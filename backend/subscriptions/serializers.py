from rest_framework import serializers
from .models import Subscription
from customers.serializers import CustomerListSerializer
from plans.serializers import PlanListSerializer
from network.serializers import RouterListSerializer


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for Subscription model."""
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'customer', 'plan', 'router', 'username', 'password',
            'access_method', 'static_ip', 'mac_address', 'status',
            'start_date', 'end_date', 'monthly_fee', 'setup_fee',
            'data_used', 'data_reset_date', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }


class SubscriptionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new subscriptions."""
    
    class Meta:
        model = Subscription
        fields = [
            'customer', 'plan', 'router', 'username', 'password',
            'access_method', 'static_ip', 'mac_address', 'status',
            'start_date', 'end_date', 'monthly_fee', 'setup_fee', 'notes'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def validate_username(self, value):
        """Validate username uniqueness."""
        if Subscription.objects.filter(username=value).exists():
            raise serializers.ValidationError('A subscription with this username already exists.')
        return value
    
    def validate(self, attrs):
        """Validate subscription data."""
        # Set monthly fee from plan if not provided
        if 'monthly_fee' not in attrs and 'plan' in attrs:
            attrs['monthly_fee'] = attrs['plan'].price
        
        # Set setup fee from plan if not provided
        if 'setup_fee' not in attrs and 'plan' in attrs:
            attrs['setup_fee'] = attrs['plan'].setup_fee
        
        return attrs


class SubscriptionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating subscriptions."""
    
    class Meta:
        model = Subscription
        fields = [
            'customer', 'plan', 'router', 'username', 'password',
            'access_method', 'static_ip', 'mac_address', 'status',
            'start_date', 'end_date', 'monthly_fee', 'setup_fee', 'notes'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def validate_username(self, value):
        """Validate username uniqueness excluding current instance."""
        if Subscription.objects.filter(username=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError('A subscription with this username already exists.')
        return value


class SubscriptionListSerializer(serializers.ModelSerializer):
    """Serializer for subscription list view with summary information."""
    
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    router_name = serializers.CharField(source='router.name', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    is_suspended = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    data_remaining = serializers.FloatField(read_only=True)
    data_usage_percentage = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'customer', 'customer_name', 'plan', 'plan_name',
            'router', 'router_name', 'username', 'access_method',
            'status', 'start_date', 'end_date', 'monthly_fee',
            'data_used', 'is_active', 'is_suspended', 'is_expired',
            'days_remaining', 'data_remaining', 'data_usage_percentage',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SubscriptionDetailSerializer(serializers.ModelSerializer):
    """Serializer for subscription detail view with additional computed fields."""
    
    customer = CustomerListSerializer(read_only=True)
    plan = PlanListSerializer(read_only=True)
    router = RouterListSerializer(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    is_suspended = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    data_remaining = serializers.FloatField(read_only=True)
    data_usage_percentage = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'customer', 'plan', 'router', 'username', 'password',
            'access_method', 'static_ip', 'mac_address', 'status',
            'start_date', 'end_date', 'monthly_fee', 'setup_fee',
            'data_used', 'data_reset_date', 'notes', 'is_active',
            'is_suspended', 'is_expired', 'days_remaining',
            'data_remaining', 'data_usage_percentage', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }


class SubscriptionStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating subscription status."""
    status = serializers.ChoiceField(choices=Subscription.Status.choices)


class DataUsageUpdateSerializer(serializers.Serializer):
    """Serializer for updating data usage."""
    bytes_used = serializers.DecimalField(max_digits=20, decimal_places=2)


class DataUsageResetSerializer(serializers.Serializer):
    """Serializer for resetting data usage."""
    pass
