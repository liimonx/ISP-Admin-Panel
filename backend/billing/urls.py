from django.urls import path
from .views import (
    InvoiceListView, InvoiceDetailView, PaymentListView, PaymentDetailView,
    invoice_stats_view, payment_stats_view, generate_invoice_view,
    send_invoice_view, mark_invoice_paid_view, bulk_generate_invoices_view
)

app_name = 'billing'

urlpatterns = [
    # Invoice CRUD operations
    path('invoices/', InvoiceListView.as_view(), name='invoice_list'),
    path('invoices/<int:pk>/', InvoiceDetailView.as_view(), name='invoice_detail'),

    # Invoice operations
    path('invoices/<int:pk>/send/', send_invoice_view, name='send_invoice'),
    path('invoices/<int:pk>/pay/', mark_invoice_paid_view, name='mark_invoice_paid'),

    # Invoice generation
    path('generate-invoice/', generate_invoice_view, name='generate_invoice'),
    path('bulk-generate/', bulk_generate_invoices_view, name='bulk_generate_invoices'),

    # Payment operations
    path('payments/', PaymentListView.as_view(), name='payment_list'),
    path('payments/<int:pk>/', PaymentDetailView.as_view(), name='payment_detail'),

    # Statistics endpoints
    path('invoices/stats/', invoice_stats_view, name='invoice_stats'),
    path('payments/stats/', payment_stats_view, name='payment_stats'),
]
