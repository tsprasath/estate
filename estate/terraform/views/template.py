from __future__ import absolute_import
import json
from django.apps import apps
from rest_framework import serializers, viewsets, decorators, exceptions, status, response
from semantic_version import Version
from estate.core.views import HistoricalSerializer, HistoryMixin
from estate.core import renderer

Namespace = apps.get_model("terraform.Namespace")
Template = apps.get_model("terraform.Template")
TemplateInstance = apps.get_model("terraform.TemplateInstance")


##########
# Template
##########
class TemplateSerializer(HistoricalSerializer):
    description = serializers.CharField(default="", allow_blank=True)
    version = serializers.CharField(read_only=True)
    version_increment = serializers.ChoiceField(choices=["major", "minor", "patch", "initial"], write_only=True)
    body = serializers.CharField(default="", allow_blank=True, validators=[renderer.is_valid_template])
    body_mode = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = ("pk", "slug", "title", "description", "version", "version_increment", "json_schema", "ui_schema", "body", "body_mode", "created", "modified")
        historical_fields = ("pk", "slug", "title", "description", "version", "json_schema", "ui_schema", "body")

    def get_body_mode(self, instance):
        return renderer.get_style(instance.body) or "hcl"

    def create(self, validated_data):
        version_increment = validated_data.pop("version_increment", "initial")
        if version_increment != "initial":
            raise exceptions.APIException("Unable to create new template with version_increment set to something other then 'initial'!")
        validated_data["version"] = "0.0.1"
        validated_data["dependencies"] = []
        return super(TemplateSerializer, self).create(validated_data)

    def update(self, instance, validated_data):
        version_increment = validated_data.pop("version_increment", "patch")
        if version_increment == "initial":
            raise exceptions.APIException("Unable to update template with version_increment set to 'initial'!")
        v = Version(instance.version)
        if version_increment == "major":
            validated_data["version"] = str(v.next_major())
        if version_increment == "minor":
            validated_data["version"] = str(v.next_minor())
        if version_increment == "patch":
            validated_data["version"] = str(v.next_patch())
        validated_data["dependencies"] = []
        return super(TemplateSerializer, self).update(instance, validated_data)


class TemplateRenderSerializer(serializers.Serializer):
    body = serializers.CharField(allow_blank=True, write_only=True, validators=[renderer.is_valid_template])
    inputs = serializers.JSONField(write_only=True)
    overrides = serializers.CharField(default="", allow_blank=True, write_only=True)
    output = serializers.JSONField(read_only=True)
    disable = serializers.BooleanField(default=False)


class TemplateApiView(HistoryMixin, viewsets.ModelViewSet):
    queryset = Template.objects.all()
    serializers = {
        "default": TemplateSerializer,
        "render": TemplateRenderSerializer,
    }
    filter_fields = ("slug", "version",)
    search_fields = ("title", "version")
    ordering_fields = ("title", "created", "modified")

    def get_serializer_class(self):
        return self.serializers.get(self.action, self.serializers["default"])

    @decorators.list_route(methods=["POST"])
    def render(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        body = serializer.validated_data["body"]
        inputs = json.loads(serializer.validated_data["inputs"])
        overrides = serializer.validated_data["overrides"]
        disable = serializer.validated_data["disable"]
        try:
            output = renderer.render_template(body, inputs, overrides, disable)
        except Exception as e:
            raise exceptions.APIException(str(e))
        headers = self.get_success_headers(serializer.data)
        return response.Response(output, status=status.HTTP_201_CREATED, headers=headers)


##################
# TemplateInstance
##################
class TemplateInstanceSerializer(HistoricalSerializer):
    namespace = serializers.SlugRelatedField(slug_field="slug", queryset=Namespace.objects.all())
    description = serializers.CharField(default="", allow_blank=True)
    inputs = serializers.JSONField()
    overrides = serializers.CharField(default="", allow_blank=True)
    templateID = serializers.IntegerField(write_only=True)
    template = TemplateSerializer(read_only=True, is_history=True)
    is_outdated = serializers.SerializerMethodField()

    class Meta:
        model = TemplateInstance
        fields = ("pk", "slug", "title", "description", "namespace", "inputs", "overrides", "disable", "templateID", "template", "is_outdated", "created", "modified")
        historical_fields = ("pk", "slug", "title", "namespace", "description", "inputs", "overrides", "disable")

    def get_is_outdated(self, instance):
        return instance.is_outdated

    def create(self, validated_data):
        template_id = validated_data.pop("templateID", False)
        if template_id is False:
            raise exceptions.APIException("Unable to create new templateInstance because a templateID was not given!")
        validated_data["historical_template"] = Template.all_objects.get(pk=template_id).history.latest().pk
        return super(TemplateInstanceSerializer, self).create(validated_data)

    def update(self, instance, validated_data):
        template_id = validated_data.pop("templateID", False)
        if template_id is not False:
            validated_data["historical_template"] = Template.all_objects.get(pk=template_id).history.latest().pk
        return super(TemplateInstanceSerializer, self).update(instance, validated_data)


class TemplateInstanceApiView(HistoryMixin, viewsets.ModelViewSet):
    queryset = TemplateInstance.objects.all()
    serializer_class = TemplateInstanceSerializer
    filter_fields = ("slug",)
    search_fields = ("title",)
    ordering_fields = ("title", "created", "modified")

    @decorators.detail_route(methods=["POST"])
    def update_template(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_outdated:
            instance.historical_template = Template.all_objects.get(pk=instance.template.id).history.latest().pk
            instance.save()
        serializer = self.get_serializer(instance)
        return response.Response(serializer.data)
