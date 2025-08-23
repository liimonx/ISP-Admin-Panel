# ISP Admin Panel - Backend

A comprehensive Django + Django REST Framework backend for ISP management, featuring customer management, billing, network monitoring, and payment integrations.

## 🚀 Features

- **Django 4.2** with Django REST Framework
- **PostgreSQL** database with django-environ
- **JWT Authentication** with SimpleJWT
- **Role-Based Access Control** (Admin, Support, Accountant)
- **Celery + Redis** for background tasks
- **MikroTik RouterOS API** integration
- **SNMP Monitoring** for network devices
- **Payment Integrations** (Stripe, bKash, SSLCommerz)
- **Swagger/OpenAPI** documentation
- **Docker** containerization

## 📁 Project Structure

```
backend/
├── isp_admin/                 # Django project settings
│   ├── __init__.py
│   ├── settings.py           # Main settings
│   ├── urls.py               # Main URL routing
│   ├── wsgi.py               # WSGI configuration
│   ├── asgi.py               # ASGI configuration
│   └── celery.py             # Celery configuration
├── accounts/                 # User management app
│   ├── models.py             # User model with RBAC
│   ├── serializers.py        # User serializers
│   ├── views.py              # Authentication views
│   ├── urls.py               # Account URLs
│   └── admin.py              # Admin configuration
├── customers/                # Customer management
│   ├── models.py             # Customer model
│   ├── serializers.py        # Customer serializers
│   ├── views.py              # Customer views
│   └── urls.py               # Customer URLs
├── plans/                    # Internet plans
│   ├── models.py             # Plan model
│   ├── serializers.py        # Plan serializers
│   ├── views.py              # Plan views
│   └── urls.py               # Plan URLs
├── subscriptions/            # Customer subscriptions
│   ├── models.py             # Subscription model
│   ├── serializers.py        # Subscription serializers
│   ├── views.py              # Subscription views
│   └── urls.py               # Subscription URLs
├── billing/                  # Billing and invoices
│   ├── models.py             # Invoice/Payment models
│   ├── tasks.py              # Celery billing tasks
│   └── urls.py               # Billing URLs
├── network/                  # Network management
│   ├── models.py             # Router models
│   ├── services.py           # RouterOS integration
│   ├── serializers.py        # Router serializers
│   ├── views.py              # Network views
│   └── urls.py               # Network URLs
├── monitoring/               # Network monitoring
│   ├── models.py             # Monitoring models
│   ├── tasks.py              # SNMP monitoring tasks
│   └── urls.py               # Monitoring URLs
├── payments/                 # Payment integrations
│   └── urls.py               # Payment webhook URLs
├── manage.py                 # Django management
├── requirements.txt          # Python dependencies
├── env.example               # Environment variables template
├── Dockerfile                # Docker configuration
└── nginx.conf                # Nginx configuration
```

## 🛠️ Tech Stack

### Core Framework
- **Django 4.2** - Web framework
- **Django REST Framework 3.14** - API framework
- **PostgreSQL 15** - Database
- **Redis 7** - Cache and message broker

### Authentication & Security
- **SimpleJWT 5.2** - JWT authentication
- **django-cors-headers 4.0** - CORS handling
- **django-environ 0.11** - Environment management

### API Documentation
- **drf-spectacular 0.26** - OpenAPI/Swagger docs

### Background Tasks
- **Celery 5.3** - Task queue
- **Redis** - Message broker

### Network Integration
- **librouteros 3.3** - MikroTik RouterOS API
- **pysnmp 4.4** - SNMP monitoring

### Payment Integrations
- **stripe 5.4** - Stripe payments
- **requests 2.31** - HTTP client for webhooks

### Development & Testing
- **pytest 7.4** - Testing framework
- **pytest-django 4.5** - Django test integration
- **factory-boy 3.3** - Test data factories

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Node.js 18+ (for frontend)

### Development Setup

1. **Clone and setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Environment configuration:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup:**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

4. **Load initial data:**
   ```bash
   python manage.py setup_isp
   ```

5. **Start development server:**
   ```bash
   python manage.py runserver
   ```

6. **Start Celery (in another terminal):**
   ```bash
   celery -A isp_admin worker --loglevel=info
   celery -A isp_admin beat --loglevel=info
   ```

### Docker Setup

1. **Build and run:**
   ```bash
   docker-compose up --build
   ```

2. **Setup initial data:**
   ```bash
   docker-compose exec backend python manage.py setup_isp
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://isp_admin:password@localhost:5432/isp_admin

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=5
JWT_REFRESH_TOKEN_LIFETIME=1

# Payment Providers
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BKASH_APP_KEY=your-bkash-app-key
SSLCOMMERZ_STORE_ID=your-store-id
SSLCOMMERZ_STORE_PASSWORD=your-store-password

# RouterOS Settings
ROUTEROS_DEFAULT_USERNAME=admin
ROUTEROS_DEFAULT_PASSWORD=password

# Email Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Database Configuration

The application uses PostgreSQL with the following default settings:

- **Database**: `isp_admin`
- **User**: `isp_admin`
- **Password**: `isp_admin_password`
- **Host**: `localhost`
- **Port**: `5432`

### Redis Configuration

Redis is used for:
- Celery message broker
- Session storage
- Caching

Default configuration:
- **Host**: `localhost`
- **Port**: `6379`
- **Database**: `0`

## 📊 Models Overview

### Core Models

#### User (accounts)
- **Fields**: username, email, first_name, last_name, role, phone, is_active
- **Roles**: Admin, Support, Accountant
- **Features**: JWT authentication, role-based permissions

#### Customer (customers)
- **Fields**: name, email, phone, address, status, company_name, tax_id, notes
- **Status**: Active, Inactive, Suspended
- **Features**: Search, filtering, bulk operations

#### Plan (plans)
- **Fields**: name, description, download_speed, upload_speed, price, setup_fee, billing_cycle
- **Features**: Speed units, data quotas, feature lists

#### Subscription (subscriptions)
- **Fields**: customer, plan, router, username, password, status, start_date, end_date
- **Status**: Active, Suspended, Expired, Cancelled
- **Features**: Data usage tracking, automatic status updates

#### Router (network)
- **Fields**: name, host, port, username, password, is_active
- **Features**: RouterOS API integration, connection testing

#### Invoice (billing)
- **Fields**: customer, subscription, invoice_number, amount, status, due_date
- **Status**: Draft, Sent, Paid, Overdue, Cancelled
- **Features**: Automatic generation, payment tracking

#### Payment (billing)
- **Fields**: invoice, amount, payment_method, status, external_id
- **Methods**: Stripe, bKash, SSLCommerz
- **Features**: Webhook processing, payment verification

## 🔐 Authentication & Authorization

### JWT Authentication

- **Access Token**: 5 minutes lifetime
- **Refresh Token**: 1 day lifetime
- **Automatic Refresh**: Built-in token refresh mechanism

### Role-Based Access Control

#### Admin Role
- Full system access
- User management
- System configuration
- All CRUD operations

#### Support Role
- Customer management
- Subscription management
- Network monitoring
- Limited billing access

#### Accountant Role
- Billing management
- Payment processing
- Financial reports
- Limited customer access

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/me/` - Current user info

### Customers
- `GET /api/customers/` - List customers
- `POST /api/customers/` - Create customer
- `GET /api/customers/{id}/` - Customer details
- `PUT /api/customers/{id}/` - Update customer
- `DELETE /api/customers/{id}/` - Delete customer
- `GET /api/customers/search/` - Search customers
- `GET /api/customers/stats/` - Customer statistics

### Plans
- `GET /api/plans/` - List plans
- `POST /api/plans/` - Create plan
- `GET /api/plans/{id}/` - Plan details
- `PUT /api/plans/{id}/` - Update plan
- `DELETE /api/plans/{id}/` - Delete plan
- `GET /api/plans/active/` - Active plans
- `GET /api/plans/featured/` - Featured plans

### Subscriptions
- `GET /api/subscriptions/` - List subscriptions
- `POST /api/subscriptions/` - Create subscription
- `GET /api/subscriptions/{id}/` - Subscription details
- `PUT /api/subscriptions/{id}/` - Update subscription
- `PATCH /api/subscriptions/{id}/status/` - Update status
- `GET /api/subscriptions/active/` - Active subscriptions
- `GET /api/subscriptions/suspended/` - Suspended subscriptions

### Network
- `GET /api/network/routers/` - List routers
- `POST /api/network/routers/` - Create router
- `GET /api/network/routers/{id}/` - Router details
- `POST /api/network/routers/{id}/test-connection/` - Test connection
- `GET /api/network/routers/{id}/sessions/` - Active sessions
- `GET /api/network/routers/{id}/pppoe-users/` - PPPoE users

### Billing
- `GET /api/billing/invoices/` - List invoices
- `GET /api/billing/invoices/{id}/` - Invoice details
- `GET /api/billing/payments/` - List payments
- `GET /api/billing/payments/{id}/` - Payment details
- `GET /api/billing/invoices/stats/` - Invoice statistics

### Monitoring
- `GET /api/monitoring/stats/` - System statistics
- `GET /api/monitoring/routers/{id}/` - Router monitoring data

### Users (Admin Only)
- `GET /api/auth/users/` - List users
- `POST /api/auth/users/create/` - Create user
- `GET /api/auth/users/{id}/` - User details
- `PUT /api/auth/users/{id}/` - Update user
- `DELETE /api/auth/users/{id}/` - Delete user

## 🔄 Background Tasks

### Celery Tasks

#### Billing Tasks
- `generate_monthly_invoices` - Generate monthly invoices
- `enforce_overdue_invoices` - Suspend overdue subscriptions
- `reactivate_paid_subscriptions` - Reactivate paid subscriptions
- `send_payment_reminders` - Send payment reminders

#### Monitoring Tasks
- `poll_snmp_usage` - Poll router SNMP data
- `create_snmp_snapshot` - Create monitoring snapshots
- `check_router_status` - Check router connectivity

#### Maintenance Tasks
- `cleanup_old_invoices` - Clean up old invoice data
- `cleanup_old_snapshots` - Clean up old monitoring data

### Scheduled Tasks

Configured in `settings.py`:

```python
CELERY_BEAT_SCHEDULE = {
    'generate-monthly-invoices': {
        'task': 'billing.tasks.generate_monthly_invoices',
        'schedule': crontab(day=1, hour=0, minute=0),  # Monthly
    },
    'enforce-overdue-invoices': {
        'task': 'billing.tasks.enforce_overdue_invoices',
        'schedule': crontab(minute=0),  # Hourly
    },
    'poll-snmp-usage': {
        'task': 'monitoring.tasks.poll_snmp_usage',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
}
```

## 🌐 Network Integration

### MikroTik RouterOS Integration

The `RouterOSService` class provides:

- **Connection Management**: Connect/disconnect to routers
- **PPPoE User Management**: Create, enable, disable users
- **Queue Management**: Bandwidth control
- **Session Monitoring**: Active connection tracking
- **System Resources**: CPU, memory, disk monitoring

### SNMP Monitoring

SNMP polling for:
- **System Resources**: CPU, memory, disk usage
- **Interface Statistics**: Bytes in/out, packet counts
- **Network Performance**: Bandwidth utilization
- **Device Health**: Temperature, uptime

## 💳 Payment Integrations

### Supported Providers

#### Stripe
- **Webhook Processing**: Automatic payment confirmation
- **Subscription Management**: Recurring billing
- **Payment Methods**: Cards, digital wallets

#### bKash
- **Mobile Banking**: Bangladesh mobile payments
- **Webhook Processing**: Payment verification
- **Transaction Tracking**: Payment status updates

#### SSLCommerz
- **Bangladesh Payments**: Local payment gateway
- **Multiple Methods**: Cards, mobile banking, internet banking
- **Webhook Processing**: Payment confirmation

### Webhook Endpoints

- `POST /api/payments/stripe/webhook/` - Stripe webhooks
- `POST /api/payments/bkash/webhook/` - bKash webhooks
- `POST /api/payments/sslcommerz/webhook/` - SSLCommerz webhooks

## 📚 API Documentation

### Swagger UI
Access the interactive API documentation at:
```
http://localhost:8000/api/schema/swagger-ui/
```

### ReDoc
Alternative documentation format:
```
http://localhost:8000/api/schema/redoc/
```

### OpenAPI Schema
Raw OpenAPI schema:
```
http://localhost:8000/api/schema/
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pytest

# Run specific app tests
pytest accounts/
pytest customers/

# Run with coverage
pytest --cov=.

# Run specific test file
pytest tests/test_models.py
```

### Test Structure

```
tests/
├── conftest.py              # Test configuration
├── factories.py             # Test data factories
├── test_models.py           # Model tests
├── test_views.py            # View tests
├── test_serializers.py      # Serializer tests
└── test_integration.py      # Integration tests
```

## 🚀 Deployment

### Docker Deployment

1. **Build and run:**
   ```bash
   docker-compose up --build -d
   ```

2. **Run migrations:**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

3. **Create superuser:**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

4. **Load initial data:**
   ```bash
   docker-compose exec backend python manage.py setup_isp
   ```

### Production Settings

For production deployment:

1. **Set environment variables:**
   ```env
   DEBUG=False
   SECRET_KEY=your-production-secret-key
   ALLOWED_HOSTS=your-domain.com
   ```

2. **Configure database:**
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

3. **Set up SSL certificates**
4. **Configure backup strategy**
5. **Set up monitoring and logging**

## 🔍 Monitoring & Logging

### Health Checks

- **Application Health**: `GET /health/`
- **Database Health**: Automatic database connectivity checks
- **Redis Health**: Celery worker health monitoring

### Logging Configuration

Configured logging levels:
- **DEBUG**: Development debugging
- **INFO**: General application info
- **WARNING**: Warning messages
- **ERROR**: Error messages
- **CRITICAL**: Critical system errors

### Performance Monitoring

- **Database Queries**: Query optimization and monitoring
- **API Response Times**: Endpoint performance tracking
- **Background Tasks**: Celery task monitoring
- **System Resources**: CPU, memory, disk usage

## 🔧 Management Commands

### Available Commands

```bash
# Setup initial ISP data
python manage.py setup_isp

# Generate test data
python manage.py generate_test_data

# Clean up old data
python manage.py cleanup_old_data

# Sync router data
python manage.py sync_router_data

# Export data
python manage.py export_customers
python manage.py export_invoices
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards

- **PEP 8** - Python code style
- **Django Best Practices** - Django conventions
- **Type Hints** - Type annotations where appropriate
- **Docstrings** - Comprehensive documentation

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
