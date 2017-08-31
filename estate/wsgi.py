from __future__ import absolute_import
import os
from django.core.wsgi import get_wsgi_application
from raven.contrib.django.raven_compat.middleware.wsgi import Sentry

application = get_wsgi_application()
if os.environ.get('RAVEN_DSN'):
    application = Sentry(application)
