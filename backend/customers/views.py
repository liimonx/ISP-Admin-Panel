from rest_framework import generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import Customer
from .serializers import (
    CustomerSerializer, CustomerCreateSerializer, CustomerUpdateSerializer,
    CustomerListSerializer, CustomerDetailSerializer
)
from django.db import models


@extend_schema(
    tags=['Customers'],
    summary='List Customers',
    description='Get a list of all customers with filtering and search capabilities'
)
class CustomerListView(generics.ListCreateAPIView):
    """List and create customers."""
    queryset = Customer.objects.all()
    serializer_class = CustomerListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'city', 'country']
    search_fields = ['name', 'email', 'phone', 'company_name']
    ordering_fields = ['name', 'email', 'created_at', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CustomerCreateSerializer
        return CustomerListSerializer


@extend_schema(
    tags=['Customers'],
    summary='Get Customer Details',
    description='Get detailed information about a specific customer'
)
class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a customer."""
    queryset = Customer.objects.all()
    serializer_class = CustomerDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CustomerUpdateSerializer
        return CustomerDetailSerializer


@extend_schema(
    tags=['Customers'],
    summary='Search Customers',
    description='Search customers by name, email, or phone number'
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def customer_search_view(request):
    """Search customers by various criteria."""
    query = request.query_params.get('q', '')
    if not query:
        return Response({'error': 'Query parameter "q" is required'}, status=400)
    
    customers = Customer.objects.filter(
        models.Q(name__icontains=query) |
        models.Q(email__icontains=query) |
        models.Q(phone__icontains=query) |
        models.Q(company_name__icontains=query)
    )[:20]  # Limit results
    
    serializer = CustomerListSerializer(customers, many=True)
    return Response(serializer.data)


@extend_schema(
    tags=['Customers'],
    summary='Get Customer Statistics',
    description='Get customer statistics and counts'
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def customer_stats_view(request):
    """Get customer statistics."""
    total_customers = Customer.objects.count()
    active_customers = Customer.objects.filter(status='active').count()
    inactive_customers = Customer.objects.filter(status='inactive').count()
    suspended_customers = Customer.objects.filter(status='suspended').count()
    cancelled_customers = Customer.objects.filter(status='cancelled').count()
    
    # Monthly growth
    from django.utils import timezone
    from datetime import timedelta
    
    now = timezone.now()
    last_month = now - timedelta(days=30)
    new_customers_this_month = Customer.objects.filter(created_at__gte=last_month).count()
    
    stats = {
        'total_customers': total_customers,
        'active_customers': active_customers,
        'inactive_customers': inactive_customers,
        'suspended_customers': suspended_customers,
        'cancelled_customers': cancelled_customers,
        'new_customers_this_month': new_customers_this_month,
        'active_percentage': round((active_customers / total_customers * 100) if total_customers > 0 else 0, 2)
    }
    
    return Response(stats)


@extend_schema(
    tags=['Customers'],
    summary='Bulk Update Customer Status',
    description='Update status for multiple customers at once'
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_update_status_view(request):
    """Bulk update customer status."""
    customer_ids = request.data.get('customer_ids', [])
    new_status = request.data.get('status')
    
    if not customer_ids or not new_status:
        return Response(
            {'error': 'Both customer_ids and status are required'}, 
            status=400
        )
    
    if new_status not in dict(Customer.Status.choices):
        return Response(
            {'error': f'Invalid status. Must be one of: {list(dict(Customer.Status.choices).keys())}'}, 
            status=400
        )
    
    updated_count = Customer.objects.filter(id__in=customer_ids).update(status=new_status)
    
    return Response({
        'message': f'Successfully updated {updated_count} customers to {new_status}',
        'updated_count': updated_count
    })
