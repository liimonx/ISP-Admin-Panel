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
    PaymentMethodStatsSerializer, TopCustomerSerializer
)
from .responses import APIResponse


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
