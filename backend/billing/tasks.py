"""
Celery tasks for billing operations.
"""
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from celery import shared_task
from django.utils import timezone
from django.db import transaction
from .models import Invoice
from subscriptions.models import Subscription
from network.services import RouterOSService

logger = logging.getLogger(__name__)


@shared_task
def generate_monthly_invoices():
    """
    Generate monthly invoices for all active subscriptions.
    """
    logger.info("Starting monthly invoice generation...")
    
    try:
        # Get all active subscriptions
        active_subscriptions = Subscription.objects.filter(status='active')
        
        invoices_created = 0
        
        for subscription in active_subscriptions:
            try:
                with transaction.atomic():
                    # Check if invoice already exists for this month
                    current_month = timezone.now().replace(day=1)
                    existing_invoice = Invoice.objects.filter(
                        subscription=subscription,
                        billing_period_start__gte=current_month,
                        invoice_type='monthly'
                    ).first()
                    
                    if existing_invoice:
                        logger.info(f"Invoice already exists for {subscription.customer.name} - {subscription.plan.name}")
                        continue
                    
                    # Calculate billing period
                    billing_start = current_month
                    billing_end = (current_month + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                    
                    # Generate invoice number
                    invoice_number = f"INV-{subscription.customer.id:06d}-{current_month.strftime('%Y%m')}"
                    
                    # Create invoice
                    invoice = Invoice.objects.create(
                        customer=subscription.customer,
                        subscription=subscription,
                        invoice_number=invoice_number,
                        invoice_type='monthly',
                        billing_period_start=billing_start,
                        billing_period_end=billing_end,
                        subtotal=subscription.monthly_fee,
                        total_amount=subscription.monthly_fee,
                        status='pending',
                        due_date=billing_start + timedelta(days=7)  # Due in 7 days
                    )
                    
                    invoices_created += 1
                    logger.info(f"Created invoice {invoice_number} for {subscription.customer.name}")
                    
            except Exception as e:
                logger.error(f"Failed to create invoice for subscription {subscription.id}: {e}")
                continue
        
        logger.info(f"Monthly invoice generation completed. Created {invoices_created} invoices.")
        return f"Created {invoices_created} invoices"
        
    except Exception as e:
        logger.error(f"Monthly invoice generation failed: {e}")
        raise


@shared_task
def enforce_overdue_invoices():
    """
    Enforce overdue invoices by suspending subscriptions.
    """
    logger.info("Starting overdue invoice enforcement...")
    
    try:
        # Get overdue invoices
        overdue_invoices = Invoice.objects.filter(
            status='pending',
            due_date__lt=timezone.now().date()
        )
        
        suspended_count = 0
        
        for invoice in overdue_invoices:
            try:
                with transaction.atomic():
                    # Mark invoice as overdue
                    invoice.mark_as_overdue()
                    
                    # Suspend subscription if it exists
                    if invoice.subscription:
                        subscription = invoice.subscription
                        
                        # Only suspend if not already suspended
                        if subscription.status != 'suspended':
                            subscription.suspend()
                            
                            # Disable PPPoE user on router
                            try:
                                with RouterOSService(subscription.router) as service:
                                    service.disable_pppoe_user(subscription.username)
                                    logger.info(f"Disabled PPPoE user {subscription.username} for overdue invoice")
                            except Exception as e:
                                logger.error(f"Failed to disable PPPoE user {subscription.username}: {e}")
                        
                        suspended_count += 1
                        logger.info(f"Suspended subscription for {invoice.customer.name} due to overdue invoice")
                    
            except Exception as e:
                logger.error(f"Failed to enforce overdue invoice {invoice.invoice_number}: {e}")
                continue
        
        logger.info(f"Overdue invoice enforcement completed. Suspended {suspended_count} subscriptions.")
        return f"Suspended {suspended_count} subscriptions"
        
    except Exception as e:
        logger.error(f"Overdue invoice enforcement failed: {e}")
        raise


@shared_task
def reactivate_paid_subscriptions():
    """
    Reactivate subscriptions when invoices are paid.
    """
    logger.info("Starting subscription reactivation for paid invoices...")
    
    try:
        # Get paid invoices with suspended subscriptions
        paid_invoices = Invoice.objects.filter(
            status='paid',
            subscription__status='suspended'
        )
        
        reactivated_count = 0
        
        for invoice in paid_invoices:
            try:
                with transaction.atomic():
                    subscription = invoice.subscription
                    
                    # Reactivate subscription
                    subscription.activate()
                    
                    # Enable PPPoE user on router
                    try:
                        with RouterOSService(subscription.router) as service:
                            service.enable_pppoe_user(subscription.username)
                            logger.info(f"Enabled PPPoE user {subscription.username} for paid invoice")
                    except Exception as e:
                        logger.error(f"Failed to enable PPPoE user {subscription.username}: {e}")
                    
                    reactivated_count += 1
                    logger.info(f"Reactivated subscription for {invoice.customer.name}")
                    
            except Exception as e:
                logger.error(f"Failed to reactivate subscription for invoice {invoice.invoice_number}: {e}")
                continue
        
        logger.info(f"Subscription reactivation completed. Reactivated {reactivated_count} subscriptions.")
        return f"Reactivated {reactivated_count} subscriptions"
        
    except Exception as e:
        logger.error(f"Subscription reactivation failed: {e}")
        raise


@shared_task
def send_payment_reminders():
    """
    Send payment reminders for pending invoices.
    """
    logger.info("Starting payment reminder sending...")
    
    try:
        # Get pending invoices due in 3 days
        reminder_date = timezone.now().date() + timedelta(days=3)
        pending_invoices = Invoice.objects.filter(
            status='pending',
            due_date=reminder_date
        )
        
        reminders_sent = 0
        
        for invoice in pending_invoices:
            try:
                # TODO: Implement email/SMS reminder sending
                # For now, just log the reminder
                logger.info(f"Payment reminder for {invoice.customer.name} - Invoice {invoice.invoice_number} due on {invoice.due_date}")
                reminders_sent += 1
                
            except Exception as e:
                logger.error(f"Failed to send reminder for invoice {invoice.invoice_number}: {e}")
                continue
        
        logger.info(f"Payment reminders completed. Sent {reminders_sent} reminders.")
        return f"Sent {reminders_sent} reminders"
        
    except Exception as e:
        logger.error(f"Payment reminder sending failed: {e}")
        raise


@shared_task
def cleanup_old_invoices():
    """
    Clean up old invoices (archive or delete).
    """
    logger.info("Starting old invoice cleanup...")
    
    try:
        # Get invoices older than 2 years
        cutoff_date = timezone.now().date() - timedelta(days=730)
        old_invoices = Invoice.objects.filter(
            created_at__date__lt=cutoff_date,
            status__in=['paid', 'cancelled']
        )
        
        deleted_count = old_invoices.count()
        old_invoices.delete()
        
        logger.info(f"Old invoice cleanup completed. Deleted {deleted_count} invoices.")
        return f"Deleted {deleted_count} old invoices"
        
    except Exception as e:
        logger.error(f"Old invoice cleanup failed: {e}")
        raise
