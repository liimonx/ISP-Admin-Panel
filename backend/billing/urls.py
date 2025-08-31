from django.urls import path
from .views import (
    InvoiceListView, InvoiceDetailView, PaymentListView, PaymentDetailView,
    invoice_stats_view, payment_stats_view
)

app_name = 'billing'

urlpatterns = [
    path('invoices/', InvoiceListView.as_view(), name='invoice_list'),
    path('invoices/<int:pk>/', InvoiceDetailView.as_view(), name='invoice_detail'),
    path('payments/', PaymentListView.as_view(), name='payment_list'),
    path('payments/<int:pk>/', PaymentDetailView.as_view(), name='payment_detail'),
    path('invoices/stats/', invoice_stats_view, name='invoice_stats'),
    path('payments/stats/', payment_stats_view, name='payment_stats'),
    # Additional endpoints for frontend compatibility
    path('stats/invoices/', invoice_stats_view, name='invoice_stats_alt'),
    path('stats/payments/', payment_stats_view, name='payment_stats_alt'),
]
