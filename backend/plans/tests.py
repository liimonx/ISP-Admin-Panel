from django.test import TestCase
from plans.models import Plan
from subscriptions.models import Subscription
from customers.models import Customer
from network.models import Router
from datetime import date
from decimal import Decimal

class PlanRevenueTests(TestCase):
    def setUp(self):
        self.router = Router.objects.create(
            name="Test Router",
            host="192.168.1.1",
            username="admin",
            password="password",
            snmp_community="public"
        )
        self.customer = Customer.objects.create(
            name="Test Customer",
            email="test@example.com",
            phone="1234567890",
            address="123 St"
        )
        self.plan = Plan.objects.create(
            name="Test Plan",
            download_speed=10,
            upload_speed=10,
            price=Decimal("100.00")
        )

    def test_revenue_calculation(self):
        # Create 5 active subscriptions
        for i in range(5):
            Subscription.objects.create(
                customer=self.customer,
                plan=self.plan,
                router=self.router,
                username=f"user_{i}",
                password="password",
                status='active',
                start_date=date.today(),
                monthly_fee=100.00
            )

        # Create 2 inactive subscriptions
        for i in range(2):
            Subscription.objects.create(
                customer=self.customer,
                plan=self.plan,
                router=self.router,
                username=f"user_inactive_{i}",
                password="password",
                status='inactive',
                start_date=date.today(),
                monthly_fee=100.00
            )

        # Test without annotation (fallback)
        # Note: Plan.objects.get() uses default manager which is PlanManager
        # But PlanManager.get_queryset() returns PlanQuerySet
        # Does PlanQuerySet annotate by default? No.
        # But PlanManager.with_revenue() does.

        plan = Plan.objects.get(id=self.plan.id)
        # Should not have annotated_revenue yet
        self.assertFalse(hasattr(plan, 'annotated_revenue'))
        revenue = plan.get_total_revenue()
        self.assertEqual(revenue, Decimal("500.00"))

        # Test with annotation
        plan_annotated = Plan.objects.with_revenue().get(id=self.plan.id)
        self.assertTrue(hasattr(plan_annotated, 'annotated_revenue'))
        self.assertEqual(plan_annotated.annotated_revenue, Decimal("500.00"))

        # Ensure method uses annotated value
        # We can mock active_subs.count() to verify it's not called, or just trust logic
        # But simpler is to check value match
        self.assertEqual(plan_annotated.get_total_revenue(), Decimal("500.00"))
