"""
Core views for dashboard and common functionality.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .services import DashboardService
from .serializers import (
    DashboardStatsSerializer, CustomerStatsSerializer, SubscriptionStatsSerializer,
    PlanStatsSerializer, RouterStatsSerializer, InvoiceStatsSerializer,
    PaymentStatsSerializer, MonthlyTrendSerializer, DailyTrendSerializer,
    PaymentMethodStatsSerializer, TopCustomerSerializer,
    SystemSettingsSerializer, SystemSettingsUpdateSerializer,
    NotificationSerializer, GlobalSearchResultSerializer
)
from .responses import APIResponse
from .models import SystemSettings, Notification
from customers.models import Customer
from plans.models import Plan
from network.models import Router
from subscriptions.models import Subscription
from billing.models import Invoice

from rest_framework import viewsets
from rest_framework.decorators import action
from django.db.models import Q


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get comprehensive dashboard statistics."""
    try:
        stats = DashboardService.get_dashboard_stats()
        serializer = DashboardStatsSerializer(stats)
        return APIResponse.success(data=serializer.data)
    except Exception as e:
        return APIResponse.server_error(f"Failed to fetch dashboard stats: {str(e)}")


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def system_settings(request):
    """Get or update system settings."""
    try:
        # Get or create system settings
        settings_obj = SystemSettings.get_settings()
        
        if request.method == 'GET':
            # Return current settings
            serializer = SystemSettingsSerializer(settings_obj)
            return APIResponse.success(
                data=serializer.data,
                message="System settings retrieved successfully"
            )
        
        elif request.method == 'PUT':
            # Update settings
            serializer = SystemSettingsUpdateSerializer(
                instance=settings_obj,
                data=request.data,
                partial=False
            )
            
            if serializer.is_valid():
                serializer.save()
                return APIResponse.success(
                    data=serializer.data,
                    message="System settings updated successfully"
                )
            else:
                return APIResponse.validation_error(serializer.errors)
                
    except Exception as e:
        return APIResponse.server_error(f"Failed to manage system settings: {str(e)}")


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_settings_partial(request):
    """Partially update system settings."""
    try:
        settings_obj = SystemSettings.get_settings()
        
        serializer = SystemSettingsUpdateSerializer(
            instance=settings_obj,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return APIResponse.success(
                data=serializer.data,
                message="System settings updated successfully"
            )
        else:
            return APIResponse.validation_error(serializer.errors)
            
    except Exception as e:
        return APIResponse.server_error(f"Failed to update system settings: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_stats(request):
    """Get customer statistics."""
    try:
        stats = DashboardService.get_customer_stats()
        serializer = CustomerStatsSerializer(stats)
        return APIResponse.success(data=serializer.data)
    except Exception as e:
        return APIResponse.server_error(f"Failed to fetch customer stats: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_stats(request):
    """Get subscription statistics."""
    try:
        stats = DashboardService.get_subscription_stats()
        serializer = SubscriptionStatsSerializer(stats)
        return APIResponse.success(data=serializer.data)
    except Exception as e:
        return APIResponse.server_error(f"Failed to fetch subscription stats: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def plan_stats(request):
    """Get plan statistics."""
    try:
        stats = DashboardService.get_plan_stats()
        serializer = PlanStatsSerializer(stats)
        return APIResponse.success(data=serializer.data)
    except Exception as e:
        return APIResponse.server_error(f"Failed to fetch plan stats: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def router_stats(request):
    """Get router statistics."""
    try:
        stats = DashboardService.get_router_stats()
        serializer = RouterStatsSerializer(stats)
        return APIResponse.success(data=serializer.data)
    except Exception as e:
        return APIResponse.server_error(f"Failed to fetch router stats: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def invoice_stats(request):
    """Get invoice statistics."""
    try:
        stats = DashboardService.get_invoice_stats()
        serializer = InvoiceStatsSerializer(stats)
        return APIResponse.success(data=serializer.data)
    except Exception as e:
        return APIResponse.server_error(f"Failed to fetch invoice stats: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_stats(request):
    """Get payment statistics."""
    try:
        stats = DashboardService.get_payment_stats()
        serializer = PaymentStatsSerializer(stats)
        return APIResponse.success(data=serializer.data)
    except Exception as e:
        return APIResponse.server_error(f"Failed to fetch payment stats: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_trends(request):
    """Get monthly trend data."""
    try:
        months = int(request.query_params.get('months', 12))
        trends = DashboardService.get_monthly_trends(months)
        serializer = MonthlyTrendSerializer(trends, many=True)
        return APIResponse.success(data=serializer.data)
    except Exception as e:
        return APIResponse.server_error(f"Failed to fetch monthly trends: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_trends(request):
    """Get daily trend data."""
    try:
        days = int(request.query_params.get('days', 30))
        trends = DashboardService.get_daily_trends(days)
        serializer = DailyTrendSerializer(trends, many=True)
        return APIResponse.success(data=serializer.data)
    except Exception as e:
        return APIResponse.server_error(f"Failed to fetch daily trends: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_method_stats(request):
    """Get payment method statistics."""
    try:
        stats = DashboardService.get_payment_method_stats()
        serializer = PaymentMethodStatsSerializer(stats, many=True)
        return APIResponse.success(data=serializer.data)
    except Exception as e:
        return APIResponse.server_error(f"Failed to fetch payment method stats: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_customers(request):
    """Get top customers by revenue."""
    try:
        limit = int(request.query_params.get('limit', 10))
        customers = DashboardService.get_top_customers(limit)
        serializer = TopCustomerSerializer(customers, many=True)
        return APIResponse.success(data=serializer.data)
    except Exception as e:
        return APIResponse.server_error(f"Failed to fetch top customers: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_stats(request):
    """Get all statistics in one request."""
    try:
        data = {
            'dashboard': DashboardService.get_dashboard_stats(),
            'customers': DashboardService.get_customer_stats(),
            'subscriptions': DashboardService.get_subscription_stats(),
            'plans': DashboardService.get_plan_stats(),
            'routers': DashboardService.get_router_stats(),
            'invoices': DashboardService.get_invoice_stats(),
            'payments': DashboardService.get_payment_stats(),
            'monthly_trends': DashboardService.get_monthly_trends(12),
            'daily_trends': DashboardService.get_daily_trends(30),
            'payment_methods': DashboardService.get_payment_method_stats(),
            'top_customers': DashboardService.get_top_customers(10),
        }
        
        # Serialize all data
        serialized_data = {
            'dashboard': DashboardStatsSerializer(data['dashboard']).data,
            'customers': CustomerStatsSerializer(data['customers']).data,
            'subscriptions': SubscriptionStatsSerializer(data['subscriptions']).data,
            'plans': PlanStatsSerializer(data['plans']).data,
            'routers': RouterStatsSerializer(data['routers']).data,
            'invoices': InvoiceStatsSerializer(data['invoices']).data,
            'payments': PaymentStatsSerializer(data['payments']).data,
            'monthly_trends': MonthlyTrendSerializer(data['monthly_trends'], many=True).data,
            'daily_trends': DailyTrendSerializer(data['daily_trends'], many=True).data,
            'payment_methods': PaymentMethodStatsSerializer(data['payment_methods'], many=True).data,
            'top_customers': TopCustomerSerializer(data['top_customers'], many=True).data,
        }
        
        return APIResponse.success(data=serialized_data)
    except Exception as e:
        return APIResponse.server_error(f"Failed to fetch all stats: {str(e)}")

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def system_settings(request):
    """Get or update system settings."""
    try:
        settings = SystemSettings.get_settings()
        
        if request.method == 'GET':
            serializer = SystemSettingsSerializer(settings)
            return APIResponse.success(data=serializer.data)
            
        elif request.method == 'PUT':
            serializer = SystemSettingsSerializer(settings, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return APIResponse.success(
                    data=serializer.data,
                    message="Settings updated successfully"
                )
            return APIResponse.bad_request(
                message="Invalid settings data",
                errors=serializer.errors
            )
    except Exception as e:
        return APIResponse.server_error(f"Failed to process settings request: {str(e)}")

class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return notifications for the current authenticated user only."""
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a specific notification as read."""
        try:
            notification = self.get_object()
            notification.is_read = True
            notification.save()
            return APIResponse.success(message="Notification marked as read")
        except Exception as e:
            return APIResponse.server_error(f"Failed to mark notification as read: {str(e)}")

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user."""
        try:
            self.get_queryset().update(is_read=True)
            return APIResponse.success(message="All notifications marked as read")
        except Exception as e:
            return APIResponse.server_error(f"Failed to mark all notifications as read: {str(e)}")

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get the count of unread notifications."""
        count = self.get_queryset().filter(is_read=False).count()
        return APIResponse.success(data={'count': count})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def global_search(request):
    """
    Perform a global search across Customers, Plans, Subscriptions, Invoices, and Routers.
    """
    query = request.query_params.get('q', '').strip()
    if not query:
        return APIResponse.success(data=[])

    results = []

    # 1. Search Customers
    customers = Customer.objects.filter(
        Q(name__icontains=query) | Q(email__icontains=query) | Q(phone__icontains=query)
    )[:5]
    for c in customers:
        results.append({
            'id': f"customer_{c.id}",
            'type': 'customer',
            'title': c.name,
            'subtitle': c.email,
            'url': f"/customers/{c.id}"
        })

    # 2. Search Plans
    plans = Plan.objects.filter(name__icontains=query)[:5]
    for p in plans:
        results.append({
            'id': f"plan_{p.id}",
            'type': 'plan',
            'title': p.name,
            'subtitle': f"Speed: {p.download_speed} {p.get_speed_unit_display()} - Price: ${p.price}",
            'url': f"/plans/{p.id}"
        })

    # 3. Search Routers
    routers = Router.objects.filter(
        Q(name__icontains=query) | Q(host__icontains=query)
    )[:5]
    for r in routers:
        results.append({
            'id': f"router_{r.id}",
            'type': 'router',
            'title': r.name,
            'subtitle': r.host,
            'url': f"/network/routers/{r.id}"
        })

    # 4. Search Subscriptions (by ID if numeric, or status)
    sub_query = Q(status__icontains=query)
    if query.isdigit():
        sub_query |= Q(id=int(query))
        
    subscriptions = Subscription.objects.select_related('customer', 'plan').filter(sub_query)[:5]
    for s in subscriptions:
        # Avoid related object queries if not selected; safely fetch names
        cust_name = s.customer.name if s.customer else "Unknown Customer"
        plan_name = s.plan.name if s.plan else "Unknown Plan"
        results.append({
            'id': f"subscription_{s.id}",
            'type': 'subscription',
            'title': f"Sub #{s.id} - {cust_name}",
            'subtitle': f"Plan: {plan_name} - Status: {s.get_status_display()}",
            'url': f"/subscriptions/{s.id}"
        })

    # 5. Search Invoices
    inv_query = Q(invoice_number__icontains=query) | Q(status__icontains=query)
    invoices = Invoice.objects.filter(inv_query)[:5]
    for i in invoices:
        cust_name = i.customer.name if i.customer else "Unknown Customer"
        results.append({
            'id': f"invoice_{i.id}",
            'type': 'invoice',
            'title': i.invoice_number,
            'subtitle': f"Customer: {cust_name} - Status: {i.get_status_display()}",
            'url': f"/billing/invoices/{i.id}"
        })

    serializer = GlobalSearchResultSerializer(results, many=True)
    return APIResponse.success(data=serializer.data)
