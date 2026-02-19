import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending emails."""

    @staticmethod
    def send_invoice(invoice):
        """
        Send invoice email to customer.

        Args:
            invoice: Invoice instance
        """
        if not invoice.customer.email:
            logger.warning(f"Customer {invoice.customer.name} has no email address. Skipping invoice email.")
            return False

        subject = f"Invoice #{invoice.invoice_number} from ISP Admin"

        # Construct a simple text message
        message = (
            f"Dear {invoice.customer.name},\n\n"
            f"Here is your invoice for the period {invoice.billing_period_start} to {invoice.billing_period_end}.\n\n"
            f"Invoice Number: {invoice.invoice_number}\n"
            f"Amount Due: {invoice.total_amount}\n"
            f"Due Date: {invoice.due_date}\n\n"
            f"Please pay by the due date to avoid service interruption.\n\n"
            f"Thank you,\n"
            f"ISP Admin Team"
        )

        from_email = settings.EMAIL_HOST_USER or 'noreply@ispadmin.com'

        try:
            send_mail(
                subject,
                message,
                from_email,
                [invoice.customer.email],
                fail_silently=False,
            )
            logger.info(f"Sent invoice email to {invoice.customer.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send invoice email to {invoice.customer.email}: {str(e)}")
            return False

    @staticmethod
    def send_invoice_reminder(invoice):
        """
        Send invoice reminder email to customer.

        Args:
            invoice: Invoice instance
        """
        if not invoice.customer.email:
            logger.warning(f"Customer {invoice.customer.name} has no email address. Skipping reminder email.")
            return False

        subject = f"Reminder: Invoice #{invoice.invoice_number} is Due Soon"

        message = (
            f"Dear {invoice.customer.name},\n\n"
            f"This is a reminder that your invoice #{invoice.invoice_number} is due on {invoice.due_date}.\n\n"
            f"Amount Due: {invoice.total_amount}\n\n"
            f"Please ensure payment is made by the due date.\n\n"
            f"Thank you,\n"
            f"ISP Admin Team"
        )

        from_email = settings.EMAIL_HOST_USER or 'noreply@ispadmin.com'

        try:
            send_mail(
                subject,
                message,
                from_email,
                [invoice.customer.email],
                fail_silently=False,
            )
            logger.info(f"Sent invoice reminder email to {invoice.customer.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send invoice reminder email to {invoice.customer.email}: {str(e)}")
            return False
