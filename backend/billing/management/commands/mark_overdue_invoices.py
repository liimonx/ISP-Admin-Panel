"""
Management command to mark invoices as overdue.
"""
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from datetime import datetime, timedelta
from billing.services import BillingService
from billing.models import Invoice
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Mark invoices as overdue if past due date'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days-past-due',
            type=int,
            default=0,
            help='Only mark invoices overdue that are X days past due (default: 0)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually updating invoices',
        )
        parser.add_argument(
            '--send-notifications',
            action='store_true',
            help='Send overdue notifications to customers',
        )

    def handle(self, *args, **options):
        days_past_due = options['days_past_due']
        dry_run = options['dry_run']
        send_notifications = options['send_notifications']

        # Calculate cutoff date
        cutoff_date = timezone.now().date() - timedelta(days=days_past_due)

        self.stdout.write(f'Marking invoices overdue with due date before: {cutoff_date}')

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No invoices will be updated'))

        try:
            # Find invoices to mark as overdue
            overdue_invoices = Invoice.objects.filter(
                status=Invoice.Status.PENDING,
                due_date__lt=cutoff_date
            ).select_related('customer')

            if not overdue_invoices.exists():
                self.stdout.write(self.style.SUCCESS('No invoices to mark as overdue'))
                return

            self.stdout.write(f'Found {overdue_invoices.count()} invoices to mark as overdue:')

            total_amount = 0
            for invoice in overdue_invoices:
                days_overdue = (timezone.now().date() - invoice.due_date).days
                total_amount += invoice.balance_due

                self.stdout.write(
                    f'  - {invoice.invoice_number} ({invoice.customer.name}): '
                    f'${invoice.balance_due} - {days_overdue} days overdue'
                )

            self.stdout.write(f'\nTotal overdue amount: ${total_amount}')

            if not dry_run:
                # Mark invoices as overdue
                updated_count = BillingService.mark_overdue_invoices()

                self.stdout.write(
                    self.style.SUCCESS(f'Successfully marked {updated_count} invoices as overdue')
                )

                # Send notifications if requested
                if send_notifications:
                    self.stdout.write('Sending overdue notifications...')
                    try:
                        sent_count = BillingService.send_overdue_notifications()
                        self.stdout.write(
                            self.style.SUCCESS(f'Sent {sent_count} overdue notifications')
                        )
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'Failed to send notifications: {str(e)}')
                        )

                # Log summary
                logger.info(
                    f'Marked {updated_count} invoices as overdue, total amount: ${total_amount}'
                )

        except Exception as e:
            logger.error(f'Error marking overdue invoices: {str(e)}', exc_info=True)
            raise CommandError(f'Failed to mark overdue invoices: {str(e)}')
