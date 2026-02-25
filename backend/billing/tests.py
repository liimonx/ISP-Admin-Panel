from decimal import Decimal
from datetime import date, timedelta
import time

from django.test import TestCase
from django.urls import reverse
from django.test.utils import CaptureQueriesContext
from django.db import connection
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from plans.models import Plan
from billing.services import BillingService
from billing.models import Payment, Invoice
from customers.models import Customer

User = get_user_model()

class BillingServiceTest(TestCase):

    def setUp(self):
        self.monthly_plan = Plan.objects.create(
            name="Monthly Plan",
            price=Decimal("30.00"),
            billing_cycle=Plan.BillingCycle.MONTHLY,
            download_speed=10,
            upload_speed=10
        )
        self.quarterly_plan = Plan.objects.create(
            name="Quarterly Plan",
            price=Decimal("90.00"),
            billing_cycle=Plan.BillingCycle.QUARTERLY,
            download_speed=10,
            upload_speed=10
        )
        self.yearly_plan = Plan.objects.create(
            name="Yearly Plan",
            price=Decimal("365.00"),
            billing_cycle=Plan.BillingCycle.YEARLY,
            download_speed=10,
            upload_speed=10
        )

    def test_calculate_prorated_amount_monthly(self):
        # 15 days usage (inclusive)
        start_date = date(2023, 1, 1)
        end_date = date(2023, 1, 15)
        # Daily rate = 30.00 / 30 = 1.00
        # Expected = 1.00 * 15 = 15.00
        expected_amount = Decimal("15.00")
        calculated_amount = BillingService.calculate_prorated_amount(
            self.monthly_plan, start_date, end_date
        )
        self.assertEqual(calculated_amount, expected_amount)

    def test_calculate_prorated_amount_quarterly(self):
        # 45 days usage (inclusive)
        start_date = date(2023, 1, 1)
        end_date = date(2023, 2, 14)
        # Daily rate = 90.00 / 90 = 1.00
        # Expected = 1.00 * 45 = 45.00
        expected_amount = Decimal("45.00")
        calculated_amount = BillingService.calculate_prorated_amount(
            self.quarterly_plan, start_date, end_date
        )
        self.assertEqual(calculated_amount, expected_amount)

    def test_calculate_prorated_amount_yearly(self):
        # 180 days usage (inclusive)
        start_date = date(2023, 1, 1)
        end_date = start_date + timedelta(days=179)
        # Daily rate = 365.00 / 365 = 1.00
        # Expected = 1.00 * 180 = 180.00
        expected_amount = Decimal("180.00")
        calculated_amount = BillingService.calculate_prorated_amount(
            self.yearly_plan, start_date, end_date
        )
        self.assertEqual(calculated_amount, expected_amount)

    def test_calculate_prorated_amount_single_day(self):
        # 1 day usage
        start_date = date(2023, 1, 1)
        end_date = date(2023, 1, 1)
        # Daily rate = 30.00 / 30 = 1.00
        # Expected = 1.00 * 1 = 1.00
        expected_amount = Decimal("1.00")
        calculated_amount = BillingService.calculate_prorated_amount(
            self.monthly_plan, start_date, end_date
        )
        self.assertEqual(calculated_amount, expected_amount)

    def test_calculate_prorated_amount_rounding(self):
        # Test with a price that results in repeating decimals
        # Price 100.00, monthly (30 days)
        # Daily rate = 100 / 30 = 3.3333...
        # 10 days usage = 33.3333... -> 33.33
        plan = Plan.objects.create(
            name="Odd Price Plan",
            price=Decimal("100.00"),
            billing_cycle=Plan.BillingCycle.MONTHLY,
            download_speed=10,
            upload_speed=10
        )
        start_date = date(2023, 1, 1)
        end_date = date(2023, 1, 10) # 10 days inclusive

        expected_amount = Decimal("33.33")
        calculated_amount = BillingService.calculate_prorated_amount(
            plan, start_date, end_date
        )
        self.assertEqual(calculated_amount, expected_amount)

    def test_calculate_prorated_amount_full_period_monthly(self):
        # 30 days usage
        start_date = date(2023, 1, 1)
        end_date = date(2023, 1, 30)
        # Daily rate = 30.00 / 30 = 1.00
        # Expected = 1.00 * 30 = 30.00
        expected_amount = Decimal("30.00")
        calculated_amount = BillingService.calculate_prorated_amount(
            self.monthly_plan, start_date, end_date
        )
        self.assertEqual(calculated_amount, expected_amount)


class PaymentStatsPerformanceTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testadmin',
            password='password123',
            email='testadmin@example.com'
        )
        self.client.force_authenticate(user=self.user)

        self.customer = Customer.objects.create(
            name="Test Customer",
            email="customer@example.com",
            phone="+8801711223344",
            address="Test Address",
            city="Dhaka",
            state="Dhaka",
            postal_code="1200",
            country="Bangladesh"
        )

        # Create invoices and payments
        # We need data for the last 30 days
        now = timezone.now()
        for i in range(30):
            date = now - timedelta(days=i)
            # Create 2 payments per day
            for j in range(2):
                invoice = Invoice.objects.create(
                    customer=self.customer,
                    invoice_number=f"INV-{i}-{j}",
                    billing_period_start=date.date(),
                    billing_period_end=date.date() + timedelta(days=30),
                    subtotal=Decimal('100.00'),
                    total_amount=Decimal('100.00'),
                    due_date=date.date() + timedelta(days=7)
                )
                # Override created_at for invoice
                invoice.created_at = date
                invoice.save()

                payment = Payment.objects.create(
                    invoice=invoice,
                    customer=self.customer,
                    payment_number=f"PAY-{i}-{j}",
                    amount=Decimal('100.00'),
                    payment_method=Payment.PaymentMethod.CASH,
                    status=Payment.Status.COMPLETED if j % 2 == 0 else Payment.Status.PENDING
                )
                # Override created_at for payment
                payment.created_at = date
                payment.save()

    def test_payment_stats_performance(self):
        url = reverse('billing:payment_stats')

        # Warm up
        self.client.get(url)

        with CaptureQueriesContext(connection) as ctx:
            start_time = time.time()
            response = self.client.get(url)
            end_time = time.time()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # print(f"\nQuery count: {len(ctx.captured_queries)}")
        # print(f"Execution time: {end_time - start_time:.4f} seconds")

        # Optimized version should have very few queries.
        # 1 for auth, 1 for stats (aggregation), maybe 1-2 others.
        self.assertLess(len(ctx.captured_queries), 15, "Expected < 15 queries after optimization")

        # Verify data correctness
        data = response.data['data']['daily_trends']
        self.assertEqual(len(data), 30)

        # In my test, I created data for 30 days.
        # Let's check a few days.
        for day_stat in data:
            self.assertEqual(day_stat['payment_count'], 2)
            self.assertEqual(day_stat['successful_count'], 1)
            # Use Decimal comparison to be robust against SQLite/Postgres differences in Sum return type stringification
            self.assertEqual(Decimal(day_stat['total_amount']), Decimal('200.00'))
