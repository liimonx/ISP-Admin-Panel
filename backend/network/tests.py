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
from unittest.mock import patch, MagicMock
from network.services import MikroTikService

User = get_user_model()

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
        from django.conf import settings
        self.router = Router.objects.create(
            name="Main Router",
            host=settings.MAIN_ROUTER_IP,
            router_type=Router.RouterType.MIKROTIK,
            status=Router.Status.ONLINE
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

    def test_unauthorized_commands_rejected(self):
        self.client.force_authenticate(user=self.superuser)
        unauthorized_commands = [
            'reboot',
            'system reset-configuration',
            'user remove admin',
            'ip address add address 1.1.1.1'
        ]
        for cmd in unauthorized_commands:
            data = {'command': cmd}
            response = self.client.post(self.url, data)
            self.assertEqual(
                response.status_code,
                status.HTTP_403_FORBIDDEN,
                f"Unauthorized command '{cmd}' should be rejected"
            )

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

class MikroTikServiceConnectionTest(TestCase):
    def setUp(self):
        self.router = Router.objects.create(
            name="Test Router",
            host="192.168.1.1",
            username="admin",
            password="password",
            api_port=8728,
            router_type=Router.RouterType.MIKROTIK,
            status=Router.Status.ONLINE,
        )

    @patch('network.services.MikroTikService.connect')
    def test_connection_success(self, mock_connect):
        service = MikroTikService(self.router)
        service._mock_mode = False

        mock_connection = MagicMock()
        service.connection = mock_connection

        def mock_path(*args):
            path_mock = MagicMock()
            if args == ('system', 'resource'):
                path_mock.select.return_value = [{'version': '7.1', 'uptime': '1d', 'cpu-load': 10, 'free-memory': 100, 'total-memory': 200}]
            elif args == ('system', 'identity'):
                path_mock.select.return_value = [{'name': 'Router1'}]
            return path_mock

        mock_connection.path.side_effect = mock_path

        result = service.test_connection()
        self.assertTrue(result['success'])
        self.assertIn('response_time_ms', result)
        self.assertEqual(result['api_version'], '7.1')
        self.assertEqual(result['router_name'], 'Router1')
        self.assertEqual(result['uptime'], '1d')
        self.assertEqual(result['cpu_usage'], 10)
        self.assertEqual(result['memory_usage'], 50)

    @patch('network.services.MikroTikService.connect')
    def test_connection_empty_response(self, mock_connect):
        service = MikroTikService(self.router)
        service._mock_mode = False

        mock_connection = MagicMock()
        service.connection = mock_connection

        def mock_path(*args):
            path_mock = MagicMock()
            path_mock.select.return_value = []
            return path_mock

        mock_connection.path.side_effect = mock_path

        result = service.test_connection()
        self.assertFalse(result['success'])
        self.assertEqual(result['error'], 'No response from router')

    @patch('network.services.MikroTikService.connect')
    def test_connection_failure_exception(self, mock_connect):
        service = MikroTikService(self.router)
        service._mock_mode = False

        # We need to mock connect to raise an exception or mock the connection property path to raise an exception
        # Actually, in the code, `connect` is not what raises the exception in the test block,
        # because `connect` is called in `__enter__`. If it fails, it's raised.
        # Wait, the `try` block in `test_connection` catches exceptions.
        # Let's mock `connect` to raise an exception.

        mock_connect.side_effect = Exception("Connection Timeout")

        result = service.test_connection()
        self.assertFalse(result['success'])
        self.assertEqual(result['error'], 'Connection Timeout')
        self.assertIn('response_time_ms', result)
