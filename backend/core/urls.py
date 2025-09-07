"""
URL configuration for core app.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Dashboard and Statistics
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('stats/customers/', views.customer_stats, name='customer-stats'),
    path('stats/subscriptions/', views.subscription_stats, name='subscription-stats'),
    path('stats/plans/', views.plan_stats, name='plan-stats'),
    path('stats/routers/', views.router_stats, name='router-stats'),
    path('stats/invoices/', views.invoice_stats, name='invoice-stats'),
    path('stats/payments/', views.payment_stats, name='payment-stats'),
    path('stats/all/', views.all_stats, name='all-stats'),
    
    # Trends and Analytics
    path('trends/monthly/', views.monthly_trends, name='monthly-trends'),
    path('trends/daily/', views.daily_trends, name='daily-trends'),
    path('analytics/payment-methods/', views.payment_method_stats, name='payment-method-stats'),
    path('analytics/top-customers/', views.top_customers, name='top-customers'),
]
