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
from .models import RouterMetric, SNMPSnapshot, UsageSnapshot
from .serializers import RouterMetricSerializer, SNMPSnapshotSerializer, UsageSnapshotSerializer
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


class RouterMetricListView(generics.ListCreateAPIView):
    """List and create router metrics."""
    queryset = RouterMetric.objects.all().order_by('-timestamp')
    serializer_class = RouterMetricSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        router_id = self.request.query_params.get('router_id')
        if router_id:
            return self.queryset.filter(router_id=router_id)
        return self.queryset


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
        from django.db.models import Avg, Max, OuterRef, Subquery
        
        # Get router counts
        total_routers = Router.objects.count()
        online_routers = Router.objects.filter(status='online').count()
        offline_routers = Router.objects.filter(status='offline').count()
        maintenance_routers = Router.objects.filter(status='maintenance').count()
        
        # Get metrics statistics
        total_metrics = RouterMetric.objects.count()
        
        # Get latest metrics for each router
        latest_metric_subquery = RouterMetric.objects.filter(
            router=OuterRef('pk')
        ).order_by('-timestamp').values('pk')[:1]

        routers_with_metric = Router.objects.annotate(
            latest_metric_id=Subquery(latest_metric_subquery)
        )

        metric_ids = [r.latest_metric_id for r in routers_with_metric if r.latest_metric_id]

        # Fetch actual metric objects efficiently
        latest_metrics = list(RouterMetric.objects.filter(pk__in=metric_ids).order_by('-timestamp'))
        
        # Calculate averages from latest metrics
        avg_cpu = sum(m.cpu_usage for m in latest_metrics) / len(latest_metrics) if latest_metrics else 0
        avg_memory = sum(m.memory_usage for m in latest_metrics) / len(latest_metrics) if latest_metrics else 0
        total_bandwidth = sum(m.download_speed + m.upload_speed for m in latest_metrics) if latest_metrics else 0
        
        # Get connection counts from usage snapshots
        latest_usage = UsageSnapshot.objects.first()
        active_connections = latest_usage.active_connections if latest_usage else 0
        
        stats = {
            'total_routers': total_routers,
            'online_routers': online_routers,
            'offline_routers': offline_routers,
            'maintenance_routers': maintenance_routers,
            'total_metrics': total_metrics,
            'average_cpu_usage': round(avg_cpu, 1),
            'average_memory_usage': round(avg_memory, 1),
            'total_bandwidth': total_bandwidth,
            'active_connections': active_connections,
            'latest_metric': RouterMetricSerializer(latest_metrics[0]).data if latest_metrics else None
        }
        
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
    
    # Get recent metrics
    data = {
        'router': {
            'id': router.id,
            'name': router.name,
            'status': router.status,
            'host': router.host
        },
        'metrics': []
    }
    
    metrics = RouterMetric.objects.filter(
        router=router
    ).order_by('-timestamp')[:50]
    data['metrics'] = RouterMetricSerializer(metrics, many=True).data
    
    return Response(data)