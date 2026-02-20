"""
Email services for the application.
"""
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending emails."""

    @staticmethod
    def send_invoice_reminder(invoice):
        """
        Send an invoice reminder email to the customer.

        Args:
            invoice: The invoice to send a reminder for.
        """
        try:
            subject = f"Invoice Reminder - {invoice.invoice_number}"

            # Simple text body
            message = (
                f"Dear {invoice.customer.name},\n\n"
                f"This is a reminder that your invoice {invoice.invoice_number} "
                f"for {invoice.total_amount} is due on {invoice.due_date}.\n\n"
                f"Please pay at your earliest convenience.\n\n"
                f"Thank you."
            )

            from_email = settings.DEFAULT_FROM_EMAIL
            recipient_list = [invoice.customer.email]

            send_mail(
                subject,
                message,
                from_email,
                recipient_list,
                fail_silently=False,
            )

            logger.info(
                f"Email sent successfully to {invoice.customer.email} for invoice {invoice.invoice_number}"
            )

        except Exception as e:
            logger.error(
                f"Failed to send email to {invoice.customer.email}: {str(e)}",
                exc_info=True
            )
            raise e
