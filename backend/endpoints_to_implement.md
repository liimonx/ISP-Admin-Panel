# Missing Backend Endpoints to Implement

The frontend is trying to access these endpoints that need to be implemented in the Django backend:

## 1. Customer Statistics Endpoint

**URL:** `/api/customers/stats/`
**Method:** GET
**Location:** `backend/customers/views.py`

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Q
from datetime import datetime, timedelta
from .models import Customer

@api_view(['GET'])
def customer_stats(request):
    """Get customer statistics"""
    now = datetime.now()
    this_month = now.replace(day=1)
    
    total_customers = Customer.objects.count()
    active_customers = Customer.objects.filter(status='active').count()
    new_customers_this_month = Customer.objects.filter(
        created_at__gte=this_month
    ).count()
    churned_customers_this_month = Customer.objects.filter(
        status='cancelled',
        updated_at__gte=this_month
    ).count()
    
    stats = {
        'total_customers': total_customers,
        'active_customers': active_customers,
        'new_customers_this_month': new_customers_this_month,
        'churned_customers_this_month': churned_customers_this_month,
        'average_customer_lifetime': 24,  # Calculate based on your data
        'customer_satisfaction_score': 4.2,  # Calculate based on your data
    }
    
    return Response({
        'success': True,
        'message': 'Customer statistics retrieved successfully',
        'data': stats,
        'timestamp': now.isoformat(),
    })
```

## 2. Billing Statistics Endpoint

**URL:** `/api/billing/stats/invoices/`
**Method:** GET
**Location:** `backend/billing/views.py`

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg
from datetime import datetime, timedelta
from .models import Invoice

@api_view(['GET'])
def invoice_stats(request):
    """Get invoice statistics"""
    now = datetime.now()
    this_month = now.replace(day=1)
    this_quarter = now.replace(month=((now.month-1)//3)*3+1, day=1)
    this_year = now.replace(month=1, day=1)
    
    total_monthly_revenue = Invoice.objects.filter(
        billing_period_start__gte=this_month,
        status='paid'
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    total_quarterly_revenue = Invoice.objects.filter(
        billing_period_start__gte=this_quarter,
        status='paid'
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    total_yearly_revenue = Invoice.objects.filter(
        billing_period_start__gte=this_year,
        status='paid'
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    pending_invoices = Invoice.objects.filter(status='pending').count()
    overdue_invoices = Invoice.objects.filter(
        status='overdue'
    ).count()
    
    stats = {
        'total_monthly_revenue': float(total_monthly_revenue),
        'total_quarterly_revenue': float(total_quarterly_revenue),
        'total_yearly_revenue': float(total_yearly_revenue),
        'pending_invoices': pending_invoices,
        'overdue_invoices': overdue_invoices,
        'average_payment_time': 3.2,  # Calculate based on your data
        'revenue_growth_rate': 12.5,  # Calculate based on your data
    }
    
    return Response({
        'success': True,
        'message': 'Invoice statistics retrieved successfully',
        'data': stats,
        'timestamp': now.isoformat(),
    })
```

## 3. Active Subscriptions Endpoint

**URL:** `/api/subscriptions/active/`
**Method:** GET
**Location:** `backend/subscriptions/views.py`

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Subscription
from .serializers import SubscriptionSerializer

@api_view(['GET'])
def active_subscriptions(request):
    """Get active subscriptions"""
    active_subscriptions = Subscription.objects.filter(status='active')
    serializer = SubscriptionSerializer(active_subscriptions, many=True)
    
    return Response({
        'success': True,
        'message': 'Active subscriptions retrieved successfully',
        'data': serializer.data,
        'timestamp': datetime.now().isoformat(),
    })
```

## 4. Monitoring Statistics Endpoint

**URL:** `/api/monitoring/stats/`
**Method:** GET
**Location:** `backend/monitoring/views.py`

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Avg
from network.models import Router
from datetime import datetime

@api_view(['GET'])
def monitoring_stats(request):
    """Get monitoring statistics"""
    total_routers = Router.objects.count()
    online_routers = Router.objects.filter(status='online').count()
    offline_routers = Router.objects.filter(status='offline').count()
    maintenance_routers = Router.objects.filter(status='maintenance').count()
    
    stats = {
        'total_routers': total_routers,
        'online_routers': online_routers,
        'offline_routers': offline_routers,
        'maintenance_routers': maintenance_routers,
        'average_uptime': 99.8,  # Calculate based on your data
        'total_bandwidth_usage': 2.5,  # Calculate based on your data
        'peak_bandwidth_usage': 3.2,  # Calculate based on your data
        'alerts_count': 3,  # Calculate based on your data
        'critical_alerts': 1,  # Calculate based on your data
    }
    
    return Response({
        'success': True,
        'message': 'Monitoring statistics retrieved successfully',
        'data': stats,
        'timestamp': datetime.now().isoformat(),
    })
```

## 5. Router Statistics Endpoint

**URL:** `/api/network/routers/stats/`
**Method:** GET
**Location:** `backend/network/views.py`

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Avg
from .models import Router
from datetime import datetime

@api_view(['GET'])
def router_stats(request):
    """Get router statistics"""
    total_routers = Router.objects.count()
    online_routers = Router.objects.filter(status='online').count()
    offline_routers = Router.objects.filter(status='offline').count()
    maintenance_routers = Router.objects.filter(status='maintenance').count()
    
    stats = {
        'total_routers': total_routers,
        'online_routers': online_routers,
        'offline_routers': offline_routers,
        'maintenance_routers': maintenance_routers,
        'average_response_time': 45,  # Calculate based on your data
        'total_interfaces': 45,  # Calculate based on your data
        'active_interfaces': 42,  # Calculate based on your data
        'dhcp_leases': 1180,  # Calculate based on your data
        'active_connections': 2500,  # Calculate based on your data
    }
    
    return Response({
        'success': True,
        'message': 'Router statistics retrieved successfully',
        'data': stats,
        'timestamp': datetime.now().isoformat(),
    })
```

## URL Configuration

Add these URLs to your `backend/isp_admin/urls.py`:

```python
from django.urls import path, include

urlpatterns = [
    # ... existing urls ...
    path('api/customers/stats/', include('customers.urls')),
    path('api/billing/stats/', include('billing.urls')),
    path('api/subscriptions/active/', include('subscriptions.urls')),
    path('api/monitoring/stats/', include('monitoring.urls')),
    path('api/network/routers/stats/', include('network.urls')),
]
```

## Implementation Priority

1. **High Priority:** Customer stats and Router stats (most commonly used)
2. **Medium Priority:** Billing stats and Monitoring stats
3. **Low Priority:** Active subscriptions (can use existing subscriptions endpoint)

## Testing

After implementing these endpoints, test them with:

```bash
# Test customer stats
curl http://localhost:8000/api/customers/stats/

# Test billing stats
curl http://localhost:8000/api/billing/stats/invoices/

# Test router stats
curl http://localhost:8000/api/network/routers/stats/
```

## Notes

- The mock data service will continue to work until these endpoints are implemented
- Once implemented, the frontend will automatically use the real data
- Consider adding caching to these endpoints for better performance
- Add proper error handling and validation
- Consider adding authentication/authorization if needed
