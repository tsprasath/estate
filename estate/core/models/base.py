from __future__ import absolute_import
import logging
from django.utils.translation import ugettext_lazy as _
from django_extensions.db.models import TimeStampedModel, TitleDescriptionModel
from django_permanent.models import PermanentModel
from simple_history.models import HistoricalRecords
from .fields import SoftDeleteAwareAutoSlugField

LOG = logging.getLogger(__name__)


class HistoricalRecordsWithoutDelete(HistoricalRecords):
    def post_delete(self, *args, **kwargs):
        # Fixes issue
        # https://github.com/treyhunner/django-simple-history/issues/207
        pass


class EstateAbstractBase(PermanentModel, TimeStampedModel, TitleDescriptionModel):
    slug = SoftDeleteAwareAutoSlugField(_('slug'), populate_from='title')

    class Meta(TimeStampedModel.Meta):
        abstract = True

    def __repr__(self):
        return "<%s:%s pk:%i>" % (self.__class__.__name__, self.title, self.pk)
