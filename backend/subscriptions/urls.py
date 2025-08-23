from django.urls import path
from .views import (
    SubscriptionListView, SubscriptionDetailView, update_subscription_status_view,
    update_data_usage_view, reset_data_usage_view, active_subscriptions_view,
    suspended_subscriptions_view, expired_subscriptions_view, subscription_stats_view,
    bulk_update_subscription_status_view
)

app_name = 'subscriptions'

urlpatterns = [
    path('', SubscriptionListView.as_view(), name='subscription_list'),
    path('<int:pk>/', SubscriptionDetailView.as_view(), name='subscription_detail'),
    path('<int:pk>/status/', update_subscription_status_view, name='update_status'),
    path('<int:pk>/data-usage/', update_data_usage_view, name='update_data_usage'),
    path('<int:pk>/reset-data-usage/', reset_data_usage_view, name='reset_data_usage'),
    path('active/', active_subscriptions_view, name='active_subscriptions'),
    path('suspended/', suspended_subscriptions_view, name='suspended_subscriptions'),
    path('expired/', expired_subscriptions_view, name='expired_subscriptions'),
    path('stats/', subscription_stats_view, name='subscription_stats'),
    path('bulk-update-status/', bulk_update_subscription_status_view, name='bulk_update_status'),
]
