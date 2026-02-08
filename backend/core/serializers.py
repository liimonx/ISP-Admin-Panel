"""
Core serializers for system settings and dashboard data.
"""
from rest_framework import serializers
from .models import SystemSettings


class SystemSettingsSerializer(serializers.ModelSerializer):
    """Serializer for system settings."""
    password_policy = serializers.SerializerMethodField()
    
    class Meta:
        model = SystemSettings
        fields = [
            'id', 'company_name', 'contact_email', 'support_phone',
            'timezone', 'date_format', 'currency', 'language',
            'maintenance_mode', 'auto_backup', 'backup_frequency',
            'email_notifications', 'sms_notifications',
            'api_rate_limit', 'session_timeout', 'max_login_attempts',
            'password_policy', 'log_level', 'database_pool_size',
            'cache_ttl', 'custom_css', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_password_policy(self, obj):
        """Get password policy as nested object."""
        return obj.get_password_policy()
    
    def update(self, instance, validated_data):
        """Update system settings with password policy handling."""
        password_policy = validated_data.pop('password_policy', None)
        
        # Update main fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update password policy if provided
        if password_policy:
            instance.set_password_policy(password_policy)
        
        instance.save()
        return instance


class SystemSettingsUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating system settings with password policy."""
    password_policy = serializers.DictField(required=False)
    
    class Meta:
        model = SystemSettings
        fields = [
            'company_name', 'contact_email', 'support_phone',
            'timezone', 'date_format', 'currency', 'language',
            'maintenance_mode', 'auto_backup', 'backup_frequency',
            'email_notifications', 'sms_notifications',
            'api_rate_limit', 'session_timeout', 'max_login_attempts',
            'password_policy', 'log_level', 'database_pool_size',
            'cache_ttl', 'custom_css'
        ]
    
    def update(self, instance, validated_data):
        """Update system settings with password policy handling."""
        password_policy = validated_data.pop('password_policy', None)
        
        # Update main fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update password policy if provided
        if password_policy:
            instance.set_password_policy(password_policy)
        
        instance.save()
        return instance


# Dashboard Statistics Serializers
class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""
    total_customers = serializers.IntegerField()
    active_subscriptions = serializers.IntegerField()
    total_routers = serializers.IntegerField()
    online_routers = serializers.IntegerField()
    pending_invoices = serializers.IntegerField()
    total_monthly_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    def to_representation(self, instance):
        """Convert total_monthly_revenue to float for JSON serialization."""
        data = super().to_representation(instance)
        if 'total_monthly_revenue' in data:
            data['total_monthly_revenue'] = float(data['total_monthly_revenue'])
        return data


class CustomerStatsSerializer(serializers.Serializer):
    """Serializer for customer statistics."""
    total_customers = serializers.IntegerField()
    active_customers = serializers.IntegerField()
    inactive_customers = serializers.IntegerField()
    suspended_customers = serializers.IntegerField()
    new_customers_this_month = serializers.IntegerField()


class SubscriptionStatsSerializer(serializers.Serializer):
    """Serializer for subscription statistics."""
    total_subscriptions = serializers.IntegerField()
    active_subscriptions = serializers.IntegerField()
    suspended_subscriptions = serializers.IntegerField()
    expired_subscriptions = serializers.IntegerField()
    new_subscriptions_this_month = serializers.IntegerField()


class PlanStatsSerializer(serializers.Serializer):
    """Serializer for plan statistics."""
    total_plans = serializers.IntegerField()
    active_plans = serializers.IntegerField()
    most_popular_plan = serializers.CharField()
    average_plan_price = serializers.DecimalField(max_digits=10, decimal_places=2)


class RouterStatsSerializer(serializers.Serializer):
    """Serializer for router statistics."""
    total_routers = serializers.IntegerField()
    online_routers = serializers.IntegerField()
    offline_routers = serializers.IntegerField()
    maintenance_routers = serializers.IntegerField()


class InvoiceStatsSerializer(serializers.Serializer):
    """Serializer for invoice statistics."""
    total_invoices = serializers.IntegerField()
    pending_invoices = serializers.IntegerField()
    paid_invoices = serializers.IntegerField()
    overdue_invoices = serializers.IntegerField()
    total_amount_due = serializers.DecimalField(max_digits=10, decimal_places=2)


class PaymentStatsSerializer(serializers.Serializer):
    """Serializer for payment statistics."""
    total_payments = serializers.IntegerField()
    successful_payments = serializers.IntegerField()
    failed_payments = serializers.IntegerField()
    total_amount_collected = serializers.DecimalField(max_digits=10, decimal_places=2)


class MonthlyTrendSerializer(serializers.Serializer):
    """Serializer for monthly trend data."""
    month = serializers.CharField()
    year = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    new_customers = serializers.IntegerField()
    new_subscriptions = serializers.IntegerField()


class DailyTrendSerializer(serializers.Serializer):
    """Serializer for daily trend data."""
    date = serializers.DateField()
    revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    new_customers = serializers.IntegerField()
    new_subscriptions = serializers.IntegerField()


class PaymentMethodStatsSerializer(serializers.Serializer):
    """Serializer for payment method statistics."""
    payment_method = serializers.CharField()
    count = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    percentage = serializers.FloatField()


class TopCustomerSerializer(serializers.Serializer):
    """Serializer for top customer data."""
    customer_id = serializers.IntegerField()
    customer_name = serializers.CharField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    subscription_count = serializers.IntegerField()