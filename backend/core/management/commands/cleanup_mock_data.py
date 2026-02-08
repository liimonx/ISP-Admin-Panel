"""
Management command to remove mock/sample data from the database.
"""
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = 'Remove mock/sample data from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion of mock data',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'This will delete mock/sample data from the database.\n'
                    'Run with --confirm to proceed.'
                )
            )
            return

        with transaction.atomic():
            deleted_counts = {}

            # Delete mock customers
            from customers.models import Customer
            mock_customers = Customer.objects.filter(
                email__icontains='example.com'
            )
            deleted_counts['customers'] = mock_customers.count()
            mock_customers.delete()

            # Delete mock subscriptions
            from subscriptions.models import Subscription
            mock_subscriptions = Subscription.objects.filter(
                username__startswith='user'
            )
            deleted_counts['subscriptions'] = mock_subscriptions.count()
            mock_subscriptions.delete()

            # Delete mock invoices
            from billing.models import Invoice
            mock_invoices = Invoice.objects.filter(
                invoice_number__startswith='INV-'
            )
            deleted_counts['invoices'] = mock_invoices.count()
            mock_invoices.delete()

            # Delete mock payments
            from billing.models import Payment
            mock_payments = Payment.objects.filter(
                external_id__startswith='pay_'
            )
            deleted_counts['payments'] = mock_payments.count()
            mock_payments.delete()

            # Keep the main router but remove other mock routers
            from network.models import Router
            mock_routers = Router.objects.exclude(
                host='103.115.252.60'
            ).filter(
                name__icontains='test'
            )
            deleted_counts['routers'] = mock_routers.count()
            mock_routers.delete()

            # Delete router sessions
            from network.models import RouterSession
            deleted_counts['router_sessions'] = RouterSession.objects.count()
            RouterSession.objects.all().delete()

            # Delete router metrics
            try:
                from monitoring.models import RouterMetric
                deleted_counts['router_metrics'] = RouterMetric.objects.count()
                RouterMetric.objects.all().delete()
            except (ImportError, Exception):
                deleted_counts['router_metrics'] = 0

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Mock data cleanup completed:\n'
                f'  - Customers: {deleted_counts.get("customers", 0)}\n'
                f'  - Subscriptions: {deleted_counts.get("subscriptions", 0)}\n'
                f'  - Invoices: {deleted_counts.get("invoices", 0)}\n'
                f'  - Payments: {deleted_counts.get("payments", 0)}\n'
                f'  - Routers: {deleted_counts.get("routers", 0)}\n'
                f'  - Router Sessions: {deleted_counts.get("router_sessions", 0)}\n'
                f'  - Router Metrics: {deleted_counts.get("router_metrics", 0)}'
            )
        )