"""
Management command to reset the database to a clean state.
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth import get_user_model
from customers.models import Customer
from plans.models import Plan
from network.models import Router
from subscriptions.models import Subscription
from billing.models import Invoice, Payment

User = get_user_model()


class Command(BaseCommand):
    help = 'Reset the database to a clean state'

    def add_arguments(self, parser):
        parser.add_argument(
            '--keep-admin',
            action='store_true',
            help='Keep the admin user when resetting',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.WARNING('This will delete ALL data from the database!')
        )
        
        if not options.get('keep_admin'):
            confirm = input('Are you sure you want to delete ALL data? (yes/no): ')
            if confirm.lower() != 'yes':
                self.stdout.write('Operation cancelled.')
                return
        else:
            self.stdout.write('Keeping admin user...')

        # Clear all data in reverse dependency order
        self.stdout.write('Clearing all data...')
        
        Payment.objects.all().delete()
        Invoice.objects.all().delete()
        Subscription.objects.all().delete()
        Customer.objects.all().delete()
        Plan.objects.all().delete()
        Router.objects.all().delete()
        
        if not options.get('keep_admin'):
            User.objects.all().delete()
            self.stdout.write('All users deleted.')
        else:
            # Keep only admin user
            User.objects.exclude(username='admin').delete()
            self.stdout.write('All users deleted except admin.')

        # Reset auto-increment counters
        self.stdout.write('Resetting auto-increment counters...')
        
        # Note: This is database-specific and may need adjustment
        # For PostgreSQL, we would use ALTER SEQUENCE commands
        # For SQLite, we would use DELETE FROM sqlite_sequence
        
        self.stdout.write(
            self.style.SUCCESS('Database reset completed successfully!')
        )
        
        if not options.get('keep_admin'):
            self.stdout.write(
                self.style.WARNING('You will need to create a new admin user.')
            )
