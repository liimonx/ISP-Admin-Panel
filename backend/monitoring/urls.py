from django.urls import path
from .views import (
    monitoring_stats_view, router_monitoring_view,
    health_check, RouterMetricListView, SNMPSnapshotListView, UsageSnapshotListView
)

app_name = 'monitoring'

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('stats/', monitoring_stats_view, name='monitoring_stats'),
    path('routers/<int:router_id>/', router_monitoring_view, name='router_monitoring'),
    path('metrics/', RouterMetricListView.as_view(), name='router_metrics'),
    path('snmp-snapshots/', SNMPSnapshotListView.as_view(), name='snmp_snapshots'),
    path('usage-snapshots/', UsageSnapshotListView.as_view(), name='usage_snapshots'),
]
