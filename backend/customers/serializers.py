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
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'address', 'city', 'state',
            'postal_code', 'country', 'company_name', 'tax_id', 'status',
            'notes', 'full_address', 'is_active', 'is_suspended',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
