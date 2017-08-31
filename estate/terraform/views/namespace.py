from __future__ import absolute_import
import django_filters
from django.apps import apps
from rest_framework import serializers, viewsets, filters, decorators, response
from estate.core.views import HistoricalSerializer, HistoryMixin
from .file import FileSerializer
from .template import TemplateInstanceSerializer
from ..terraform import Terraform

Namespace = apps.get_model('terraform.Namespace')


class NamespaceSerializer(HistoricalSerializer):
    description = serializers.CharField(default="", allow_blank=True)
    owner = serializers.CharField(default="", allow_blank=True)
    files = FileSerializer(many=True, read_only=True, is_history=True)
    templates = TemplateInstanceSerializer(many=True, read_only=True, is_history=True)

    class Meta:
        model = Namespace
        fields = ("pk", "slug", "title", "description", "owner", "files", "templates", "created", "modified")
        historical_fields = ("pk", "slug", "title", "description", "owner", "historical_files", "historical_templates")


class NamespaceFilter(filters.FilterSet):
    owner = django_filters.CharFilter(label="owner", method="filter_is_owner")

    class Meta:
        model = Namespace
        fields = ["title", "owner", "slug"]

    def filter_is_owner(self, qs, name, value):
        return qs


class NamespaceApiView(HistoryMixin, viewsets.ModelViewSet):
    queryset = Namespace.objects.all()
    serializer_class = NamespaceSerializer
    filter_class = NamespaceFilter
    search_fields = ('title',)
    ordering_fields = ('title', 'created', 'modified')

    @decorators.detail_route(methods=["POST"])
    def plan(self, request, *args, **kwargs):
        instance = self.get_object()
        runner = Terraform("plan", instance)
        runner.run()
        return response.Response(runner.get_stream())

    @decorators.detail_route(methods=["Get"])
    def plan_live(self, request, *args, **kwargs):
        instance = self.get_object()
        runner = Terraform("plan", instance, {})
        return response.Response(runner.get_stream())

    @decorators.detail_route(methods=["POST"], url_path=r'apply/(?P<plan_hash>.*)')
    def apply(self, request, plan_hash, *args, **kwargs):
        instance = self.get_object()
        runner = Terraform("apply", instance, plan_hash)
        runner.run()
        return response.Response(runner.get_stream())

    @decorators.detail_route(methods=["Get"])
    def apply_live(self, request, *args, **kwargs):
        instance = self.get_object()
        runner = Terraform("apply", instance, {})
        return response.Response(runner.get_stream())
