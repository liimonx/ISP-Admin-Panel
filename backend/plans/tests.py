from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from plans.models import Plan
from subscriptions.models import Subscription
from customers.models import Customer
from network.models import Router
from datetime import date
from decimal import Decimal

User = get_user_model()

class PlanRevenueTests(TestCase):
    def setUp(self):
        self.router = Router.objects.create(
            name="Test Router",
            host="192.168.1.1",
            username="admin",
            password="password"
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
        self.assertEqual(plan_annotated.get_total_revenue(), Decimal("500.00"))


class PlanStatsViewTests(APITestCase):
    def setUp(self):
        # Create user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123',
            first_name='Test',
            last_name='User'
        )
        self.client.force_authenticate(user=self.user)

        self.router = Router.objects.create(
            name="Test Router",
            host="192.168.1.1",
            username="admin",
            password="password"
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

    def test_plan_stats_revenue(self):
        url = reverse('plans:plan_stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 5 active subscriptions * 100.00 = 500.0
        self.assertEqual(response.data['total_monthly_revenue'], 500.0)
