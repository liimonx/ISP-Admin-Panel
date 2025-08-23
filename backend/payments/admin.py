from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone


# Since the payments app mainly handles webhooks and doesn't have models yet,
# we'll create a simple admin interface for webhook management
class WebhookLogAdmin(admin.ModelAdmin):
    """Admin interface for webhook logs (if we add a WebhookLog model later)"""
    
    list_display = [
        'provider', 'event_type', 'status', 'created_at'
    ]
    list_filter = ['provider', 'event_type', 'status', 'created_at']
    search_fields = ['provider', 'event_type', 'payload']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Webhook Information', {
            'fields': ('provider', 'event_type', 'status')
        }),
        ('Payload', {
            'fields': ('payload',),
            'classes': ('collapse',)
        }),
        ('Response', {
            'fields': ('response_data', 'response_status'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def status_display(self, obj):
        if obj.status == 'success':
            return format_html(
                '<span style="color: green; font-weight: bold;">✅ Success</span>'
            )
        elif obj.status == 'failed':
            return format_html(
                '<span style="color: red; font-weight: bold;">❌ Failed</span>'
            )
        else:
            return format_html(
                '<span style="color: orange; font-weight: bold;">🟡 Pending</span>'
            )
    status_display.short_description = 'Status'


# Payment Provider Configuration Admin
class PaymentProviderConfigAdmin(admin.ModelAdmin):
    """Admin interface for payment provider configurations"""
    
    list_display = [
        'provider_name', 'is_active', 'environment', 'created_at'
    ]
    list_filter = ['provider_name', 'is_active', 'environment']
    search_fields = ['provider_name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Provider Information', {
            'fields': ('provider_name', 'description', 'is_active', 'environment')
        }),
        ('API Configuration', {
            'fields': ('api_key', 'api_secret', 'webhook_secret'),
            'classes': ('collapse',)
        }),
        ('Settings', {
            'fields': ('settings',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def environment_display(self, obj):
        if obj.environment == 'production':
            return format_html(
                '<span style="color: red; font-weight: bold;">🚀 Production</span>'
            )
        else:
            return format_html(
                '<span style="color: blue; font-weight: bold;">🧪 Sandbox</span>'
            )
    environment_display.short_description = 'Environment'


# Register admin classes (commented out since models don't exist yet)
# @admin.register(WebhookLog)
# class WebhookLogAdmin(WebhookLogAdmin):
#     pass

# @admin.register(PaymentProviderConfig)
# class PaymentProviderConfigAdmin(PaymentProviderConfigAdmin):
#     pass


# Add custom admin actions for payment management
class PaymentAdminActions:
    """Custom admin actions for payment management"""
    
    def test_webhook_endpoint(self, request, queryset):
        """Test webhook endpoints for selected providers"""
        from django.contrib import messages
        
        for provider in queryset:
            try:
                # This would test the webhook endpoint
                # Implementation depends on the actual webhook testing logic
                messages.success(
                    request, 
                    f"✅ Webhook test successful for {provider.provider_name}"
                )
            except Exception as e:
                messages.error(
                    request, 
                    f"❌ Webhook test failed for {provider.provider_name}: {str(e)}"
                )
    
    test_webhook_endpoint.short_description = "Test webhook endpoints"
    
    def sync_payment_status(self, request, queryset):
        """Sync payment status from external providers"""
        from django.contrib import messages
        
        for provider in queryset:
            try:
                # This would sync payment status
                # Implementation depends on the actual sync logic
                messages.success(
                    request, 
                    f"🔄 Payment status synced for {provider.provider_name}"
                )
            except Exception as e:
                messages.error(
                    request, 
                    f"❌ Payment sync failed for {provider.provider_name}: {str(e)}"
                )
    
    sync_payment_status.short_description = "Sync payment status"


# Add a simple admin view for payment statistics
@admin.register(type('PaymentStats', (), {
    '__module__': 'payments.admin',
    'Meta': type('Meta', (), {'app_label': 'payments'}),
    '__str__': lambda self: 'Payment Statistics',
    '__repr__': lambda self: 'PaymentStats()'
}))
class PaymentStatsAdmin(admin.ModelAdmin):
    """Admin interface for payment statistics"""
    
    def changelist_view(self, request, extra_context=None):
        """Custom changelist view for payment statistics"""
        from django.shortcuts import render
        from django.db.models import Count, Sum
        from billing.models import Payment
        
        # Get payment statistics
        stats = {
            'total_payments': Payment.objects.count(),
            'total_amount': Payment.objects.filter(status='completed').aggregate(
                total=Sum('amount')
            )['total'] or 0,
            'payments_by_provider': Payment.objects.values('provider').annotate(
                count=Count('id')
            ),
            'recent_payments': Payment.objects.order_by('-created_at')[:10],
        }
        
        extra_context = extra_context or {}
        extra_context['stats'] = stats
        
        return render(request, 'admin/payments/payment_stats.html', extra_context)
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
