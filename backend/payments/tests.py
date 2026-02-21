from rest_framework import status
from core.testing import BaseAPITestCase, TestDataFactory
from billing.models import Invoice, Payment
from customers.models import Customer
from decimal import Decimal

class PaymentRefundTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        # Create user
        self.create_test_user()

        # Create customer
        self.customer = Customer.objects.create(**TestDataFactory.create_customer_data())

        # Create invoice
        invoice_data = TestDataFactory.create_invoice_data(status='paid')
        self.invoice = Invoice.objects.create(customer=self.customer, **invoice_data)
        self.invoice.calculate_total()
        self.invoice.paid_amount = self.invoice.total_amount
        self.invoice.save()

        # Create payment
        payment_data = TestDataFactory.create_payment_data(status='completed')
        # Ensure amount matches invoice total for full refund test
        payment_data['amount'] = self.invoice.total_amount
        # Ensure payment number is unique
        payment_data['payment_number'] = 'PAY-TEST-REFUND-001'

        self.payment = Payment.objects.create(
            invoice=self.invoice,
            customer=self.customer,
            **payment_data
        )

    def test_refund_payment_updates_invoice(self):
        """Test that refunding a payment updates the invoice status and paid amount."""
        url = f'/api/payments/payments/{self.payment.id}/mark_refunded/'

        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.payment.refresh_from_db()
        self.invoice.refresh_from_db()

        # Check payment status
        self.assertEqual(self.payment.status, Payment.Status.REFUNDED)

        # Check invoice paid amount reduced
        # This assertion is expected to fail before the fix
        self.assertEqual(self.invoice.paid_amount, Decimal('0.00'))

        # Check invoice status updated (should be PENDING or OVERDUE)
        # This assertion is expected to fail before the fix
        self.assertNotEqual(self.invoice.status, Invoice.Status.PAID)
