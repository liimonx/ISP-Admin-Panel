from django.urls import path
from .views import (
    SNMPSnapshotListView, UsageSnapshotListView,
    monitoring_stats_view, router_monitoring_view
)

app_name = 'monitoring'

urlpatterns = [
    path('snmp-snapshots/', SNMPSnapshotListView.as_view(), name='snmp_snapshot_list'),
    path('usage-snapshots/', UsageSnapshotListView.as_view(), name='usage_snapshot_list'),
    path('stats/', monitoring_stats_view, name='monitoring_stats'),
    path('routers/<int:router_id>/', router_monitoring_view, name='router_monitoring'),
]
