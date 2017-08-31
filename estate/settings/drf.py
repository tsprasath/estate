from __future__ import absolute_import
from . import INSTALLED_APPS


def api_exception_handler(exc, context):
    from rest_framework import views, exceptions
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = views.exception_handler(exc, context)
    if response is None and isinstance(exc, Exception):
        new_exc = exceptions.APIException(str(exc))
        response = views.exception_handler(new_exc, context)
    # Now lets generate our standardized format
    if response is not None:
        response.data = {"errors": response.data,
                         "status_text": response.status_text,
                         "status_code": response.status_code}

    return response


INSTALLED_APPS += [
    'rest_framework',
    'rest_framework_swagger',
]

REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': api_exception_handler,
    'DEFAULT_PAGINATION_CLASS': "estate.pagination.LinkHeaderPagination",
    'PAGE_SIZE': 10,
    'DEFAULT_AUTHENTICATION_CLASSES': (
        #'rest_framework.authentication.BasicAuthentication',
        #'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        #'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.AdminRenderer',
        'rest_framework.renderers.HTMLFormRenderer',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
        'rest_framework.filters.DjangoFilterBackend',
    )
}

SWAGGER_SETTINGS = {
    'USE_SESSION_AUTH': True,
    'APIS_SORTER': 'alpha',
    'JSON_EDITOR': True,
    'VALIDATOR_URL': None
}

CORS_URLS_REGEX = r'^/api/.*$'
