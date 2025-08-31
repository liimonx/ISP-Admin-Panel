"""
Custom middleware for the ISP Admin API including rate limiting and security enhancements.
"""
import time
import logging
from typing import Dict, Optional
from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser

# Import PerformanceMiddleware from performance module
from .performance import PerformanceMiddleware

logger = logging.getLogger(__name__)


class RateLimitMiddleware(MiddlewareMixin):
    """
    Rate limiting middleware that tracks and limits requests per user/IP.
    """

    # Default rate limits (requests per minute)
    DEFAULT_RATE_LIMITS = {
        'authenticated': 200,    # 200 requests per minute for authenticated users
        'anonymous': 60,         # 60 requests per minute for anonymous users
        'login': 10,            # 10 login attempts per minute
        'password_reset': 5,    # 5 password reset attempts per minute
    }

    # Endpoints with special rate limits
    ENDPOINT_LIMITS = {
        '/api/auth/login/': 'login',
        '/api/auth/password-reset/': 'password_reset',
        '/api/auth/change-password/': 'password_reset',
    }

    def __init__(self, get_response):
        super().__init__(get_response)
        self.rate_limits = getattr(settings, 'RATE_LIMITS', self.DEFAULT_RATE_LIMITS)

    def process_request(self, request):
        """Process incoming request and apply rate limiting."""
        # Skip rate limiting for health checks and admin
        if self._should_skip_rate_limiting(request):
            return None

        # Get client identifier
        client_id = self._get_client_identifier(request)

        # Determine rate limit type
        limit_type = self._get_limit_type(request)

        # Check rate limit
        if self._is_rate_limited(client_id, limit_type, request):
            return self._rate_limit_response(request, client_id)

        return None

    def _should_skip_rate_limiting(self, request) -> bool:
        """Determine if rate limiting should be skipped for this request."""
        skip_paths = [
            '/health/',
            '/admin/',
            '/api/health/',
            '/api/schema/',
            '/api/docs/',
        ]

        return any(request.path.startswith(path) for path in skip_paths)

    def _get_client_identifier(self, request) -> str:
        """Get unique identifier for the client."""
        # Use user ID for authenticated users
        if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser):
            return f"user:{request.user.id}"

        # Use IP address for anonymous users
        ip_address = self._get_client_ip(request)
        return f"ip:{ip_address}"

    def _get_client_ip(self, request) -> str:
        """Extract client IP address from request."""
        # Check for IP in headers (for reverse proxy setups)
        ip = request.META.get('HTTP_X_FORWARDED_FOR')
        if ip:
            ip = ip.split(',')[0].strip()
        else:
            ip = request.META.get('HTTP_X_REAL_IP') or request.META.get('REMOTE_ADDR')

        return ip or 'unknown'

    def _get_limit_type(self, request) -> str:
        """Determine the appropriate rate limit type for the request."""
        # Check for specific endpoint limits
        for endpoint, limit_type in self.ENDPOINT_LIMITS.items():
            if request.path.startswith(endpoint):
                return limit_type

        # Default based on authentication status
        if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser):
            return 'authenticated'
        else:
            return 'anonymous'

    def _is_rate_limited(self, client_id: str, limit_type: str, request) -> bool:
        """Check if the client has exceeded the rate limit."""
        limit = self.rate_limits.get(limit_type, self.DEFAULT_RATE_LIMITS['anonymous'])

        # Use sliding window approach with cache
        current_minute = int(time.time() // 60)
        cache_key = f"rate_limit:{client_id}:{limit_type}:{current_minute}"

        # Get current request count
        current_count = cache.get(cache_key, 0)

        if current_count >= limit:
            # Log rate limit violation
            logger.warning(
                f"Rate limit exceeded for {client_id}",
                extra={
                    'client_id': client_id,
                    'limit_type': limit_type,
                    'current_count': current_count,
                    'limit': limit,
                    'path': request.path,
                    'method': request.method
                }
            )
            return True

        # Increment counter
        cache.set(cache_key, current_count + 1, 60)  # Expire after 1 minute

        return False

    def _rate_limit_response(self, request, client_id: str) -> JsonResponse:
        """Return rate limit exceeded response."""
        return JsonResponse({
            'success': False,
            'message': 'Rate limit exceeded. Please try again later.',
            'error_code': 'RATE_LIMIT_EXCEEDED',
            'data': None,
            'timestamp': timezone.now().isoformat() + 'Z'
        }, status=429)


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware to add security headers to responses.
    """

    def process_response(self, request, response):
        """Add security headers to the response."""
        # Content Security Policy
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self';"
        )

        # X-Frame-Options
        response['X-Frame-Options'] = 'DENY'

        # X-Content-Type-Options
        response['X-Content-Type-Options'] = 'nosniff'

        # X-XSS-Protection
        response['X-XSS-Protection'] = '1; mode=block'

        # Referrer Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Strict Transport Security (only for HTTPS)
        if request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        # Permissions Policy
        response['Permissions-Policy'] = (
            'camera=(), microphone=(), geolocation=(), '
            'interest-cohort=(), payment=()'
        )

        return response


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log API requests and responses for monitoring and debugging.
    """

    def __init__(self, get_response):
        super().__init__(get_response)
        self.sensitive_headers = {
            'HTTP_AUTHORIZATION', 'HTTP_X_API_KEY', 'HTTP_COOKIE'
        }

    def process_request(self, request):
        """Log incoming request details."""
        if self._should_log_request(request):
            request._logging_start_time = time.time()

            # Prepare request data for logging
            request_data = {
                'method': request.method,
                'path': request.path,
                'query_params': dict(request.GET),
                'content_type': request.content_type,
                'user_agent': request.META.get('HTTP_USER_AGENT', 'Unknown'),
                'ip_address': self._get_client_ip(request),
                'user': str(request.user) if hasattr(request, 'user') else 'Anonymous'
            }

            # Log headers (excluding sensitive ones)
            headers = {}
            for key, value in request.META.items():
                if key.startswith('HTTP_') and key not in self.sensitive_headers:
                    headers[key] = value

            if headers:
                request_data['headers'] = headers

            logger.info(
                f"API Request: {request.method} {request.path}",
                extra=request_data
            )

    def process_response(self, request, response):
        """Log response details."""
        if self._should_log_request(request):
            # Calculate response time
            response_time = 0
            if hasattr(request, '_logging_start_time'):
                response_time = (time.time() - request._logging_start_time) * 1000

            # Prepare response data for logging
            response_data = {
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'response_time_ms': round(response_time, 2),
                'content_type': response.get('Content-Type', 'unknown'),
                'user': str(request.user) if hasattr(request, 'user') else 'Anonymous'
            }

            # Determine log level based on status code
            if response.status_code >= 500:
                log_level = 'error'
            elif response.status_code >= 400:
                log_level = 'warning'
            else:
                log_level = 'info'

            getattr(logger, log_level)(
                f"API Response: {request.method} {request.path} - {response.status_code}",
                extra=response_data
            )

        return response

    def _should_log_request(self, request) -> bool:
        """Determine if request should be logged."""
        skip_paths = [
            '/health/',
            '/api/health/',
            '/admin/jsi18n/',
        ]

        return not any(request.path.startswith(path) for path in skip_paths)

    def _get_client_ip(self, request) -> str:
        """Extract client IP address from request."""
        ip = request.META.get('HTTP_X_FORWARDED_FOR')
        if ip:
            ip = ip.split(',')[0].strip()
        else:
            ip = request.META.get('HTTP_X_REAL_IP') or request.META.get('REMOTE_ADDR')

        return ip or 'unknown'


class APIVersionMiddleware(MiddlewareMixin):
    """
    Middleware to handle API versioning.
    """

    def process_request(self, request):
        """Add API version information to request."""
        # Get version from header or URL
        api_version = (
            request.META.get('HTTP_API_VERSION') or
            request.META.get('HTTP_X_API_VERSION') or
            '1.0'
        )

        # Add version to request for use in views
        request.api_version = api_version

        return None

    def process_response(self, request, response):
        """Add API version to response headers."""
        response['X-API-Version'] = getattr(request, 'api_version', '1.0')
        return response


class PerformanceHeadersMiddleware(MiddlewareMixin):
    """
    Middleware to add performance-related headers to responses.
    """

    def process_request(self, request):
        """Record request start time."""
        request._perf_start_time = time.time()

    def process_response(self, request, response):
        """Add performance headers."""
        if hasattr(request, '_perf_start_time'):
            # Calculate response time
            response_time = (time.time() - request._perf_start_time) * 1000
            response['X-Response-Time'] = f"{response_time:.2f}ms"

        # Add cache control headers for API responses
        if request.path.startswith('/api/'):
            if request.method == 'GET':
                # GET requests can be cached for short periods
                response['Cache-Control'] = 'private, max-age=60'
            else:
                # Other methods should not be cached
                response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'

        return response
