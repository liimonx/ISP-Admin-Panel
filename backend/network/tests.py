from django.test import TestCase
from django.utils import timezone
from decimal import Decimal
from network.models import Router
from subscriptions.models import Subscription
from customers.models import Customer
from plans.models import Plan
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()

class RouterModelTest(TestCase):

    def setUp(self):
        self.router = Router.objects.create(
            name="Test Router",
            host="192.168.1.1",
            router_type=Router.RouterType.MIKROTIK,
            status=Router.Status.ONLINE
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

class CommandExecutionTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        self.superuser = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpassword'
        )
        # We need to make sure the URL name matches what's in urls.py
        # It was 'main_router_execute_command'
        self.url = reverse('main_router_execute_command')

    def test_regular_user_cannot_execute_command(self):
        self.client.force_authenticate(user=self.user)
        data = {'command': 'ping 8.8.8.8'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, "Regular user should not be able to execute commands")

    def test_superuser_can_execute_safe_command(self):
        self.client.force_authenticate(user=self.superuser)
        # Using a simple alphanumeric command
        data = {'command': 'ping 8.8.8.8'}
        response = self.client.post(self.url, data)
        # This asserts that a valid command IS allowed for superuser
        self.assertEqual(response.status_code, status.HTTP_200_OK, "Superuser should be able to execute valid commands")

    def test_command_injection_prevented(self):
        self.client.force_authenticate(user=self.superuser)
        injection_payloads = [
            '; ls -la',
            '| cat /etc/passwd',
            '`reboot`',
            '$(shutdown now)',
            '&& rm -rf /',
            'ping 8.8.8.8; ls'
        ]
        for payload in injection_payloads:
            data = {'command': payload}
            response = self.client.post(self.url, data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, f"Payload '{payload}' should be rejected")
