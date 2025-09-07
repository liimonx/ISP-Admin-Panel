from rest_framework import serializers
from .models import Plan


class PlanSerializer(serializers.ModelSerializer):
    """Serializer for Plan model."""
    
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'description', 'download_speed', 'upload_speed',
            'speed_unit', 'data_quota', 'quota_unit', 'price', 'setup_fee',
            'billing_cycle', 'is_active', 'is_featured', 'is_popular',
            'features', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PlanCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new plans."""
    
    class Meta:
        model = Plan
        fields = [
            'name', 'description', 'download_speed', 'upload_speed',
            'speed_unit', 'data_quota', 'quota_unit', 'price', 'setup_fee',
            'billing_cycle', 'is_active', 'is_featured', 'is_popular', 'features'
        ]
    
    def validate(self, attrs):
        """Validate plan data."""
        # Ensure upload speed is not greater than download speed
        if attrs.get('upload_speed', 0) > attrs.get('download_speed', 0):
            raise serializers.ValidationError(
                'Upload speed cannot be greater than download speed'
            )
        
        # Validate data quota for unlimited plans
        if attrs.get('quota_unit') == Plan.QuotaUnit.UNLIMITED:
            attrs['data_quota'] = None
        
        return attrs


class PlanUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating plans."""
    
    class Meta:
        model = Plan
        fields = [
            'name', 'description', 'download_speed', 'upload_speed',
            'speed_unit', 'data_quota', 'quota_unit', 'price', 'setup_fee',
            'billing_cycle', 'is_active', 'is_featured', 'is_popular', 'features'
        ]
    
    def validate(self, attrs):
        """Validate plan data."""
        # Ensure upload speed is not greater than download speed
        download_speed = attrs.get('download_speed', self.instance.download_speed)
        upload_speed = attrs.get('upload_speed', self.instance.upload_speed)
        
        if upload_speed > download_speed:
            raise serializers.ValidationError(
                'Upload speed cannot be greater than download speed'
            )
        
        # Validate data quota for unlimited plans
        if attrs.get('quota_unit') == Plan.QuotaUnit.UNLIMITED:
            attrs['data_quota'] = None
        
        return attrs


class PlanListSerializer(serializers.ModelSerializer):
    """Serializer for plan list view with summary information."""
    
    formatted_speed = serializers.CharField(read_only=True)
    formatted_quota = serializers.CharField(read_only=True)
    formatted_price = serializers.CharField(read_only=True)
    active_subscriptions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'download_speed', 'upload_speed', 'speed_unit',
            'data_quota', 'quota_unit', 'price', 'is_active', 'is_featured',
            'is_popular', 'formatted_speed', 'formatted_quota', 'formatted_price',
            'active_subscriptions_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_active_subscriptions_count(self, obj):
        """Get count of active subscriptions for this plan."""
        return obj.get_active_subscriptions_count()


class PlanDetailSerializer(serializers.ModelSerializer):
    """Serializer for plan detail view with additional computed fields."""
    
    formatted_speed = serializers.CharField(read_only=True)
    formatted_quota = serializers.CharField(read_only=True)
    formatted_price = serializers.CharField(read_only=True)
    is_unlimited = serializers.BooleanField(read_only=True)
    active_subscriptions_count = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()
    subscribers_count = serializers.SerializerMethodField()
    active_subscribers_count = serializers.SerializerMethodField()
    monthly_revenue = serializers.SerializerMethodField()
    
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'description', 'download_speed', 'upload_speed',
            'speed_unit', 'data_quota', 'quota_unit', 'price', 'setup_fee',
            'billing_cycle', 'is_active', 'is_featured', 'is_popular',
            'features', 'formatted_speed', 'formatted_quota', 'formatted_price',
            'is_unlimited', 'active_subscriptions_count', 'total_revenue',
            'subscribers_count', 'active_subscribers_count', 'monthly_revenue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_active_subscriptions_count(self, obj):
        """Get count of active subscriptions for this plan."""
        return obj.get_active_subscriptions_count()
    
    def get_total_revenue(self, obj):
        """Get total monthly revenue from this plan."""
        return float(obj.get_total_revenue())
    
    def get_subscribers_count(self, obj):
        """Get total number of subscribers for this plan."""
        return obj.get_subscribers_count()
    
    def get_active_subscribers_count(self, obj):
        """Get count of active subscribers for this plan."""
        return obj.get_active_subscribers_count()
    
    def get_monthly_revenue(self, obj):
        """Get monthly revenue from this plan."""
        return obj.get_monthly_revenue()


class PlanComparisonSerializer(serializers.ModelSerializer):
    """Serializer for plan comparison view."""
    
    formatted_speed = serializers.CharField(read_only=True)
    formatted_quota = serializers.CharField(read_only=True)
    formatted_price = serializers.CharField(read_only=True)
    is_unlimited = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'description', 'formatted_speed', 'formatted_quota',
            'formatted_price', 'is_unlimited', 'features', 'is_featured',
            'is_popular', 'setup_fee'
        ]
        read_only_fields = ['id']
