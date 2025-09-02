import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from customers.models import Customer
from plans.models import Plan
from network.models import Router
from subscriptions.models import Subscription
from billing.models import Invoice
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Set up initial ISP data for development/testing'

    def handle(self, *args, **options):
        self.stdout.write('Setting up initial ISP data...')

        # Create admin user
        if not User.objects.filter(username='admin').exists():
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@isp.com',
                password=os.environ.get('ADMIN_PASSWORD', 'changeme123!'),
                first_name='Admin',
                last_name='User',
                role='admin'
            )
            self.stdout.write(f'Created admin user: {admin_user.username}')

        # Create support user
        if not User.objects.filter(username='support').exists():
            support_user = User.objects.create_user(
                username='support',
                email='support@isp.com',
                password=os.environ.get('SUPPORT_PASSWORD', 'changeme123!'),
                first_name='Support',
                last_name='Staff',
                role='support'
            )
            self.stdout.write(f'Created support user: {support_user.username}')

        # Create accountant user
        if not User.objects.filter(username='accountant').exists():
            accountant_user = User.objects.create_user(
                username='accountant',
                email='accountant@isp.com',
                password=os.environ.get('ACCOUNTANT_PASSWORD', 'changeme123!'),
                first_name='Accountant',
                last_name='User',
                role='accountant'
            )
            self.stdout.write(f'Created accountant user: {accountant_user.username}')

        # Create sample customers
        customers_data = [
            {
                'name': 'John Doe',
                'email': 'john.doe@email.com',
                'phone': '+8801712345678',
                'address': '123 Main Street',
                'city': 'Dhaka',
                'state': 'Dhaka',
                'postal_code': '1200',
                'country': 'Bangladesh'
            },
            {
                'name': 'Jane Smith',
                'email': 'jane.smith@email.com',
                'phone': '+8801812345678',
                'address': '456 Oak Avenue',
                'city': 'Chittagong',
                'state': 'Chittagong',
                'postal_code': '4000',
                'country': 'Bangladesh'
            },
            {
                'name': 'ABC Company Ltd',
                'email': 'info@abc.com',
                'phone': '+8801912345678',
                'address': '789 Business Park',
                'city': 'Sylhet',
                'state': 'Sylhet',
                'postal_code': '3100',
                'country': 'Bangladesh',
                'company_name': 'ABC Company Ltd',
                'tax_id': 'TAX123456'
            }
        ]

        for customer_data in customers_data:
            customer, created = Customer.objects.get_or_create(
                email=customer_data['email'],
                defaults=customer_data
            )
            if created:
                self.stdout.write(f'Created customer: {customer.name}')

        # Create sample plans
        plans_data = [
            {
                'name': 'Basic 10 Mbps',
                'description': 'Basic internet plan for light users',
                'download_speed': Decimal('10.00'),
                'upload_speed': Decimal('5.00'),
                'speed_unit': 'mbps',
                'data_quota': Decimal('50.00'),
                'quota_unit': 'gb',
                'price': Decimal('500.00'),
                'setup_fee': Decimal('1000.00'),
                'is_active': True,
                'features': ['Email support', 'Basic speed']
            },
            {
                'name': 'Standard 25 Mbps',
                'description': 'Standard plan for regular users',
                'download_speed': Decimal('25.00'),
                'upload_speed': Decimal('10.00'),
                'speed_unit': 'mbps',
                'data_quota': Decimal('100.00'),
                'quota_unit': 'gb',
                'price': Decimal('800.00'),
                'setup_fee': Decimal('1000.00'),
                'is_active': True,
                'is_featured': True,
                'features': ['Priority support', 'HD streaming', 'Gaming optimized']
            },
            {
                'name': 'Premium 50 Mbps',
                'description': 'Premium plan for heavy users',
                'download_speed': Decimal('50.00'),
                'upload_speed': Decimal('20.00'),
                'speed_unit': 'mbps',
                'data_quota': Decimal('200.00'),
                'quota_unit': 'gb',
                'price': Decimal('1200.00'),
                'setup_fee': Decimal('1000.00'),
                'is_active': True,
                'is_popular': True,
                'features': ['24/7 support', '4K streaming', 'Unlimited gaming']
            },
            {
                'name': 'Unlimited 100 Mbps',
                'description': 'Unlimited data plan for power users',
                'download_speed': Decimal('100.00'),
                'upload_speed': Decimal('50.00'),
                'speed_unit': 'mbps',
                'quota_unit': 'unlimited',
                'price': Decimal('2000.00'),
                'setup_fee': Decimal('1500.00'),
                'is_active': True,
                'features': ['Unlimited data', 'Premium support', 'All features included']
            }
        ]

        for plan_data in plans_data:
            plan, created = Plan.objects.get_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            if created:
                self.stdout.write(f'Created plan: {plan.name}')

        # Create sample router
        if not Router.objects.filter(name='Main Router').exists():
            router = Router.objects.create(
                name='Main Router',
                description='Main MikroTik router for customer connections',
                router_type='mikrotik',
                host='192.168.1.1',
                api_port=8729,
                username='admin',
                password=os.environ.get('ROUTER_PASSWORD', 'RouterPass123!'),
                use_tls=True,
                status='online',
                location='Main Office',
                snmp_community='public'
            )
            self.stdout.write(f'Created router: {router.name}')

        self.stdout.write(
            self.style.SUCCESS('Successfully set up initial ISP data!')
        )
        self.stdout.write('\n⚠️  Default passwords set - CHANGE IN PRODUCTION!')
        self.stdout.write('Set environment variables: ADMIN_PASSWORD, SUPPORT_PASSWORD, ACCOUNTANT_PASSWORD, ROUTER_PASSWORD')
