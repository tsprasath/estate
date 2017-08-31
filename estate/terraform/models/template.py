from __future__ import absolute_import
import json
import logging
from django.db import models
from django.utils.translation import ugettext_lazy as _
from django.contrib.postgres.fields import JSONField
import semantic_version
from ...core.models.base import EstateAbstractBase, HistoricalRecordsWithoutDelete
from ...core.renderer import render_template

LOG = logging.getLogger(__name__)


class TemplateDependency(models.Model):
    CONDITIONS = (
        (1, _("Any")),
        (2, _("All")),
        (3, _("Not Any")),
        (4, _("Not All")),
    )

    dependencies = models.ManyToManyField("terraform.Template", related_name="asDependent")
    template = models.ForeignKey("terraform.Template", related_name="dependencies")
    condition = models.IntegerField(choices=CONDITIONS, default=1)

    class Meta:
        verbose_name = "TemplateDependencies"


class Template(EstateAbstractBase):
    version = models.CharField(_('version'), max_length=128, default="0.0.0", validators=[semantic_version.validate])
    json_schema = models.TextField(_('JSONSchema'), blank=True)
    ui_schema = models.TextField(_('UISchema'), blank=True)
    body = models.TextField(_('body'), blank=True)

    history = HistoricalRecordsWithoutDelete(excluded_fields=['slug'])

    @property
    def semantic_version(self):
        return semantic_version.Version(self.version)


class TemplateInstance(EstateAbstractBase):
    namespace = models.ForeignKey('terraform.Namespace', related_name="templates")
    disable = models.BooleanField(_('disable'), default=False)
    inputs = JSONField(_('inputs'))
    overrides = models.TextField(_('overrides'), blank=True)
    historical_template = models.IntegerField()

    history = HistoricalRecordsWithoutDelete(excluded_fields=['slug'])

    @property
    def template(self):
        return Template.history.get(pk=self.historical_template)

    @property
    def semantic_version(self):
        return semantic_version.Version(self.template.version)

    @property
    def is_outdated(self):
        template = Template.all_objects.get(pk=self.template.id)
        latest = template.semantic_version
        current = self.semantic_version
        return latest > current

    @property
    def content(self):
        return json.dumps(render_template(self.template.body, self.inputs, self.overrides, self.disable))
