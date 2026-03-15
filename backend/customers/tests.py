from django.urls import reverse
from rest_framework import status
from core.testing import ComprehensiveAPITestCase, TestDataFactory
from customers.models import Customer
import json

class CustomerSearchAPITestCase(ComprehensiveAPITestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse('customers:customer_search')

        # Create test customers
        self.customer1 = Customer.objects.create(
            name="Alice Smith",
            email="alice@example.com",
            phone="1234567890",
            company_name="Alice Corp"
        )
        self.customer2 = Customer.objects.create(
            name="Bob Jones",
            email="bob@example.com",
            phone="0987654321",
            company_name="Bob Inc"
        )
        self.customer3 = Customer.objects.create(
            name="Charlie Brown",
            email="charlie@test.com",
            phone="5551234567",
            company_name="Charlie LLC"
        )

    def test_search_by_name(self):
        response = self.client.get(f"{self.url}?q=Alice", follow=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = self.get_json(response)
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 1)
        self.assertEqual(data['data'][0]['name'], "Alice Smith")

    def test_search_by_email(self):
        response = self.client.get(f"{self.url}?q=bob@example", follow=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = self.get_json(response)
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 1)
        self.assertEqual(data['data'][0]['email'], "bob@example.com")

    def test_search_by_phone(self):
        response = self.client.get(f"{self.url}?q=555123", follow=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = self.get_json(response)
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 1)
        self.assertEqual(data['data'][0]['phone'], "5551234567")

    def test_search_by_company_name(self):
        response = self.client.get(f"{self.url}?q=Bob Inc", follow=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = self.get_json(response)
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 1)
        # self.assertEqual(data['data'][0]['company_name'], "Bob Inc") # company_name not in CustomerListSerializer

    def test_search_case_insensitive(self):
        response = self.client.get(f"{self.url}?q=aLiCe", follow=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = self.get_json(response)
        self.assertEqual(len(data['data']), 1)
        self.assertEqual(data['data'][0]['name'], "Alice Smith")

    def test_search_multiple_matches(self):
        # Add another customer with 'example.com' email
        Customer.objects.create(
            name="David Doe",
            email="david@example.com",
            phone="1112223333"
        )
        response = self.client.get(f"{self.url}?q=example.com", follow=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = self.get_json(response)
        self.assertEqual(len(data['data']), 3)

    def test_search_no_results(self):
        response = self.client.get(f"{self.url}?q=NonExistentSearchTerm", follow=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = self.get_json(response)
        self.assertEqual(len(data['data']), 0)

    def test_search_missing_query(self):
        response = self.client.get(self.url, follow=True)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = self.get_json(response)
        self.assertFalse(data['success'])
        self.assertIn('required', data['message'].lower())

    def test_search_empty_query(self):
        response = self.client.get(f"{self.url}?q=", follow=True)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = self.get_json(response)
        self.assertFalse(data['success'])
        self.assertIn('required', data['message'].lower())

    def test_search_limit_results(self):
        # Create 25 more customers matching 'Smith'
        for i in range(25):
            Customer.objects.create(
                name=f"Smith {i}",
                email=f"smith{i}@test.com",
                phone=f"12345678{i:02d}"
            )

        # The view should limit to 20 results
        response = self.client.get(f"{self.url}?q=Smith", follow=True)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = self.get_json(response)
        self.assertEqual(len(data['data']), 20)

    def test_authentication_required(self):
        self.unauthenticate()
        response = self.client.get(f"{self.url}?q=test", follow=True)
        self.assert_unauthorized(response)

    def test_admin_permission_required(self):
        # We don't need this since the view doesn't require admin permission
        pass

    def test_input_validation(self):
        # Already covered by missing/empty query tests
        pass

    def test_pagination_performance(self):
        # Endpoint doesn't implement pagination, it just returns a fixed limit
        pass

    def test_sql_injection_protection(self):
        super().test_sql_injection_protection(self.url, ['q'])
