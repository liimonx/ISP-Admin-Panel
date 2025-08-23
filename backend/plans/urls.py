from django.urls import path
from .views import (
    PlanListView, PlanDetailView, active_plans_view, featured_plans_view,
    compare_plans_view, plan_stats_view, bulk_update_plan_status_view
)

app_name = 'plans'

urlpatterns = [
    path('', PlanListView.as_view(), name='plan_list'),
    path('<int:pk>/', PlanDetailView.as_view(), name='plan_detail'),
    path('active/', active_plans_view, name='active_plans'),
    path('featured/', featured_plans_view, name='featured_plans'),
    path('compare/', compare_plans_view, name='compare_plans'),
    path('stats/', plan_stats_view, name='plan_stats'),
    path('bulk-update-status/', bulk_update_plan_status_view, name='bulk_update_status'),
]
