from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Avg, Sum
from django.db import models
from django.utils import timezone
from datetime import datetime, timedelta
import logging
from core.responses import APIResponse
import random

from .models import Router, RouterSession
from .serializers import RouterSerializer, RouterSessionSerializer
from .services import MikroTikService

logger = logging.getLogger(__name__)


class RouterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing routers.
    """
    queryset = Router.objects.all()
    serializer_class = RouterSerializer
    
    def get_queryset(self):
        queryset = Router.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by router type
        router_type = self.request.query_params.get('router_type')
        if router_type:
            queryset = queryset.filter(router_type=router_type)
        
        # Search by name or host
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(host__icontains=search) |
                models.Q(description__icontains=search)
            )
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Test connection to a specific router."""
        router = self.get_object()
        
        try:
            mikrotik_service = MikroTikService(router)
            result = mikrotik_service.test_connection()
            
            return Response({
                'success': True,
                'message': 'Connection test successful',
                'data': result,
                'timestamp': timezone.now().isoformat(),
            })
        except Exception as e:
            logger.error(f"Connection test failed for router {router.name}: {str(e)}")
            return Response({
                'success': False,
                'message': f'Connection test failed: {str(e)}',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get router statistics."""
        total_routers = Router.objects.count()
        online_routers = Router.objects.filter(status='online').count()
        offline_routers = Router.objects.filter(status='offline').count()
        maintenance_routers = Router.objects.filter(status='maintenance').count()
        
        # Calculate average response time (mock data for now)
        average_response_time = 45
        
        # Get total interfaces and active sessions
        total_interfaces = 45  # Mock data
        active_sessions = RouterSession.objects.filter(
            last_seen__gte=timezone.now() - timedelta(minutes=5)
        ).count()
        
        stats = {
            'total_routers': total_routers,
            'online_routers': online_routers,
            'offline_routers': offline_routers,
            'maintenance_routers': maintenance_routers,
            'average_response_time': average_response_time,
            'total_interfaces': total_interfaces,
            'active_interfaces': total_interfaces - 3,  # Mock data
            'dhcp_leases': active_sessions + 1000,  # Mock data
            'active_connections': active_sessions + 1500,  # Mock data
        }
        
        return Response({
            'success': True,
            'message': 'Router statistics retrieved successfully',
            'data': stats,
            'timestamp': timezone.now().isoformat(),
        })


# Main Router specific endpoints
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def main_router_status(request):
    """Get main router status."""
    try:
        # Get the first router from database or use default
        try:
            main_router = Router.objects.first()
            if not main_router:
                # Create a default main router if none exists
                main_router = Router.objects.create(
                    name="Main Router",
                    host="192.168.1.1",
                    api_port=8728,
                    username="admin",
                    password="admin",
                    status="online"
                )
        except Exception as e:
            logger.warning(f"Could not get main router from database: {str(e)}")
            # Use default router for mock data
            main_router = Router(
                name="Main Router",
                host="192.168.1.1",
                api_port=8728,
                username="admin",
                password="admin",
                status="online"
            )
        
        # Use MikroTik service to get real-time data
        service = MikroTikService(main_router)
        connection_data = service.test_connection()
        
        status_data = {
            'status': 'online',
            'uptime': connection_data.get('uptime', '15 days, 3 hours, 45 minutes'),
            'version': connection_data.get('api_version', 'RouterOS v6.49.7'),
            'last_seen': timezone.now().isoformat(),
            'cpu_usage': connection_data.get('cpu_usage', 25),
            'memory_usage': connection_data.get('memory_usage', 45),
            'disk_usage': random.randint(10, 20),
            'temperature': random.randint(35, 65),
        }
        
        return Response({
            'success': True,
            'message': 'Main router status retrieved successfully',
            'data': status_data,
            'timestamp': timezone.now().isoformat(),
        })
    except Exception as e:
        logger.error(f"Failed to get main router status: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to get main router status: {str(e)}',
            'timestamp': timezone.now().isoformat(),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def main_router_interfaces(request):
    """Get main router interfaces."""
    try:
        # Get the first router
        main_router = Router.objects.first()
        if not main_router:
            main_router = Router(
                name="Main Router",
                host="192.168.1.1",
                api_port=8728,
                username="admin",
                password="admin",
                status="online"
            )
        
        # Use MikroTik service to get real-time data
        service = MikroTikService(main_router)
        interfaces = service.get_interfaces()
        
        return Response({
            'success': True,
            'message': 'Main router interfaces retrieved successfully',
            'data': interfaces,
            'timestamp': timezone.now().isoformat(),
        })
    except Exception as e:
        logger.error(f"Failed to get main router interfaces: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to get main router interfaces: {str(e)}',
            'timestamp': timezone.now().isoformat(),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def main_router_bandwidth(request):
    """Get main router bandwidth usage."""
    try:
        # Get the first router
        main_router = Router.objects.first()
        if not main_router:
            main_router = Router(
                name="Main Router",
                host="192.168.1.1",
                api_port=8728,
                username="admin",
                password="admin",
                status="online"
            )
        
        # Use MikroTik service to get real-time data
        service = MikroTikService(main_router)
        bandwidth_data = service.get_bandwidth_usage()
        
        return Response({
            'success': True,
            'message': 'Main router bandwidth retrieved successfully',
            'data': bandwidth_data,
            'timestamp': timezone.now().isoformat(),
        })
    except Exception as e:
        logger.error(f"Failed to get main router bandwidth: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to get main router bandwidth: {str(e)}',
            'timestamp': timezone.now().isoformat(),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def main_router_connections(request):
    """Get main router active connections."""
    try:
        # Get the first router
        main_router = Router.objects.first()
        if not main_router:
            main_router = Router(
                name="Main Router",
                host="192.168.1.1",
                api_port=8728,
                username="admin",
                password="admin",
                status="online"
            )
        
        # Use MikroTik service to get real-time data
        service = MikroTikService(main_router)
        connections = service.get_connections()
        
        return Response({
            'success': True,
            'message': 'Main router connections retrieved successfully',
            'data': {
                'total_connections': len(connections),
                'connections': connections,
            },
            'timestamp': timezone.now().isoformat(),
        })
    except Exception as e:
        logger.error(f"Failed to get main router connections: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to get main router connections: {str(e)}',
            'timestamp': timezone.now().isoformat(),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def main_router_dhcp_leases(request):
    """Get main router DHCP leases."""
    try:
        # Get the first router
        main_router = Router.objects.first()
        if not main_router:
            main_router = Router(
                name="Main Router",
                host="192.168.1.1",
                api_port=8728,
                username="admin",
                password="admin",
                status="online"
            )
        
        # Use MikroTik service to get real-time data
        service = MikroTikService(main_router)
        leases = service.get_dhcp_leases()
        
        return Response({
            'success': True,
            'message': 'Main router DHCP leases retrieved successfully',
            'data': {
                'total_leases': len(leases),
                'leases': leases,
            },
            'timestamp': timezone.now().isoformat(),
        })
    except Exception as e:
        logger.error(f"Failed to get main router DHCP leases: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to get main router DHCP leases: {str(e)}',
            'timestamp': timezone.now().isoformat(),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def main_router_resources(request):
    """Get main router system resources."""
    try:
        # Get the first router
        main_router = Router.objects.first()
        if not main_router:
            main_router = Router(
                name="Main Router",
                host="192.168.1.1",
                api_port=8728,
                username="admin",
                password="admin",
                status="online"
            )
        
        # Use MikroTik service to get real-time data
        service = MikroTikService(main_router)
        resources = service.get_system_resources()
        
        return Response({
            'success': True,
            'message': 'Main router resources retrieved successfully',
            'data': resources,
            'timestamp': timezone.now().isoformat(),
        })
    except Exception as e:
        logger.error(f"Failed to get main router resources: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to get main router resources: {str(e)}',
            'timestamp': timezone.now().isoformat(),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def main_router_logs(request):
    """Get main router system logs."""
    try:
        limit = int(request.query_params.get('limit', 50))
        
        # Mock log data (replace with actual MikroTik API call)
        logs = [
            {
                'timestamp': '2024-01-15T10:30:00Z',
                'level': 'info',
                'message': 'DHCP lease added: 192.168.1.100 -> AA:BB:CC:DD:EE:FF',
            },
            {
                'timestamp': '2024-01-15T10:25:00Z',
                'level': 'warning',
                'message': 'High CPU usage detected: 85%',
            },
            {
                'timestamp': '2024-01-15T10:20:00Z',
                'level': 'info',
                'message': 'Interface ether1 is up',
            },
        ]
        
        return Response({
            'success': True,
            'message': 'Main router logs retrieved successfully',
            'data': {
                'logs': logs[:limit],
            },
            'timestamp': timezone.now().isoformat(),
        })
    except Exception as e:
        logger.error(f"Failed to get main router logs: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to get main router logs: {str(e)}',
            'timestamp': timezone.now().isoformat(),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def main_router_alerts(request):
    """Get main router alerts."""
    try:
        # Mock alerts data (replace with actual monitoring logic)
        alerts = [
            {
                'id': '1',
                'title': 'High CPU Usage',
                'message': 'CPU usage is above 80% for the last 5 minutes',
                'severity': 'warning',
                'timestamp': '2024-01-15T10:25:00Z',
                'acknowledged': False,
            },
            {
                'id': '2',
                'title': 'Interface Down',
                'message': 'Interface ether3 is down',
                'severity': 'high',
                'timestamp': '2024-01-15T09:15:00Z',
                'acknowledged': True,
            },
        ]
        
        return Response({
            'success': True,
            'message': 'Main router alerts retrieved successfully',
            'data': {
                'alerts': alerts,
            },
            'timestamp': timezone.now().isoformat(),
        })
    except Exception as e:
        logger.error(f"Failed to get main router alerts: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to get main router alerts: {str(e)}',
            'timestamp': timezone.now().isoformat(),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def main_router_execute_command(request):
    """Execute command on main router."""
    try:
        command = request.data.get('command')
        if not command:
            return Response({
                'success': False,
                'message': 'Command is required',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mock command execution (replace with actual MikroTik API call)
        result = f"Command executed: {command}\nResult: Mock response for {command}"
        
        return Response({
            'success': True,
            'message': 'Command executed successfully',
            'data': {
                'result': result,
                'command': command,
            },
            'timestamp': timezone.now().isoformat(),
        })
    except Exception as e:
        logger.error(f"Failed to execute command on main router: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to execute command: {str(e)}',
            'timestamp': timezone.now().isoformat(),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def main_router_test_connection(request):
    """Test connection to main router."""
    try:
        # Mock connection test (replace with actual MikroTik API call)
        result = {
            'success': True,
            'response_time_ms': 45,
            'api_version': '6.49.7',
            'router_name': 'Main Router',
            'uptime': '15 days, 3 hours, 45 minutes',
        }
        
        return Response({
            'success': True,
            'message': 'Connection test successful',
            'data': result,
            'timestamp': timezone.now().isoformat(),
        })
    except Exception as e:
        logger.error(f"Failed to test main router connection: {str(e)}")
        return Response({
            'success': False,
            'message': f'Connection test failed: {str(e)}',
            'timestamp': timezone.now().isoformat(),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def main_router_restart(request):
    """Restart main router."""
    try:
        # Mock restart (replace with actual MikroTik API call)
        logger.warning("Main router restart requested - this would restart the actual router!")
        
        return Response({
            'success': True,
            'message': 'Router restart initiated',
            'data': {
                'restart_time': timezone.now().isoformat(),
                'estimated_downtime': '2-3 minutes',
            },
            'timestamp': timezone.now().isoformat(),
        })
    except Exception as e:
        logger.error(f"Failed to restart main router: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to restart router: {str(e)}',
            'timestamp': timezone.now().isoformat(),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def router_stats_view(request):
    """Get router statistics."""
    try:
        total_routers = Router.objects.count()
        online_routers = Router.objects.filter(status='online').count()
        offline_routers = Router.objects.filter(status='offline').count()
        maintenance_routers = Router.objects.filter(status='maintenance').count()
        
        # Calculate average response time (mock data for now)
        average_response_time = 45
        
        # Get total interfaces and active sessions
        total_interfaces = 45  # Mock data
        active_sessions = RouterSession.objects.filter(
            last_seen__gte=timezone.now() - timedelta(minutes=5)
        ).count()
        
        stats = {
            'total_routers': total_routers,
            'online_routers': online_routers,
            'offline_routers': offline_routers,
            'maintenance_routers': maintenance_routers,
            'average_response_time': average_response_time,
            'total_interfaces': total_interfaces,
            'active_interfaces': total_interfaces - 3,  # Mock data
            'dhcp_leases': active_sessions + 1000,  # Mock data
            'active_connections': active_sessions + 1500,  # Mock data
        }
        
        return APIResponse.success(
            data=stats,
            message="Router statistics retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Failed to get router statistics: {str(e)}")
        return APIResponse.error(
            message=f"Failed to get router statistics: {str(e)}"
        )
