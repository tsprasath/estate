from __future__ import absolute_import
from django.contrib import admin
from django.apps import apps

Template = apps.get_model('terraform.Template')
TemplateInstance = apps.get_model('terraform.TemplateInstance')


class TemplateAdmin(admin.ModelAdmin):
    list_display = ['pk', 'title', 'description', 'version', 'modified']
    list_filter = ['title']
    search_fields = ['slug', 'title']
    list_per_page = 10


class TemplateInstanceAdmin(admin.ModelAdmin):
    list_display = ['pk', 'title', 'description', 'modified']
    list_filter = ['title']
    search_fields = ['slug', 'title']
    list_per_page = 10


admin.site.register(Template, TemplateAdmin)
admin.site.register(TemplateInstance, TemplateInstanceAdmin)
