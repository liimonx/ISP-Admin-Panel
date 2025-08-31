"""
Management command to generate monthly invoices for all active subscriptions.
"""
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from datetime import datetime
from billing.services import BillingService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Generate monthly invoices for active subscriptions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Billing date in YYYY-MM-DD format (default: today)',
        )
        parser.add_argument(
            '--customer-ids',
            type=str,
            help='Comma-separated list of customer IDs to generate invoices for',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually creating invoices',
        )

    def handle(self, *args, **options):
        # Parse billing date
        billing_date = timezone.now().date()
        if options['date']:
            try:
                billing_date = datetime.strptime(options['date'], '%Y-%m-%d').date()
            except ValueError:
                raise CommandError('Invalid date format. Use YYYY-MM-DD')

        # Parse customer IDs
        customer_ids = None
        if options['customer_ids']:
            try:
                customer_ids = [int(id.strip()) for id in options['customer_ids'].split(',')]
            except ValueError:
                raise CommandError('Invalid customer IDs format')

        self.stdout.write(f'Generating invoices for billing date: {billing_date}')

        if customer_ids:
            self.stdout.write(f'Target customers: {customer_ids}')
        else:
            self.stdout.write('Target: All active subscriptions')

        if options['dry_run']:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No invoices will be created'))

        try:
            if options['dry_run']:
                # Just show what would be done
                from subscriptions.models import Subscription
                from billing.models import Invoice

                subscriptions_query = Subscription.objects.filter(status='active')
                if customer_ids:
                    subscriptions_query = subscriptions_query.filter(customer_id__in=customer_ids)

                subscriptions = subscriptions_query.select_related('customer', 'plan')

                self.stdout.write(f'\nWould generate invoices for {subscriptions.count()} subscriptions:')

                for subscription in subscriptions:
                    existing = Invoice.objects.filter(
                        subscription=subscription,
                        billing_period_start=billing_date
                    ).exists()

                    status = "SKIP (exists)" if existing else "CREATE"
                    self.stdout.write(
                        f'  - {subscription.customer.name} ({subscription.plan.name}): {status}'
                    )
            else:
                # Actually generate invoices
                result = BillingService.bulk_generate_invoices(customer_ids, billing_date)

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully generated {result["summary"]["generated_count"]} invoices'
                    )
                )

                if result['errors']:
                    self.stdout.write(
                        self.style.WARNING(f'{len(result["errors"])} errors occurred:')
                    )
                    for error in result['errors']:
                        self.stdout.write(f'  - {error["customer_name"]}: {error["error"]}')

                # Summary
                summary = result['summary']
                self.stdout.write(f'\nSummary:')
                self.stdout.write(f'  Total subscriptions: {summary["total_subscriptions"]}')
                self.stdout.write(f'  Invoices generated: {summary["generated_count"]}')
                self.stdout.write(f'  Errors: {summary["error_count"]}')

        except Exception as e:
            logger.error(f'Error generating monthly invoices: {str(e)}', exc_info=True)
            raise CommandError(f'Failed to generate invoices: {str(e)}')
