from decimal import Decimal
from datetime import date, timedelta
import random

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import connection
from django.test.utils import CaptureQueriesContext

from dateutil.relativedelta import relativedelta
from rest_framework.test import APIClient
from rest_framework import status

from plans.models import Plan
from billing.services import BillingService
from billing.models import Invoice
from customers.models import Customer


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


class InvoiceStatsPerformanceTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create user and authenticate
        User = get_user_model()
        self.user = User.objects.create_user(username='testuser', password='password', email='test@example.com')
        self.client.force_authenticate(user=self.user)

        # Create customer
        self.customer = Customer.objects.create(
            name="Test Customer",
            email="test@example.com",
            phone="1234567890",
            address="Test Address"
        )

        # Create invoices for the last 12 months
        now = timezone.now()
        for i in range(12):
            month_date = now - relativedelta(months=i)
            # Create a paid invoice
            inv1 = Invoice.objects.create(
                customer=self.customer,
                invoice_number=f"INV-{i}-PAID",
                billing_period_start=month_date.date(),
                billing_period_end=(month_date + relativedelta(months=1)).date(),
                due_date=(month_date + relativedelta(days=7)).date(),
                subtotal=Decimal('100.00'),
                total_amount=Decimal('100.00'),
                paid_amount=Decimal('100.00'),
                status='paid',
            )
            inv1.created_at = month_date
            inv1.save(update_fields=['created_at'])

            # Create a pending invoice
            inv2 = Invoice.objects.create(
                customer=self.customer,
                invoice_number=f"INV-{i}-PENDING",
                billing_period_start=month_date.date(),
                billing_period_end=(month_date + relativedelta(months=1)).date(),
                due_date=(month_date + relativedelta(days=7)).date(),
                subtotal=Decimal('200.00'),
                total_amount=Decimal('200.00'),
                paid_amount=Decimal('0.00'),
                status='pending',
            )
            inv2.created_at = month_date
            inv2.save(update_fields=['created_at'])

    def test_invoice_stats_performance(self):
        url = reverse('billing:invoice_stats')

        with CaptureQueriesContext(connection) as captured:
            response = self.client.get(url)

        print(f"Queries executed: {len(captured)}")

        # Currently it should be around 36 + overhead.
        # We expect it to be much lower after optimization (around 10-15 queries)
        self.assertLess(len(captured), 20)

        if response.status_code != status.HTTP_200_OK:
            print(response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['data']

        # Verify correctness
        monthly_trends = data['monthly_trends']
        self.assertEqual(len(monthly_trends), 12)

        for month_data in monthly_trends:
            self.assertEqual(month_data['invoice_count'], 2, f"Failed for month {month_data['month']}")
            self.assertEqual(Decimal(month_data['total_amount']), Decimal('300.00'))
            self.assertEqual(Decimal(month_data['paid_amount']), Decimal('100.00'))
