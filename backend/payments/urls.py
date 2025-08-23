from django.urls import path
from .views import (
    webhook_stripe_view, webhook_bkash_view, webhook_sslcommerz_view,
    payment_methods_view
)

app_name = 'payments'

urlpatterns = [
    path('webhooks/stripe/', webhook_stripe_view, name='webhook_stripe'),
    path('webhooks/bkash/', webhook_bkash_view, name='webhook_bkash'),
    path('webhooks/sslcommerz/', webhook_sslcommerz_view, name='webhook_sslcommerz'),
    path('methods/', payment_methods_view, name='payment_methods'),
]
