"""
Serializers for monitoring models.
"""
from rest_framework import serializers
from .models import SNMPSnapshot, UsageSnapshot


class SNMPSnapshotSerializer(serializers.ModelSerializer):
    """Serializer for SNMP snapshots."""
    
    router_name = serializers.CharField(source='router.name', read_only=True)
    
    class Meta:
        model = SNMPSnapshot
        fields = [
            'id', 'router', 'router_name', 'timestamp', 'cpu_usage',
            'memory_usage', 'uptime', 'temperature', 'interface_data',
            'disk_usage'
        ]


class UsageSnapshotSerializer(serializers.ModelSerializer):
    """Serializer for usage snapshots."""
    
    router_name = serializers.CharField(source='router.name', read_only=True)
    
    class Meta:
        model = UsageSnapshot
        fields = [
            'id', 'router', 'router_name', 'timestamp', 'total_bytes_in',
            'total_bytes_out', 'active_connections', 'pppoe_users_count',
            'pppoe_active_sessions'
        ]