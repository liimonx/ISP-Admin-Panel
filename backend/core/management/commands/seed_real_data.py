"""
Management command to seed the database with realistic data for production use.
"""
import random
from decimal import Decimal
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from customers.models import Customer
from plans.models import Plan
from network.models import Router
from subscriptions.models import Subscription
from billing.models import Invoice, Payment
from accounts.models import User

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with realistic data for production use'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )
        parser.add_argument(
            '--customers',
            type=int,
            default=50,
            help='Number of customers to create (default: 50)',
        )
        parser.add_argument(
            '--subscriptions',
            type=int,
            default=100,
            help='Number of subscriptions to create (default: 100)',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Starting to seed database with real data...')
        )

        if options['clear']:
            self.clear_data()

        # Create admin user if not exists
        self.create_admin_user()
        
        # Create realistic plans
        self.create_plans()
        
        # Create routers
        self.create_routers()
        
        # Create customers
        self.create_customers(options['customers'])
        
        # Create subscriptions
        self.create_subscriptions(options['subscriptions'])
        
        # Create invoices and payments
        self.create_billing_data()

        self.stdout.write(
            self.style.SUCCESS('Successfully seeded database with real data!')
        )

    def clear_data(self):
        """Clear existing data (except admin user)."""
        self.stdout.write('Clearing existing data...')
        
        # Clear in reverse dependency order
        Payment.objects.all().delete()
        Invoice.objects.all().delete()
        Subscription.objects.all().delete()
        Customer.objects.all().delete()
        Plan.objects.all().delete()
        Router.objects.all().delete()
        
        # Keep admin user but clear other users
        User.objects.exclude(username='admin').delete()
        
        self.stdout.write(self.style.WARNING('Existing data cleared.'))

    def create_admin_user(self):
        """Create admin user if not exists."""
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@isp.com',
                password='changeme123!',
                first_name='Admin',
                last_name='User'
            )
            self.stdout.write('Created admin user.')
        else:
            self.stdout.write('Admin user already exists.')

    def create_plans(self):
        """Create realistic internet plans."""
        plans_data = [
            {
                'name': 'Basic 10 Mbps',
                'description': 'Perfect for light browsing and email',
                'download_speed': Decimal('10.00'),
                'upload_speed': Decimal('5.00'),
                'speed_unit': 'mbps',
                'data_quota': Decimal('50.00'),
                'quota_unit': 'gb',
                'price': Decimal('500.00'),
                'setup_fee': Decimal('0.00'),
                'is_active': True,
                'is_featured': False,
                'is_popular': False,
            },
            {
                'name': 'Standard 25 Mbps',
                'description': 'Great for streaming and online gaming',
                'download_speed': Decimal('25.00'),
                'upload_speed': Decimal('10.00'),
                'speed_unit': 'mbps',
                'data_quota': Decimal('100.00'),
                'quota_unit': 'gb',
                'price': Decimal('800.00'),
                'setup_fee': Decimal('500.00'),
                'is_active': True,
                'is_featured': True,
                'is_popular': False,
            },
            {
                'name': 'Premium 50 Mbps',
                'description': 'Ideal for heavy usage and multiple devices',
                'download_speed': Decimal('50.00'),
                'upload_speed': Decimal('20.00'),
                'speed_unit': 'mbps',
                'data_quota': Decimal('200.00'),
                'quota_unit': 'gb',
                'price': Decimal('1200.00'),
                'setup_fee': Decimal('1000.00'),
                'is_active': True,
                'is_featured': False,
                'is_popular': True,
            },
            {
                'name': 'Business 100 Mbps',
                'description': 'Professional grade for business use',
                'download_speed': Decimal('100.00'),
                'upload_speed': Decimal('50.00'),
                'speed_unit': 'mbps',
                'data_quota': Decimal('500.00'),
                'quota_unit': 'gb',
                'price': Decimal('2000.00'),
                'setup_fee': Decimal('2000.00'),
                'is_active': True,
                'is_featured': True,
                'is_popular': False,
            },
            {
                'name': 'Unlimited 200 Mbps',
                'description': 'Unlimited data with premium speeds',
                'download_speed': Decimal('200.00'),
                'upload_speed': Decimal('100.00'),
                'speed_unit': 'mbps',
                'data_quota': None,
                'quota_unit': 'unlimited',
                'price': Decimal('3500.00'),
                'setup_fee': Decimal('3000.00'),
                'is_active': True,
                'is_featured': True,
                'is_popular': True,
            },
        ]

        for plan_data in plans_data:
            plan, created = Plan.objects.get_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            if created:
                self.stdout.write(f'Created plan: {plan.name}')

    def create_routers(self):
        """Create realistic routers."""
        routers_data = [
            {
                'name': 'Main Router - Dhaka',
                'description': 'Primary MikroTik router for Dhaka region',
                'router_type': 'mikrotik',
                'host': '192.168.1.1',
                'api_port': 8729,
                'ssh_port': 22,
                'username': 'admin',
                'use_tls': True,
                'status': 'online',
                'location': 'Dhaka Main Office',
                'coordinates': '23.8103,90.4125',
                'snmp_community': 'public',
                'snmp_port': 161,
                'notes': 'Primary router for customer connections',
            },
            {
                'name': 'Backup Router - Dhaka',
                'description': 'Backup MikroTik router for redundancy',
                'router_type': 'mikrotik',
                'host': '192.168.1.2',
                'api_port': 8729,
                'ssh_port': 22,
                'username': 'admin',
                'use_tls': True,
                'status': 'online',
                'location': 'Dhaka Backup Office',
                'coordinates': '23.8103,90.4125',
                'snmp_community': 'public',
                'snmp_port': 161,
                'notes': 'Backup router for failover',
            },
            {
                'name': 'Chittagong Router',
                'description': 'Regional router for Chittagong area',
                'router_type': 'mikrotik',
                'host': '192.168.2.1',
                'api_port': 8729,
                'ssh_port': 22,
                'username': 'admin',
                'use_tls': True,
                'status': 'online',
                'location': 'Chittagong Office',
                'coordinates': '22.3569,91.7832',
                'snmp_community': 'public',
                'snmp_port': 161,
                'notes': 'Regional router for Chittagong customers',
            },
        ]

        for router_data in routers_data:
            router, created = Router.objects.get_or_create(
                name=router_data['name'],
                defaults=router_data
            )
            if created:
                self.stdout.write(f'Created router: {router.name}')

    def create_customers(self, count):
        """Create realistic customers."""
        cities = [
            'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna',
            'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Narayanganj'
        ]
        
        first_names = [
            'Ahmed', 'Hassan', 'Rahman', 'Ali', 'Khan', 'Hossain', 'Islam',
            'Uddin', 'Rahman', 'Chowdhury', 'Miah', 'Sarkar', 'Mondal',
            'Biswas', 'Das', 'Roy', 'Dutta', 'Ghosh', 'Banerjee', 'Mukherjee'
        ]
        
        last_names = [
            'Ahmed', 'Hassan', 'Rahman', 'Ali', 'Khan', 'Hossain', 'Islam',
            'Uddin', 'Rahman', 'Chowdhury', 'Miah', 'Sarkar', 'Mondal',
            'Biswas', 'Das', 'Roy', 'Dutta', 'Ghosh', 'Banerjee', 'Mukherjee'
        ]

        for i in range(count):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            name = f"{first_name} {last_name}"
            email = f"{first_name.lower()}.{last_name.lower()}{i+1}@email.com"
            phone = f"+8801{random.randint(300000000, 999999999)}"
            city = random.choice(cities)
            status = random.choices(
                ['active', 'inactive', 'suspended'],
                weights=[80, 15, 5]
            )[0]

            customer, created = Customer.objects.get_or_create(
                email=email,
                defaults={
                    'name': name,
                    'phone': phone,
                    'city': city,
                    'status': status,
                }
            )
            
            if created and (i + 1) % 10 == 0:
                self.stdout.write(f'Created {i + 1} customers...')

        self.stdout.write(f'Created {count} customers.')

    def create_subscriptions(self, count):
        """Create realistic subscriptions."""
        customers = list(Customer.objects.all())
        plans = list(Plan.objects.all())
        routers = list(Router.objects.all())
        
        if not customers or not plans or not routers:
            self.stdout.write(
                self.style.ERROR('No customers, plans, or routers found. Please create them first.')
            )
            return

        status_choices = ['active', 'inactive', 'suspended', 'cancelled', 'pending']
        access_methods = ['pppoe', 'static_ip', 'dhcp']
        
        for i in range(count):
            customer = random.choice(customers)
            plan = random.choice(plans)
            router = random.choice(routers)
            
            # Generate unique username
            username = f"user{random.randint(1000, 9999)}{i+1}"
            while Subscription.objects.filter(username=username).exists():
                username = f"user{random.randint(1000, 9999)}{i+1}"
            
            password = f"pass{random.randint(100000, 999999)}"
            access_method = random.choice(access_methods)
            status = random.choices(
                status_choices,
                weights=[60, 10, 5, 5, 20]
            )[0]
            
            # Generate dates
            start_date = timezone.now().date() - timedelta(days=random.randint(0, 365))
            end_date = None
            if random.random() < 0.3:  # 30% chance of having end date
                end_date = start_date + timedelta(days=random.randint(30, 365))
            
            # Generate network configuration based on access method
            static_ip = None
            mac_address = None
            
            if access_method == 'static_ip':
                static_ip = f"192.168.{random.randint(1, 255)}.{random.randint(10, 254)}"
            elif access_method == 'dhcp':
                mac_address = ':'.join([f"{random.randint(0, 255):02x}" for _ in range(6)])
            
            # Generate usage data for active subscriptions
            data_used = Decimal('0.00')
            if status == 'active':
                data_used = Decimal(str(random.uniform(0, float(plan.data_quota or 100))))
            
            subscription = Subscription.objects.create(
                customer=customer,
                plan=plan,
                router=router,
                username=username,
                password=password,
                access_method=access_method,
                static_ip=static_ip,
                mac_address=mac_address,
                status=status,
                start_date=start_date,
                end_date=end_date,
                monthly_fee=plan.price,
                setup_fee=plan.setup_fee,
                data_used=data_used,
                notes=f"Generated subscription for {customer.name}",
            )
            
            if (i + 1) % 20 == 0:
                self.stdout.write(f'Created {i + 1} subscriptions...')

        self.stdout.write(f'Created {count} subscriptions.')

    def create_billing_data(self):
        """Create realistic invoices and payments."""
        subscriptions = Subscription.objects.filter(status='active')
        
        for subscription in subscriptions:
            # Create invoices for the last 6 months
            for month_offset in range(6):
                invoice_date = timezone.now().date().replace(day=1) - timedelta(days=30 * month_offset)
                due_date = invoice_date + timedelta(days=30)
                
                # Random chance of being paid
                is_paid = random.random() < 0.85  # 85% chance of being paid
                status = 'paid' if is_paid else 'pending'
                
                # Generate invoice number
                invoice_number = f"INV-{subscription.customer.id:04d}-{invoice_date.strftime('%Y%m')}-{random.randint(1000, 9999)}"
                
                # Calculate amounts
                subtotal = subscription.monthly_fee
                tax_amount = subtotal * Decimal('0.15')  # 15% tax
                total_amount = subtotal + tax_amount
                paid_amount = total_amount if is_paid else Decimal('0.00')
                
                invoice = Invoice.objects.create(
                    customer=subscription.customer,
                    subscription=subscription,
                    invoice_number=invoice_number,
                    invoice_type='monthly',
                    billing_period_start=invoice_date,
                    billing_period_end=invoice_date + timedelta(days=29),
                    subtotal=subtotal,
                    tax_amount=tax_amount,
                    total_amount=total_amount,
                    paid_amount=paid_amount,
                    due_date=due_date,
                    status=status,
                    notes=f"Monthly invoice for {subscription.plan.name}",
                )
                
                # Create payment if invoice is paid
                if is_paid:
                    payment_date = timezone.now().date() - timedelta(days=random.randint(0, 30))
                    payment_number = f"PAY-{subscription.customer.id:04d}-{payment_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
                    Payment.objects.create(
                        invoice=invoice,
                        customer=subscription.customer,
                        payment_number=payment_number,
                        amount=total_amount,
                        payment_method=random.choice(['cash', 'bank_transfer', 'bkash']),
                        payment_date=payment_date,
                        status='completed',
                        notes=f"Payment for invoice #{invoice.invoice_number}",
                    )

        self.stdout.write('Created billing data (invoices and payments).')
