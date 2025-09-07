# ISP Admin Panel - Backend API Integration Guide

## Overview

This guide provides comprehensive information about the backend API structure, data models, and integration points for the frontend application.

## API Base URL

```
http://localhost:8000/api/
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Authentication Endpoints

- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/me/` - Get current user info

## Standardized Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { /* response data */ },
  "timestamp": "2024-01-01T00:00:00Z",
  "pagination": { /* pagination info if applicable */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "timestamp": "2024-01-01T00:00:00Z",
  "errors": { /* detailed error information */ },
  "error_code": "ERROR_CODE"
}
```

## Core Data Models

### User Model
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string; // computed field
  role: "admin" | "support" | "accountant";
  phone?: string;
  is_active: boolean;
  date_joined: string;
  created_at: string;
}
```

### Customer Model
```typescript
interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  company_name?: string;
  tax_id?: string;
  status: "active" | "inactive" | "suspended" | "cancelled";
  notes?: string;
  full_address: string; // computed field
  is_active: boolean; // computed field
  is_suspended: boolean; // computed field
  subscriptions_count: number; // computed field
  active_subscriptions_count: number; // computed field
  total_monthly_bill: number; // computed field
  created_at: string;
  updated_at: string;
}
```

### Plan Model
```typescript
interface Plan {
  id: number;
  name: string;
  description?: string;
  download_speed: number;
  upload_speed: number;
  speed_unit: "mbps" | "gbps";
  data_quota?: number;
  quota_unit: "gb" | "tb" | "unlimited";
  price: number;
  setup_fee: number;
  billing_cycle: "monthly" | "quarterly" | "yearly";
  is_active: boolean;
  is_featured: boolean;
  is_popular: boolean;
  features: string[];
  formatted_speed: string; // computed field
  formatted_quota: string; // computed field
  formatted_price: string; // computed field
  is_unlimited: boolean; // computed field
  active_subscriptions_count: number; // computed field
  total_revenue: number; // computed field
  subscribers_count: number; // computed field
  active_subscribers_count: number; // computed field
  monthly_revenue: number; // computed field
  created_at: string;
  updated_at: string;
}
```

### Subscription Model
```typescript
interface Subscription {
  id: number;
  customer: Customer;
  plan: Plan;
  router: Router;
  username: string;
  access_method: "pppoe" | "static_ip" | "dhcp";
  static_ip?: string;
  mac_address?: string;
  status: "active" | "inactive" | "suspended" | "cancelled" | "pending";
  start_date: string;
  end_date?: string;
  monthly_fee: number;
  setup_fee: number;
  data_used: number;
  data_reset_date?: string;
  notes?: string;
  is_active: boolean; // computed field
  is_suspended: boolean; // computed field
  is_expired: boolean; // computed field
  days_remaining?: number; // computed field
  data_remaining?: number; // computed field
  data_usage_percentage: number; // computed field
  monthly_fee_float: number; // computed field
  setup_fee_float: number; // computed field
  data_used_float: number; // computed field
  created_at: string;
  updated_at: string;
}
```

### Router Model
```typescript
interface Router {
  id: number;
  name: string;
  description?: string;
  router_type: "mikrotik" | "cisco" | "other";
  host: string;
  api_port: number;
  ssh_port: number;
  username: string;
  use_tls: boolean;
  status: "online" | "offline" | "maintenance";
  last_seen?: string;
  location?: string;
  coordinates?: string;
  snmp_community: string;
  snmp_port: number;
  notes?: string;
  is_online: boolean; // computed field
  is_mikrotik: boolean; // computed field
  api_url: string; // computed field
  active_subscriptions_count: number; // computed field
  total_bandwidth_usage: number; // computed field
  subscriptions_count: number; // computed field
  total_bandwidth_usage_float: number; // computed field
  created_at: string;
  updated_at: string;
}
```

### Invoice Model
```typescript
interface Invoice {
  id: number;
  customer: Customer;
  subscription?: Subscription;
  invoice_number: string;
  invoice_type: "monthly" | "setup" | "adjustment" | "other";
  billing_period_start: string;
  billing_period_end: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
  issue_date: string;
  due_date: string;
  paid_date?: string;
  notes?: string;
  days_overdue: number; // computed field
  balance_due: number; // computed field
  is_overdue: boolean; // computed field
  is_paid: boolean; // computed field
  subtotal_float: number; // computed field
  tax_amount_float: number; // computed field
  discount_amount_float: number; // computed field
  total_amount_float: number; // computed field
  paid_amount_float: number; // computed field
  balance_due_float: number; // computed field
  created_at: string;
  updated_at: string;
}
```

### Payment Model
```typescript
interface Payment {
  id: number;
  customer: Customer;
  invoice: Invoice;
  payment_number: string;
  amount: number;
  payment_method: "cash" | "bank_transfer" | "bkash" | "nagad" | "rocket" | "sslcommerz" | "stripe" | "other";
  status: "pending" | "completed" | "failed" | "cancelled" | "refunded";
  payment_date?: string;
  external_id?: string;
  transaction_id?: string;
  notes?: string;
  is_completed: boolean; // computed field
  is_failed: boolean; // computed field
  amount_float: number; // computed field
  created_at: string;
  updated_at: string;
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/me/` - Get current user

### Users
- `GET /api/auth/users/` - List users (Admin only)
- `POST /api/auth/users/` - Create user (Admin only)
- `GET /api/auth/users/{id}/` - Get user details (Admin only)
- `PUT/PATCH /api/auth/users/{id}/` - Update user (Admin only)
- `DELETE /api/auth/users/{id}/` - Delete user (Admin only)
- `POST /api/auth/change-password/` - Change password
- `PUT/PATCH /api/auth/profile/` - Update profile

### Customers
- `GET /api/customers/` - List customers
- `POST /api/customers/` - Create customer
- `GET /api/customers/{id}/` - Get customer details
- `PUT/PATCH /api/customers/{id}/` - Update customer
- `DELETE /api/customers/{id}/` - Delete customer

### Plans
- `GET /api/plans/` - List plans
- `POST /api/plans/` - Create plan
- `GET /api/plans/{id}/` - Get plan details
- `PUT/PATCH /api/plans/{id}/` - Update plan
- `DELETE /api/plans/{id}/` - Delete plan

### Subscriptions
- `GET /api/subscriptions/` - List subscriptions
- `POST /api/subscriptions/` - Create subscription
- `GET /api/subscriptions/{id}/` - Get subscription details
- `PUT/PATCH /api/subscriptions/{id}/` - Update subscription
- `DELETE /api/subscriptions/{id}/` - Delete subscription
- `POST /api/subscriptions/{id}/activate/` - Activate subscription
- `POST /api/subscriptions/{id}/suspend/` - Suspend subscription
- `POST /api/subscriptions/{id}/cancel/` - Cancel subscription
- `POST /api/subscriptions/{id}/reset-data/` - Reset data usage

### Routers
- `GET /api/network/routers/` - List routers
- `POST /api/network/routers/` - Create router
- `GET /api/network/routers/{id}/` - Get router details
- `PUT/PATCH /api/network/routers/{id}/` - Update router
- `DELETE /api/network/routers/{id}/` - Delete router
- `POST /api/network/routers/{id}/test-connection/` - Test router connection

### Billing
- `GET /api/billing/invoices/` - List invoices
- `POST /api/billing/invoices/` - Create invoice
- `GET /api/billing/invoices/{id}/` - Get invoice details
- `PUT/PATCH /api/billing/invoices/{id}/` - Update invoice
- `DELETE /api/billing/invoices/{id}/` - Delete invoice
- `POST /api/billing/invoices/{id}/mark-paid/` - Mark invoice as paid
- `POST /api/billing/invoices/{id}/mark-overdue/` - Mark invoice as overdue

### Payments
- `GET /api/payments/payments/` - List payments
- `POST /api/payments/payments/` - Create payment
- `GET /api/payments/payments/{id}/` - Get payment details
- `PUT/PATCH /api/payments/payments/{id}/` - Update payment
- `DELETE /api/payments/payments/{id}/` - Delete payment
- `POST /api/payments/payments/{id}/mark-completed/` - Mark payment as completed
- `POST /api/payments/payments/{id}/mark-failed/` - Mark payment as failed
- `POST /api/payments/payments/{id}/mark-refunded/` - Mark payment as refunded

### Dashboard & Statistics
- `GET /api/core/dashboard/stats/` - Get dashboard statistics
- `GET /api/core/stats/customers/` - Get customer statistics
- `GET /api/core/stats/subscriptions/` - Get subscription statistics
- `GET /api/core/stats/plans/` - Get plan statistics
- `GET /api/core/stats/routers/` - Get router statistics
- `GET /api/core/stats/invoices/` - Get invoice statistics
- `GET /api/core/stats/payments/` - Get payment statistics
- `GET /api/core/stats/all/` - Get all statistics in one request
- `GET /api/core/trends/monthly/` - Get monthly trends
- `GET /api/core/trends/daily/` - Get daily trends
- `GET /api/core/analytics/payment-methods/` - Get payment method statistics
- `GET /api/core/analytics/top-customers/` - Get top customers

## Dashboard Statistics Response

The `/api/core/stats/all/` endpoint returns comprehensive statistics:

```typescript
interface AllStats {
  dashboard: {
    total_customers: number;
    active_customers: number;
    total_subscriptions: number;
    active_subscriptions: number;
    total_monthly_revenue: number;
    total_monthly_revenue_float: number;
    total_routers: number;
    online_routers: number;
    total_invoices: number;
    pending_invoices: number;
    overdue_invoices: number;
    total_payments: number;
    successful_payments: number;
  };
  customers: {
    total_customers: number;
    active_customers: number;
    inactive_customers: number;
    suspended_customers: number;
    cancelled_customers: number;
    new_customers_this_month: number;
    customers_with_active_subscriptions: number;
  };
  subscriptions: {
    total_subscriptions: number;
    active_subscriptions: number;
    inactive_subscriptions: number;
    suspended_subscriptions: number;
    cancelled_subscriptions: number;
    pending_subscriptions: number;
    new_subscriptions_this_month: number;
    total_monthly_revenue: number;
    total_monthly_revenue_float: number;
  };
  plans: {
    total_plans: number;
    active_plans: number;
    featured_plans: number;
    popular_plans: number;
    most_popular_plan: string;
    highest_revenue_plan: string;
    total_monthly_revenue: number;
    total_monthly_revenue_float: number;
  };
  routers: {
    total_routers: number;
    online_routers: number;
    offline_routers: number;
    maintenance_routers: number;
    mikrotik_routers: number;
    cisco_routers: number;
    other_routers: number;
    total_bandwidth_usage: number;
    total_bandwidth_usage_float: number;
  };
  invoices: {
    total_invoices: number;
    pending_invoices: number;
    paid_invoices: number;
    overdue_invoices: number;
    cancelled_invoices: number;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    overdue_amount: number;
    avg_invoice_amount: number;
    collection_rate: number;
    total_amount_float: number;
    paid_amount_float: number;
    pending_amount_float: number;
    overdue_amount_float: number;
    avg_invoice_amount_float: number;
  };
  payments: {
    total_payments: number;
    successful_payments: number;
    failed_payments: number;
    pending_payments: number;
    total_amount: number;
    successful_amount: number;
    avg_payment_amount: number;
    success_rate: number;
    total_amount_float: number;
    successful_amount_float: number;
    avg_payment_amount_float: number;
  };
  monthly_trends: Array<{
    month: string;
    year: number;
    invoice_count: number;
    total_amount: number;
    paid_amount: number;
    payment_count: number;
    successful_payment_count: number;
    total_amount_float: number;
    paid_amount_float: number;
  }>;
  daily_trends: Array<{
    date: string;
    payment_count: number;
    total_amount: number;
    successful_count: number;
    invoice_count: number;
    total_amount_float: number;
  }>;
  payment_methods: Array<{
    method: string;
    count: number;
    total_amount: number;
    success_rate: number;
    total_amount_float: number;
  }>;
  top_customers: Array<{
    customer_id: number;
    customer_name: string;
    total_amount: number;
    invoice_count: number;
    subscription_count: number;
    total_amount_float: number;
  }>;
}
```

## Error Handling

The API uses standardized error codes:

- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Permission denied
- `METHOD_NOT_ALLOWED` - HTTP method not allowed
- `THROTTLED` - Rate limit exceeded
- `PARSE_ERROR` - Malformed request data
- `UNSUPPORTED_MEDIA_TYPE` - Unsupported content type
- `NOT_ACCEPTABLE` - Cannot satisfy Accept header
- `INTEGRITY_ERROR` - Database constraint violation
- `BUSINESS_LOGIC_ERROR` - Business rule violation
- `RESOURCE_CONFLICT` - Resource conflict
- `EXTERNAL_SERVICE_ERROR` - External service failure
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `INTERNAL_ERROR` - Internal server error

## Pagination

List endpoints support pagination with the following query parameters:

- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20, max: 100)

Pagination response format:
```json
{
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_items": 200,
    "page_size": 20,
    "has_next": true,
    "has_previous": false,
    "next_page": 2,
    "previous_page": null
  }
}
```

## Filtering and Search

Most list endpoints support filtering and search:

- `GET /api/customers/?status=active` - Filter by status
- `GET /api/customers/?search=john` - Search by name/email
- `GET /api/subscriptions/?customer=1` - Filter by customer
- `GET /api/invoices/?status=pending&customer=1` - Multiple filters

## Health Check

- `GET /api/health/` - Basic health check
- `GET /api/health/detailed/` - Detailed health check
- `GET /api/health/ready/` - Readiness check
- `GET /api/health/live/` - Liveness check

## API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- OpenAPI Schema: `http://localhost:8000/api/schema/`

## Frontend Integration Tips

1. **Use the standardized response format** - All responses follow the same structure
2. **Handle errors consistently** - Check the `success` field and handle `errors` appropriately
3. **Use computed fields** - Many models provide computed fields for common operations
4. **Leverage the dashboard stats endpoint** - Use `/api/core/stats/all/` for comprehensive dashboard data
5. **Implement proper authentication** - Store and refresh JWT tokens appropriately
6. **Use pagination** - Implement pagination for large datasets
7. **Handle loading states** - Use the standardized response format to show loading states
8. **Validate data types** - The API provides both decimal and float versions of numeric fields

## Testing

You can test the API using:

1. **Swagger UI** - Interactive documentation at `/api/docs/`
2. **curl** - Command line testing
3. **Postman** - API testing tool
4. **Frontend application** - Direct integration testing

Example curl commands:

```bash
# Health check
curl -X GET http://localhost:8000/api/health/

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# Get dashboard stats (with authentication)
curl -X GET http://localhost:8000/api/core/stats/all/ \
  -H "Authorization: Bearer <access_token>"
```

This comprehensive API provides all the functionality needed for a robust ISP admin panel with proper error handling, data validation, and frontend integration support.
