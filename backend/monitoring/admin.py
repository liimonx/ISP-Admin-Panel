from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse

try:
    from .models import RouterMetric
except ImportError:
    RouterMetric = None


if RouterMetric:
    @admin.register(RouterMetric)
    class RouterMetricAdmin(admin.ModelAdmin):
        list_display = [
            'router', 'cpu_usage', 'memory_usage', 'temperature', 'timestamp'
        ]
        list_filter = ['router', 'timestamp']
        search_fields = ['router__name']
        readonly_fields = ['timestamp']
        date_hierarchy = 'timestamp'
        
        fieldsets = (
            ('System Resources', {
                'fields': ('router', 'cpu_usage', 'memory_usage', 'disk_usage', 'temperature')
            }),
            ('Bandwidth', {
                'fields': ('total_download', 'total_upload', 'download_speed', 'upload_speed')
            }),
            ('Metadata', {
                'fields': ('timestamp',)
            }),
        )
        
        def get_queryset(self, request):
            return super().get_queryset(request).select_related('router')
