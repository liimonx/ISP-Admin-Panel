from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Invoice, Payment


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        'invoice_number', 'customer', 'subscription', 'amount', 
        'status', 'due_date', 'created_at'
    ]
    list_filter = ['status', 'due_date', 'created_at', 'subscription__plan']
    search_fields = ['invoice_number', 'customer__name', 'customer__email']
    readonly_fields = ['invoice_number', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Invoice Information', {
            'fields': ('invoice_number', 'customer', 'subscription', 'amount', 'status')
        }),
        ('Dates', {
            'fields': ('due_date', 'created_at', 'updated_at')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer', 'subscription', 'subscription__plan')
    
    def customer_link(self, obj):
        if obj.customer:
            url = reverse('admin:customers_customer_change', args=[obj.customer.id])
            return format_html('<a href="{}">{}</a>', url, obj.customer.name)
        return '-'
    customer_link.short_description = 'Customer'
    
    def subscription_link(self, obj):
        if obj.subscription:
            url = reverse('admin:subscriptions_subscription_change', args=[obj.subscription.id])
            return format_html('<a href="{}">{}</a>', url, obj.subscription.username)
        return '-'
    subscription_link.short_description = 'Subscription'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'payment_id', 'invoice', 'amount', 'provider', 'status', 
        'paid_at', 'created_at'
    ]
    list_filter = ['provider', 'status', 'paid_at', 'created_at']
    search_fields = ['payment_id', 'invoice__invoice_number', 'external_id']
    readonly_fields = ['payment_id', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('payment_id', 'invoice', 'amount', 'provider', 'status')
        }),
        ('External Data', {
            'fields': ('external_id', 'transaction_data'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('paid_at', 'created_at', 'updated_at')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('invoice', 'invoice__customer')
    
    def invoice_link(self, obj):
        if obj.invoice:
            url = reverse('admin:billing_invoice_change', args=[obj.invoice.id])
            return format_html('<a href="{}">{}</a>', url, obj.invoice.invoice_number)
        return '-'
    invoice_link.short_description = 'Invoice'
    
    def customer_name(self, obj):
        return obj.invoice.customer.name if obj.invoice and obj.invoice.customer else '-'
    customer_name.short_description = 'Customer'
