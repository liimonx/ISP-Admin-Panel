from django.test import TestCase, RequestFactory
from django.http import HttpResponse
from core.middleware import SecurityHeadersMiddleware

class SecurityHeadersMiddlewareTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = SecurityHeadersMiddleware(lambda request: HttpResponse("OK"))

    def test_security_headers_present(self):
        request = self.factory.get('/')
        response = self.middleware(request)

        self.assertEqual(response['X-Frame-Options'], 'DENY')
        self.assertEqual(response['X-Content-Type-Options'], 'nosniff')
        self.assertEqual(response['X-XSS-Protection'], '1; mode=block')
        self.assertEqual(response['Referrer-Policy'], 'strict-origin-when-cross-origin')
        self.assertIn("default-src 'self'", response['Content-Security-Policy'])
        self.assertIn("script-src 'self' 'unsafe-inline'", response['Content-Security-Policy'])
        self.assertIn("style-src 'self' 'unsafe-inline'", response['Content-Security-Policy'])
        self.assertIn("img-src 'self' data: https:", response['Content-Security-Policy'])
        self.assertIn("connect-src 'self'", response['Content-Security-Policy'])

        # Permissions Policy
        self.assertIn('camera=()', response['Permissions-Policy'])
        self.assertIn('microphone=()', response['Permissions-Policy'])
        self.assertIn('geolocation=()', response['Permissions-Policy'])
        self.assertIn('interest-cohort=()', response['Permissions-Policy'])
        self.assertIn('payment=()', response['Permissions-Policy'])

    def test_hsts_header_secure_request(self):
        request = self.factory.get('/', secure=True)
        response = self.middleware(request)
        self.assertEqual(response['Strict-Transport-Security'], 'max-age=31536000; includeSubDomains')

    def test_hsts_header_insecure_request(self):
        request = self.factory.get('/', secure=False)
        response = self.middleware(request)
        self.assertNotIn('Strict-Transport-Security', response)
