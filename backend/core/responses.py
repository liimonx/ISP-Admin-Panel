"""
Standardized API response utilities for consistent API responses.
"""
from rest_framework.response import Response
from rest_framework import status
from typing import Any, Dict, Optional, Union
from datetime import datetime


class APIResponse:
    """Standardized API response handler."""

    @staticmethod
    def success(
        data: Any = None,
        message: str = "Success",
        status_code: int = status.HTTP_200_OK,
        pagination: Optional[Dict] = None,
        meta: Optional[Dict] = None
    ) -> Response:
        """
        Create a standardized success response.

        Args:
            data: Response data
            message: Success message
            status_code: HTTP status code
            pagination: Pagination information
            meta: Additional metadata
        """
        response_data = {
            "success": True,
            "message": message,
            "data": data,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        if pagination:
            response_data["pagination"] = pagination

        if meta:
            response_data["meta"] = meta

        return Response(response_data, status=status_code)

    @staticmethod
    def error(
        message: str = "An error occurred",
        errors: Optional[Union[Dict, list]] = None,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        error_code: Optional[str] = None
    ) -> Response:
        """
        Create a standardized error response.

        Args:
            message: Error message
            errors: Detailed error information
            status_code: HTTP status code
            error_code: Application-specific error code
        """
        response_data = {
            "success": False,
            "message": message,
            "data": None,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        if errors:
            response_data["errors"] = errors

        if error_code:
            response_data["error_code"] = error_code

        return Response(response_data, status=status_code)

    @staticmethod
    def validation_error(serializer_errors: Dict) -> Response:
        """
        Create a standardized validation error response.

        Args:
            serializer_errors: Django REST Framework serializer errors
        """
        return APIResponse.error(
            message="Validation failed",
            errors=serializer_errors,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR"
        )

    @staticmethod
    def not_found(message: str = "Resource not found") -> Response:
        """Create a standardized not found response."""
        return APIResponse.error(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND"
        )

    @staticmethod
    def unauthorized(message: str = "Authentication required") -> Response:
        """Create a standardized unauthorized response."""
        return APIResponse.error(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED"
        )

    @staticmethod
    def forbidden(message: str = "Permission denied") -> Response:
        """Create a standardized forbidden response."""
        return APIResponse.error(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN"
        )

    @staticmethod
    def server_error(message: str = "Internal server error") -> Response:
        """Create a standardized server error response."""
        return APIResponse.error(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="INTERNAL_ERROR"
        )


def paginate_response(queryset, request, serializer_class, page_size: int = None):
    """
    Helper function to paginate queryset and return standardized response.

    Args:
        queryset: Django queryset to paginate
        request: DRF request object
        serializer_class: Serializer class for the data
        page_size: Optional page size override
    """
    from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

    # Get page size from request or use default
    page_size = page_size or int(request.query_params.get('page_size', 20))
    page_size = min(page_size, 100)  # Limit max page size

    page = request.query_params.get('page', 1)

    paginator = Paginator(queryset, page_size)

    try:
        paginated_queryset = paginator.page(page)
    except PageNotAnInteger:
        paginated_queryset = paginator.page(1)
    except EmptyPage:
        paginated_queryset = paginator.page(paginator.num_pages)

    serializer = serializer_class(paginated_queryset.object_list, many=True)

    pagination_data = {
        'current_page': paginated_queryset.number,
        'total_pages': paginator.num_pages,
        'total_items': paginator.count,
        'page_size': page_size,
        'has_next': paginated_queryset.has_next(),
        'has_previous': paginated_queryset.has_previous(),
        'next_page': paginated_queryset.next_page_number() if paginated_queryset.has_next() else None,
        'previous_page': paginated_queryset.previous_page_number() if paginated_queryset.has_previous() else None
    }

    return APIResponse.success(
        data=serializer.data,
        pagination=pagination_data
    )
