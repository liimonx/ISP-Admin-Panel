from rest_framework import serializers
from .models import Router, RouterSession


class RouterSerializer(serializers.ModelSerializer):
    """Serializer for Router model."""
    
    class Meta:
        model = Router
        fields = [
            'id', 'name', 'description', 'router_type', 'host', 'api_port',
            'ssh_port', 'username', 'password', 'use_tls', 'status',
            'last_seen', 'location', 'coordinates', 'snmp_community',
            'snmp_port', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }


class RouterCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new routers."""
    
    class Meta:
        model = Router
        fields = [
            'name', 'description', 'router_type', 'host', 'api_port',
            'ssh_port', 'username', 'password', 'use_tls', 'status',
            'location', 'coordinates', 'snmp_community', 'snmp_port', 'notes'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }


class RouterUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating routers."""
    
    class Meta:
        model = Router
        fields = [
            'name', 'description', 'router_type', 'host', 'api_port',
            'ssh_port', 'username', 'password', 'use_tls', 'status',
            'location', 'coordinates', 'snmp_community', 'snmp_port', 'notes'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }


class RouterListSerializer(serializers.ModelSerializer):
    """Serializer for router list view with summary information."""
    
    is_online = serializers.BooleanField(read_only=True)
    is_mikrotik = serializers.BooleanField(read_only=True)
    api_url = serializers.CharField(read_only=True)
    active_subscriptions_count = serializers.SerializerMethodField()
    total_bandwidth_usage = serializers.SerializerMethodField()
    
    class Meta:
        model = Router
        fields = [
            'id', 'name', 'router_type', 'host', 'api_port', 'status',
            'last_seen', 'location', 'is_online', 'is_mikrotik', 'api_url',
            'active_subscriptions_count', 'total_bandwidth_usage', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_active_subscriptions_count(self, obj):
        """Get count of active subscriptions on this router."""
        return obj.get_active_subscriptions_count()
    
    def get_total_bandwidth_usage(self, obj):
        """Get total bandwidth usage for this router."""
        return float(obj.get_total_bandwidth_usage())


class RouterDetailSerializer(serializers.ModelSerializer):
    """Serializer for router detail view with additional computed fields."""
    
    is_online = serializers.BooleanField(read_only=True)
    is_mikrotik = serializers.BooleanField(read_only=True)
    api_url = serializers.CharField(read_only=True)
    active_subscriptions_count = serializers.SerializerMethodField()
    total_bandwidth_usage = serializers.SerializerMethodField()
    
    class Meta:
        model = Router
        fields = [
            'id', 'name', 'description', 'router_type', 'host', 'api_port',
            'ssh_port', 'username', 'password', 'use_tls', 'status',
            'last_seen', 'location', 'coordinates', 'snmp_community',
            'snmp_port', 'notes', 'is_online', 'is_mikrotik', 'api_url',
            'active_subscriptions_count', 'total_bandwidth_usage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def get_active_subscriptions_count(self, obj):
        """Get count of active subscriptions on this router."""
        return obj.get_active_subscriptions_count()
    
    def get_total_bandwidth_usage(self, obj):
        """Get total bandwidth usage for this router."""
        return float(obj.get_total_bandwidth_usage())


class RouterSessionSerializer(serializers.ModelSerializer):
    """Serializer for RouterSession model."""
    
    class Meta:
        model = RouterSession
        fields = [
            'id', 'router', 'username', 'ip_address', 'mac_address',
            'session_id', 'bytes_in', 'bytes_out', 'uptime',
            'started_at', 'last_seen'
        ]
        read_only_fields = ['id', 'started_at', 'last_seen']


class RouterSessionListSerializer(serializers.ModelSerializer):
    """Serializer for router session list view."""
    
    router_name = serializers.CharField(source='router.name', read_only=True)
    total_bytes = serializers.IntegerField(read_only=True)
    total_gb = serializers.FloatField(read_only=True)
    
    class Meta:
        model = RouterSession
        fields = [
            'id', 'router', 'router_name', 'username', 'ip_address',
            'mac_address', 'bytes_in', 'bytes_out', 'total_bytes',
            'total_gb', 'uptime', 'started_at', 'last_seen'
        ]
        read_only_fields = ['id', 'started_at', 'last_seen']


class RouterStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating router status."""
    status = serializers.ChoiceField(choices=Router.Status.choices)


class RouterTestConnectionSerializer(serializers.Serializer):
    """Serializer for testing router connection."""
    pass
