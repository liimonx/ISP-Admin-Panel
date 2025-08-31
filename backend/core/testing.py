"""
Testing utilities for API testing and test data generation.
"""
import json
import random
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Any, List, Optional
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from faker import Faker

fake = Faker()
User = get_user_model()


class APITestMixin:
    """Mixin for API testing with common utilities."""

    def setUp(self):
        """Set up test client and authentication."""
        super().setUp()
        self.client = APIClient()
        self.user = self.create_test_user()
        self.authenticate(self.user)

    def create_test_user(self, **kwargs):
        """Create a test user with default values."""
        defaults = {
            'email': fake.email(),
            'first_name': fake.first_name(),
            'last_name': fake.last_name(),
            'is_active': True,
        }
        defaults.update(kwargs)
        return User.objects.create_user(**defaults)

    def create_admin_user(self, **kwargs):
        """Create a test admin user."""
        defaults = {
            'email': fake.email(),
            'first_name': fake.first_name(),
            'last_name': fake.last_name(),
            'is_active': True,
            'is_staff': True,
            'is_superuser': True,
        }
        defaults.update(kwargs)
        return User.objects.create_superuser(**defaults)

    def authenticate(self, user=None):
        """Authenticate the test client with a user."""
        if user is None:
            user = self.user

        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def unauthenticate(self):
        """Remove authentication from the test client."""
        self.client.credentials()

    def assert_api_response(self, response, status_code=200, success=True):
        """Assert API response format and status."""
        self.assertEqual(response.status_code, status_code)

        if hasattr(response, 'json'):
            data = response.json()
        else:
            data = json.loads(response.content)

        self.assertIn('success', data)
        self.assertEqual(data['success'], success)
        self.assertIn('message', data)
        self.assertIn('data', data)
        self.assertIn('timestamp', data)

        return data

    def assert_validation_error(self, response, field_errors=None):
        """Assert validation error response."""
        data = self.assert_api_response(response, 422, False)
        self.assertIn('errors', data)

        if field_errors:
            for field, expected_error in field_errors.items():
                self.assertIn(field, data['errors'])
                if isinstance(expected_error, str):
                    self.assertIn(expected_error, str(data['errors'][field]))

    def assert_permission_denied(self, response):
        """Assert permission denied response."""
        self.assert_api_response(response, 403, False)

    def assert_not_found(self, response):
        """Assert not found response."""
        self.assert_api_response(response, 404, False)

    def assert_unauthorized(self, response):
        """Assert unauthorized response."""
        self.assert_api_response(response, 401, False)

    def get_json(self, response):
        """Get JSON data from response."""
        if hasattr(response, 'json'):
            return response.json()
        return json.loads(response.content)


class TestDataFactory:
    """Factory for creating test data."""

    @staticmethod
    def create_customer_data(**kwargs):
        """Create customer test data."""
        defaults = {
            'name': fake.company(),
            'email': fake.email(),
            'phone': fake.phone_number()[:20],
            'address': fake.address(),
            'city': fake.city(),
            'state': fake.state(),
            'country': fake.country_code(),
            'postal_code': fake.postcode(),
        }
        defaults.update(kwargs)
        return defaults

    @staticmethod
    def create_plan_data(**kwargs):
        """Create plan test data."""
        defaults = {
            'name': f"{fake.word().title()} Plan",
            'description': fake.text(max_nb_chars=200),
            'price': Decimal(str(random.uniform(10.00, 500.00))).quantize(Decimal('0.01')),
            'speed_download': random.randint(10, 1000),
            'speed_upload': random.randint(5, 100),
            'data_limit_gb': random.choice([None, 100, 500, 1000]),
            'billing_cycle': random.choice(['monthly', 'quarterly', 'yearly']),
        }
        defaults.update(kwargs)
        return defaults

    @staticmethod
    def create_subscription_data(**kwargs):
        """Create subscription test data."""
        start_date = fake.date_between(start_date='-1y', end_date='today')
        defaults = {
            'start_date': start_date,
            'end_date': start_date + timedelta(days=30),
            'status': random.choice(['active', 'inactive', 'suspended']),
        }
        defaults.update(kwargs)
        return defaults

    @staticmethod
    def create_invoice_data(**kwargs):
        """Create invoice test data."""
        subtotal = Decimal(str(random.uniform(50.00, 300.00))).quantize(Decimal('0.01'))
        tax_amount = subtotal * Decimal('0.15')

        defaults = {
            'subtotal': subtotal,
            'tax_amount': tax_amount,
            'discount_amount': Decimal('0.00'),
            'total_amount': subtotal + tax_amount,
            'billing_period_start': fake.date_this_month(),
            'billing_period_end': fake.date_this_month(),
            'due_date': fake.future_date(end_date='+30d'),
            'status': random.choice(['pending', 'paid', 'overdue']),
        }
        defaults.update(kwargs)
        return defaults

    @staticmethod
    def create_payment_data(**kwargs):
        """Create payment test data."""
        defaults = {
            'amount': Decimal(str(random.uniform(10.00, 200.00))).quantize(Decimal('0.01')),
            'payment_method': random.choice(['cash', 'bank_transfer', 'bkash', 'stripe']),
            'transaction_id': fake.uuid4(),
            'status': random.choice(['pending', 'completed', 'failed']),
        }
        defaults.update(kwargs)
        return defaults


class APIPerformanceTestMixin:
    """Mixin for performance testing of API endpoints."""

    def time_endpoint(self, method, url, data=None, **kwargs):
        """Time an API endpoint and return response time."""
        start_time = timezone.now()

        if method.upper() == 'GET':
            response = self.client.get(url, **kwargs)
        elif method.upper() == 'POST':
            response = self.client.post(url, data, format='json', **kwargs)
        elif method.upper() == 'PUT':
            response = self.client.put(url, data, format='json', **kwargs)
        elif method.upper() == 'PATCH':
            response = self.client.patch(url, data, format='json', **kwargs)
        elif method.upper() == 'DELETE':
            response = self.client.delete(url, **kwargs)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")

        end_time = timezone.now()
        response_time = (end_time - start_time).total_seconds() * 1000

        return response, response_time

    def assert_response_time(self, method, url, max_time_ms=1000, **kwargs):
        """Assert that endpoint responds within specified time."""
        response, response_time = self.time_endpoint(method, url, **kwargs)
        self.assertLess(
            response_time,
            max_time_ms,
            f"Endpoint {method} {url} took {response_time:.2f}ms (max: {max_time_ms}ms)"
        )
        return response

    def benchmark_endpoint(self, method, url, iterations=10, **kwargs):
        """Benchmark an endpoint over multiple iterations."""
        response_times = []

        for _ in range(iterations):
            _, response_time = self.time_endpoint(method, url, **kwargs)
            response_times.append(response_time)

        return {
            'min': min(response_times),
            'max': max(response_times),
            'avg': sum(response_times) / len(response_times),
            'iterations': iterations,
            'response_times': response_times
        }


class BulkTestMixin:
    """Mixin for bulk operations testing."""

    def create_bulk_test_data(self, model_class, factory_method, count=100):
        """Create bulk test data using a factory method."""
        objects = []
        for _ in range(count):
            data = factory_method()
            objects.append(model_class(**data))

        return model_class.objects.bulk_create(objects)

    def test_pagination_performance(self, url, expected_count=None, page_size=20):
        """Test pagination performance across multiple pages."""
        page = 1
        total_items = 0
        response_times = []

        while True:
            params = {'page': page, 'page_size': page_size}
            response, response_time = self.time_endpoint('GET', url, params=params)
            response_times.append(response_time)

            self.assertEqual(response.status_code, 200)
            data = self.get_json(response)

            if not data.get('data') or len(data['data']) == 0:
                break

            total_items += len(data['data'])
            page += 1

            # Safety check to prevent infinite loops
            if page > 100:
                break

        if expected_count is not None:
            self.assertEqual(total_items, expected_count)

        return {
            'total_pages': page - 1,
            'total_items': total_items,
            'avg_response_time': sum(response_times) / len(response_times),
            'response_times': response_times
        }


class APISecurityTestMixin:
    """Mixin for API security testing."""

    def test_authentication_required(self, method, url, data=None):
        """Test that endpoint requires authentication."""
        self.unauthenticate()

        if method.upper() == 'GET':
            response = self.client.get(url)
        elif method.upper() == 'POST':
            response = self.client.post(url, data, format='json')
        elif method.upper() == 'PUT':
            response = self.client.put(url, data, format='json')
        elif method.upper() == 'PATCH':
            response = self.client.patch(url, data, format='json')
        elif method.upper() == 'DELETE':
            response = self.client.delete(url)

        self.assert_unauthorized(response)

    def test_admin_permission_required(self, method, url, data=None):
        """Test that endpoint requires admin permissions."""
        # Test with regular user
        regular_user = self.create_test_user()
        self.authenticate(regular_user)

        if method.upper() == 'GET':
            response = self.client.get(url)
        elif method.upper() == 'POST':
            response = self.client.post(url, data, format='json')
        elif method.upper() == 'PUT':
            response = self.client.put(url, data, format='json')
        elif method.upper() == 'PATCH':
            response = self.client.patch(url, data, format='json')
        elif method.upper() == 'DELETE':
            response = self.client.delete(url)

        self.assert_permission_denied(response)

    def test_input_validation(self, method, url, invalid_data_sets):
        """Test input validation with various invalid data sets."""
        for description, invalid_data in invalid_data_sets.items():
            with self.subTest(case=description):
                if method.upper() == 'POST':
                    response = self.client.post(url, invalid_data, format='json')
                elif method.upper() == 'PUT':
                    response = self.client.put(url, invalid_data, format='json')
                elif method.upper() == 'PATCH':
                    response = self.client.patch(url, invalid_data, format='json')

                self.assertIn(response.status_code, [400, 422])

    def test_sql_injection_protection(self, url, injectable_params):
        """Test SQL injection protection."""
        sql_payloads = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "1; SELECT * FROM users",
            "1' UNION SELECT * FROM users --",
        ]

        for param in injectable_params:
            for payload in sql_payloads:
                with self.subTest(param=param, payload=payload):
                    params = {param: payload}
                    response = self.client.get(url, params)

                    # Should either return valid response or 400/422, not 500
                    self.assertNotEqual(response.status_code, 500)


class BaseAPITestCase(APITestMixin, APITestCase):
    """Base test case for API testing."""
    pass


class BasePerformanceTestCase(APIPerformanceTestMixin, BaseAPITestCase):
    """Base test case for performance testing."""
    pass


class BaseBulkTestCase(BulkTestMixin, BaseAPITestCase):
    """Base test case for bulk operations testing."""
    pass


class BaseSecurityTestCase(APISecurityTestMixin, BaseAPITestCase):
    """Base test case for security testing."""
    pass


class ComprehensiveAPITestCase(
    APITestMixin,
    APIPerformanceTestMixin,
    BulkTestMixin,
    APISecurityTestMixin,
    APITestCase
):
    """Comprehensive test case with all testing utilities."""
    pass
