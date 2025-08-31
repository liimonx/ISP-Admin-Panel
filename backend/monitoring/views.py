"""
Views for monitoring and health checks.
"""
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from django.conf import settings
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status as drf_status
from core.responses import APIResponse
from .models import SNMPSnapshot, UsageSnapshot
from .serializers import SNMPSnapshotSerializer, UsageSnapshotSerializer
import redis
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """
    Health check endpoint for monitoring application status.
    Returns status of database, Redis, and overall system health.
    """
    health_status = {
        'status': 'healthy',
        'timestamp': None,
        'services': {
            'database': 'unknown',
            'redis': 'unknown',
            'celery': 'unknown'
        },
        'version': '1.0.0'
    }
    
    overall_healthy = True
    
    # Check database connectivity
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        health_status['services']['database'] = 'healthy'
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status['services']['database'] = 'unhealthy'
        overall_healthy = False
    
    # Check Redis connectivity
    try:
        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        health_status['services']['redis'] = 'healthy'
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        health_status['services']['redis'] = 'unhealthy'
        overall_healthy = False
    
    # Check Celery (basic check - see if we can connect to Redis)
    try:
        r = redis.from_url(settings.REDIS_URL)
        # Check if Celery queue exists (basic check)
        r.llen('celery')
        health_status['services']['celery'] = 'healthy'
    except Exception as e:
        logger.warning(f"Celery health check warning: {e}")
        health_status['services']['celery'] = 'warning'
    
    # Set overall status
    health_status['status'] = 'healthy' if overall_healthy else 'unhealthy'
    health_status['timestamp'] = str(__import__('django.utils.timezone').timezone.now())
    
    # Return appropriate HTTP status
    http_status = 200 if overall_healthy else 503
    
    return JsonResponse(health_status, status=http_status)


class SNMPSnapshotListView(generics.ListCreateAPIView):
    """List and create SNMP snapshots."""
    queryset = SNMPSnapshot.objects.all().order_by('-timestamp')
    serializer_class = SNMPSnapshotSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        router_id = self.request.query_params.get('router_id')
        if router_id:
            return self.queryset.filter(router_id=router_id)
        return self.queryset


class UsageSnapshotListView(generics.ListCreateAPIView):
    """List and create usage snapshots."""
    queryset = UsageSnapshot.objects.all().order_by('-timestamp')
    serializer_class = UsageSnapshotSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        router_id = self.request.query_params.get('router_id')
        if router_id:
            return self.queryset.filter(router_id=router_id)
        return self.queryset


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def monitoring_stats_view(request):
    """
    Get monitoring statistics overview.
    """
    try:
        from network.models import Router
        
        stats = {
            'total_routers': Router.objects.count(),
            'online_routers': Router.objects.filter(status='online').count(),
            'offline_routers': Router.objects.filter(status='offline').count(),
            'maintenance_routers': Router.objects.filter(status='maintenance').count(),
            'total_snapshots': SNMPSnapshot.objects.count(),
            'total_usage_snapshots': UsageSnapshot.objects.count(),
            'latest_snapshot': None,
            'latest_usage_snapshot': None
        }
        
        # Get latest snapshots
        latest_snmp = SNMPSnapshot.objects.first()
        latest_usage = UsageSnapshot.objects.first()
        
        if latest_snmp:
            stats['latest_snapshot'] = SNMPSnapshotSerializer(latest_snmp).data
        
        if latest_usage:
            stats['latest_usage_snapshot'] = UsageSnapshotSerializer(latest_usage).data
        
        return APIResponse.success(
            data=stats,
            message="Monitoring statistics retrieved successfully"
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Failed to retrieve monitoring statistics: {str(e)}"
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def router_monitoring_view(request, router_id):
    """
    Get monitoring data for a specific router.
    """
    from network.models import Router
    
    try:
        router = Router.objects.get(id=router_id)
    except Router.DoesNotExist:
        return Response(
            {'error': 'Router not found'}, 
            status=drf_status.HTTP_404_NOT_FOUND
        )
    
    # Get recent snapshots
    snmp_snapshots = SNMPSnapshot.objects.filter(
        router=router
    ).order_by('-timestamp')[:50]
    
    usage_snapshots = UsageSnapshot.objects.filter(
        router=router
    ).order_by('-timestamp')[:50]
    
    data = {
        'router': {
            'id': router.id,
            'name': router.name,
            'status': router.status,
            'host': router.host
        },
        'snmp_snapshots': SNMPSnapshotSerializer(snmp_snapshots, many=True).data,
        'usage_snapshots': UsageSnapshotSerializer(usage_snapshots, many=True).data
    }
    
    return Response(data)