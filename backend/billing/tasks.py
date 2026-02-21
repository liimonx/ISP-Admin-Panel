"""
Enhanced Celery tasks for billing operations with improved service integration.
"""
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from celery import shared_task
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from .models import Invoice, Payment
from .services import BillingService
from subscriptions.models import Subscription
from customers.models import Customer
from core.exceptions import BusinessLogicError, ExternalServiceError
from core.email import EmailService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def generate_monthly_invoices(self, customer_ids=None, billing_date=None):
    """
    Generate monthly invoices for active subscriptions.

    Args:
        customer_ids: List of customer IDs to generate invoices for (optional)
        billing_date: Billing date string in YYYY-MM-DD format (optional)
    """
    logger.info("Starting monthly invoice generation task...")

    try:
        # Parse billing date
        if billing_date:
            billing_date = datetime.strptime(billing_date, '%Y-%m-%d').date()
        else:
            billing_date = timezone.now().date()

        # Use billing service for bulk generation
        result = BillingService.bulk_generate_invoices(customer_ids, billing_date)

        # Log results
        summary = result['summary']
        logger.info(
            f"Monthly invoice generation completed: "
            f"{summary['generated_count']} generated, {summary['error_count']} errors"
        )

        # Schedule follow-up tasks
        if result['generated_invoices']:
            # Schedule invoice sending
            send_pending_invoices.apply_async(countdown=300)  # Send after 5 minutes

            # Schedule overdue checking
            mark_overdue_invoices.apply_async(countdown=86400)  # Check after 24 hours

        return {
            'success': True,
            'generated_count': summary['generated_count'],
            'error_count': summary['error_count'],
            'errors': result['errors'][:10]  # Limit errors in response
        }

    except Exception as exc:
        logger.error(f"Monthly invoice generation failed: {str(exc)}", exc_info=True)

        # Retry the task
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

        return {
            'success': False,
            'error': str(exc),
            'retries_exhausted': True
        }


@shared_task(bind=True, max_retries=3)
def mark_overdue_invoices(self):
    """Mark invoices as overdue and take enforcement actions."""
    logger.info("Starting overdue invoice marking task...")

    try:
        updated_count = BillingService.mark_overdue_invoices()

        if updated_count > 0:
            # Schedule enforcement actions
            enforce_overdue_invoices.apply_async(countdown=300)  # Enforce after 5 minutes

            # Send overdue notifications
            send_overdue_notifications.apply_async()

        logger.info(f"Marked {updated_count} invoices as overdue")

        return {
            'success': True,
            'updated_count': updated_count
        }

    except Exception as exc:
        logger.error(f"Overdue invoice marking failed: {str(exc)}", exc_info=True)

        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

        return {
            'success': False,
            'error': str(exc)
        }


@shared_task(bind=True, max_retries=3)
def enforce_overdue_invoices(self, grace_period_days=7):
    """
    Enforce overdue invoices by suspending services.

    Args:
        grace_period_days: Days after due date before enforcement (default: 7)
    """
    logger.info("Starting overdue invoice enforcement...")

    try:
        grace_cutoff = timezone.now().date() - timedelta(days=grace_period_days)

        # Get invoices overdue beyond grace period
        overdue_invoices = Invoice.objects.filter(
            status=Invoice.Status.OVERDUE,
            due_date__lt=grace_cutoff,
            subscription__status='active'
        ).select_related('customer', 'subscription')

        suspended_count = 0
        errors = []

        for invoice in overdue_invoices:
            try:
                with transaction.atomic():
                    subscription = invoice.subscription

                    # Suspend the subscription
                    subscription.status = 'suspended'
                    subscription.suspended_at = timezone.now()
                    subscription.suspension_reason = f'Overdue invoice {invoice.invoice_number}'
                    subscription.save()

                    # Disable network access (if network integration exists)
                    try:
                        from network.tasks import disable_customer_access
                        disable_customer_access.delay(subscription.customer.id)
                    except ImportError:
                        logger.warning("Network integration not available")

                    suspended_count += 1
                    logger.info(
                        f"Suspended subscription for {invoice.customer.name} "
                        f"due to overdue invoice {invoice.invoice_number}"
                    )

            except Exception as e:
                error_msg = f"Failed to suspend subscription for invoice {invoice.invoice_number}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)

        logger.info(f"Enforcement completed: {suspended_count} subscriptions suspended")

        return {
            'success': True,
            'suspended_count': suspended_count,
            'errors': errors
        }

    except Exception as exc:
        logger.error(f"Overdue invoice enforcement failed: {str(exc)}", exc_info=True)

        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

        return {
            'success': False,
            'error': str(exc)
        }


@shared_task(bind=True, max_retries=3)
def reactivate_paid_subscriptions(self):
    """Reactivate subscriptions when invoices are paid."""
    logger.info("Starting paid subscription reactivation...")

    try:
        # Find recently paid invoices with suspended subscriptions
        recently_paid_invoices = Invoice.objects.filter(
            status=Invoice.Status.PAID,
            paid_date__gte=timezone.now() - timedelta(hours=24),
            subscription__status='suspended'
        ).select_related('customer', 'subscription')

        reactivated_count = 0
        errors = []

        for invoice in recently_paid_invoices:
            try:
                with transaction.atomic():
                    subscription = invoice.subscription

                    # Check if all invoices for this customer are paid
                    outstanding_invoices = Invoice.objects.filter(
                        customer=invoice.customer,
                        status__in=[Invoice.Status.PENDING, Invoice.Status.OVERDUE]
                    ).count()

                    if outstanding_invoices == 0:
                        # Reactivate subscription
                        subscription.status = 'active'
                        subscription.suspended_at = None
                        subscription.suspension_reason = ''
                        subscription.save()

                        # Enable network access
                        try:
                            from network.tasks import enable_customer_access
                            enable_customer_access.delay(subscription.customer.id)
                        except ImportError:
                            logger.warning("Network integration not available")

                        reactivated_count += 1
                        logger.info(f"Reactivated subscription for {invoice.customer.name}")

            except Exception as e:
                error_msg = f"Failed to reactivate subscription for invoice {invoice.invoice_number}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)

        logger.info(f"Reactivation completed: {reactivated_count} subscriptions reactivated")

        return {
            'success': True,
            'reactivated_count': reactivated_count,
            'errors': errors
        }

    except Exception as exc:
        logger.error(f"Subscription reactivation failed: {str(exc)}", exc_info=True)

        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

        return {
            'success': False,
            'error': str(exc)
        }


@shared_task(bind=True, max_retries=3)
def send_invoice_reminders(self, days_before_due=3):
    """
    Send payment reminders for upcoming due invoices.

    Args:
        days_before_due: Number of days before due date to send reminders
    """
    logger.info("Starting invoice reminder sending...")

    try:
        reminder_date = timezone.now().date() + timedelta(days=days_before_due)

        pending_invoices = Invoice.objects.filter(
            status=Invoice.Status.PENDING,
            due_date=reminder_date
        ).select_related('customer')

        sent_count = BillingService.send_invoice_reminders()

        logger.info(f"Sent {sent_count} invoice reminders")

        return {
            'success': True,
            'sent_count': sent_count
        }

    except Exception as exc:
        logger.error(f"Invoice reminder sending failed: {str(exc)}", exc_info=True)

        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

        return {
            'success': False,
            'error': str(exc)
        }


@shared_task(bind=True, max_retries=3)
def send_overdue_notifications(self):
    """Send notifications for overdue invoices."""
    logger.info("Starting overdue notification sending...")

    try:
        overdue_invoices = Invoice.objects.filter(
            status=Invoice.Status.OVERDUE
        ).select_related('customer')

        sent_count = 0
        errors = []

        for invoice in overdue_invoices:
            try:
                # TODO: Implement actual email/SMS notification sending
                # For now, just log the notification
                logger.info(
                    f"Overdue notification for {invoice.customer.name} - "
                    f"Invoice {invoice.invoice_number}, {invoice.days_overdue} days overdue"
                )
                sent_count += 1

            except Exception as e:
                error_msg = f"Failed to send overdue notification for {invoice.invoice_number}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)

        logger.info(f"Sent {sent_count} overdue notifications")

        return {
            'success': True,
            'sent_count': sent_count,
            'errors': errors
        }

    except Exception as exc:
        logger.error(f"Overdue notification sending failed: {str(exc)}", exc_info=True)

        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

        return {
            'success': False,
            'error': str(exc)
        }


@shared_task(bind=True, max_retries=3)
def send_pending_invoices(self, batch_size=50):
    """
    Send pending invoices to customers.

    Args:
        batch_size: Number of invoices to process in each batch
    """
    logger.info("Starting pending invoice sending...")

    try:
        pending_invoices = Invoice.objects.filter(
            status=Invoice.Status.PENDING,
            sent_at__isnull=True
        ).select_related('customer')[:batch_size]

        sent_count = 0
        errors = []

        for invoice in pending_invoices:
            try:
                with transaction.atomic():
                    # Mark as sent
                    invoice.status = Invoice.Status.SENT if hasattr(Invoice.Status, 'SENT') else Invoice.Status.PENDING
                    invoice.sent_at = timezone.now()
                    invoice.save()

                    # Send invoice via email
                    EmailService.send_invoice(invoice)

                    sent_count += 1
                    logger.info(f"Sent invoice {invoice.invoice_number} to {invoice.customer.email}")

            except Exception as e:
                error_msg = f"Failed to send invoice {invoice.invoice_number}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)

        # If there are more invoices to send, schedule another task
        remaining_count = Invoice.objects.filter(
            status=Invoice.Status.PENDING,
            sent_at__isnull=True
        ).count()

        if remaining_count > 0:
            send_pending_invoices.apply_async(countdown=60)  # Process next batch after 1 minute

        logger.info(f"Sent {sent_count} pending invoices, {remaining_count} remaining")

        return {
            'success': True,
            'sent_count': sent_count,
            'remaining_count': remaining_count,
            'errors': errors
        }

    except Exception as exc:
        logger.error(f"Pending invoice sending failed: {str(exc)}", exc_info=True)

        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

        return {
            'success': False,
            'error': str(exc)
        }


@shared_task(bind=True, max_retries=3)
def process_payment_webhook(self, payment_data):
    """
    Process payment webhook from external payment providers.

    Args:
        payment_data: Payment data from webhook
    """
    logger.info(f"Processing payment webhook: {payment_data.get('transaction_id', 'unknown')}")

    try:
        with transaction.atomic():
            # Find the invoice
            invoice_id = payment_data.get('invoice_id')
            transaction_id = payment_data.get('transaction_id')

            if not invoice_id:
                raise ValueError("Invoice ID is required")

            invoice = Invoice.objects.select_for_update().get(id=invoice_id)

            # Create payment record
            payment = Payment.objects.create(
                invoice=invoice,
                customer=invoice.customer,
                payment_number=BillingService._generate_payment_number(),
                amount=Decimal(str(payment_data['amount'])),
                payment_method=payment_data.get('payment_method', 'online'),
                external_id=payment_data.get('external_id', ''),
                transaction_id=transaction_id,
                status=Payment.Status.COMPLETED if payment_data.get('status') == 'success' else Payment.Status.FAILED
            )

            if payment.status == Payment.Status.COMPLETED:
                # Mark invoice as paid
                invoice.status = Invoice.Status.PAID
                invoice.paid_at = timezone.now()
                invoice.paid_amount = payment.amount
                invoice.save()

                # Schedule subscription reactivation
                reactivate_paid_subscriptions.apply_async(countdown=60)

                logger.info(f"Payment processed successfully: {transaction_id}")
            else:
                logger.warning(f"Payment failed: {transaction_id}")

            return {
                'success': True,
                'payment_id': payment.id,
                'invoice_status': invoice.status
            }

    except Invoice.DoesNotExist:
        logger.error(f"Invoice not found: {invoice_id}")
        return {
            'success': False,
            'error': 'Invoice not found'
        }

    except Exception as exc:
        logger.error(f"Payment webhook processing failed: {str(exc)}", exc_info=True)

        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

        return {
            'success': False,
            'error': str(exc)
        }


@shared_task(bind=True)
def cleanup_old_data(self, days_to_keep=730):
    """
    Clean up old billing data.

    Args:
        days_to_keep: Number of days of data to keep (default: 2 years)
    """
    logger.info("Starting old billing data cleanup...")

    try:
        cutoff_date = timezone.now().date() - timedelta(days=days_to_keep)

        # Delete old paid/cancelled invoices
        old_invoices = Invoice.objects.filter(
            created_at__date__lt=cutoff_date,
            status__in=[Invoice.Status.PAID, Invoice.Status.CANCELLED]
        )
        deleted_invoice_count = old_invoices.count()
        old_invoices.delete()

        # Delete old completed payments
        old_payments = Payment.objects.filter(
            created_at__date__lt=cutoff_date,
            status__in=[Payment.Status.COMPLETED, Payment.Status.REFUNDED]
        )
        deleted_payment_count = old_payments.count()
        old_payments.delete()

        logger.info(
            f"Cleanup completed: deleted {deleted_invoice_count} invoices "
            f"and {deleted_payment_count} payments older than {days_to_keep} days"
        )

        return {
            'success': True,
            'deleted_invoices': deleted_invoice_count,
            'deleted_payments': deleted_payment_count
        }

    except Exception as exc:
        logger.error(f"Data cleanup failed: {str(exc)}", exc_info=True)
        return {
            'success': False,
            'error': str(exc)
        }


@shared_task(bind=True)
def generate_billing_reports(self, month=None, year=None):
    """
    Generate monthly billing reports.

    Args:
        month: Month to generate report for (default: current month)
        year: Year to generate report for (default: current year)
    """
    logger.info("Starting billing report generation...")

    try:
        now = timezone.now()
        target_month = month or now.month
        target_year = year or now.year

        report = BillingReportService.generate_monthly_report(target_month, target_year)

        # TODO: Save report to file or send via email
        logger.info(f"Generated billing report for {target_year}-{target_month:02d}")

        return {
            'success': True,
            'report_period': f"{target_year}-{target_month:02d}",
            'report': report
        }

    except Exception as exc:
        logger.error(f"Billing report generation failed: {str(exc)}", exc_info=True)
        return {
            'success': False,
            'error': str(exc)
        }
