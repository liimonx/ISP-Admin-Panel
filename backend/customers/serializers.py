from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer model."""
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'address', 'city', 'state',
            'postal_code', 'country', 'company_name', 'tax_id', 'status',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new customers."""
    
    class Meta:
        model = Customer
        fields = [
            'name', 'email', 'phone', 'address', 'city', 'state',
            'postal_code', 'country', 'company_name', 'tax_id', 'status', 'notes'
        ]
    
    def validate_email(self, value):
        """Validate email uniqueness."""
        if Customer.objects.filter(email=value).exists():
            raise serializers.ValidationError('A customer with this email already exists.')
        return value


class CustomerUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating customers."""
    
    class Meta:
        model = Customer
        fields = [
            'name', 'email', 'phone', 'address', 'city', 'state',
            'postal_code', 'country', 'company_name', 'tax_id', 'status', 'notes'
        ]
    
    def validate_email(self, value):
        """Validate email uniqueness excluding current instance."""
        if Customer.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError('A customer with this email already exists.')
        return value


class CustomerListSerializer(serializers.ModelSerializer):
    """Serializer for customer list view with summary information."""
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'city', 'status',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CustomerDetailSerializer(serializers.ModelSerializer):
    """Serializer for customer detail view with additional computed fields."""
    
    full_address = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    is_suspended = serializers.BooleanField(read_only=True)
    subscriptions_count = serializers.SerializerMethodField()
    active_subscriptions_count = serializers.SerializerMethodField()
    total_monthly_bill = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'address', 'city', 'state',
            'postal_code', 'country', 'company_name', 'tax_id', 'status',
            'notes', 'full_address', 'is_active', 'is_suspended',
            'subscriptions_count', 'active_subscriptions_count', 'total_monthly_bill',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_subscriptions_count(self, obj):
        """Get total number of subscriptions for this customer."""
        return obj.get_subscriptions_count()
    
    def get_active_subscriptions_count(self, obj):
        """Get count of active subscriptions for this customer."""
        return obj.get_active_subscriptions_count()
    
    def get_total_monthly_bill(self, obj):
        """Get total monthly bill from active subscriptions."""
        return float(obj.get_total_monthly_bill())
