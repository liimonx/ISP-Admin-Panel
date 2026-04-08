from django.db.models import Sum, Avg, Max, Count
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from core.responses import APIResponse
from customers.models import Customer
from subscriptions.models import Subscription
from billing.models import Invoice


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_reports(request):
    """Get comprehensive customer reports data."""
    try:
        # Get date range from query params (default: last 30 days)
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Customer growth metrics
        total_customers = Customer.objects.count()
        active_customers = Customer.objects.filter(status=Customer.Status.ACTIVE).count()
        new_customers_this_period = Customer.objects.filter(
            created_at__gte=start_date
        ).count()
        
        # Customer status distribution
        status_distribution = Customer.objects.values('status').annotate(
            count=Count('id')
        )
        status_breakdown = {item['status']: item['count'] for item in status_distribution}
        
        # Customer churn rate (customers who became inactive/cancelled in this period)
        churned_customers = Customer.objects.filter(
            status__in=[Customer.Status.INACTIVE, Customer.Status.CANCELLED],
            updated_at__gte=start_date
        ).count()
        churn_rate = (churned_customers / total_customers * 100) if total_customers > 0 else 0
        
        # Growth rate
        growth_rate = (new_customers_this_period / (total_customers - new_customers_this_period) * 100) \
            if (total_customers - new_customers_this_period) > 0 else 0
        
        # Customer trends (daily signups for the period)
        daily_signups = Customer.objects.filter(
            created_at__gte=start_date
        ).extra(select={'date': 'DATE(created_at)'}).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        trends = []
        for item in daily_signups:
            trends.append({
                'date': str(item['date']),
                'count': item['count']
            })
        
        # Top cities by customer count
        top_cities = Customer.objects.values('city').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        # Average customers per city
        avg_customers_per_city = total_customers / Customer.objects.values('city').distinct().count() \
            if Customer.objects.values('city').distinct().count() > 0 else 0
        
        data = {
            'total_customers': total_customers,
            'active_customers': active_customers,
            'new_customers': new_customers_this_period,
            'churned_customers': churned_customers,
            'churn_rate': round(churn_rate, 2),
            'growth_rate': round(growth_rate, 2),
            'status_distribution': status_breakdown,
            'trends': trends,
            'top_cities': list(top_cities),
            'avg_customers_per_city': round(avg_customers_per_city, 2),
            'period_days': days
        }
        
        return APIResponse.success(data, "Customer reports retrieved successfully")
        
    except Exception as e:
        return APIResponse.server_error(f"Failed to fetch customer reports: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def network_reports(request):
    """Get comprehensive network reports data."""
    try:
        from monitoring.models import RouterMetric, UsageSnapshot
        from network.models import Router
        
        # Get date range from query params (default: last 30 days)
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Router statistics
        total_routers = Router.objects.count()
        online_routers = Router.objects.filter(status=Router.Status.ONLINE).count()
        offline_routers = Router.objects.filter(status=Router.Status.OFFLINE).count()
        maintenance_routers = Router.objects.filter(status=Router.Status.MAINTENANCE).count()
        
        # Router status distribution
        router_status_dist = Router.objects.values('status').annotate(
            count=Count('id')
        )
        status_breakdown = {item['status']: item['count'] for item in router_status_dist}
        
        # Get latest metrics for all routers
        latest_metrics = RouterMetric.objects.filter(
            timestamp__gte=start_date
        )
        
        # Bandwidth utilization
        if latest_metrics.exists():
            total_download = latest_metrics.aggregate(total=Sum('download_speed'))['total'] or 0
            total_upload = latest_metrics.aggregate(total=Sum('upload_speed'))['total'] or 0
            total_bandwidth = total_download + total_upload
            
            # Assume total capacity (this should be configurable per router)
            total_capacity = total_routers * 1000000000  # 1 Gbps per router
            bandwidth_utilization = (total_bandwidth / total_capacity * 100) if total_capacity > 0 else 0
            
            # Average speeds
            avg_download = latest_metrics.aggregate(avg=Avg('download_speed'))['avg'] or 0
            avg_upload = latest_metrics.aggregate(avg=Avg('upload_speed'))['avg'] or 0
            avg_speed = (avg_download + avg_upload) / 1000000  # Convert to Mbps
            
            # Peak usage
            max_download = latest_metrics.aggregate(max=Max('download_speed'))['max'] or 0
            max_upload = latest_metrics.aggregate(max=Max('upload_speed'))['max'] or 0
            peak_usage = (max_download + max_upload) / 1000000  # Convert to Mbps
            
            # System resource usage
            avg_cpu = latest_metrics.aggregate(avg=Avg('cpu_usage'))['avg'] or 0
            avg_memory = latest_metrics.aggregate(avg=Avg('memory_usage'))['avg'] or 0
            avg_disk = latest_metrics.aggregate(avg=Avg('disk_usage'))['avg'] or 0
        else:
            total_bandwidth = 0
            bandwidth_utilization = 0
            avg_speed = 0
            peak_usage = 0
            avg_cpu = 0
            avg_memory = 0
            avg_disk = 0
        
        # Connection statistics from usage snapshots
        latest_snapshots = UsageSnapshot.objects.filter(
            timestamp__gte=start_date
        )
        
        if latest_snapshots.exists():
            avg_connections = latest_snapshots.aggregate(avg=Avg('active_connections'))['avg'] or 0
            avg_pppoe_users = latest_snapshots.aggregate(avg=Avg('pppoe_users_count'))['avg'] or 0
            avg_active_sessions = latest_snapshots.aggregate(avg=Avg('pppoe_active_sessions'))['avg'] or 0
            total_bytes_in = latest_snapshots.aggregate(total=Sum('total_bytes_in'))['total'] or 0
            total_bytes_out = latest_snapshots.aggregate(total=Sum('total_bytes_out'))['total'] or 0
        else:
            avg_connections = 0
            avg_pppoe_users = 0
            avg_active_sessions = 0
            total_bytes_in = 0
            total_bytes_out = 0
        
        # Network trends (daily metrics)
        daily_metrics = RouterMetric.objects.filter(
            timestamp__gte=start_date
        ).extra(select={'date': 'DATE(timestamp)'}).values('date').annotate(
            avg_download=Avg('download_speed'),
            avg_upload=Avg('upload_speed'),
            avg_cpu=Avg('cpu_usage'),
            avg_memory=Avg('memory_usage')
        ).order_by('date')
        
        trends = []
        for item in daily_metrics:
            trends.append({
                'date': str(item['date']),
                'avg_download_mbps': round(item['avg_download'] / 1000000, 2) if item['avg_download'] else 0,
                'avg_upload_mbps': round(item['avg_upload'] / 1000000, 2) if item['avg_upload'] else 0,
                'avg_cpu_percent': round(item['avg_cpu'], 2) if item['avg_cpu'] else 0,
                'avg_memory_percent': round(item['avg_memory'], 2) if item['avg_memory'] else 0
            })
        
        data = {
            'total_routers': total_routers,
            'online_routers': online_routers,
            'offline_routers': offline_routers,
            'maintenance_routers': maintenance_routers,
            'router_status_distribution': status_breakdown,
            'bandwidth_utilization': round(bandwidth_utilization, 2),
            'avg_speed_mbps': round(avg_speed, 2),
            'peak_usage_mbps': round(peak_usage, 2),
            'total_data_transferred_gb': round((total_bytes_in + total_bytes_out) / (1024 ** 3), 2),
            'avg_connections': round(avg_connections, 2),
            'avg_pppoe_users': round(avg_pppoe_users, 2),
            'avg_active_sessions': round(avg_active_sessions, 2),
            'resource_usage': {
                'avg_cpu_percent': round(avg_cpu, 2),
                'avg_memory_percent': round(avg_memory, 2),
                'avg_disk_percent': round(avg_disk, 2)
            },
            'trends': trends,
            'period_days': days
        }
        
        return APIResponse.success(data, "Network reports retrieved successfully")
        
    except Exception as e:
        return APIResponse.server_error(f"Failed to fetch network reports: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usage_reports(request):
    """Get usage reports data"""
    from monitoring.models import RouterMetric
    
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