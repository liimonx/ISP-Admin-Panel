from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'routers', views.RouterViewSet)

urlpatterns = [
    # Include ViewSet routes
    path('', include(router.urls)),
    
    # Router statistics endpoint (accessible at /api/network/routers/stats/)
    path('routers/stats/', views.router_stats_view, name='router_stats'),
    
    # Main Router specific endpoints
    path('main-router/status/', views.main_router_status, name='main_router_status'),
    path('main-router/interfaces/', views.main_router_interfaces, name='main_router_interfaces'),
    path('main-router/bandwidth/', views.main_router_bandwidth, name='main_router_bandwidth'),
    path('main-router/connections/', views.main_router_connections, name='main_router_connections'),
    path('main-router/dhcp-leases/', views.main_router_dhcp_leases, name='main_router_dhcp_leases'),
    path('main-router/resources/', views.main_router_resources, name='main_router_resources'),
    path('main-router/logs/', views.main_router_logs, name='main_router_logs'),
    path('main-router/alerts/', views.main_router_alerts, name='main_router_alerts'),
    path('main-router/execute-command/', views.main_router_execute_command, name='main_router_execute_command'),
    path('main-router/test-connection/', views.main_router_test_connection, name='main_router_test_connection'),
    path('main-router/restart/', views.main_router_restart, name='main_router_restart'),
]
