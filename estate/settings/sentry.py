from __future__ import absolute_import
import os
from . import INSTALLED_APPS, LOGGING, MIDDLEWARE

SENTRY_DSN = os.environ.get('SENTRY_DSN')

INSTALLED_APPS += [
    'raven.contrib.django.raven_compat',
]

if SENTRY_DSN:
    MIDDLEWARE = (
        'raven.contrib.django.raven_compat.middleware.Sentry404CatchMiddleware',
    ) + MIDDLEWARE
    RAVEN_CONFIG = {
        'dsn': SENTRY_DSN,
        'release': os.environ.get('RELEASE', "UNKNOWN"),
    }
    LOGGING['root']['level'] = 'WARNING'
    LOGGING['root']['handlers'].append('sentry')
    LOGGING['handlers']['sentry'] = {
        'level': 'WARNING',
        'class': 'raven.contrib.django.raven_compat.handlers.SentryHandler',
    }
    LOGGING['loggers']['raven'] = {
        'level': 'DEBUG',
        'handlers': ['stderr'],
        'propagate': False,
    }
    LOGGING['loggers']['sentry.errors'] = {
        'level': 'DEBUG',
        'handlers': ['stderr'],
        'propagate': False,
    }
    LOGGING['loggers']['django.db.backends'] = {
        'level': 'ERROR',
        'handlers': ['sentry'],
        'propagate': False,
    }
