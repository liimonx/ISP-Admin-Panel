from decimal import Decimal
from datetime import date, timedelta
from django.test import TestCase
from plans.models import Plan
from billing.services import BillingService

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
