"""
Serializers for the billing app.
"""
from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from .models import Invoice, Payment, BillingCycle
from customers.serializers import CustomerListSerializer
from subscriptions.serializers import SubscriptionListSerializer


class InvoiceListSerializer(serializers.ModelSerializer):
    """Serializer for invoice list view."""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    subscription_plan = serializers.CharField(source='subscription.plan.name', read_only=True)
    days_overdue = serializers.ReadOnlyField()
    balance_due = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer_name', 'customer_email',
            'subscription_plan', 'invoice_type', 'status', 'total_amount',
            'paid_amount', 'balance_due', 'issue_date', 'due_date',
            'days_overdue', 'is_overdue', 'created_at'
        ]


class InvoiceSerializer(serializers.ModelSerializer):
    """Detailed invoice serializer."""
    customer = CustomerListSerializer(read_only=True)
    subscription = SubscriptionListSerializer(read_only=True)
    days_overdue = serializers.ReadOnlyField()
    balance_due = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    is_paid = serializers.ReadOnlyField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'subscription',
            'invoice_type', 'billing_period_start', 'billing_period_end',
            'subtotal', 'tax_amount', 'discount_amount', 'total_amount',
            'paid_amount', 'balance_due', 'status', 'issue_date',
            'due_date', 'paid_date', 'notes', 'days_overdue',
            'is_overdue', 'is_paid', 'created_at', 'updated_at'
        ]


class InvoiceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating invoices."""

    class Meta:
        model = Invoice
        fields = [
            'customer', 'subscription', 'invoice_type',
            'billing_period_start', 'billing_period_end',
            'subtotal', 'tax_amount', 'discount_amount',
            'due_date', 'notes'
        ]

    def validate(self, data):
        """Validate invoice data."""
        # Validate billing period
        if data['billing_period_start'] >= data['billing_period_end']:
            raise serializers.ValidationError(
                "Billing period start must be before billing period end"
            )

        # Validate due date
        if data['due_date'] < timezone.now().date():
            raise serializers.ValidationError(
                "Due date cannot be in the past"
            )

        # Validate amounts
        if data['subtotal'] < Decimal('0'):
            raise serializers.ValidationError(
                "Subtotal cannot be negative"
            )

        if data.get('tax_amount', 0) < Decimal('0'):
            raise serializers.ValidationError(
                "Tax amount cannot be negative"
            )

        if data.get('discount_amount', 0) < Decimal('0'):
            raise serializers.ValidationError(
                "Discount amount cannot be negative"
            )

        return data

    def create(self, validated_data):
        """Create invoice with auto-generated invoice number."""
        # Generate invoice number if not provided
        if not validated_data.get('invoice_number'):
            last_invoice = Invoice.objects.order_by('-id').first()
            if last_invoice:
                last_number = int(last_invoice.invoice_number.split('-')[-1])
                validated_data['invoice_number'] = f"INV-{last_number + 1:06d}"
            else:
                validated_data['invoice_number'] = "INV-000001"

        # Calculate total amount
        subtotal = validated_data['subtotal']
        tax_amount = validated_data.get('tax_amount', Decimal('0'))
        discount_amount = validated_data.get('discount_amount', Decimal('0'))
        validated_data['total_amount'] = subtotal + tax_amount - discount_amount

        return super().create(validated_data)


class PaymentListSerializer(serializers.ModelSerializer):
    """Serializer for payment list view."""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    is_completed = serializers.ReadOnlyField()

    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'customer_name', 'invoice_number',
            'amount', 'payment_method', 'status', 'payment_date',
            'transaction_id', 'is_completed', 'created_at'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    """Detailed payment serializer."""
    customer = CustomerListSerializer(read_only=True)
    invoice = InvoiceListSerializer(read_only=True)
    is_completed = serializers.ReadOnlyField()
    is_failed = serializers.ReadOnlyField()

    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'customer', 'invoice',
            'amount', 'payment_method', 'status', 'payment_date',
            'external_id', 'transaction_id', 'notes',
            'is_completed', 'is_failed', 'created_at', 'updated_at'
        ]


class PaymentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating payments."""

    class Meta:
        model = Payment
        fields = [
            'invoice', 'amount', 'payment_method',
            'external_id', 'transaction_id', 'notes'
        ]

    def validate(self, data):
        """Validate payment data."""
        invoice = data['invoice']
        amount = data['amount']

        # Validate amount
        if amount <= Decimal('0'):
            raise serializers.ValidationError(
                "Payment amount must be greater than zero"
            )

        # Validate that payment doesn't exceed invoice balance
        if amount > invoice.balance_due:
            raise serializers.ValidationError(
                f"Payment amount ({amount}) cannot exceed invoice balance due ({invoice.balance_due})"
            )

        # Validate invoice status
        if invoice.status == Invoice.Status.PAID:
            raise serializers.ValidationError(
                "Cannot add payment to an already paid invoice"
            )

        if invoice.status == Invoice.Status.CANCELLED:
            raise serializers.ValidationError(
                "Cannot add payment to a cancelled invoice"
            )

        return data

    def create(self, validated_data):
        """Create payment with auto-generated payment number."""
        # Set customer from invoice
        validated_data['customer'] = validated_data['invoice'].customer

        # Generate payment number if not provided
        if not validated_data.get('payment_number'):
            last_payment = Payment.objects.order_by('-id').first()
            if last_payment:
                last_number = int(last_payment.payment_number.split('-')[-1])
                validated_data['payment_number'] = f"PAY-{last_number + 1:06d}"
            else:
                validated_data['payment_number'] = "PAY-000001"

        return super().create(validated_data)


class BillingCycleSerializer(serializers.ModelSerializer):
    """Serializer for billing cycle information."""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    subscription_plan = serializers.CharField(source='subscription.plan.name', read_only=True)
    is_current = serializers.ReadOnlyField()

    class Meta:
        model = BillingCycle
        fields = [
            'id', 'customer', 'customer_name', 'subscription', 'subscription_plan',
            'cycle_number', 'start_date', 'end_date', 'status', 'base_amount',
            'total_amount', 'notes', 'is_current', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class InvoiceStatsSerializer(serializers.Serializer):
    """Serializer for invoice statistics."""
    total_invoices = serializers.IntegerField()
    pending_invoices = serializers.IntegerField()
    paid_invoices = serializers.IntegerField()
    overdue_invoices = serializers.IntegerField()
    cancelled_invoices = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    overdue_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    avg_invoice_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    collection_rate = serializers.FloatField()


class PaymentStatsSerializer(serializers.Serializer):
    """Serializer for payment statistics."""
    total_payments = serializers.IntegerField()
    successful_payments = serializers.IntegerField()
    failed_payments = serializers.IntegerField()
    pending_payments = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    successful_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    avg_payment_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    success_rate = serializers.FloatField()


class MonthlyTrendSerializer(serializers.Serializer):
    """Serializer for monthly trend data."""
    month = serializers.CharField()
    invoice_count = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = serializers.DecimalField(max_digits=12, decimal_places=2)


class DailyTrendSerializer(serializers.Serializer):
    """Serializer for daily trend data."""
    date = serializers.DateField()
    payment_count = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    successful_count = serializers.IntegerField()


class PaymentMethodStatsSerializer(serializers.Serializer):
    """Serializer for payment method statistics."""
    method = serializers.CharField()
    count = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)


class TopCustomerSerializer(serializers.Serializer):
    """Serializer for top customer data."""
    customer_id = serializers.IntegerField()
    customer_name = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    invoice_count = serializers.IntegerField()


class BulkInvoiceGenerationSerializer(serializers.Serializer):
    """Serializer for bulk invoice generation."""
    customer_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of customer IDs. If not provided, generates for all active customers."
    )
    billing_date = serializers.DateField(
        required=False,
        help_text="Billing date for invoice generation. Defaults to today."
    )


class InvoiceActionSerializer(serializers.Serializer):
    """Serializer for invoice actions (send, mark as paid, etc.)."""
    action = serializers.ChoiceField(choices=['send', 'mark_paid', 'cancel'])
    payment_method = serializers.CharField(required=False)
    transaction_id = serializers.CharField(required=False)
    notes = serializers.CharField(required=False)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
