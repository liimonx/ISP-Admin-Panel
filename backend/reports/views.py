from django.db.models import Sum, Avg, Max, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.responses import APIResponse
from customers.models import Customer
from subscriptions.models import Subscription
from billing.models import Invoice, Payment


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usage_reports(request):
    """Get usage reports data"""
    from monitoring.models import RouterMetric
    from network.models import Router
    
    # Get actual usage data from monitoring metrics
    latest_metrics = RouterMetric.objects.filter(
        timestamp__gte=timezone.now() - timedelta(hours=24)
    )
    
    if latest_metrics.exists():
        # Calculate actual bandwidth utilization from metrics
        total_download = latest_metrics.aggregate(total=Sum('download_speed'))['total'] or 0
        total_upload = latest_metrics.aggregate(total=Sum('upload_speed'))['total'] or 0
        total_bandwidth = total_download + total_upload
        
        # Assume total capacity (this should be configurable)
        total_capacity = 1000000000  # 1 Gbps in bytes/s
        bandwidth_utilization = (total_bandwidth / total_capacity * 100) if total_capacity > 0 else 0
        
        # Calculate averages
        avg_download = latest_metrics.aggregate(avg=Avg('download_speed'))['avg'] or 0
        avg_upload = latest_metrics.aggregate(avg=Avg('upload_speed'))['avg'] or 0
        average_usage = (avg_download + avg_upload) / 1000000  # Convert to Mbps
        
        # Calculate peak usage
        max_download = latest_metrics.aggregate(max=Max('download_speed'))['max'] or 0
        max_upload = latest_metrics.aggregate(max=Max('upload_speed'))['max'] or 0
        peak_usage = (max_download + max_upload) / 1000000  # Convert to Mbps
        
        data = {
            'total_usage': total_bandwidth / 1000000,  # Convert to Mbps
            'average_usage': average_usage,
            'peak_usage': peak_usage,
            'bandwidth_utilization': min(100, bandwidth_utilization),  # Cap at 100%
            'usage_trend': 12.5  # This would need historical comparison
        }
    else:
        # Fallback to minimal data if no metrics available
        data = {
            'total_usage': 0,
            'average_usage': 0,
            'peak_usage': 0,
            'bandwidth_utilization': 0,
            'usage_trend': 0
        }
    
    return APIResponse.success(data, "Usage reports retrieved successfully")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_users(request):
    """Get top users by usage"""
    # Get active subscriptions with customer data
    subscriptions = Subscription.objects.filter(
        status='active'
    ).select_related('customer', 'plan')[:10]
    
    users = []
    for sub in subscriptions:
        users.append({
            'id': sub.customer.id,
            'name': sub.customer.name,
            'email': sub.customer.email,
            'usage': 45.2 + (sub.id * 5.3),  # Mock usage calculation
            'plan': sub.plan.name,
            'status': sub.customer.status
        })
    
    # Sort by usage descending
    users.sort(key=lambda x: x['usage'], reverse=True)
    
    return APIResponse.success({'users': users}, "Top users retrieved successfully")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usage_trends(request):
    """Get usage trends over time"""
    # Mock trends data - replace with actual monitoring data
    trends = [
        {'date': '2024-01', 'usage': 1100},
        {'date': '2024-02', 'usage': 1200},
        {'date': '2024-03', 'usage': 1250}
    ]
    
    return APIResponse.success({'trends': trends}, "Usage trends retrieved successfully")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revenue_reports(request):
    """Get revenue reports data"""
    # Get actual revenue data from invoices
    total_revenue = Invoice.objects.filter(
        status='paid'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Get monthly revenue (current month)
    current_month = timezone.now().replace(day=1)
    monthly_revenue = Invoice.objects.filter(
        status='paid',
        created_at__gte=current_month
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Get active customers count
    active_customers = Customer.objects.filter(status='active').count()
    
    # Calculate ARPU
    arpu = (monthly_revenue / active_customers) if active_customers > 0 else 0
    
    # Mock revenue trends
    trends = [
        {'date': '2024-01', 'revenue': 14000},
        {'date': '2024-02', 'revenue': 14500},
        {'date': '2024-03', 'revenue': float(monthly_revenue)}
    ]
    
    data = {
        'total_revenue': float(total_revenue),
        'monthly_revenue': float(monthly_revenue),
        'revenue_trend': 8.5,  # Mock trend
        'active_customers': active_customers,
        'arpu': float(arpu),
        'mrr_growth': 8.5,  # Mock growth
        'trends': trends
    }
    
    return APIResponse.success(data, "Revenue reports retrieved successfully")