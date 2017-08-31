from __future__ import absolute_import
import logging
from django_extensions.db.fields import AutoSlugField

LOG = logging.getLogger(__name__)


class SoftDeleteAwareAutoSlugField(AutoSlugField):

    def get_queryset(self, model_cls, slug_field):
        for field, model in self._get_fields(model_cls):
            if model and field == slug_field:
                if hasattr(model, "all_objects"):
                    return model.all_objects.all()
                else:
                    return model._default_manager.all()
        if hasattr(model_cls, "all_objects"):
            return model_cls.all_objects.all()
        else:
            return model_cls._default_manager.all()
