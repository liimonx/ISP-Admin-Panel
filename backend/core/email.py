import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_invoice(invoice):
        """
        Send invoice to customer via email.
        """
        try:
            subject = f"Invoice #{invoice.invoice_number} from ISP Admin"
            from_email = settings.DEFAULT_FROM_EMAIL
            to_email = [invoice.customer.email]

            context = {
                'invoice': invoice,
                'customer': invoice.customer,
                'company_name': getattr(settings, 'COMPANY_NAME', 'ISP Admin'),
            }

            html_content = render_to_string('billing/email/invoice.html', context)
            text_content = strip_tags(html_content)

            msg = EmailMultiAlternatives(subject, text_content, from_email, to_email)
            msg.attach_alternative(html_content, "text/html")
            msg.send()

            logger.info(f"Invoice email sent to {invoice.customer.email} for invoice {invoice.invoice_number}")
            return True
        except Exception as e:
            logger.error(f"Failed to send invoice email: {str(e)}", exc_info=True)
            return False

    @staticmethod
    def send_invoice_reminder(invoice):
        """
        Send invoice reminder to customer via email.
        """
        try:
            subject = f"Reminder: Invoice #{invoice.invoice_number} Due Soon"
            from_email = settings.DEFAULT_FROM_EMAIL
            to_email = [invoice.customer.email]

            context = {
                'invoice': invoice,
                'customer': invoice.customer,
                'company_name': getattr(settings, 'COMPANY_NAME', 'ISP Admin'),
            }

            html_content = render_to_string('billing/email/invoice_reminder.html', context)
            text_content = strip_tags(html_content)

            msg = EmailMultiAlternatives(subject, text_content, from_email, to_email)
            msg.attach_alternative(html_content, "text/html")
            msg.send()

            logger.info(f"Invoice reminder email sent to {invoice.customer.email} for invoice {invoice.invoice_number}")
            return True
        except Exception as e:
            logger.error(f"Failed to send invoice reminder email: {str(e)}", exc_info=True)
            return False
