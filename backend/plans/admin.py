from django.contrib import admin
from .models import Plan


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    """Admin for Plan model."""
    list_display = ['name', 'download_speed', 'upload_speed', 'speed_unit', 'price', 'is_active', 'is_featured']
    list_filter = ['is_active', 'is_featured', 'is_popular', 'billing_cycle', 'speed_unit']
    search_fields = ['name', 'description']
    ordering = ['price']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Speed Configuration', {
            'fields': ('download_speed', 'upload_speed', 'speed_unit')
        }),
        ('Data Quota', {
            'fields': ('data_quota', 'quota_unit')
        }),
        ('Pricing', {
            'fields': ('price', 'setup_fee', 'billing_cycle')
        }),
        ('Features', {
            'fields': ('is_featured', 'is_popular', 'features')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
