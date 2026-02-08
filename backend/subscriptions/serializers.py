from rest_framework import serializers
from .models import Subscription
from customers.serializers import CustomerListSerializer
from plans.serializers import PlanListSerializer
from network.serializers import RouterListSerializer


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for Subscription model with related data."""

    customer = CustomerListSerializer(read_only=True)
    plan = PlanListSerializer(read_only=True)
    router = RouterListSerializer(read_only=True)

    # Add computed properties
    is_active = serializers.BooleanField(read_only=True)
    is_suspended = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    data_remaining = serializers.SerializerMethodField()
    data_usage_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            'id', 'customer', 'plan', 'router', 'username', 'access_method',
            'static_ip', 'mac_address', 'status', 'start_date', 'end_date',
            'monthly_fee', 'setup_fee', 'data_used', 'data_reset_date',
            'notes', 'created_at', 'updated_at', 'is_active', 'is_suspended',
            'is_expired', 'data_remaining', 'data_usage_percentage'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_data_remaining(self, obj):
        """Get remaining data quota."""
        return obj.data_remaining

    def get_data_usage_percentage(self, obj):
        """Get data usage as percentage."""
        return obj.data_usage_percentage


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


class SubscriptionListSerializer(serializers.Serializer):
    """Serializer for subscription list view with summary information."""

    id = serializers.IntegerField(read_only=True)
    customer = serializers.IntegerField(source='customer.id', read_only=True)
    plan = serializers.IntegerField(source='plan.id', read_only=True)
    router = serializers.IntegerField(source='router.id', read_only=True)
    username = serializers.CharField(read_only=True)
    access_method = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    start_date = serializers.DateField(read_only=True)
    end_date = serializers.DateField(read_only=True, allow_null=True)
    monthly_fee = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    data_used = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    created_at = serializers.DateTimeField(read_only=True)



class SubscriptionDetailSerializer(serializers.ModelSerializer):
    """Serializer for subscription detail view with additional computed fields."""

    customer = CustomerListSerializer(read_only=True)
    plan = PlanListSerializer(read_only=True)
    router = RouterListSerializer(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    is_suspended = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    monthly_fee_float = serializers.SerializerMethodField()
    setup_fee_float = serializers.SerializerMethodField()
    data_used_float = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            'id', 'customer', 'plan', 'router', 'username', 'password',
            'access_method', 'static_ip', 'mac_address', 'status',
            'start_date', 'end_date', 'monthly_fee', 'setup_fee',
            'data_used', 'data_reset_date', 'notes', 'is_active',
            'is_suspended', 'is_expired', 'monthly_fee_float',
            'setup_fee_float', 'data_used_float', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def get_monthly_fee_float(self, obj):
        """Get monthly fee as float."""
        return obj.get_monthly_fee_float()

    def get_setup_fee_float(self, obj):
        """Get setup fee as float."""
        return obj.get_setup_fee_float()

    def get_data_used_float(self, obj):
        """Get data used as float."""
        return obj.get_data_used_float()



class SubscriptionStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating subscription status."""
    status = serializers.ChoiceField(choices=Subscription.Status.choices)


class DataUsageUpdateSerializer(serializers.Serializer):
    """Serializer for updating data usage."""
    bytes_used = serializers.DecimalField(max_digits=20, decimal_places=2)


class DataUsageResetSerializer(serializers.Serializer):
    """Serializer for resetting data usage."""
    pass
