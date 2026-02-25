from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from customers.models import Customer
from plans.models import Plan
from subscriptions.models import Subscription
from billing.models import Invoice, Payment
from network.models import Router
from decimal import Decimal
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate database with sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')

        # Create admin user if not exists
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
            self.stdout.write('Created admin user')

        # Create plans
        plans_data = [
            {'name': 'Basic', 'download_speed': 10, 'upload_speed': 5, 'price': Decimal('29.99')},
            {'name': 'Standard', 'download_speed': 50, 'upload_speed': 25, 'price': Decimal('49.99')},
            {'name': 'Premium', 'download_speed': 100, 'upload_speed': 50, 'price': Decimal('79.99')},
        ]
        
        for plan_data in plans_data:
            plan, created = Plan.objects.get_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            if created:
                self.stdout.write(f'Created plan: {plan.name}')

        # Create customers
        customers_data = [
            {'name': 'John Doe', 'email': 'john@example.com', 'phone': '123-456-7890'},
            {'name': 'Jane Smith', 'email': 'jane@example.com', 'phone': '123-456-7891'},
            {'name': 'Bob Wilson', 'email': 'bob@example.com', 'phone': '123-456-7892'},
            {'name': 'Alice Johnson', 'email': 'alice@example.com', 'phone': '123-456-7893'},
            {'name': 'Charlie Brown', 'email': 'charlie@example.com', 'phone': '123-456-7894'},
        ]

        for customer_data in customers_data:
            customer, created = Customer.objects.get_or_create(
                email=customer_data['email'],
                defaults=customer_data
            )
            if created:
                self.stdout.write(f'Created customer: {customer.name}')

        # Create router
        router, created = Router.objects.get_or_create(
            name='Main Router',
            defaults={
                'host': '192.168.1.1',
                'api_port': 8729,
                'username': 'admin',
                'password': 'password',
                'snmp_community': 'public'
            }
        )
        if created:
            self.stdout.write('Created router')

        # Create subscriptions
        customers = Customer.objects.all()
        plans = Plan.objects.all()
        
        for customer in customers:
            if not Subscription.objects.filter(customer=customer).exists():
                from django.utils import timezone
                selected_plan = random.choice(plans)
                subscription = Subscription.objects.create(
                    customer=customer,
                    plan=selected_plan,
                    router=router,
                    username=f'user_{customer.id}',
                    password='password123',
                    status='active',
                    start_date=timezone.now().date(),
                    monthly_fee=selected_plan.price
                )
                self.stdout.write(f'Created subscription for {customer.name}')

        # Create invoices
        subscriptions = Subscription.objects.all()
        for subscription in subscriptions:
            for month in range(1, 4):  # 3 months of invoices
                from datetime import date, timedelta
                start_date = date.today() - timedelta(days=30*month)
                end_date = start_date + timedelta(days=30)
                due_date = end_date + timedelta(days=7)
                
                invoice = Invoice.objects.create(
                    customer=subscription.customer,
                    subscription=subscription,
                    invoice_number=f'INV-{subscription.id}-{month:02d}',
                    subtotal=subscription.plan.price,
                    total_amount=subscription.plan.price,
                    billing_period_start=start_date,
                    billing_period_end=end_date,
                    due_date=due_date,
                    status='paid'
                )
                
                # Create payment for invoice
                Payment.objects.create(
                    invoice=invoice,
                    customer=subscription.customer,
                    payment_number=f'PAY-{invoice.id}',
                    amount=invoice.total_amount,
                    payment_method='stripe',
                    status='completed'
                )
                
        self.stdout.write(f'Created invoices and payments')
        self.stdout.write(self.style.SUCCESS('Sample data created successfully!'))