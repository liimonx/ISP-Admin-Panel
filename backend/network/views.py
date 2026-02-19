from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.db.models import Count, Avg, Sum, Q
from django.db.models.functions import Coalesce
from django.db import models
from django.utils import timezone
from datetime import datetime, timedelta
import logging
from core.responses import APIResponse

from .models import Router, RouterSession
from .serializers import (
    RouterSerializer, RouterListSerializer, RouterDetailSerializer,
    RouterCreateSerializer, RouterUpdateSerializer, RouterSessionSerializer
)
from .services import MikroTikService

logger = logging.getLogger(__name__)


class RouterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing routers.
    """
    queryset = Router.objects.all()
    serializer_class = RouterSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return RouterListSerializer
        elif self.action == 'retrieve':
            return RouterDetailSerializer
        elif self.action == 'create':
            return RouterCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return RouterUpdateSerializer
        return RouterSerializer
    
    def get_queryset(self):
        queryset = Router.objects.annotate(
            annotated_active_subscriptions_count=Coalesce(
                Count('subscriptions', filter=Q(subscriptions__status='active')),
                0
            ),
            annotated_total_bandwidth_usage=Coalesce(
                Sum('subscriptions__data_used', filter=Q(subscriptions__status='active')),
                models.Value(0.0, output_field=models.FloatField())
            ),
            annotated_subscriptions_count=Count('subscriptions')
        )
        
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
            
            # Update router status based on connection test
            if result.get('success'):
                router.status = Router.Status.ONLINE
                router.last_seen = timezone.now()
            else:
                router.status = Router.Status.OFFLINE
            router.save(update_fields=['status', 'last_seen'])
            
            return Response({
                'success': True,
                'message': 'Connection test completed',
                'data': result,
                'timestamp': timezone.now().isoformat(),
            })
        except Exception as e:
            logger.error(f"Connection test failed for router {router.name}: {str(e)}")
            router.status = Router.Status.OFFLINE
            router.save(update_fields=['status'])
            return Response({
                'success': False,
                'message': f'Connection test failed: {str(e)}',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def interfaces(self, request, pk=None):
        """Get router interfaces."""
        router = self.get_object()
        
        try:
            mikrotik_service = MikroTikService(router)
            interfaces = mikrotik_service.get_interfaces()
            
            return Response({
                'success': True,
                'message': 'Router interfaces retrieved successfully',
                'data': interfaces,
                'timestamp': timezone.now().isoformat(),
            })
        except Exception as e:
            logger.error(f"Failed to get interfaces for router {router.name}: {str(e)}")
            return Response({
                'success': False,
                'message': f'Failed to get interfaces: {str(e)}',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def bandwidth(self, request, pk=None):
        """Get router bandwidth usage."""
        router = self.get_object()
        
        try:
            mikrotik_service = MikroTikService(router)
            bandwidth = mikrotik_service.get_bandwidth_usage()
            
            return Response({
                'success': True,
                'message': 'Router bandwidth retrieved successfully',
                'data': bandwidth,
                'timestamp': timezone.now().isoformat(),
            })
        except Exception as e:
            logger.error(f"Failed to get bandwidth for router {router.name}: {str(e)}")
            return Response({
                'success': False,
                'message': f'Failed to get bandwidth: {str(e)}',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def connections(self, request, pk=None):
        """Get router active connections."""
        router = self.get_object()
        
        try:
            mikrotik_service = MikroTikService(router)
            connections = mikrotik_service.get_connections()
            
            return Response({
                'success': True,
                'message': 'Router connections retrieved successfully',
                'data': {
                    'total_connections': len(connections),
                    'connections': connections,
                },
                'timestamp': timezone.now().isoformat(),
            })
        except Exception as e:
            logger.error(f"Failed to get connections for router {router.name}: {str(e)}")
            return Response({
                'success': False,
                'message': f'Failed to get connections: {str(e)}',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def dhcp_leases(self, request, pk=None):
        """Get router DHCP leases."""
        router = self.get_object()
        
        try:
            mikrotik_service = MikroTikService(router)
            leases = mikrotik_service.get_dhcp_leases()
            
            return Response({
                'success': True,
                'message': 'Router DHCP leases retrieved successfully',
                'data': {
                    'total_leases': len(leases),
                    'leases': leases,
                },
                'timestamp': timezone.now().isoformat(),
            })
        except Exception as e:
            logger.error(f"Failed to get DHCP leases for router {router.name}: {str(e)}")
            return Response({
                'success': False,
                'message': f'Failed to get DHCP leases: {str(e)}',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def resources(self, request, pk=None):
        """Get router system resources."""
        router = self.get_object()
        
        try:
            mikrotik_service = MikroTikService(router)
            resources = mikrotik_service.get_system_resources()
            
            return Response({
                'success': True,
                'message': 'Router resources retrieved successfully',
                'data': resources,
                'timestamp': timezone.now().isoformat(),
            })
        except Exception as e:
            logger.error(f"Failed to get resources for router {router.name}: {str(e)}")
            return Response({
                'success': False,
                'message': f'Failed to get resources: {str(e)}',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """Get router system logs."""
        router = self.get_object()
        
        try:
            limit = int(request.query_params.get('limit', 50))
            mikrotik_service = MikroTikService(router)
            logs = mikrotik_service.get_logs(limit)
            
            return Response({
                'success': True,
                'message': 'Router logs retrieved successfully',
                'data': {
                    'logs': logs,
                },
                'timestamp': timezone.now().isoformat(),
            })
        except Exception as e:
            logger.error(f"Failed to get logs for router {router.name}: {str(e)}")
            return Response({
                'success': False,
                'message': f'Failed to get logs: {str(e)}',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def pppoe_users(self, request, pk=None):
        """Get router PPPoE users."""
        router = self.get_object()
        
        try:
            mikrotik_service = MikroTikService(router)
            users = mikrotik_service.get_pppoe_users()
            
            return Response({
                'success': True,
                'message': 'PPPoE users retrieved successfully',
                'data': {
                    'total_users': len(users),
                    'users': users,
                },
                'timestamp': timezone.now().isoformat(),
            })
        except Exception as e:
            logger.error(f"Failed to get PPPoE users for router {router.name}: {str(e)}")
            return Response({
                'success': False,
                'message': f'Failed to get PPPoE users: {str(e)}',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def create_pppoe_user(self, request, pk=None):
        """Create a PPPoE user on the router."""
        router = self.get_object()
        
        username = request.data.get('username')
        password = request.data.get('password')
        profile = request.data.get('profile')
        limit_in = request.data.get('limit_bytes_in')
        limit_out = request.data.get('limit_bytes_out')
        
        if not username or not password:
            return Response({
                'success': False,
                'message': 'Username and password are required',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            mikrotik_service = MikroTikService(router)
            success = mikrotik_service.create_pppoe_user(
                username=username,
                password=password,
                profile=profile,
                limit_bytes_in=limit_in,
                limit_bytes_out=limit_out
            )
            
            if success:
                return Response({
                    'success': True,
                    'message': f'PPPoE user {username} created successfully',
                    'timestamp': timezone.now().isoformat(),
                })
            else:
                return Response({
                    'success': False,
                    'message': f'Failed to create PPPoE user {username}',
                    'timestamp': timezone.now().isoformat(),
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Failed to create PPPoE user {username} on router {router.name}: {str(e)}")
            return Response({
                'success': False,
                'message': f'Failed to create PPPoE user: {str(e)}',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def restart(self, request, pk=None):
        """Restart the router."""
        router = self.get_object()
        
        try:
            mikrotik_service = MikroTikService(router)
            success = mikrotik_service.restart_router()
            
            if success:
                return Response({
                    'success': True,
                    'message': f'Router {router.name} restart initiated',
                    'data': {
                        'restart_time': timezone.now().isoformat(),
                        'estimated_downtime': '2-3 minutes',
                    },
                    'timestamp': timezone.now().isoformat(),
                })
            else:
                return Response({
                    'success': False,
                    'message': f'Failed to restart router {router.name}',
                    'timestamp': timezone.now().isoformat(),
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Failed to restart router {router.name}: {str(e)}")
            return Response({
                'success': False,
                'message': f'Failed to restart router: {str(e)}',
                'timestamp': timezone.now().isoformat(),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get router statistics."""
        from monitoring.models import RouterMetric, UsageSnapshot
        from django.db.models import Avg, Sum
        
        total_routers = Router.objects.count()
        online_routers = Router.objects.filter(status='online').count()
        offline_routers = Router.objects.filter(status='offline').count()
        maintenance_routers = Router.objects.filter(status='maintenance').count()
        
        # Calculate real statistics from monitoring data
        latest_metrics = RouterMetric.objects.filter(
            timestamp__gte=timezone.now() - timedelta(hours=1)
        )
        
        average_response_time = 45  # This would need actual ping measurements
        
        # Get interface count from cache (updated by background task)
        from django.core.cache import cache
        total_interfaces = cache.get('router_stats_total_interfaces', 0)
        active_interfaces = cache.get('router_stats_active_interfaces', 0)
        
        # Get connection data from usage snapshots
        latest_usage = UsageSnapshot.objects.aggregate(
            total_connections=Sum('active_connections'),
            total_pppoe_users=Sum('pppoe_users_count')
        )
        
        # Get bandwidth totals
        total_bandwidth = latest_metrics.aggregate(
            total_down=Sum('download_speed'),
            total_up=Sum('upload_speed')
        )
        
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
            'active_interfaces': active_interfaces,
            'active_connections': latest_usage.get('total_connections', 0) or active_sessions,
            'total_bandwidth': (total_bandwidth.get('total_down', 0) or 0) + (total_bandwidth.get('total_up', 0) or 0),
            'pppoe_users': latest_usage.get('total_pppoe_users', 0),
        }
        
        return Response({
            'success': True,
            'message': 'Router statistics retrieved successfully',
            'data': stats,
            'timestamp': timezone.now().isoformat(),
        })


# Main Router specific endpoints
@api_view(['GET'])
def main_router_status(request):
    """Get main router status."""
    try:
        from network.services import MikroTikService
        from monitoring.models import RouterMetric
        
        # Get or create main router record
        main_router, created = Router.objects.get_or_create(
            host='103.115.252.60',
            defaults={
                'name': 'Main Router',
                'router_type': 'mikrotik',
                'api_port': 8728,
                'ssh_port': 22,
                'username': 'admin',
                'password': '',
                'use_tls': True,
                'status': 'online',
                'location': 'Main Data Center',
            }
        )
        
        # Get real data from MikroTik service
        service = MikroTikService(main_router)
        resources = service.get_system_resources()
        connection_test = service.test_connection()
        
        # Get latest metric from database
        latest_metric = RouterMetric.objects.filter(router=main_router).first()
        
        # Combine real and stored data
        status_data = {
            'status': main_router.status,
            'uptime': resources.get('uptime', 'Unknown'),
            'version': connection_test.get('api_version', 'Unknown'),
            'last_seen': main_router.last_seen.isoformat() if main_router.last_seen else None,
            'cpu_usage': latest_metric.cpu_usage if latest_metric else resources.get('cpu_usage', 0),
            'memory_usage': latest_metric.memory_usage if latest_metric else resources.get('memory_usage', 0),
            'disk_usage': latest_metric.disk_usage if latest_metric else resources.get('disk_usage', 0),
            'temperature': latest_metric.temperature if latest_metric else resources.get('temperature'),
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
def main_router_interfaces(request):
    """Get main router interfaces."""
    try:
        from network.services import MikroTikService
        
        # Get main router
        main_router = Router.objects.filter(host='103.115.252.60').first()
        if not main_router:
            raise Exception("Main router not found")
        
        # Get real interface data
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
def main_router_bandwidth(request):
    """Get main router bandwidth usage."""
    try:
        from network.services import MikroTikService
        from monitoring.models import RouterMetric
        
        # Get or create main router record
        main_router, created = Router.objects.get_or_create(
            host='103.115.252.60',
            defaults={
                'name': 'Main Router',
                'router_type': 'mikrotik',
                'api_port': 8728,
                'ssh_port': 22,
                'username': 'admin',
                'password': '',
                'use_tls': True,
                'status': 'online',
                'location': 'Main Data Center',
            }
        )
        
        # Get bandwidth data from MikroTik service (includes database fallback)
        service = MikroTikService(main_router)
        bandwidth_data = service.get_bandwidth_usage()
        
        # Ensure all values are properly formatted and have consistent units
        # All values should be in bytes (for totals) and bytes/s (for speeds)
        bandwidth_response = {
            'total_download': int(bandwidth_data.get('total_download', 0)),
            'total_upload': int(bandwidth_data.get('total_upload', 0)),
            'download_speed': int(bandwidth_data.get('download_speed', 0)),
            'upload_speed': int(bandwidth_data.get('upload_speed', 0)),
            'interfaces': bandwidth_data.get('interfaces', {}),
            'timestamp': timezone.now().isoformat(),
        }
        
        return Response({
            'success': True,
            'message': 'Main router bandwidth retrieved successfully',
            'data': bandwidth_response,
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
def main_router_connections(request):
    """Get main router active connections."""
    try:
        # Mock connection data (replace with actual MikroTik API call)
        connections = [
            {
                'protocol': 'TCP',
                'source': '192.168.1.100:54321',
                'destination': '8.8.8.8:443',
                'state': 'established',
                'duration': '00:15:30',
            },
            {
                'protocol': 'UDP',
                'source': '192.168.1.101:12345',
                'destination': '1.1.1.1:53',
                'state': 'established',
                'duration': '00:02:15',
            },
        ]
        
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
def main_router_dhcp_leases(request):
    """Get main router DHCP leases."""
    try:
        # Mock DHCP leases data (replace with actual MikroTik API call)
        leases = [
            {
                'ip_address': '192.168.1.100',
                'mac_address': 'AA:BB:CC:DD:EE:FF',
                'hostname': 'johns-iphone',
                'status': 'active',
                'expires': '2024-01-15T10:30:00Z',
            },
            {
                'ip_address': '192.168.1.101',
                'mac_address': '11:22:33:44:55:66',
                'hostname': 'janes-laptop',
                'status': 'active',
                'expires': '2024-01-15T11:45:00Z',
            },
        ]
        
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
def main_router_resources(request):
    """Get main router system resources."""
    try:
        # Mock resource data (replace with actual MikroTik API call)
        resources = {
            'cpu_usage': 25,
            'memory_usage': 45,
            'disk_usage': 12,
            'temperature': 45,
            'uptime': '15 days, 3 hours, 45 minutes',
            'load_average': [0.5, 0.3, 0.2],
        }
        
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
