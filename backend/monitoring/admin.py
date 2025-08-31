from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import SNMPSnapshot, UsageSnapshot


@admin.register(SNMPSnapshot)
class SNMPSnapshotAdmin(admin.ModelAdmin):
    list_display = [
        'router', 'cpu_usage', 'memory_usage', 'uptime', 'temperature', 'timestamp'
    ]
    list_filter = ['router', 'timestamp']
    search_fields = ['router__name']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('System Resources', {
            'fields': ('router', 'cpu_usage', 'memory_usage', 'uptime', 'temperature')
        }),
        ('Network Interfaces', {
            'fields': ('interface_data',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('timestamp',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('router')
    
    def router_link(self, obj):
        if obj.router:
            url = reverse('admin:network_router_change', args=[obj.router.id])
            return format_html('<a href="{}">{}</a>', url, obj.router.name)
        return '-'
    router_link.short_description = 'Router'
    
    # Add actions for data management
    actions = ['export_data', 'cleanup_old_data']
    
    def export_data(self, request, queryset):
        import csv
        from django.http import HttpResponse
        from django.utils import timezone
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="snmp_snapshots_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Router', 'CPU Usage (%)', 'Memory Usage (%)', 'Uptime (s)', 'Temperature (°C)', 'Timestamp'])
        
        for snapshot in queryset:
            writer.writerow([
                snapshot.router.name if snapshot.router else '',
                snapshot.cpu_usage or '',
                snapshot.memory_usage or '',
                snapshot.uptime or '',
                snapshot.temperature or '',
                snapshot.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
    
    export_data.short_description = "Export selected data to CSV"
    
    def cleanup_old_data(self, request, queryset):
        from django.utils import timezone
        from datetime import timedelta
        
        # Delete data older than 30 days
        cutoff_date = timezone.now() - timedelta(days=30)
        deleted_count = queryset.filter(timestamp__lt=cutoff_date).delete()[0]
        
        self.message_user(
            request, 
            f"🗑️ Deleted {deleted_count} old SNMP snapshot records"
        )
    
    cleanup_old_data.short_description = "Clean up old data (30+ days)"


@admin.register(UsageSnapshot)
class UsageSnapshotAdmin(admin.ModelAdmin):
    list_display = [
        'router', 'total_bytes_in', 'total_bytes_out', 'total_gb', 
        'active_connections', 'timestamp'
    ]
    list_filter = ['router', 'timestamp']
    search_fields = ['router__name']
    readonly_fields = ['timestamp', 'total_gb']
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('Router Information', {
            'fields': ('router',)
        }),
        ('Usage Statistics', {
            'fields': ('total_bytes_in', 'total_bytes_out', 'active_connections')
        }),
        ('PPPoE Statistics', {
            'fields': ('pppoe_users_count', 'pppoe_active_sessions'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('timestamp', 'total_gb'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('router')
    
    def router_link(self, obj):
        if obj.router:
            url = reverse('admin:network_router_change', args=[obj.router.id])
            return format_html('<a href="{}">{}</a>', url, obj.router.name)
        return '-'
    router_link.short_description = 'Router'
    
    def total_gb_display(self, obj):
        return f"{obj.total_gb:.2f} GB"
    total_gb_display.short_description = 'Total Data (GB)'
    
    # Override list_display to use custom methods
    list_display = [
        'router_link', 'total_bytes_in', 'total_bytes_out', 
        'total_gb_display', 'active_connections', 'timestamp'
    ]
    
    # Add actions for usage management
    actions = ['export_usage_report']
    
    def export_usage_report(self, request, queryset):
        import csv
        from django.http import HttpResponse
        from django.utils import timezone
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="usage_report_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Router', 'Bytes In', 'Bytes Out', 'Total Data (GB)', 
            'Active Connections', 'PPPoE Users', 'PPPoE Sessions', 'Timestamp'
        ])
        
        for snapshot in queryset:
            writer.writerow([
                snapshot.router.name if snapshot.router else '',
                snapshot.total_bytes_in,
                snapshot.total_bytes_out,
                f"{snapshot.total_gb:.2f}",
                snapshot.active_connections,
                snapshot.pppoe_users_count,
                snapshot.pppoe_active_sessions,
                snapshot.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
    
    export_usage_report.short_description = "Export usage report to CSV"
