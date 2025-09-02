"""
Business logic services for the billing app.
"""
import logging
from decimal import Decimal
from datetime import datetime, timedelta
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from dateutil.relativedelta import relativedelta

from .models import Invoice, Payment
from customers.models import Customer
from subscriptions.models import Subscription
from plans.models import Plan

logger = logging.getLogger(__name__)


class BillingService:
    """Service class for billing operations."""

    @staticmethod
    def generate_invoice_for_subscription(subscription: Subscription, billing_date: datetime.date = None) -> Invoice:
        """
        Generate an invoice for a subscription.

        Args:
            subscription: The subscription to bill
            billing_date: The billing date (defaults to today)

        Returns:
            Generated Invoice instance
        """
        if billing_date is None:
            billing_date = timezone.now().date()

        # Calculate billing period
        billing_period_start = billing_date

        if subscription.plan.billing_cycle == Plan.BillingCycle.MONTHLY:
            billing_period_end = billing_period_start + relativedelta(months=1) - timedelta(days=1)
        elif subscription.plan.billing_cycle == Plan.BillingCycle.QUARTERLY:
            billing_period_end = billing_period_start + relativedelta(months=3) - timedelta(days=1)
        elif subscription.plan.billing_cycle == Plan.BillingCycle.YEARLY:
            billing_period_end = billing_period_start + relativedelta(years=1) - timedelta(days=1)
        else:
            billing_period_end = billing_period_start + timedelta(days=30)

        # Calculate due date (typically 15 days after billing date)
        due_date = billing_date + timedelta(days=15)

        # Generate invoice number
        invoice_number = BillingService._generate_invoice_number()

        # Calculate amounts
        subtotal = subscription.plan.price
        tax_amount = BillingService._calculate_tax(subtotal, subscription.customer)
        discount_amount = BillingService._calculate_discount(subtotal, subscription)
        total_amount = subtotal + tax_amount - discount_amount

        # Create the invoice
        invoice = Invoice.objects.create(
            customer=subscription.customer,
            subscription=subscription,
            invoice_number=invoice_number,
            invoice_type=Invoice.InvoiceType.MONTHLY,
            billing_period_start=billing_period_start,
            billing_period_end=billing_period_end,
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            total_amount=total_amount,
            due_date=due_date,
            status=Invoice.Status.PENDING
        )

        logger.info(
            "Generated invoice for subscription",
            extra={
                'invoice_id': invoice.id,
                'invoice_number': invoice_number,
                'subscription_id': subscription.id,
                'customer_id': subscription.customer.id,
                'amount': str(total_amount)
            }
        )

        return invoice

    @staticmethod
    def _generate_invoice_number() -> str:
        """Generate unique invoice number."""
        last_invoice = Invoice.objects.order_by('-id').first()
        if last_invoice and last_invoice.invoice_number.startswith('INV-'):
            try:
                last_number = int(last_invoice.invoice_number.split('-')[-1])
                return f"INV-{last_number + 1:06d}"
            except (ValueError, IndexError):
                pass

        # Fallback: use timestamp-based number
        timestamp = int(timezone.now().timestamp())
        return f"INV-{timestamp % 1000000:06d}"

    @staticmethod
    def _calculate_tax(subtotal: Decimal, customer: Customer) -> Decimal:
        """
        Calculate tax amount based on customer location and local tax rules.

        Args:
            subtotal: The subtotal amount
            customer: Customer instance

        Returns:
            Tax amount
        """
        # Default tax rate (can be customized based on customer location)
        tax_rate = getattr(settings, 'DEFAULT_TAX_RATE', Decimal('0.15'))  # 15%

        # Apply location-specific tax rates
        if customer.country == 'BD':  # Bangladesh
            tax_rate = Decimal('0.15')  # 15% VAT
        elif customer.country == 'US':
            tax_rate = Decimal('0.08')  # 8% sales tax (varies by state)
        elif customer.country == 'GB':
            tax_rate = Decimal('0.20')  # 20% VAT

        return subtotal * tax_rate

    @staticmethod
    def _calculate_discount(subtotal: Decimal, subscription: Subscription) -> Decimal:
        """
        Calculate discount amount based on subscription or customer promotions.

        Args:
            subtotal: The subtotal amount
            subscription: Subscription instance

        Returns:
            Discount amount
        """
        discount_amount = Decimal('0.00')

        # Apply subscription-specific discounts
        if hasattr(subscription, 'discount_percentage') and subscription.discount_percentage:
            discount_amount = subtotal * (subscription.discount_percentage / 100)

        # Apply long-term customer discounts
        if subscription.customer.created_at < timezone.now() - relativedelta(years=1):
            # 5% loyalty discount for customers over 1 year
            loyalty_discount = subtotal * Decimal('0.05')
            discount_amount = max(discount_amount, loyalty_discount)

        return discount_amount

    @staticmethod
    def process_payment(invoice: Invoice, payment_data: dict) -> Payment:
        """
        Process a payment for an invoice.

        Args:
            invoice: Invoice to pay
            payment_data: Payment information dictionary

        Returns:
            Created Payment instance
        """
        with transaction.atomic():
            # Generate payment number
            payment_number = BillingService._generate_payment_number()

            # Create payment record
            payment = Payment.objects.create(
                invoice=invoice,
                customer=invoice.customer,
                payment_number=payment_number,
                amount=payment_data['amount'],
                payment_method=payment_data['payment_method'],
                external_id=payment_data.get('external_id', ''),
                transaction_id=payment_data.get('transaction_id', ''),
                notes=payment_data.get('notes', ''),
                status=Payment.Status.PENDING
            )

            # Process payment based on method
            if payment_data['payment_method'] in ['cash', 'manual']:
                # Manual payments are immediately completed
                payment.mark_as_completed()
            else:
                # For digital payments, integration with payment providers would go here
                # For now, we'll mark as completed
                payment.mark_as_completed()

            logger.info(
                "Processed payment for invoice",
                extra={
                    'payment_id': payment.id,
                    'payment_number': payment_number,
                    'invoice_id': invoice.id,
                    'invoice_number': invoice.invoice_number,
                    'amount': str(payment.amount),
                    'method': payment.payment_method
                }
            )

            return payment

    @staticmethod
    def _generate_payment_number() -> str:
        """Generate unique payment number."""
        last_payment = Payment.objects.order_by('-id').first()
        if last_payment and last_payment.payment_number.startswith('PAY-'):
            try:
                last_number = int(last_payment.payment_number.split('-')[-1])
                return f"PAY-{last_number + 1:06d}"
            except (ValueError, IndexError):
                pass

        # Fallback: use timestamp-based number
        timestamp = int(timezone.now().timestamp())
        return f"PAY-{timestamp % 1000000:06d}"

    @staticmethod
    def bulk_generate_invoices(customer_ids: list = None, billing_date: datetime.date = None) -> dict:
        """
        Bulk generate invoices for multiple customers.

        Args:
            customer_ids: List of customer IDs (if None, generates for all active)
            billing_date: Billing date (defaults to today)

        Returns:
            Dictionary with generation results
        """
        if billing_date is None:
            billing_date = timezone.now().date()

        # Get active subscriptions
        subscriptions_query = Subscription.objects.filter(status='active')
        if customer_ids:
            subscriptions_query = subscriptions_query.filter(customer_id__in=customer_ids)

        subscriptions = subscriptions_query.select_related('customer', 'plan')

        generated_invoices = []
        errors = []

        for subscription in subscriptions:
            try:
                # Check if invoice already exists for this billing period
                existing_invoice = Invoice.objects.filter(
                    subscription=subscription,
                    billing_period_start=billing_date
                ).first()

                if existing_invoice:
                    errors.append({
                        'subscription_id': subscription.id,
                        'customer_name': subscription.customer.name,
                        'error': 'Invoice already exists for this billing period'
                    })
                    continue

                # Generate invoice
                invoice = BillingService.generate_invoice_for_subscription(
                    subscription, billing_date
                )
                generated_invoices.append(invoice)

            except Exception as e:
                logger.error(
                    "Failed to generate invoice for subscription",
                    extra={'subscription_id': subscription.id, 'error': str(e)},
                    exc_info=True
                )
                errors.append({
                    'subscription_id': subscription.id,
                    'customer_name': subscription.customer.name,
                    'error': str(e)
                })

        logger.info(
            "Bulk invoice generation completed",
            extra={
                'generated_count': len(generated_invoices),
                'error_count': len(errors),
                'total_subscriptions': subscriptions.count()
            }
        )

        return {
            'generated_invoices': generated_invoices,
            'errors': errors,
            'summary': {
                'total_subscriptions': subscriptions.count(),
                'generated_count': len(generated_invoices),
                'error_count': len(errors)
            }
        }

    @staticmethod
    def mark_overdue_invoices():
        """Mark invoices as overdue if past due date."""
        overdue_invoices = Invoice.objects.filter(
            status=Invoice.Status.PENDING,
            due_date__lt=timezone.now().date()
        )

        updated_count = 0
        for invoice in overdue_invoices:
            invoice.mark_as_overdue()
            updated_count += 1

            logger.warning(
                "Invoice marked as overdue",
                extra={
                    'invoice_id': invoice.id,
                    'invoice_number': invoice.invoice_number,
                    'customer_id': invoice.customer.id,
                    'days_overdue': invoice.days_overdue,
                    'amount': str(invoice.total_amount)
                }
            )

        logger.info(f"Marked {updated_count} invoices as overdue")
        return updated_count

    @staticmethod
    def send_invoice_reminders():
        """Send reminders for unpaid invoices."""
        # Get invoices that need reminders (due in 3 days or overdue)
        reminder_date = timezone.now().date() + timedelta(days=3)

        reminder_invoices = Invoice.objects.filter(
            status__in=[Invoice.Status.PENDING, Invoice.Status.OVERDUE],
            due_date__lte=reminder_date
        ).select_related('customer')

        sent_count = 0
        for invoice in reminder_invoices:
            try:
                # TODO: Implement actual email sending
                # EmailService.send_invoice_reminder(invoice)

                logger.info(
                    f"Sent reminder for invoice {invoice.invoice_number}",
                    extra={
                        'invoice_id': invoice.id,
                        'customer_email': invoice.customer.email
                    }
                )
                sent_count += 1

            except Exception as e:
                logger.error(
                    f"Failed to send reminder for invoice {invoice.invoice_number}: {str(e)}"
                )

        logger.info(f"Sent {sent_count} invoice reminders")
        return sent_count

    @staticmethod
    def generate_setup_fee_invoice(subscription: Subscription) -> Invoice:
        """
        Generate a setup fee invoice for a new subscription.

        Args:
            subscription: The new subscription

        Returns:
            Generated setup fee Invoice instance
        """
        if not subscription.plan.setup_fee or subscription.plan.setup_fee <= 0:
            raise ValueError("Plan has no setup fee")

        # Generate invoice number
        invoice_number = BillingService._generate_invoice_number()

        # Setup fee is due immediately
        due_date = timezone.now().date() + timedelta(days=1)

        # Create the invoice
        invoice = Invoice.objects.create(
            customer=subscription.customer,
            subscription=subscription,
            invoice_number=invoice_number,
            invoice_type=Invoice.InvoiceType.SETUP,
            billing_period_start=timezone.now().date(),
            billing_period_end=timezone.now().date(),
            subtotal=subscription.plan.setup_fee,
            tax_amount=BillingService._calculate_tax(subscription.plan.setup_fee, subscription.customer),
            discount_amount=Decimal('0.00'),
            total_amount=subscription.plan.setup_fee + BillingService._calculate_tax(
                subscription.plan.setup_fee, subscription.customer
            ),
            due_date=due_date,
            status=Invoice.Status.PENDING
        )

        logger.info(
            f"Generated setup fee invoice {invoice_number} for subscription {subscription.id}",
            extra={
                'invoice_id': invoice.id,
                'subscription_id': subscription.id,
                'setup_fee': str(subscription.plan.setup_fee)
            }
        )

        return invoice

    @staticmethod
    def calculate_prorated_amount(plan: Plan, start_date: datetime.date, end_date: datetime.date) -> Decimal:
        """
        Calculate prorated amount for partial billing period.

        Args:
            plan: The plan to calculate for
            start_date: Period start date
            end_date: Period end date

        Returns:
            Prorated amount
        """
        total_days = (end_date - start_date).days + 1

        if plan.billing_cycle == Plan.BillingCycle.MONTHLY:
            billing_days = 30
        elif plan.billing_cycle == Plan.BillingCycle.QUARTERLY:
            billing_days = 90
        elif plan.billing_cycle == Plan.BillingCycle.YEARLY:
            billing_days = 365
        else:
            billing_days = 30

        daily_rate = plan.price / billing_days
        prorated_amount = daily_rate * total_days

        return prorated_amount.quantize(Decimal('0.01'))


class PaymentProcessingService:
    """Service for processing payments with external providers."""

    @staticmethod
    def process_stripe_payment(invoice: Invoice, payment_intent_id: str) -> Payment:
        """Process Stripe payment."""
        # TODO: Implement Stripe integration
        pass

    @staticmethod
    def process_bkash_payment(invoice: Invoice, transaction_id: str) -> Payment:
        """Process bKash payment."""
        # TODO: Implement bKash integration
        pass

    @staticmethod
    def process_sslcommerz_payment(invoice: Invoice, transaction_data: dict) -> Payment:
        """Process SSLCommerz payment."""
        # TODO: Implement SSLCommerz integration
        pass


class BillingReportService:
    """Service for generating billing reports."""

    @staticmethod
    def generate_monthly_report(month: int, year: int) -> dict:
        """Generate monthly billing report."""
        from django.db.models import Sum, Count

        start_date = datetime(year, month, 1).date()
        if month == 12:
            end_date = datetime(year + 1, 1, 1).date() - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1).date() - timedelta(days=1)

        invoices = Invoice.objects.filter(
            created_at__date__range=[start_date, end_date]
        )

        payments = Payment.objects.filter(
            created_at__date__range=[start_date, end_date],
            status=Payment.Status.COMPLETED
        )

        report = {
            'period': f"{year}-{month:02d}",
            'invoices': {
                'total_count': invoices.count(),
                'total_amount': invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0'),
                'paid_count': invoices.filter(status=Invoice.Status.PAID).count(),
                'pending_count': invoices.filter(status=Invoice.Status.PENDING).count(),
                'overdue_count': invoices.filter(status=Invoice.Status.OVERDUE).count(),
            },
            'payments': {
                'total_count': payments.count(),
                'total_amount': payments.aggregate(Sum('amount'))['amount__sum'] or Decimal('0'),
                'by_method': payments.values('payment_method').annotate(
                    count=Count('id'),
                    amount=Sum('amount')
                )
            }
        }

        return report
