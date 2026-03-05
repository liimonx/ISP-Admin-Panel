from django.urls import path
from . import views

urlpatterns = [
    # Existing endpoints
    path('usage/', views.usage_reports, name='usage-reports'),
    path('top-users/', views.top_users, name='top-users'),
    path('usage-trends/', views.usage_trends, name='usage-trends'),
    path('revenue/', views.revenue_reports, name='revenue-reports'),
    path('customers/', views.customer_reports, name='customer-reports'),
    path('network/', views.network_reports, name='network-reports'),
]
