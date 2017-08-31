from __future__ import absolute_import
from django.contrib import admin
from django.apps import apps

File = apps.get_model('terraform.File')


class FileAdmin(admin.ModelAdmin):
    list_display = ['pk', 'title', 'description', 'modified']
    list_filter = ['title']
    search_fields = ['slug', 'title']
    list_per_page = 10


admin.site.register(File, FileAdmin)
