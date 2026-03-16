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
            price=Decimal("100.00"),
            is_active=True,
            is_popular=True
        )

        self.featured_plan = Plan.objects.create(
            name="Featured Plan",
            download_speed=20,
            upload_speed=20,
            price=Decimal("200.00"),
            is_active=True,
            is_featured=True
        )

        self.inactive_plan = Plan.objects.create(
            name="Inactive Plan",
            download_speed=5,
            upload_speed=5,
            price=Decimal("50.00"),
            is_active=False
        )

        # Create 5 active subscriptions for the popular plan
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

        # Create 2 active subscriptions for the featured plan
        for i in range(2):
            Subscription.objects.create(
                customer=self.customer,
                plan=self.featured_plan,
                router=self.router,
                username=f"feat_user_{i}",
                password="password",
                status='active',
                start_date=date.today(),
                monthly_fee=200.00
            )

        # Create 1 inactive subscription for the inactive plan
        Subscription.objects.create(
            customer=self.customer,
            plan=self.inactive_plan,
            router=self.router,
            username="inactive_user_0",
            password="password",
            status='inactive',
            start_date=date.today(),
            monthly_fee=50.00
        )

    def test_plan_stats_counts(self):
        url = reverse('plans:plan_stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(response.data['total_plans'], 3)
        self.assertEqual(response.data['active_plans'], 2)
        self.assertEqual(response.data['featured_plans'], 1)
        self.assertEqual(response.data['popular_plans'], 1)

    def test_plan_stats_revenue(self):
        url = reverse('plans:plan_stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 5 active subscriptions * 100.00 + 2 active subscriptions * 200.00 = 500.0 + 400.0 = 900.0
        self.assertEqual(response.data['total_monthly_revenue'], 900.0)

    def test_plan_stats_top_plans(self):
        url = reverse('plans:plan_stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify top_plans are only active plans and are correctly ordered by subscriber count
        top_plans = response.data['top_plans']
        self.assertEqual(len(top_plans), 2)

        # First plan should be the popular plan (5 subs)
        self.assertEqual(top_plans[0]['id'], self.plan.id)

        # Second plan should be the featured plan (2 subs)
        self.assertEqual(top_plans[1]['id'], self.featured_plan.id)

    def test_plan_stats_empty_revenue(self):
        # Delete all subscriptions
        Subscription.objects.all().delete()

        url = reverse('plans:plan_stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(response.data['total_monthly_revenue'], 0.0)
