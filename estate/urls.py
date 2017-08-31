from __future__ import absolute_import
from django.conf.urls import url, include
from django.views.generic import RedirectView
from django.contrib import admin
from django.http import HttpResponse
from django.views.generic import TemplateView
from rest_framework.documentation import include_docs_urls
from rest_framework.schemas import get_schema_view
from rest_framework_swagger.views import get_swagger_view

title = "Estate API"

base_schema_view = get_schema_view(title=title)

swagger_view = get_swagger_view(title=title)

urlpatterns = [
    url(r'^ping$', lambda x: HttpResponse('pong'), name="ping"),
    url(r'^admin/', admin.site.urls),
    url(r'^api/$', RedirectView.as_view(url='/api/swagger/')),
    url(r'^api/schema/$', base_schema_view),
    url(r'^api/swagger/', swagger_view),
    url(r'^api/docs/', include_docs_urls(title=title), name="api-docs"),
    url(r'^api/terraform/', include('estate.terraform.urls')),
    # Acts as a catchall for everything else and react router will take over
    url(r'^', TemplateView.as_view(template_name='index.html')),
]
