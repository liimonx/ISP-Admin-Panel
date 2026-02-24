from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        'username', 'customer', 'plan', 'router', 'status', 
        'access_method', 'created_at'
    ]
    list_filter = [
        'status', 'access_method', 'plan', 'router', 'created_at', 'end_date'
    ]
    search_fields = [
        'username', 'customer__name', 'customer__email', 'customer__phone'
    ]
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Subscription Information', {
            'fields': ('customer', 'plan', 'username', 'password', 'status')
        }),
        ('Network Configuration', {
            'fields': ('router', 'access_method', 'ip_address', 'mac_address')
        }),
        ('Bandwidth Settings', {
            'fields': ('data_used',),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date', 'created_at', 'updated_at')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'customer', 'plan', 'router'
        )
    
    def customer_link(self, obj):
        if obj.customer:
            url = reverse('admin:customers_customer_change', args=[obj.customer.id])
            return format_html('<a href="{}">{}</a>', url, obj.customer.name)
        return '-'
    customer_link.short_description = 'Customer'
    
    def plan_link(self, obj):
        if obj.plan:
            url = reverse('admin:plans_plan_change', args=[obj.plan.id])
            return format_html('<a href="{}">{}</a>', url, obj.plan.name)
        return '-'
    plan_link.short_description = 'Plan'
    
    def router_link(self, obj):
        if obj.router:
            url = reverse('admin:network_router_change', args=[obj.router.id])
            return format_html('<a href="{}">{}</a>', url, obj.router.name)
        return '-'
    router_link.short_description = 'Router'
    
    def status_display(self, obj):
        if obj.status == 'active':
            return format_html(
                '<span style="color: green; font-weight: bold;">🟢 Active</span>'
            )
        elif obj.status == 'suspended':
            return format_html(
                '<span style="color: red; font-weight: bold;">🔴 Suspended</span>'
            )
        elif obj.status == 'expired':
            return format_html(
                '<span style="color: orange; font-weight: bold;">🟡 Expired</span>'
            )
        else:
            return format_html(
                '<span style="color: gray; font-weight: bold;">⚪ Inactive</span>'
            )
    status_display.short_description = 'Status'
    
    def speed_display(self, obj):
        if obj.plan and getattr(obj.plan, 'download_speed', None) and getattr(obj.plan, 'upload_speed', None):
            return f"{obj.plan.download_speed}↓ / {obj.plan.upload_speed}↑ Mbps"
        return '-'
    speed_display.short_description = 'Speed'
    
    def data_usage_display(self, obj):
        data_limit = getattr(obj.plan, 'data_quota', 0)
        if data_limit:
            usage_pct = (obj.data_used / data_limit * 100) if data_limit > 0 else 0
            if usage_pct > 90:
                color = 'red'
            elif usage_pct > 75:
                color = 'orange'
            else:
                color = 'green'
            
            return format_html(
                '<span style="color: {};">{:.1f} GB / {:.1f} GB ({:.1f}%)</span>',
                color, obj.data_used, data_limit, usage_pct
            )
        return f"{obj.data_used:.1f} GB"
    data_usage_display.short_description = 'Data Usage'
    
    def expires_display(self, obj):
        if obj.end_date:
            from django.utils import timezone
            now = timezone.now().date()
            if obj.end_date < now:
                return format_html(
                    '<span style="color: red; font-weight: bold;">Expired</span>'
                )
            elif obj.end_date < now + timezone.timedelta(days=7):
                return format_html(
                    '<span style="color: orange; font-weight: bold;">Expires Soon</span>'
                )
            else:
                return obj.end_date.strftime('%Y-%m-%d')
        return '-'
    expires_display.short_description = 'Expires'
    
    # Override list_display to use custom methods
    list_display = [
        'username', 'customer_link', 'plan_link', 'router_link', 
        'status_display', 'speed_display', 'expires_display'
    ]
    
    # Add actions for subscription management
    actions = ['activate_subscriptions', 'suspend_subscriptions', 'sync_router']
    
    def activate_subscriptions(self, request, queryset):
        from .tasks import activate_subscription_on_router
        
        for subscription in queryset:
            try:
                activate_subscription_on_router.delay(subscription.id)
                self.message_user(
                    request, 
                    f"🔄 Activation queued for {subscription.username}"
                )
            except Exception as e:
                self.message_user(
                    request, 
                    f"❌ Error activating {subscription.username}: {str(e)}",
                    level='ERROR'
                )
    
    activate_subscriptions.short_description = "Activate selected subscriptions"
    
    def suspend_subscriptions(self, request, queryset):
        from .tasks import suspend_subscription_on_router
        
        for subscription in queryset:
            try:
                suspend_subscription_on_router.delay(subscription.id)
                self.message_user(
                    request, 
                    f"🔄 Suspension queued for {subscription.username}"
                )
            except Exception as e:
                self.message_user(
                    request, 
                    f"❌ Error suspending {subscription.username}: {str(e)}",
                    level='ERROR'
                )
    
    suspend_subscriptions.short_description = "Suspend selected subscriptions"
    
    def sync_router(self, request, queryset):
        from .tasks import sync_subscription_usage
        
        for subscription in queryset:
            try:
                sync_subscription_usage.delay(subscription.id)
                self.message_user(
                    request, 
                    f"🔄 Usage sync queued for {subscription.username}"
                )
            except Exception as e:
                self.message_user(
                    request, 
                    f"❌ Error syncing {subscription.username}: {str(e)}",
                    level='ERROR'
                )
    
    sync_router.short_description = "Sync usage data"
