from __future__ import absolute_import
from django.conf.urls import url, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r"file", views.FileApiView)
router.register(r"template", views.TemplateApiView)
router.register(r"templateinstance", views.TemplateInstanceApiView)
router.register(r"namespace", views.NamespaceApiView)
router.include_root_view = True

urlpatterns = [
    url(r'^', include(router.urls)),
]
