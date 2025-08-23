from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import SNMPData, UsageSnapshot


@admin.register(SNMPData)
class SNMPDataAdmin(admin.ModelAdmin):
    list_display = [
        'router', 'metric_type', 'value', 'unit', 'timestamp'
    ]
    list_filter = ['metric_type', 'router', 'timestamp']
    search_fields = ['router__name', 'metric_type']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('SNMP Data', {
            'fields': ('router', 'metric_type', 'value', 'unit')
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
    
    def value_display(self, obj):
        if obj.unit:
            return f"{obj.value} {obj.unit}"
        return obj.value
    value_display.short_description = 'Value'
    
    # Override list_display to use custom methods
    list_display = [
        'router_link', 'metric_type', 'value_display', 'timestamp'
    ]
    
    # Add actions for data management
    actions = ['export_data', 'cleanup_old_data']
    
    def export_data(self, request, queryset):
        import csv
        from django.http import HttpResponse
        from django.utils import timezone
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="snmp_data_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Router', 'Metric Type', 'Value', 'Unit', 'Timestamp'])
        
        for data in queryset:
            writer.writerow([
                data.router.name if data.router else '',
                data.metric_type,
                data.value,
                data.unit or '',
                data.timestamp.strftime('%Y-%m-%d %H:%M:%S')
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
            f"🗑️ Deleted {deleted_count} old SNMP data records"
        )
    
    cleanup_old_data.short_description = "Clean up old data (30+ days)"


@admin.register(UsageSnapshot)
class UsageSnapshotAdmin(admin.ModelAdmin):
    list_display = [
        'subscription', 'data_used', 'data_limit', 'usage_percentage', 
        'period_start', 'period_end'
    ]
    list_filter = ['subscription__plan', 'period_start', 'period_end']
    search_fields = ['subscription__customer__name', 'subscription__username']
    readonly_fields = ['created_at']
    date_hierarchy = 'period_start'
    
    fieldsets = (
        ('Usage Information', {
            'fields': ('subscription', 'data_used', 'data_limit', 'period_start', 'period_end')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'subscription', 'subscription__customer', 'subscription__plan'
        )
    
    def subscription_link(self, obj):
        if obj.subscription:
            url = reverse('admin:subscriptions_subscription_change', args=[obj.subscription.id])
            return format_html('<a href="{}">{}</a>', url, obj.subscription.username)
        return '-'
    subscription_link.short_description = 'Subscription'
    
    def customer_name(self, obj):
        return obj.subscription.customer.name if obj.subscription and obj.subscription.customer else '-'
    customer_name.short_description = 'Customer'
    
    def usage_percentage(self, obj):
        if obj.data_limit and obj.data_limit > 0:
            percentage = (obj.data_used / obj.data_limit) * 100
            if percentage > 90:
                color = 'red'
            elif percentage > 75:
                color = 'orange'
            else:
                color = 'green'
            
            return format_html(
                '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
                color, percentage
            )
        return '-'
    usage_percentage.short_description = 'Usage %'
    
    def data_used_display(self, obj):
        return f"{obj.data_used} GB"
    data_used_display.short_description = 'Data Used'
    
    def data_limit_display(self, obj):
        return f"{obj.data_limit} GB"
    data_limit_display.short_description = 'Data Limit'
    
    # Override list_display to use custom methods
    list_display = [
        'subscription_link', 'customer_name', 'data_used_display', 
        'data_limit_display', 'usage_percentage', 'period_start', 'period_end'
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
            'Customer', 'Subscription', 'Plan', 'Data Used (GB)', 
            'Data Limit (GB)', 'Usage %', 'Period Start', 'Period End'
        ])
        
        for snapshot in queryset:
            usage_pct = (snapshot.data_used / snapshot.data_limit * 100) if snapshot.data_limit > 0 else 0
            writer.writerow([
                snapshot.subscription.customer.name if snapshot.subscription and snapshot.subscription.customer else '',
                snapshot.subscription.username if snapshot.subscription else '',
                snapshot.subscription.plan.name if snapshot.subscription and snapshot.subscription.plan else '',
                snapshot.data_used,
                snapshot.data_limit,
                f"{usage_pct:.1f}%",
                snapshot.period_start.strftime('%Y-%m-%d'),
                snapshot.period_end.strftime('%Y-%m-%d')
            ])
        
        return response
    
    export_usage_report.short_description = "Export usage report to CSV"
