from django.core.management.base import BaseCommand
from django.utils import timezone
from subscriptions.models import Subscription
from customers.models import Customer
from plans.models import Plan
from network.models import Router


class Command(BaseCommand):
    help = 'Create a test subscription for debugging'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='test_user',
            help='Username for the test subscription'
        )

    def handle(self, *args, **options):
        username = options['username']

        try:
            # Get or create a test customer
            customer, created = Customer.objects.get_or_create(
                email='test@example.com',
                defaults={
                    'name': 'Test Customer',
                    'phone': '+1234567890',
                    'address': '123 Test Street',
                    'city': 'Test City',
                    'state': 'Test State',
                    'postal_code': '12345',
                    'country': 'Test Country',
                    'status': 'active',
                }
            )

            if created:
                self.stdout.write(f'Created test customer: {customer.name}')
            else:
                self.stdout.write(f'Using existing customer: {customer.name}')

            # Get or create a test plan
            plan, created = Plan.objects.get_or_create(
                name='Test Plan',
                defaults={
                    'description': 'Test internet plan',
                    'download_speed': 100,
                    'upload_speed': 50,
                    'speed_unit': 'mbps',
                    'data_quota': 1000,
                    'quota_unit': 'gb',
                    'price': 50.00,
                    'setup_fee': 25.00,
                    'billing_cycle': 'monthly',
                    'is_active': True,
                }
            )

            if created:
                self.stdout.write(f'Created test plan: {plan.name}')
            else:
                self.stdout.write(f'Using existing plan: {plan.name}')

            # Get or create a test router
            router, created = Router.objects.get_or_create(
                name='Test Router',
                defaults={
                    'description': 'Test router for subscriptions',
                    'router_type': 'mikrotik',
                    'host': '192.168.1.1',
                    'api_port': 8728,
                    'ssh_port': 22,
                    'username': 'admin',
                    'use_tls': False,
                    'status': 'online',
                    'location': 'Test Location',
                    'snmp_community': 'public',
                    'snmp_port': 161,
                }
            )

            if created:
                self.stdout.write(f'Created test router: {router.name}')
            else:
                self.stdout.write(f'Using existing router: {router.name}')

            # Create the test subscription
            subscription, created = Subscription.objects.get_or_create(
                username=username,
                defaults={
                    'customer': customer,
                    'plan': plan,
                    'router': router,
                    'password': 'test123',
                    'access_method': 'pppoe',
                    'status': 'active',
                    'start_date': timezone.now().date(),
                    'monthly_fee': plan.price,
                    'setup_fee': plan.setup_fee,
                    'data_used': 0,
                }
            )

            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created test subscription: {subscription.username}'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f'Subscription with username "{username}" already exists'
                    )
                )

            # Display subscription details
            self.stdout.write('\n--- Subscription Details ---')
            self.stdout.write(f'ID: {subscription.id}')
            self.stdout.write(f'Customer: {subscription.customer.name}')
            self.stdout.write(f'Plan: {subscription.plan.name}')
            self.stdout.write(f'Router: {subscription.router.name}')
            self.stdout.write(f'Username: {subscription.username}')
            self.stdout.write(f'Status: {subscription.status}')
            self.stdout.write(f'Monthly Fee: ${subscription.monthly_fee}')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating test subscription: {str(e)}')
            )
