from __future__ import absolute_import
from . import INSTALLED_APPS  # , MIDDLEWARE

INSTALLED_APPS += [
    'simple_history',
]

PERMANENT_FIELD = 'deleted'

# this doesn't work with django 1.10
# MIDDLEWARE = MIDDLEWARE + (
#     'simple_history.middleware.HistoryRequestMiddleware',
# )
