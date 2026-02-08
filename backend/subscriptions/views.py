from rest_framework import generics, permissions, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from core.responses import APIResponse
from .models import Subscription
from .serializers import (
    SubscriptionSerializer, SubscriptionCreateSerializer, SubscriptionUpdateSerializer,
    SubscriptionDetailSerializer,
    SubscriptionStatusUpdateSerializer, DataUsageUpdateSerializer, DataUsageResetSerializer
)
import logging

logger = logging.getLogger(__name__)


@extend_schema(
    tags=['Subscriptions'],
    summary='List Subscriptions',
    description='Get a list of all subscriptions with filtering and search capabilities'
)
class SubscriptionListView(generics.ListCreateAPIView):
    """List and create subscriptions."""
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    # Temporarily disable filtering to isolate the issue
    # filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    # filterset_fields = ['status', 'access_method', 'customer', 'plan', 'router']
    # search_fields = ['username', 'customer__name', 'plan__name']
    # ordering_fields = ['username', 'start_date', 'monthly_fee', 'created_at']
    ordering = ['-created_at']

    def create(self, request, *args, **kwargs):
        """Create a new subscription with logging."""
        logger.info(f"📝 Creating new subscription with data: {request.data}")

        response = super().create(request, *args, **kwargs)

        if response.status_code == 201:
            logger.info(f"✅ Subscription created successfully: {response.data}")
        else:
            logger.error(f"❌ Failed to create subscription: {response.data}")

        return response

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SubscriptionCreateSerializer
        return SubscriptionSerializer

    def list(self, request, *args, **kwargs):
        """List subscriptions with proper serialization."""
        try:
            logger.info("📋 Listing subscriptions...")

            # Get queryset with related fields - ensure we select related data
            queryset = self.get_queryset().select_related(
                'customer', 'plan', 'router'
            ).prefetch_related(
                'customer', 'plan', 'router'
            )

            total_count = queryset.count()
            logger.info(f"📊 Found {total_count} subscriptions in database")

            # Get all subscriptions (disable pagination for debugging)
            serializer = self.get_serializer(queryset, many=True)
            serialized_data = serializer.data

            logger.info(f"🔍 Serialized {len(serialized_data)} subscriptions")

            # Log first item for debugging
            if serialized_data:
                logger.info(f"📋 First subscription data: {serialized_data[0]}")

            response_data = {
                'success': True,
                'message': 'Subscriptions retrieved successfully',
                'count': total_count,
                'results': serialized_data,
                'next': None,
                'previous': None,
            }

            logger.info(f"📤 Returning response with {len(serialized_data)} items")
            return Response(response_data)

        except Exception as e:
            logger.error(f"❌ Error retrieving subscriptions: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': f'Error retrieving subscriptions: {str(e)}',
                'count': 0,
                'results': [],
                'next': None,
                'previous': None,
            }, status=500)


@extend_schema(
    tags=['Subscriptions'],
    summary='Get Subscription Details',
    description='Get detailed information about a specific subscription'
)
class SubscriptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a subscription."""
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return SubscriptionUpdateSerializer
        return SubscriptionDetailSerializer


@extend_schema(
    tags=['Subscriptions'],
    summary='Update Subscription Status',
    description='Update the status of a subscription'
)
@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_subscription_status_view(request, pk):
    """Update subscription status."""
    try:
        subscription = Subscription.objects.get(pk=pk)
    except Subscription.DoesNotExist:
        return Response({'error': 'Subscription not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = SubscriptionStatusUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    new_status = serializer.validated_data['status']
    subscription.status = new_status
    subscription.save()

    return Response({
        'message': f'Subscription status updated to {new_status}',
        'subscription': SubscriptionDetailSerializer(subscription).data
    })


@extend_schema(
    tags=['Subscriptions'],
    summary='Update Data Usage',
    description='Update data usage for a subscription'
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_data_usage_view(request, pk):
    """Update subscription data usage."""
    try:
        subscription = Subscription.objects.get(pk=pk)
    except Subscription.DoesNotExist:
        return Response({'error': 'Subscription not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = DataUsageUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    bytes_used = serializer.validated_data['bytes_used']
    subscription.add_data_usage(bytes_used)

    return Response({
        'message': 'Data usage updated successfully',
        'subscription': SubscriptionDetailSerializer(subscription).data
    })


@extend_schema(
    tags=['Subscriptions'],
    summary='Reset Data Usage',
    description='Reset data usage counter for a subscription'
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reset_data_usage_view(request, pk):
    """Reset subscription data usage."""
    try:
        subscription = Subscription.objects.get(pk=pk)
    except Subscription.DoesNotExist:
        return Response({'error': 'Subscription not found'}, status=status.HTTP_404_NOT_FOUND)

    subscription.reset_data_usage()

    return Response({
        'message': 'Data usage reset successfully',
        'subscription': SubscriptionDetailSerializer(subscription).data
    })


@extend_schema(
    tags=['Subscriptions'],
    summary='Get Active Subscriptions',
    description='Get all active subscriptions'
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def active_subscriptions_view(request):
    """Get active subscriptions."""
    try:
        subscriptions = Subscription.objects.filter(status='active')
        serializer = SubscriptionListSerializer(subscriptions, many=True)
        return APIResponse.success(
            data=serializer.data,
            message="Active subscriptions retrieved successfully"
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Failed to retrieve active subscriptions: {str(e)}"
        )


@extend_schema(
    tags=['Subscriptions'],
    summary='Get Suspended Subscriptions',
    description='Get all suspended subscriptions'
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def suspended_subscriptions_view(request):
    """Get suspended subscriptions."""
    try:
        subscriptions = Subscription.objects.filter(status='suspended')
        serializer = SubscriptionListSerializer(subscriptions, many=True)
        return APIResponse.success(
            data=serializer.data,
            message="Suspended subscriptions retrieved successfully"
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Failed to retrieve suspended subscriptions: {str(e)}"
        )


@extend_schema(
    tags=['Subscriptions'],
    summary='Get Expired Subscriptions',
    description='Get all expired subscriptions'
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def expired_subscriptions_view(request):
    """Get expired subscriptions."""
    from django.utils import timezone
    subscriptions = Subscription.objects.filter(
        end_date__lt=timezone.now().date(),
        status__in=['active', 'pending']
    )
    serializer = SubscriptionSerializer(subscriptions, many=True)
    return Response(serializer.data)


@extend_schema(
    tags=['Subscriptions'],
    summary='Get Subscription Statistics',
    description='Get subscription statistics and counts'
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def subscription_stats_view(request):
    """Get subscription statistics."""
    try:
        total_subscriptions = Subscription.objects.count()
        active_subscriptions = Subscription.objects.filter(status='active').count()
        suspended_subscriptions = Subscription.objects.filter(status='suspended').count()
        pending_subscriptions = Subscription.objects.filter(status='pending').count()
        cancelled_subscriptions = Subscription.objects.filter(status='cancelled').count()

        # Revenue statistics
        total_monthly_revenue = sum(sub.monthly_fee for sub in Subscription.objects.filter(status='active'))

        # Data usage statistics
        total_data_used = sum(float(sub.data_used) for sub in Subscription.objects.all())

        stats = {
            'total_subscriptions': total_subscriptions,
            'active_subscriptions': active_subscriptions,
            'suspended_subscriptions': suspended_subscriptions,
            'pending_subscriptions': pending_subscriptions,
            'cancelled_subscriptions': cancelled_subscriptions,
            'total_monthly_revenue': float(total_monthly_revenue),
            'total_data_used_gb': round(total_data_used, 2),
            'active_percentage': round((active_subscriptions / total_subscriptions * 100) if total_subscriptions > 0 else 0, 2)
        }

        return APIResponse.success(
            data=stats,
            message="Subscription statistics retrieved successfully"
        )
    except Exception as e:
        return APIResponse.error(
            message=f"Failed to retrieve subscription statistics: {str(e)}"
        )


@extend_schema(
    tags=['Subscriptions'],
    summary='Bulk Update Subscription Status',
    description='Update status for multiple subscriptions at once'
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_update_subscription_status_view(request):
    """Bulk update subscription status."""
    subscription_ids = request.data.get('subscription_ids', [])
    new_status = request.data.get('status')

    if not subscription_ids or not new_status:
        return Response(
            {'error': 'Both subscription_ids and status are required'},
            status=400
        )

    if new_status not in dict(Subscription.Status.choices):
        return Response(
            {'error': f'Invalid status. Must be one of: {list(dict(Subscription.Status.choices).keys())}'},
            status=400
        )

    updated_count = Subscription.objects.filter(id__in=subscription_ids).update(status=new_status)

    return Response({
        'message': f'Successfully updated {updated_count} subscriptions to {new_status}',
        'updated_count': updated_count
    })
