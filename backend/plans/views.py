from rest_framework import generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from django.db.models import Count
from .models import Plan
from .serializers import (
    PlanSerializer, PlanCreateSerializer, PlanUpdateSerializer,
    PlanListSerializer, PlanDetailSerializer, PlanComparisonSerializer
)


@extend_schema(
    tags=['Plans'],
    summary='List Plans',
    description='Get a list of all internet plans with filtering and search capabilities'
)
class PlanListView(generics.ListCreateAPIView):
    """List and create plans."""
    queryset = Plan.objects.all()
    serializer_class = PlanListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_featured', 'is_popular', 'billing_cycle']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'download_speed', 'created_at']
    ordering = ['price']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PlanCreateSerializer
        return PlanListSerializer
    
    def get_queryset(self):
        """Filter queryset based on request parameters."""
        queryset = Plan.objects.all()
        
        # Filter by active plans only for non-admin users
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset


@extend_schema(
    tags=['Plans'],
    summary='Get Plan Details',
    description='Get detailed information about a specific plan'
)
class PlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a plan."""
    queryset = Plan.objects.all()
    serializer_class = PlanDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PlanUpdateSerializer
        return PlanDetailSerializer


@extend_schema(
    tags=['Plans'],
    summary='Get Active Plans',
    description='Get only active plans for customer selection'
)
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def active_plans_view(request):
    """Get only active plans."""
    plans = Plan.objects.filter(is_active=True).order_by('price')
    serializer = PlanListSerializer(plans, many=True)
    return Response(serializer.data)


@extend_schema(
    tags=['Plans'],
    summary='Get Featured Plans',
    description='Get featured plans for homepage display'
)
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def featured_plans_view(request):
    """Get featured plans."""
    plans = Plan.objects.filter(is_active=True, is_featured=True).order_by('price')
    serializer = PlanListSerializer(plans, many=True)
    return Response(serializer.data)


@extend_schema(
    tags=['Plans'],
    summary='Compare Plans',
    description='Compare multiple plans side by side'
)
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def compare_plans_view(request):
    """Compare multiple plans."""
    plan_ids = request.query_params.getlist('plan_ids')
    
    if not plan_ids:
        return Response({'error': 'plan_ids parameter is required'}, status=400)
    
    if len(plan_ids) > 5:
        return Response({'error': 'Maximum 5 plans can be compared'}, status=400)
    
    plans = Plan.objects.filter(id__in=plan_ids, is_active=True)
    serializer = PlanComparisonSerializer(plans, many=True)
    return Response(serializer.data)


@extend_schema(
    tags=['Plans'],
    summary='Get Plan Statistics',
    description='Get plan statistics and revenue information'
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def plan_stats_view(request):
    """Get plan statistics."""
    total_plans = Plan.objects.count()
    active_plans = Plan.objects.filter(is_active=True).count()
    featured_plans = Plan.objects.filter(is_featured=True).count()
    popular_plans_count = Plan.objects.filter(is_popular=True).count()
    
    # Revenue statistics
    total_monthly_revenue = sum(plan.get_total_revenue() for plan in Plan.objects.with_revenue())
    
    # Most popular plans
    top_plans = Plan.objects.filter(is_active=True).annotate(subs_count=Count('subscriptions')).order_by('-subs_count')[:5]
    
    stats = {
        'total_plans': total_plans,
        'active_plans': active_plans,
        'featured_plans': featured_plans,
        'popular_plans': popular_plans_count,
        'top_plans': PlanListSerializer(top_plans, many=True).data,
        'total_monthly_revenue': float(total_monthly_revenue),
    }
    
    return Response(stats)


@extend_schema(
    tags=['Plans'],
    summary='Bulk Update Plan Status',
    description='Update status for multiple plans at once'
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_update_plan_status_view(request):
    """Bulk update plan status."""
    plan_ids = request.data.get('plan_ids', [])
    is_active = request.data.get('is_active')
    
    if not plan_ids or is_active is None:
        return Response(
            {'error': 'Both plan_ids and is_active are required'}, 
            status=400
        )
    
    updated_count = Plan.objects.filter(id__in=plan_ids).update(is_active=is_active)
    
    return Response({
        'message': f'Successfully updated {updated_count} plans',
        'updated_count': updated_count
    })
