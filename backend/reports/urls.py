from django.urls import path
from . import views

urlpatterns = [
    path('usage/', views.usage_reports, name='usage-reports'),
    path('top-users/', views.top_users, name='top-users'),
    path('usage-trends/', views.usage_trends, name='usage-trends'),
    path('revenue/', views.revenue_reports, name='revenue-reports'),
]