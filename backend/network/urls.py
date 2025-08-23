from django.urls import path
from .views import (
    RouterListView, RouterDetailView, test_router_connection_view,
    update_router_status_view, router_sessions_view, router_pppoe_users_view,
    create_pppoe_user_view, delete_pppoe_user_view, router_stats_view,
    RouterSessionListView, bulk_update_router_status_view
)

app_name = 'network'

urlpatterns = [
    path('routers/', RouterListView.as_view(), name='router_list'),
    path('routers/<int:pk>/', RouterDetailView.as_view(), name='router_detail'),
    path('routers/<int:pk>/test-connection/', test_router_connection_view, name='test_connection'),
    path('routers/<int:pk>/status/', update_router_status_view, name='update_status'),
    path('routers/<int:pk>/sessions/', router_sessions_view, name='router_sessions'),
    path('routers/<int:pk>/pppoe-users/', router_pppoe_users_view, name='router_pppoe_users'),
    path('routers/<int:pk>/create-pppoe-user/', create_pppoe_user_view, name='create_pppoe_user'),
    path('routers/<int:pk>/delete-pppoe-user/', delete_pppoe_user_view, name='delete_pppoe_user'),
    path('routers/stats/', router_stats_view, name='router_stats'),
    path('routers/bulk-update-status/', bulk_update_router_status_view, name='bulk_update_status'),
    path('sessions/', RouterSessionListView.as_view(), name='session_list'),
]
