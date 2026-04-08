from unittest.mock import patch
from rest_framework import status
from rest_framework_simplejwt.tokens import TokenError
from core.testing import BaseAPITestCase


class LogoutViewTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.create_test_user()
        self.authenticate()

    @patch('accounts.views.RefreshToken')
    def test_logout_view_success(self, MockRefreshToken):
        mock_token = MockRefreshToken.return_value
        mock_token.blacklist.return_value = None

        url = "/api/auth/logout/"
        response = self.client.post(url, {"refresh_token": "dummy_token"}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['success'], True)
        self.assertEqual(response.data['message'], 'Successfully logged out')

    @patch('accounts.views.RefreshToken')
    def test_logout_view_token_error(self, MockRefreshToken):
        MockRefreshToken.side_effect = TokenError("Token is invalid or expired")

        url = "/api/auth/logout/"
        response = self.client.post(url, {"refresh_token": "dummy_token"}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['success'], False)
        self.assertEqual(response.data['message'], 'Invalid token')

    @patch('accounts.views.RefreshToken')
    def test_logout_view_exception_handling(self, MockRefreshToken):
        MockRefreshToken.side_effect = Exception("Unexpected error")

        url = "/api/auth/logout/"
        response = self.client.post(url, {"refresh_token": "dummy_token"}, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data['success'], False)
        self.assertEqual(response.data['message'], 'Logout failed')
