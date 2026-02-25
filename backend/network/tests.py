from django.test import TestCase
from django.utils import timezone
from decimal import Decimal
from network.models import Router
from subscriptions.models import Subscription
from customers.models import Customer
from plans.models import Plan

class RouterModelTest(TestCase):

    def setUp(self):
        self.router = Router.objects.create(
            name="Test Router",
            host="192.168.1.1",
            router_type=Router.RouterType.MIKROTIK,
            status=Router.Status.ONLINE,
            snmp_community='public'
        )

        self.plan = Plan.objects.create(
            name="Test Plan",
            price=Decimal("100.00"),
            download_speed=50,
            upload_speed=50
        )

        self.customer = Customer.objects.create(
            name="Test Customer",
            email="test@example.com",
            phone="1234567890"
        )

    def test_get_total_bandwidth_usage(self):
        # Create active subscriptions
        Subscription.objects.create(
            customer=self.customer,
            plan=self.plan,
            router=self.router,
            username="user1",
            password="password",
            status=Subscription.Status.ACTIVE,
            start_date=timezone.now().date(),
            monthly_fee=Decimal("100.00"),
            data_used=Decimal("1.5")
        )

        Subscription.objects.create(
            customer=self.customer,
            plan=self.plan,
            router=self.router,
            username="user2",
            password="password",
            status=Subscription.Status.ACTIVE,
            start_date=timezone.now().date(),
            monthly_fee=Decimal("100.00"),
            data_used=Decimal("2.5")
        )

        # Create inactive subscription (should be ignored)
        Subscription.objects.create(
            customer=self.customer,
            plan=self.plan,
            router=self.router,
            username="user3",
            password="password",
            status=Subscription.Status.INACTIVE,
            start_date=timezone.now().date(),
            monthly_fee=Decimal("100.00"),
            data_used=Decimal("5.0")
        )

        # Total should be 1.5 + 2.5 = 4.0
        self.assertEqual(self.router.get_total_bandwidth_usage(), Decimal("4.0"))

    def test_get_total_bandwidth_usage_empty(self):
        # No subscriptions
        self.assertEqual(self.router.get_total_bandwidth_usage(), 0)
