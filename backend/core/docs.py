"""
API Documentation examples and utilities for drf-spectacular.
"""
from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiExample, OpenApiParameter,
    OpenApiResponse, OpenApiTypes
)
from drf_spectacular.openapi import AutoSchema
from rest_framework import status


class APIDocumentationExamples:
    """Common API documentation examples."""

    # Authentication Examples
    LOGIN_REQUEST_EXAMPLE = OpenApiExample(
        'Login Request',
        summary='User login request',
        description='Login with email and password',
        value={
            "email": "user@example.com",
            "password": "SecurePassword123!"
        }
    )

    LOGIN_RESPONSE_EXAMPLE = OpenApiExample(
        'Login Response',
        summary='Successful login response',
        description='JWT tokens and user information',
        value={
            "success": True,
            "message": "Login successful",
            "data": {
                "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "user": {
                    "id": 1,
                    "email": "user@example.com",
                    "first_name": "John",
                    "last_name": "Doe",
                    "is_active": True
                }
            },
            "timestamp": "2024-01-15T10:30:00Z"
        }
    )

    # Customer Examples
    CUSTOMER_CREATE_EXAMPLE = OpenApiExample(
        'Create Customer',
        summary='Create new customer',
        description='Customer creation with complete information',
        value={
            "name": "ABC Internet Solutions",
            "email": "contact@abcinternet.com",
            "phone": "+1234567890",
            "address": "123 Main Street",
            "city": "Springfield",
            "state": "IL",
            "country": "US",
            "postal_code": "62701",
            "contact_person": "Jane Smith",
            "tax_id": "123456789"
        }
    )

    CUSTOMER_RESPONSE_EXAMPLE = OpenApiExample(
        'Customer Response',
        summary='Customer information response',
        description='Complete customer data with relationships',
        value={
            "success": True,
            "message": "Customer retrieved successfully",
            "data": {
                "id": 1,
                "name": "ABC Internet Solutions",
                "email": "contact@abcinternet.com",
                "phone": "+1234567890",
                "address": "123 Main Street",
                "city": "Springfield",
                "state": "IL",
                "country": "US",
                "postal_code": "62701",
                "contact_person": "Jane Smith",
                "tax_id": "123456789",
                "status": "active",
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z",
                "subscriptions_count": 2,
                "total_outstanding": "150.00"
            },
            "timestamp": "2024-01-15T10:30:00Z"
        }
    )

    # Invoice Examples
    INVOICE_CREATE_EXAMPLE = OpenApiExample(
        'Create Invoice',
        summary='Create new invoice',
        description='Invoice creation for a subscription',
        value={
            "customer": 1,
            "subscription": 1,
            "invoice_type": "monthly",
            "billing_period_start": "2024-01-01",
            "billing_period_end": "2024-01-31",
            "subtotal": "99.99",
            "tax_amount": "14.99",
            "discount_amount": "0.00",
            "due_date": "2024-02-15",
            "notes": "Monthly internet service fee"
        }
    )

    INVOICE_RESPONSE_EXAMPLE = OpenApiExample(
        'Invoice Response',
        summary='Invoice information response',
        description='Complete invoice data with calculations',
        value={
            "success": True,
            "message": "Invoice retrieved successfully",
            "data": {
                "id": 1,
                "invoice_number": "INV-000001",
                "customer": {
                    "id": 1,
                    "name": "ABC Internet Solutions",
                    "email": "contact@abcinternet.com"
                },
                "subscription": {
                    "id": 1,
                    "plan": {
                        "name": "Premium Internet 100Mbps"
                    }
                },
                "invoice_type": "monthly",
                "billing_period_start": "2024-01-01",
                "billing_period_end": "2024-01-31",
                "subtotal": "99.99",
                "tax_amount": "14.99",
                "discount_amount": "0.00",
                "total_amount": "114.98",
                "paid_amount": "0.00",
                "balance_due": "114.98",
                "status": "pending",
                "issue_date": "2024-01-01",
                "due_date": "2024-02-15",
                "paid_date": None,
                "notes": "Monthly internet service fee",
                "days_overdue": 0,
                "is_overdue": False,
                "is_paid": False,
                "created_at": "2024-01-01T08:00:00Z",
                "updated_at": "2024-01-01T08:00:00Z"
            },
            "timestamp": "2024-01-15T10:30:00Z"
        }
    )

    # Payment Examples
    PAYMENT_CREATE_EXAMPLE = OpenApiExample(
        'Create Payment',
        summary='Record new payment',
        description='Payment recording for an invoice',
        value={
            "invoice": 1,
            "amount": "114.98",
            "payment_method": "bank_transfer",
            "transaction_id": "TXN123456789",
            "notes": "Payment via bank transfer"
        }
    )

    PAYMENT_RESPONSE_EXAMPLE = OpenApiExample(
        'Payment Response',
        summary='Payment information response',
        description='Complete payment data',
        value={
            "success": True,
            "message": "Payment retrieved successfully",
            "data": {
                "id": 1,
                "payment_number": "PAY-000001",
                "customer": {
                    "id": 1,
                    "name": "ABC Internet Solutions"
                },
                "invoice": {
                    "id": 1,
                    "invoice_number": "INV-000001"
                },
                "amount": "114.98",
                "payment_method": "bank_transfer",
                "status": "completed",
                "payment_date": "2024-01-15T14:30:00Z",
                "external_id": "",
                "transaction_id": "TXN123456789",
                "notes": "Payment via bank transfer",
                "is_completed": True,
                "is_failed": False,
                "created_at": "2024-01-15T14:30:00Z",
                "updated_at": "2024-01-15T14:30:00Z"
            },
            "timestamp": "2024-01-15T15:00:00Z"
        }
    )

    # Statistics Examples
    CUSTOMER_STATS_EXAMPLE = OpenApiExample(
        'Customer Statistics',
        summary='Customer statistics response',
        description='Comprehensive customer analytics',
        value={
            "success": True,
            "message": "Customer statistics retrieved successfully",
            "data": {
                "total_customers": 1250,
                "active_customers": 1100,
                "inactive_customers": 50,
                "suspended_customers": 75,
                "cancelled_customers": 25,
                "new_customers_this_month": 45,
                "active_percentage": 88.0
            },
            "timestamp": "2024-01-15T10:30:00Z"
        }
    )

    INVOICE_STATS_EXAMPLE = OpenApiExample(
        'Invoice Statistics',
        summary='Invoice statistics response',
        description='Comprehensive billing analytics',
        value={
            "success": True,
            "message": "Invoice statistics retrieved successfully",
            "data": {
                "totals": {
                    "total_invoices": 5240,
                    "pending_invoices": 320,
                    "paid_invoices": 4750,
                    "overdue_invoices": 145,
                    "cancelled_invoices": 25,
                    "total_amount": "524000.00",
                    "paid_amount": "475000.00",
                    "pending_amount": "32000.00",
                    "overdue_amount": "14500.00",
                    "avg_invoice_amount": "100.00",
                    "collection_rate": 90.65
                },
                "monthly_trends": [
                    {
                        "month": "2024-01",
                        "invoice_count": 450,
                        "total_amount": "45000.00",
                        "paid_amount": "40500.00"
                    }
                ],
                "top_customers": [
                    {
                        "customer_id": 1,
                        "customer_name": "ABC Internet Solutions",
                        "total_amount": "2400.00",
                        "invoice_count": 24
                    }
                ]
            },
            "timestamp": "2024-01-15T10:30:00Z"
        }
    )

    # Error Examples
    VALIDATION_ERROR_EXAMPLE = OpenApiExample(
        'Validation Error',
        summary='Validation error response',
        description='Request data validation failed',
        value={
            "success": False,
            "message": "Validation failed",
            "data": None,
            "errors": {
                "email": ["Enter a valid email address."],
                "phone": ["This field is required."],
                "amount": ["Ensure this value is greater than 0."]
            },
            "error_code": "VALIDATION_ERROR",
            "timestamp": "2024-01-15T10:30:00Z"
        }
    )

    UNAUTHORIZED_ERROR_EXAMPLE = OpenApiExample(
        'Unauthorized Error',
        summary='Authentication required',
        description='User authentication is required',
        value={
            "success": False,
            "message": "Authentication credentials were not provided",
            "data": None,
            "error_code": "UNAUTHORIZED",
            "timestamp": "2024-01-15T10:30:00Z"
        }
    )

    NOT_FOUND_ERROR_EXAMPLE = OpenApiExample(
        'Not Found Error',
        summary='Resource not found',
        description='Requested resource does not exist',
        value={
            "success": False,
            "message": "The requested resource was not found",
            "data": None,
            "error_code": "NOT_FOUND",
            "timestamp": "2024-01-15T10:30:00Z"
        }
    )

    RATE_LIMIT_ERROR_EXAMPLE = OpenApiExample(
        'Rate Limit Error',
        summary='Rate limit exceeded',
        description='Too many requests from this client',
        value={
            "success": False,
            "message": "Rate limit exceeded. Please try again later.",
            "data": None,
            "error_code": "RATE_LIMIT_EXCEEDED",
            "timestamp": "2024-01-15T10:30:00Z"
        }
    )

    # Pagination Example
    PAGINATED_RESPONSE_EXAMPLE = OpenApiExample(
        'Paginated Response',
        summary='Paginated list response',
        description='Standard pagination format for list endpoints',
        value={
            "success": True,
            "message": "Data retrieved successfully",
            "data": [
                {
                    "id": 1,
                    "name": "Item 1"
                },
                {
                    "id": 2,
                    "name": "Item 2"
                }
            ],
            "pagination": {
                "current_page": 1,
                "total_pages": 15,
                "total_items": 295,
                "page_size": 20,
                "has_next": True,
                "has_previous": False,
                "next_page": 2,
                "previous_page": None
            },
            "timestamp": "2024-01-15T10:30:00Z"
        }
    )


class APIParameters:
    """Common API parameters for documentation."""

    PAGE_PARAMETER = OpenApiParameter(
        name='page',
        type=OpenApiTypes.INT,
        location=OpenApiParameter.QUERY,
        description='Page number for pagination',
        default=1
    )

    PAGE_SIZE_PARAMETER = OpenApiParameter(
        name='page_size',
        type=OpenApiTypes.INT,
        location=OpenApiParameter.QUERY,
        description='Number of items per page (max: 100)',
        default=20
    )

    SEARCH_PARAMETER = OpenApiParameter(
        name='search',
        type=OpenApiTypes.STR,
        location=OpenApiParameter.QUERY,
        description='Search query to filter results'
    )

    ORDERING_PARAMETER = OpenApiParameter(
        name='ordering',
        type=OpenApiTypes.STR,
        location=OpenApiParameter.QUERY,
        description='Field to order by. Prefix with - for descending order',
        examples=[
            OpenApiExample('Ascending', value='created_at'),
            OpenApiExample('Descending', value='-created_at'),
        ]
    )

    DATE_FROM_PARAMETER = OpenApiParameter(
        name='date_from',
        type=OpenApiTypes.DATE,
        location=OpenApiParameter.QUERY,
        description='Filter results from this date (YYYY-MM-DD format)'
    )

    DATE_TO_PARAMETER = OpenApiParameter(
        name='date_to',
        type=OpenApiTypes.DATE,
        location=OpenApiParameter.QUERY,
        description='Filter results up to this date (YYYY-MM-DD format)'
    )

    STATUS_PARAMETER = OpenApiParameter(
        name='status',
        type=OpenApiTypes.STR,
        location=OpenApiParameter.QUERY,
        description='Filter by status'
    )

    CUSTOMER_ID_PARAMETER = OpenApiParameter(
        name='customer_id',
        type=OpenApiTypes.INT,
        location=OpenApiParameter.QUERY,
        description='Filter by customer ID'
    )


class APIResponses:
    """Standard API responses for documentation."""

    SUCCESS_RESPONSE = OpenApiResponse(
        response={
            "type": "object",
            "properties": {
                "success": {"type": "boolean", "example": True},
                "message": {"type": "string", "example": "Operation completed successfully"},
                "data": {"type": "object"},
                "timestamp": {"type": "string", "format": "date-time"}
            }
        },
        description="Successful response"
    )

    CREATED_RESPONSE = OpenApiResponse(
        response={
            "type": "object",
            "properties": {
                "success": {"type": "boolean", "example": True},
                "message": {"type": "string", "example": "Resource created successfully"},
                "data": {"type": "object"},
                "timestamp": {"type": "string", "format": "date-time"}
            }
        },
        description="Resource created successfully"
    )

    VALIDATION_ERROR_RESPONSE = OpenApiResponse(
        response={
            "type": "object",
            "properties": {
                "success": {"type": "boolean", "example": False},
                "message": {"type": "string", "example": "Validation failed"},
                "data": {"type": "null"},
                "errors": {"type": "object"},
                "error_code": {"type": "string", "example": "VALIDATION_ERROR"},
                "timestamp": {"type": "string", "format": "date-time"}
            }
        },
        description="Validation error",
        examples=[APIDocumentationExamples.VALIDATION_ERROR_EXAMPLE]
    )

    UNAUTHORIZED_RESPONSE = OpenApiResponse(
        response={
            "type": "object",
            "properties": {
                "success": {"type": "boolean", "example": False},
                "message": {"type": "string", "example": "Authentication required"},
                "data": {"type": "null"},
                "error_code": {"type": "string", "example": "UNAUTHORIZED"},
                "timestamp": {"type": "string", "format": "date-time"}
            }
        },
        description="Authentication required",
        examples=[APIDocumentationExamples.UNAUTHORIZED_ERROR_EXAMPLE]
    )

    FORBIDDEN_RESPONSE = OpenApiResponse(
        response={
            "type": "object",
            "properties": {
                "success": {"type": "boolean", "example": False},
                "message": {"type": "string", "example": "Permission denied"},
                "data": {"type": "null"},
                "error_code": {"type": "string", "example": "FORBIDDEN"},
                "timestamp": {"type": "string", "format": "date-time"}
            }
        },
        description="Permission denied"
    )

    NOT_FOUND_RESPONSE = OpenApiResponse(
        response={
            "type": "object",
            "properties": {
                "success": {"type": "boolean", "example": False},
                "message": {"type": "string", "example": "Resource not found"},
                "data": {"type": "null"},
                "error_code": {"type": "string", "example": "NOT_FOUND"},
                "timestamp": {"type": "string", "format": "date-time"}
            }
        },
        description="Resource not found",
        examples=[APIDocumentationExamples.NOT_FOUND_ERROR_EXAMPLE]
    )

    RATE_LIMIT_RESPONSE = OpenApiResponse(
        response={
            "type": "object",
            "properties": {
                "success": {"type": "boolean", "example": False},
                "message": {"type": "string", "example": "Rate limit exceeded"},
                "data": {"type": "null"},
                "error_code": {"type": "string", "example": "RATE_LIMIT_EXCEEDED"},
                "timestamp": {"type": "string", "format": "date-time"}
            }
        },
        description="Rate limit exceeded",
        examples=[APIDocumentationExamples.RATE_LIMIT_ERROR_EXAMPLE]
    )


def standard_list_schema(
    summary: str,
    description: str,
    tags: list,
    filterset_fields: list = None,
    search_fields: list = None,
    ordering_fields: list = None
):
    """
    Standard schema decorator for list endpoints.

    Args:
        summary: Brief summary of the endpoint
        description: Detailed description
        tags: API tags for grouping
        filterset_fields: Fields available for filtering
        search_fields: Fields available for search
        ordering_fields: Fields available for ordering
    """
    parameters = [
        APIParameters.PAGE_PARAMETER,
        APIParameters.PAGE_SIZE_PARAMETER,
    ]

    if search_fields:
        parameters.append(APIParameters.SEARCH_PARAMETER)

    if ordering_fields:
        parameters.append(APIParameters.ORDERING_PARAMETER)

    if filterset_fields:
        for field in filterset_fields:
            parameters.append(
                OpenApiParameter(
                    name=field,
                    type=OpenApiTypes.STR,
                    location=OpenApiParameter.QUERY,
                    description=f'Filter by {field.replace("_", " ")}'
                )
            )

    return extend_schema(
        summary=summary,
        description=description,
        tags=tags,
        parameters=parameters,
        responses={
            200: APIResponses.SUCCESS_RESPONSE,
            401: APIResponses.UNAUTHORIZED_RESPONSE,
            403: APIResponses.FORBIDDEN_RESPONSE,
            429: APIResponses.RATE_LIMIT_RESPONSE,
        },
        examples=[APIDocumentationExamples.PAGINATED_RESPONSE_EXAMPLE]
    )


def standard_create_schema(summary: str, description: str, tags: list, request_example=None):
    """Standard schema decorator for create endpoints."""
    examples = [request_example] if request_example else []

    return extend_schema(
        summary=summary,
        description=description,
        tags=tags,
        examples=examples,
        responses={
            201: APIResponses.CREATED_RESPONSE,
            400: APIResponses.VALIDATION_ERROR_RESPONSE,
            401: APIResponses.UNAUTHORIZED_RESPONSE,
            403: APIResponses.FORBIDDEN_RESPONSE,
            429: APIResponses.RATE_LIMIT_RESPONSE,
        }
    )


def standard_detail_schema(summary: str, description: str, tags: list, response_example=None):
    """Standard schema decorator for detail endpoints."""
    examples = [response_example] if response_example else []

    return extend_schema(
        summary=summary,
        description=description,
        tags=tags,
        examples=examples,
        responses={
            200: APIResponses.SUCCESS_RESPONSE,
            401: APIResponses.UNAUTHORIZED_RESPONSE,
            403: APIResponses.FORBIDDEN_RESPONSE,
            404: APIResponses.NOT_FOUND_RESPONSE,
            429: APIResponses.RATE_LIMIT_RESPONSE,
        }
    )


def standard_update_schema(summary: str, description: str, tags: list, request_example=None):
    """Standard schema decorator for update endpoints."""
    examples = [request_example] if request_example else []

    return extend_schema(
        summary=summary,
        description=description,
        tags=tags,
        examples=examples,
        responses={
            200: APIResponses.SUCCESS_RESPONSE,
            400: APIResponses.VALIDATION_ERROR_RESPONSE,
            401: APIResponses.UNAUTHORIZED_RESPONSE,
            403: APIResponses.FORBIDDEN_RESPONSE,
            404: APIResponses.NOT_FOUND_RESPONSE,
            429: APIResponses.RATE_LIMIT_RESPONSE,
        }
    )


def standard_delete_schema(summary: str, description: str, tags: list):
    """Standard schema decorator for delete endpoints."""
    return extend_schema(
        summary=summary,
        description=description,
        tags=tags,
        responses={
            204: OpenApiResponse(description="Resource deleted successfully"),
            401: APIResponses.UNAUTHORIZED_RESPONSE,
            403: APIResponses.FORBIDDEN_RESPONSE,
            404: APIResponses.NOT_FOUND_RESPONSE,
            429: APIResponses.RATE_LIMIT_RESPONSE,
        }
    )
