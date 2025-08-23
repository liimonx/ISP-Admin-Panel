from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Router


@admin.register(Router)
class RouterAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'host', 'port', 'status', 'router_type', 
        'location', 'created_at'
    ]
    list_filter = ['status', 'router_type', 'location', 'created_at']
    search_fields = ['name', 'host', 'location', 'description']
    readonly_fields = ['created_at', 'updated_at', 'last_sync_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Router Information', {
            'fields': ('name', 'host', 'port', 'router_type', 'location', 'description')
        }),
        ('Connection Settings', {
            'fields': ('username', 'password', 'use_tls', 'verify_ssl'),
            'classes': ('collapse',)
        }),
        ('Status & Monitoring', {
            'fields': ('status', 'last_sync_at', 'sync_interval'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request)
    
    def status_display(self, obj):
        if obj.status == 'online':
            return format_html(
                '<span style="color: green; font-weight: bold;">🟢 Online</span>'
            )
        elif obj.status == 'offline':
            return format_html(
                '<span style="color: red; font-weight: bold;">🔴 Offline</span>'
            )
        else:
            return format_html(
                '<span style="color: orange; font-weight: bold;">🟡 Unknown</span>'
            )
    status_display.short_description = 'Status'
    
    def connection_info(self, obj):
        protocol = 'HTTPS' if obj.use_tls else 'HTTP'
        return f"{protocol}://{obj.host}:{obj.port}"
    connection_info.short_description = 'Connection'
    
    def last_sync_display(self, obj):
        if obj.last_sync_at:
            return obj.last_sync_at.strftime('%Y-%m-%d %H:%M:%S')
        return 'Never'
    last_sync_display.short_description = 'Last Sync'
    
    # Override list_display to use custom methods
    list_display = [
        'name', 'connection_info', 'status_display', 'router_type', 
        'location', 'last_sync_display'
    ]
    
    # Add actions for router management
    actions = ['test_connection', 'sync_router']
    
    def test_connection(self, request, queryset):
        from .services import RouterOSService
        
        for router in queryset:
            try:
                service = RouterOSService(router)
                if service.test_connection():
                    self.message_user(
                        request, 
                        f"✅ Connection test successful for {router.name}"
                    )
                else:
                    self.message_user(
                        request, 
                        f"❌ Connection test failed for {router.name}",
                        level='ERROR'
                    )
            except Exception as e:
                self.message_user(
                    request, 
                    f"❌ Error testing connection for {router.name}: {str(e)}",
                    level='ERROR'
                )
    
    test_connection.short_description = "Test router connection"
    
    def sync_router(self, request, queryset):
        from .tasks import sync_router_status
        
        for router in queryset:
            try:
                sync_router_status.delay(router.id)
                self.message_user(
                    request, 
                    f"🔄 Sync task queued for {router.name}"
                )
            except Exception as e:
                self.message_user(
                    request, 
                    f"❌ Error queuing sync for {router.name}: {str(e)}",
                    level='ERROR'
                )
    
    sync_router.short_description = "Sync router status"
