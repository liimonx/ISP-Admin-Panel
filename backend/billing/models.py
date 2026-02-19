from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
from customers.models import Customer
from subscriptions.models import Subscription


class Invoice(models.Model):
    """
    Invoice model for customer billing.
    """
    class Status(models.TextChoices):
        DRAFT = 'draft', _('Draft')
        PENDING = 'pending', _('Pending')
        PAID = 'paid', _('Paid')
        OVERDUE = 'overdue', _('Overdue')
        CANCELLED = 'cancelled', _('Cancelled')
    
    class InvoiceType(models.TextChoices):
        MONTHLY = 'monthly', _('Monthly')
        SETUP = 'setup', _('Setup Fee')
        ADJUSTMENT = 'adjustment', _('Adjustment')
        OTHER = 'other', _('Other')
    
    # Relationships
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='invoices',
        help_text=_('Customer for this invoice')
    )
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name='invoices',
        null=True,
        blank=True,
        help_text=_('Subscription for this invoice (optional)')
    )
    
    # Invoice Details
    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        help_text=_('Unique invoice number')
    )
    invoice_type = models.CharField(
        max_length=20,
        choices=InvoiceType.choices,
        default=InvoiceType.MONTHLY,
        help_text=_('Type of invoice')
    )
    
    # Billing Period
    billing_period_start = models.DateField(help_text=_('Billing period start date'))
    billing_period_end = models.DateField(help_text=_('Billing period end date'))
    
    # Amounts
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Subtotal amount')
    )
    tax_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Tax amount')
    )
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Discount amount')
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Total amount')
    )
    paid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Amount paid')
    )
    
    # Status and Dates
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        help_text=_('Invoice status')
    )
    issue_date = models.DateField(auto_now_add=True, help_text=_('Invoice issue date'))
    due_date = models.DateField(help_text=_('Payment due date'))
    paid_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('Date when invoice was paid')
    )
    
    # Notes and Additional Info
    notes = models.TextField(blank=True, help_text=_('Additional notes'))
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Invoice')
        verbose_name_plural = _('Invoices')
        ordering = ['-issue_date']
        indexes = [
            models.Index(fields=['customer']),
            models.Index(fields=['subscription']),
            models.Index(fields=['status']),
            models.Index(fields=['invoice_number']),
            models.Index(fields=['due_date']),
            models.Index(fields=['issue_date']),
        ]
    
    def __str__(self):
        from django.utils.html import escape
        return f"Invoice {escape(self.invoice_number)} - {escape(self.customer.name)}"
    
    @property
    def is_paid(self):
        """Check if invoice is fully paid."""
        return self.status == self.Status.PAID
    
    @property
    def is_overdue(self):
        """Check if invoice is overdue."""
        from django.utils import timezone
        return self.status == self.Status.OVERDUE or (
            self.status == self.Status.PENDING and 
            timezone.now().date() > self.due_date
        )
    
    @property
    def balance_due(self):
        """Get remaining balance."""
        return self.total_amount - self.paid_amount
    
    @property
    def days_overdue(self):
        """Get days overdue."""
        if not self.is_overdue:
            return 0
        from django.utils import timezone
        overdue_days = (timezone.now().date() - self.due_date).days
        return max(0, overdue_days)
    
    def calculate_total(self):
        """Calculate total amount."""
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount
        return self.total_amount
    
    def mark_as_paid(self, amount=None, paid_date=None):
        """Mark invoice as paid."""
        from django.utils import timezone
        
        if amount is None:
            amount = self.balance_due
        
        self.paid_amount += amount
        self.status = self.Status.PAID
        self.paid_date = paid_date or timezone.now()
        self.save()
    
    def mark_as_overdue(self):
        """Mark invoice as overdue."""
        self.status = self.Status.OVERDUE
        self.save()
    
    def refund_payment(self, amount):
        """Refund a payment amount."""
        self.paid_amount -= amount
        if self.paid_amount < 0:
            self.paid_amount = Decimal('0.00')

        if self.paid_amount < self.total_amount:
            if timezone.now().date() > self.due_date:
                self.status = self.Status.OVERDUE
            else:
                self.status = self.Status.PENDING

        self.save()

    def save(self, *args, **kwargs):
        """Override save to calculate total."""
        if not self.total_amount:
            self.calculate_total()
        super().save(*args, **kwargs)
    
    def get_subtotal_float(self):
        """Get subtotal as float for API responses."""
        return float(self.subtotal)
    
    def get_tax_amount_float(self):
        """Get tax amount as float for API responses."""
        return float(self.tax_amount)
    
    def get_discount_amount_float(self):
        """Get discount amount as float for API responses."""
        return float(self.discount_amount)
    
    def get_total_amount_float(self):
        """Get total amount as float for API responses."""
        return float(self.total_amount)
    
    def get_paid_amount_float(self):
        """Get paid amount as float for API responses."""
        return float(self.paid_amount)
    
    def get_balance_due_float(self):
        """Get balance due as float for API responses."""
        return float(self.balance_due)


class Payment(models.Model):
    """
    Payment model for tracking payments.
    """
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        COMPLETED = 'completed', _('Completed')
        FAILED = 'failed', _('Failed')
        CANCELLED = 'cancelled', _('Cancelled')
        REFUNDED = 'refunded', _('Refunded')
    
    class PaymentMethod(models.TextChoices):
        CASH = 'cash', _('Cash')
        BANK_TRANSFER = 'bank_transfer', _('Bank Transfer')
        BKASH = 'bkash', _('bKash')
        NAGAD = 'nagad', _('Nagad')
        ROCKET = 'rocket', _('Rocket')
        SSLCOMMERZ = 'sslcommerz', _('SSLCommerz')
        STRIPE = 'stripe', _('Stripe')
        OTHER = 'other', _('Other')
    
    # Relationships
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='payments',
        help_text=_('Invoice for this payment')
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='payments',
        help_text=_('Customer for this payment')
    )
    
    # Payment Details
    payment_number = models.CharField(
        max_length=50,
        unique=True,
        help_text=_('Unique payment number')
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text=_('Payment amount')
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        help_text=_('Payment method')
    )
    
    # Status and Dates
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        help_text=_('Payment status')
    )
    payment_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('Date when payment was made')
    )
    
    # External Payment Details
    external_id = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('External payment ID from payment provider')
    )
    transaction_id = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Transaction ID from payment provider')
    )
    
    # Notes and Additional Info
    notes = models.TextField(blank=True, help_text=_('Additional notes'))
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Payment')
        verbose_name_plural = _('Payments')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['invoice']),
            models.Index(fields=['customer']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_number']),
            models.Index(fields=['external_id']),
            models.Index(fields=['transaction_id']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        from django.utils.html import escape
        return f"Payment {escape(self.payment_number)} - {escape(self.customer.name)}"
    
    @property
    def is_completed(self):
        """Check if payment is completed."""
        return self.status == self.Status.COMPLETED
    
    @property
    def is_failed(self):
        """Check if payment failed."""
        return self.status == self.Status.FAILED
    
    def mark_as_completed(self, payment_date=None):
        """Mark payment as completed."""
        from django.utils import timezone
        
        self.status = self.Status.COMPLETED
        self.payment_date = payment_date or timezone.now()
        self.save()
        
        # Update invoice
        self.invoice.mark_as_paid(self.amount, self.payment_date)
    
    def mark_as_failed(self):
        """Mark payment as failed."""
        self.status = self.Status.FAILED
        self.save()
    
    def mark_as_refunded(self):
        """Mark payment as refunded."""
        if self.status == self.Status.REFUNDED:
            return

        self.invoice.refund_payment(self.amount)
        self.status = self.Status.REFUNDED
        self.save()
    
    def get_amount_float(self):
        """Get payment amount as float for API responses."""
        return float(self.amount)


class BillingCycle(models.Model):
    """
    Billing cycle model for managing billing periods.
    """
    class Status(models.TextChoices):
        ACTIVE = 'active', _('Active')
        INACTIVE = 'inactive', _('Inactive')
        SUSPENDED = 'suspended', _('Suspended')
    
    # Relationships
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='billing_cycles',
        help_text=_('Customer for this billing cycle')
    )
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name='billing_cycles',
        help_text=_('Subscription for this billing cycle')
    )
    
    # Billing Cycle Details
    cycle_number = models.PositiveIntegerField(help_text=_('Billing cycle number'))
    start_date = models.DateField(help_text=_('Billing cycle start date'))
    end_date = models.DateField(help_text=_('Billing cycle end date'))
    
    # Status and Dates
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        help_text=_('Billing cycle status')
    )
    
    # Amounts
    base_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Base amount for this cycle')
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Total amount for this cycle')
    )
    
    # Notes and Additional Info
    notes = models.TextField(blank=True, help_text=_('Additional notes'))
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Billing Cycle')
        verbose_name_plural = _('Billing Cycles')
        ordering = ['-start_date']
        unique_together = ['customer', 'subscription', 'cycle_number']
        indexes = [
            models.Index(fields=['customer']),
            models.Index(fields=['subscription']),
            models.Index(fields=['status']),
            models.Index(fields=['start_date']),
            models.Index(fields=['end_date']),
        ]
    
    def __str__(self):
        from django.utils.html import escape
        return f"Billing Cycle {self.cycle_number} - {escape(self.customer.name)}"
    
    @property
    def is_active(self):
        """Check if billing cycle is active."""
        return self.status == self.Status.ACTIVE
    
    @property
    def is_current(self):
        """Check if this is the current billing cycle."""
        today = timezone.now().date()
        return self.start_date <= today <= self.end_date
    
    def calculate_total(self):
        """Calculate total amount."""
        self.total_amount = self.base_amount
        return self.total_amount
    
    def save(self, *args, **kwargs):
        """Override save to calculate total."""
        if not self.total_amount:
            self.calculate_total()
        super().save(*args, **kwargs)
    
    def get_base_amount_float(self):
        """Get base amount as float for API responses."""
        return float(self.base_amount)
    
    def get_total_amount_float(self):
        """Get total amount as float for API responses."""
        return float(self.total_amount)
