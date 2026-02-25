from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()

class NetworkPermissionTests(APITestCase):
    def setUp(self):
        # Create support user
        self.support_user = User.objects.create_user(
            username='support',
            email='support@example.com',
            password='password123',
            role=User.Role.SUPPORT
        )

        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='password123',
            role=User.Role.ADMIN
        )

        self.url = '/api/network/main-router/execute-command/'
        self.data = {'command': '/system identity print'}

    def test_execute_command_permission_denied_for_support(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.post(self.url, self.data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_execute_command_allowed_for_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(self.url, self.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
