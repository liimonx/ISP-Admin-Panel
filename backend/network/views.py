from rest_framework import generics, permissions, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from .models import Router, RouterSession
from .serializers import (
    RouterSerializer, RouterCreateSerializer, RouterUpdateSerializer,
    RouterListSerializer, RouterDetailSerializer, RouterSessionSerializer,
    RouterSessionListSerializer, RouterStatusUpdateSerializer, RouterTestConnectionSerializer
)
from .services import test_router_connection, RouterOSService


@extend_schema(
    tags=['Network'],
    summary='List Routers',
    description='Get a list of all routers with filtering and search capabilities'
)
class RouterListView(generics.ListCreateAPIView):
    """List and create routers."""
    queryset = Router.objects.all()
    serializer_class = RouterListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'router_type', 'location']
    search_fields = ['name', 'host', 'description']
    ordering_fields = ['name', 'host', 'status', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RouterCreateSerializer
        return RouterListSerializer


@extend_schema(
    tags=['Network'],
    summary='Get Router Details',
    description='Get detailed information about a specific router'
)
class RouterDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a router."""
    queryset = Router.objects.all()
    serializer_class = RouterDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return RouterUpdateSerializer
        return RouterDetailSerializer


@extend_schema(
    tags=['Network'],
    summary='Test Router Connection',
    description='Test connection to a specific router'
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def test_router_connection_view(request, pk):
    """Test connection to a router."""
    try:
        router = Router.objects.get(pk=pk)
    except Router.DoesNotExist:
        return Response({'error': 'Router not found'}, status=status.HTTP_404_NOT_FOUND)
    
    result = test_router_connection(router)
    return Response(result)


@extend_schema(
    tags=['Network'],
    summary='Update Router Status',
    description='Update the status of a router'
)
@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_router_status_view(request, pk):
    """Update router status."""
    try:
        router = Router.objects.get(pk=pk)
    except Router.DoesNotExist:
        return Response({'error': 'Router not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = RouterStatusUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    new_status = serializer.validated_data['status']
    router.status = new_status
    router.save()
    
    return Response({
        'message': f'Router status updated to {new_status}',
        'router': RouterDetailSerializer(router).data
    })


@extend_schema(
    tags=['Network'],
    summary='Get Router Sessions',
    description='Get active sessions for a specific router'
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def router_sessions_view(request, pk):
    """Get active sessions for a router."""
    try:
        router = Router.objects.get(pk=pk)
    except Router.DoesNotExist:
        return Response({'error': 'Router not found'}, status=status.HTTP_404_NOT_FOUND)
    
    sessions = RouterSession.objects.filter(router=router).order_by('-started_at')
    serializer = RouterSessionListSerializer(sessions, many=True)
    return Response(serializer.data)


@extend_schema(
    tags=['Network'],
    summary='Get Router PPPoE Users',
    description='Get PPPoE users from a specific router'
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def router_pppoe_users_view(request, pk):
    """Get PPPoE users from a router."""
    try:
        router = Router.objects.get(pk=pk)
    except Router.DoesNotExist:
        return Response({'error': 'Router not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        with RouterOSService(router) as service:
            users = service.get_pppoe_users()
            return Response({
                'router': router.name,
                'users': users,
                'count': len(users)
            })
    except Exception as e:
        return Response({
            'error': f'Failed to get PPPoE users: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Network'],
    summary='Create PPPoE User',
    description='Create a new PPPoE user on a router'
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_pppoe_user_view(request, pk):
    """Create a PPPoE user on a router."""
    try:
        router = Router.objects.get(pk=pk)
    except Router.DoesNotExist:
        return Response({'error': 'Router not found'}, status=status.HTTP_404_NOT_FOUND)
    
    username = request.data.get('username')
    password = request.data.get('password')
    profile = request.data.get('profile')
    
    if not username or not password:
        return Response({
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        with RouterOSService(router) as service:
            success = service.create_pppoe_user(username, password, profile)
            if success:
                return Response({
                    'message': f'PPPoE user {username} created successfully on {router.name}'
                })
            else:
                return Response({
                    'error': f'Failed to create PPPoE user {username} on {router.name}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            'error': f'Failed to create PPPoE user: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Network'],
    summary='Delete PPPoE User',
    description='Delete a PPPoE user from a router'
)
@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_pppoe_user_view(request, pk):
    """Delete a PPPoE user from a router."""
    try:
        router = Router.objects.get(pk=pk)
    except Router.DoesNotExist:
        return Response({'error': 'Router not found'}, status=status.HTTP_404_NOT_FOUND)
    
    username = request.data.get('username')
    if not username:
        return Response({
            'error': 'Username is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        with RouterOSService(router) as service:
            success = service.delete_pppoe_user(username)
            if success:
                return Response({
                    'message': f'PPPoE user {username} deleted successfully from {router.name}'
                })
            else:
                return Response({
                    'error': f'Failed to delete PPPoE user {username} from {router.name}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            'error': f'Failed to delete PPPoE user: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Network'],
    summary='Get Router Statistics',
    description='Get statistics for all routers'
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def router_stats_view(request):
    """Get router statistics."""
    total_routers = Router.objects.count()
    online_routers = Router.objects.filter(status='online').count()
    offline_routers = Router.objects.filter(status='offline').count()
    maintenance_routers = Router.objects.filter(status='maintenance').count()
    
    # MikroTik routers
    mikrotik_routers = Router.objects.filter(router_type='mikrotik').count()
    
    # Total subscriptions across all routers
    total_subscriptions = sum(router.get_active_subscriptions_count() for router in Router.objects.all())
    
    stats = {
        'total_routers': total_routers,
        'online_routers': online_routers,
        'offline_routers': offline_routers,
        'maintenance_routers': maintenance_routers,
        'mikrotik_routers': mikrotik_routers,
        'total_subscriptions': total_subscriptions,
        'online_percentage': round((online_routers / total_routers * 100) if total_routers > 0 else 0, 2)
    }
    
    return Response(stats)


@extend_schema(
    tags=['Network'],
    summary='Get All Router Sessions',
    description='Get all active sessions across all routers'
)
class RouterSessionListView(generics.ListAPIView):
    """List all router sessions."""
    queryset = RouterSession.objects.all()
    serializer_class = RouterSessionListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['router', 'username', 'ip_address']
    search_fields = ['username', 'ip_address', 'mac_address']
    ordering_fields = ['username', 'started_at', 'last_seen', 'total_bytes']
    ordering = ['-started_at']


@extend_schema(
    tags=['Network'],
    summary='Bulk Update Router Status',
    description='Update status for multiple routers at once'
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_update_router_status_view(request):
    """Bulk update router status."""
    router_ids = request.data.get('router_ids', [])
    new_status = request.data.get('status')
    
    if not router_ids or not new_status:
        return Response(
            {'error': 'Both router_ids and status are required'}, 
            status=400
        )
    
    if new_status not in dict(Router.Status.choices):
        return Response(
            {'error': f'Invalid status. Must be one of: {list(dict(Router.Status.choices).keys())}'}, 
            status=400
        )
    
    updated_count = Router.objects.filter(id__in=router_ids).update(status=new_status)
    
    return Response({
        'message': f'Successfully updated {updated_count} routers to {new_status}',
        'updated_count': updated_count
    })
