"""
Core serializers for common data structures and statistics.
"""
from rest_framework import serializers
from django.db.models import Sum, Count, Avg
from customers.models import Customer
from subscriptions.models import Subscription
from plans.models import Plan
from network.models import Router
from billing.models import Invoice, Payment


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""
    
    # Customer Statistics
    total_customers = serializers.IntegerField()
    active_customers = serializers.IntegerField()
    
    # Subscription Statistics
    total_subscriptions = serializers.IntegerField()
    active_subscriptions = serializers.IntegerField()
    
    # Revenue Statistics
    total_monthly_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_monthly_revenue_float = serializers.SerializerMethodField()
    
    # Router Statistics
    total_routers = serializers.IntegerField()
    online_routers = serializers.IntegerField()
    
    # Invoice Statistics
    total_invoices = serializers.IntegerField()
    pending_invoices = serializers.IntegerField()
    overdue_invoices = serializers.IntegerField()
    
    # Payment Statistics
    total_payments = serializers.IntegerField()
    successful_payments = serializers.IntegerField()
    
    def get_total_monthly_revenue_float(self, obj):
        """Get total monthly revenue as float."""
        return float(obj.get('total_monthly_revenue', 0))


class CustomerStatsSerializer(serializers.Serializer):
    """Serializer for customer statistics."""
    
    total_customers = serializers.IntegerField()
    active_customers = serializers.IntegerField()
    inactive_customers = serializers.IntegerField()
    suspended_customers = serializers.IntegerField()
    cancelled_customers = serializers.IntegerField()
    new_customers_this_month = serializers.IntegerField()
    customers_with_active_subscriptions = serializers.IntegerField()


class SubscriptionStatsSerializer(serializers.Serializer):
    """Serializer for subscription statistics."""
    
    total_subscriptions = serializers.IntegerField()
    active_subscriptions = serializers.IntegerField()
    inactive_subscriptions = serializers.IntegerField()
    suspended_subscriptions = serializers.IntegerField()
    cancelled_subscriptions = serializers.IntegerField()
    pending_subscriptions = serializers.IntegerField()
    new_subscriptions_this_month = serializers.IntegerField()
    total_monthly_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_monthly_revenue_float = serializers.SerializerMethodField()
    
    def get_total_monthly_revenue_float(self, obj):
        """Get total monthly revenue as float."""
        return float(obj.get('total_monthly_revenue', 0))


class PlanStatsSerializer(serializers.Serializer):
    """Serializer for plan statistics."""
    
    total_plans = serializers.IntegerField()
    active_plans = serializers.IntegerField()
    featured_plans = serializers.IntegerField()
    popular_plans = serializers.IntegerField()
    most_popular_plan = serializers.CharField()
    highest_revenue_plan = serializers.CharField()
    total_monthly_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_monthly_revenue_float = serializers.SerializerMethodField()
    
    def get_total_monthly_revenue_float(self, obj):
        """Get total monthly revenue as float."""
        return float(obj.get('total_monthly_revenue', 0))


class RouterStatsSerializer(serializers.Serializer):
    """Serializer for router statistics."""
    
    total_routers = serializers.IntegerField()
    online_routers = serializers.IntegerField()
    offline_routers = serializers.IntegerField()
    maintenance_routers = serializers.IntegerField()
    mikrotik_routers = serializers.IntegerField()
    cisco_routers = serializers.IntegerField()
    other_routers = serializers.IntegerField()
    total_bandwidth_usage = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_bandwidth_usage_float = serializers.SerializerMethodField()
    
    def get_total_bandwidth_usage_float(self, obj):
        """Get total bandwidth usage as float."""
        return float(obj.get('total_bandwidth_usage', 0))


class InvoiceStatsSerializer(serializers.Serializer):
    """Serializer for invoice statistics."""
    
    total_invoices = serializers.IntegerField()
    pending_invoices = serializers.IntegerField()
    paid_invoices = serializers.IntegerField()
    overdue_invoices = serializers.IntegerField()
    cancelled_invoices = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    overdue_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    avg_invoice_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    collection_rate = serializers.FloatField()
    
    # Float versions for frontend compatibility
    total_amount_float = serializers.SerializerMethodField()
    paid_amount_float = serializers.SerializerMethodField()
    pending_amount_float = serializers.SerializerMethodField()
    overdue_amount_float = serializers.SerializerMethodField()
    avg_invoice_amount_float = serializers.SerializerMethodField()
    
    def get_total_amount_float(self, obj):
        """Get total amount as float."""
        return float(obj.get('total_amount', 0))
    
    def get_paid_amount_float(self, obj):
        """Get paid amount as float."""
        return float(obj.get('paid_amount', 0))
    
    def get_pending_amount_float(self, obj):
        """Get pending amount as float."""
        return float(obj.get('pending_amount', 0))
    
    def get_overdue_amount_float(self, obj):
        """Get overdue amount as float."""
        return float(obj.get('overdue_amount', 0))
    
    def get_avg_invoice_amount_float(self, obj):
        """Get average invoice amount as float."""
        return float(obj.get('avg_invoice_amount', 0))


class PaymentStatsSerializer(serializers.Serializer):
    """Serializer for payment statistics."""
    
    total_payments = serializers.IntegerField()
    successful_payments = serializers.IntegerField()
    failed_payments = serializers.IntegerField()
    pending_payments = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    successful_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    avg_payment_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    success_rate = serializers.FloatField()
    
    # Float versions for frontend compatibility
    total_amount_float = serializers.SerializerMethodField()
    successful_amount_float = serializers.SerializerMethodField()
    avg_payment_amount_float = serializers.SerializerMethodField()
    
    def get_total_amount_float(self, obj):
        """Get total amount as float."""
        return float(obj.get('total_amount', 0))
    
    def get_successful_amount_float(self, obj):
        """Get successful amount as float."""
        return float(obj.get('successful_amount', 0))
    
    def get_avg_payment_amount_float(self, obj):
        """Get average payment amount as float."""
        return float(obj.get('avg_payment_amount', 0))


class MonthlyTrendSerializer(serializers.Serializer):
    """Serializer for monthly trend data."""
    
    month = serializers.CharField()
    year = serializers.IntegerField()
    invoice_count = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_count = serializers.IntegerField()
    successful_payment_count = serializers.IntegerField()
    
    # Float versions for frontend compatibility
    total_amount_float = serializers.SerializerMethodField()
    paid_amount_float = serializers.SerializerMethodField()
    
    def get_total_amount_float(self, obj):
        """Get total amount as float."""
        return float(obj.get('total_amount', 0))
    
    def get_paid_amount_float(self, obj):
        """Get paid amount as float."""
        return float(obj.get('paid_amount', 0))


class DailyTrendSerializer(serializers.Serializer):
    """Serializer for daily trend data."""
    
    date = serializers.DateField()
    payment_count = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    successful_count = serializers.IntegerField()
    invoice_count = serializers.IntegerField()
    
    # Float versions for frontend compatibility
    total_amount_float = serializers.SerializerMethodField()
    
    def get_total_amount_float(self, obj):
        """Get total amount as float."""
        return float(obj.get('total_amount', 0))


class PaymentMethodStatsSerializer(serializers.Serializer):
    """Serializer for payment method statistics."""
    
    method = serializers.CharField()
    count = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    success_rate = serializers.FloatField()
    
    # Float versions for frontend compatibility
    total_amount_float = serializers.SerializerMethodField()
    
    def get_total_amount_float(self, obj):
        """Get total amount as float."""
        return float(obj.get('total_amount', 0))


class TopCustomerSerializer(serializers.Serializer):
    """Serializer for top customer data."""
    
    customer_id = serializers.IntegerField()
    customer_name = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    invoice_count = serializers.IntegerField()
    subscription_count = serializers.IntegerField()
    
    # Float versions for frontend compatibility
    total_amount_float = serializers.SerializerMethodField()
    
    def get_total_amount_float(self, obj):
        """Get total amount as float."""
        return float(obj.get('total_amount', 0))
