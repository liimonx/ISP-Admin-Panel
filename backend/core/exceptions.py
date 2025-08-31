"""
Custom exception handler for consistent API error responses.
"""
import logging
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from django.db import IntegrityError
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework import status
from rest_framework.exceptions import (
    ValidationError, PermissionDenied, NotAuthenticated,
    NotFound, MethodNotAllowed, Throttled, ParseError,
    UnsupportedMediaType, NotAcceptable
)
from .responses import APIResponse

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error responses.
    """
    # Call REST framework's default exception handler first
    response = drf_exception_handler(exc, context)

    # Log the exception
    view = context.get('view', None)
    request = context.get('request', None)

    if view and request:
        logger.error(
            f"API Exception in {view.__class__.__name__}: {str(exc)}",
            extra={
                'view': view.__class__.__name__,
                'method': request.method,
                'path': request.path,
                'user': str(request.user) if hasattr(request, 'user') else 'Anonymous',
                'exception': str(exc),
                'exception_type': exc.__class__.__name__
            }
        )

    # Handle specific exceptions with custom responses
    if isinstance(exc, ValidationError):
        return APIResponse.validation_error(exc.detail)

    elif isinstance(exc, NotAuthenticated):
        return APIResponse.unauthorized("Authentication credentials were not provided")

    elif isinstance(exc, PermissionDenied):
        return APIResponse.forbidden("You do not have permission to perform this action")

    elif isinstance(exc, NotFound) or isinstance(exc, Http404):
        return APIResponse.not_found("The requested resource was not found")

    elif isinstance(exc, MethodNotAllowed):
        allowed_methods = exc.detail.get('allowed_methods', [])
        message = f"Method '{context['request'].method}' not allowed."
        if allowed_methods:
            message += f" Allowed methods: {', '.join(allowed_methods)}"
        return APIResponse.error(
            message=message,
            status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
            error_code="METHOD_NOT_ALLOWED"
        )

    elif isinstance(exc, Throttled):
        wait_time = exc.wait
        return APIResponse.error(
            message=f"Request was throttled. Expected available in {wait_time} seconds.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="THROTTLED"
        )

    elif isinstance(exc, ParseError):
        return APIResponse.error(
            message="Malformed request data",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="PARSE_ERROR"
        )

    elif isinstance(exc, UnsupportedMediaType):
        return APIResponse.error(
            message="Unsupported media type",
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            error_code="UNSUPPORTED_MEDIA_TYPE"
        )

    elif isinstance(exc, NotAcceptable):
        return APIResponse.error(
            message="Could not satisfy the request Accept header",
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            error_code="NOT_ACCEPTABLE"
        )

    elif isinstance(exc, DjangoValidationError):
        return APIResponse.validation_error({
            'non_field_errors': [str(exc)]
        })

    elif isinstance(exc, IntegrityError):
        return APIResponse.error(
            message="Database integrity error. This operation violates database constraints",
            status_code=status.HTTP_409_CONFLICT,
            error_code="INTEGRITY_ERROR"
        )

    # Handle generic exceptions
    elif response is not None:
        custom_response_data = {
            'success': False,
            'message': 'An error occurred',
            'data': None,
            'timestamp': APIResponse.success()['timestamp']
        }

        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                custom_response_data['errors'] = exc.detail
                # Try to extract a meaningful message
                if 'detail' in exc.detail:
                    custom_response_data['message'] = exc.detail['detail']
                elif 'non_field_errors' in exc.detail:
                    custom_response_data['message'] = exc.detail['non_field_errors'][0] if exc.detail['non_field_errors'] else 'Validation error'
            elif isinstance(exc.detail, list):
                custom_response_data['message'] = exc.detail[0] if exc.detail else 'An error occurred'
                custom_response_data['errors'] = exc.detail
            else:
                custom_response_data['message'] = str(exc.detail)

        response.data = custom_response_data
        return response

    # Handle unexpected server errors
    logger.critical(
        f"Unhandled exception in API: {str(exc)}",
        extra={
            'exception': str(exc),
            'exception_type': exc.__class__.__name__,
            'view': view.__class__.__name__ if view else 'Unknown',
            'path': request.path if request else 'Unknown'
        },
        exc_info=True
    )

    return APIResponse.server_error("An unexpected error occurred. Please try again later.")


class APIException(Exception):
    """Base exception class for API-specific errors."""

    def __init__(self, message, status_code=status.HTTP_400_BAD_REQUEST, error_code=None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(message)


class BusinessLogicError(APIException):
    """Exception for business logic violations."""

    def __init__(self, message, error_code="BUSINESS_LOGIC_ERROR"):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY, error_code)


class ResourceConflictError(APIException):
    """Exception for resource conflicts."""

    def __init__(self, message, error_code="RESOURCE_CONFLICT"):
        super().__init__(message, status.HTTP_409_CONFLICT, error_code)


class ExternalServiceError(APIException):
    """Exception for external service failures."""

    def __init__(self, message, error_code="EXTERNAL_SERVICE_ERROR"):
        super().__init__(message, status.HTTP_503_SERVICE_UNAVAILABLE, error_code)


class RateLimitExceededError(APIException):
    """Exception for rate limit violations."""

    def __init__(self, message="Rate limit exceeded", error_code="RATE_LIMIT_EXCEEDED"):
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS, error_code)
