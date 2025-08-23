from django.urls import path
from .views import (
    CustomerListView, CustomerDetailView, customer_search_view,
    customer_stats_view, bulk_update_status_view
)

app_name = 'customers'

urlpatterns = [
    path('', CustomerListView.as_view(), name='customer_list'),
    path('<int:pk>/', CustomerDetailView.as_view(), name='customer_detail'),
    path('search/', customer_search_view, name='customer_search'),
    path('stats/', customer_stats_view, name='customer_stats'),
    path('bulk-update-status/', bulk_update_status_view, name='bulk_update_status'),
]
