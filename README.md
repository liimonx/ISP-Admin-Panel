# ISP Admin Panel

A comprehensive ISP (Internet Service Provider) management system with Django backend and React frontend, featuring customer management, billing, network monitoring, and payment integrations.

## 🚀 Features

### Backend (Django)
- **Django 4.2** with Django REST Framework
- **PostgreSQL** database with django-environ
- **JWT Authentication** with SimpleJWT
- **Role-Based Access Control** (Admin, Support, Accountant)
- **Celery + Redis** for background tasks
- **MikroTik RouterOS API** integration
- **SNMP Monitoring** for network devices
- **Payment Integrations** (Stripe, bKash, SSLCommerz)
- **Swagger/OpenAPI** documentation

### Frontend (React)
- **React 18** with TypeScript
- **Atomix Design System** for consistent UI
- **React Query** for server state management
- **React Hook Form** with Yup validation
- **React Router** for client-side routing
- **Dark Mode** with ISP branding
- **Responsive Design** for all screen sizes

## 📁 Project Structure

```
isp-admin-panel/
├── backend/                   # Django backend
│   ├── isp_admin/            # Django project settings
│   ├── accounts/             # User management
│   ├── customers/            # Customer management
│   ├── plans/                # Internet plans
│   ├── subscriptions/        # Customer subscriptions
│   ├── billing/              # Billing and invoices
│   ├── network/              # Network management
│   ├── monitoring/           # Network monitoring
│   ├── payments/             # Payment integrations
│   ├── manage.py             # Django management
│   ├── requirements.txt      # Python dependencies
│   ├── env.example           # Environment template
│   ├── Dockerfile            # Backend Docker config
│   └── nginx.conf            # Backend nginx config
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # Utility functions
│   │   ├── types/            # TypeScript types
│   │   ├── context/          # React context
│   │   └── styles/           # Global styles
│   ├── package.json          # Node dependencies
│   ├── tsconfig.json         # TypeScript config
│   ├── vite.config.ts        # Vite config
│   ├── Dockerfile            # Frontend Docker config
│   └── nginx.conf            # Frontend nginx config
├── docker-compose.yml         # Main Docker Compose
├── nginx.conf                 # Root nginx reverse proxy
└── README.md                  # This file
```

## 🛠️ Tech Stack

### Backend
- **Django 4.2** - Web framework
- **Django REST Framework 3.14** - API framework
- **PostgreSQL 15** - Database
- **Redis 7** - Cache and message broker
- **Celery 5.3** - Background tasks
- **SimpleJWT 5.2** - JWT authentication
- **drf-spectacular 0.26** - API documentation

### Frontend
- **React 18.2.0** - UI library
- **TypeScript 4.9.3** - Type safety
- **Vite 4.2.0** - Build tool
- **React Query 4.29.5** - Server state management
- **React Hook Form 7.43.5** - Form management
- **Atomix Design System** - UI components
- **React Router 6.8.1** - Client-side routing

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file serving
- **PostgreSQL** - Database
- **Redis** - Cache and message broker

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose**
- **Node.js 18+** (for local frontend development)
- **Python 3.11+** (for local backend development)

### Docker Setup (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd isp-admin-panel
   ```

2. **Set up environment variables:**
   ```bash
   cp backend/env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Build and start all services:**
   ```bash
   docker-compose up --build -d
   ```

4. **Setup initial data:**
   ```bash
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py setup_isp
   ```

5. **Access the application:**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **Admin Interface**: http://localhost:8000/admin
   - **API Documentation**: http://localhost:8000/api/schema/swagger-ui/

### Local Development Setup

#### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Setup database:**
   ```bash
   python manage.py migrate
   python manage.py setup_isp
   ```

6. **Start development server:**
   ```bash
   python manage.py runserver
   ```

7. **Start Celery (in another terminal):**
   ```bash
   celery -A isp_admin worker --loglevel=info
   celery -A isp_admin beat --loglevel=info
   ```

#### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
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

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=ISP Admin Panel
```

## 📊 Core Features

### Customer Management
- **Customer Profiles**: Complete customer information management
- **Search & Filter**: Advanced customer search and filtering
- **Bulk Operations**: Mass customer operations
- **Status Tracking**: Active, inactive, suspended statuses

### Plan Management
- **Internet Plans**: Speed, pricing, and feature management
- **Plan Comparison**: Side-by-side plan comparison
- **Feature Lists**: Detailed plan features and benefits
- **Pricing Tiers**: Multiple pricing options

### Subscription Management
- **Customer Subscriptions**: Link customers to plans
- **Status Management**: Active, suspended, expired, cancelled
- **Data Usage Tracking**: Monitor customer data consumption
- **Automatic Updates**: Status updates based on billing

### Billing & Payments
- **Invoice Generation**: Automatic monthly invoice generation
- **Payment Tracking**: Multiple payment method support
- **Overdue Management**: Automatic subscription suspension
- **Payment Integrations**: Stripe, bKash, SSLCommerz

### Network Management
- **Router Management**: MikroTik router configuration
- **PPPoE Users**: User management on routers
- **Connection Monitoring**: Real-time connection status
- **Bandwidth Control**: Queue management for bandwidth

### Network Monitoring
- **SNMP Polling**: System resource monitoring
- **Performance Metrics**: CPU, memory, disk usage
- **Interface Statistics**: Network interface monitoring
- **Health Checks**: Router and service health monitoring

### User Management
- **Role-Based Access**: Admin, Support, Accountant roles
- **Permission Control**: Feature-level access control
- **JWT Authentication**: Secure token-based authentication
- **Session Management**: Automatic session handling

## 🔐 Authentication & Authorization

### User Roles

#### Admin
- Full system access
- User management
- System configuration
- All CRUD operations

#### Support
- Customer management
- Subscription management
- Network monitoring
- Limited billing access

#### Accountant
- Billing management
- Payment processing
- Financial reports
- Limited customer access

### JWT Authentication
- **Access Token**: 5 minutes lifetime
- **Refresh Token**: 1 day lifetime
- **Automatic Refresh**: Built-in token refresh mechanism

## 📡 API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/api/schema/swagger-ui/
- **ReDoc**: http://localhost:8000/api/schema/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

### Key Endpoints

#### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `GET /api/auth/me/` - Current user info

#### Customers
- `GET /api/customers/` - List customers
- `POST /api/customers/` - Create customer
- `GET /api/customers/{id}/` - Customer details

#### Plans
- `GET /api/plans/` - List plans
- `POST /api/plans/` - Create plan
- `GET /api/plans/{id}/` - Plan details

#### Subscriptions
- `GET /api/subscriptions/` - List subscriptions
- `POST /api/subscriptions/` - Create subscription
- `PATCH /api/subscriptions/{id}/status/` - Update status

## 🔄 Background Tasks

### Automated Tasks
- **Monthly Invoice Generation**: Automatic invoice creation
- **Overdue Enforcement**: Suspend overdue subscriptions
- **Payment Processing**: Reactivate paid subscriptions
- **SNMP Monitoring**: Network device polling
- **Data Cleanup**: Old data maintenance

### Task Scheduling
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

## 🎨 Design System

The frontend uses the **Atomix Design System** for consistent UI components:

### Color Palette
- **Primary**: `#7AFFD7` (Cyan)
- **Secondary**: `#1AFFD2` (Light Cyan)
- **Success**: `#4DFF9F` (Green)
- **Error**: `#DD6061` (Red)
- **Background**: `#000000` (Black)
- **Surface**: `#212121` (Dark Gray)

### Components
- **40+ Components** - Comprehensive UI library
- **Design Tokens** - Consistent spacing and typography
- **Accessibility First** - WCAG 2.1 AA compliant
- **Dark Mode** - Built-in theme switching
- **Responsive** - Mobile-first design approach

## 🚀 Deployment

### Production Deployment

1. **Set production environment variables:**
   ```env
   DEBUG=False
   SECRET_KEY=your-production-secret-key
   ALLOWED_HOSTS=your-domain.com
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

2. **Build and deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

3. **Setup SSL certificates**
4. **Configure backup strategy**
5. **Set up monitoring and logging**

### Docker Services

- **backend**: Django application (port 8000)
- **frontend**: React application (port 3000)
- **db**: PostgreSQL database (port 5432)
- **redis**: Redis cache and message broker (port 6379)
- **celery_worker**: Background task worker
- **celery_beat**: Task scheduler
- **nginx**: Reverse proxy (port 80)

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest
pytest --cov=.
```

### Frontend Testing
```bash
cd frontend
npm test
npm run test:coverage
```

## 🔍 Monitoring & Health Checks

### Health Endpoints
- **Application Health**: `GET /health/`
- **Database Health**: Automatic connectivity checks
- **Redis Health**: Celery worker monitoring

### Performance Monitoring
- **Database Queries**: Query optimization
- **API Response Times**: Endpoint performance
- **Background Tasks**: Celery task monitoring
- **System Resources**: CPU, memory, disk usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards

#### Backend
- **PEP 8** - Python code style
- **Django Best Practices** - Django conventions
- **Type Hints** - Type annotations
- **Docstrings** - Comprehensive documentation

#### Frontend
- **ESLint** - Code linting
- **TypeScript** - Type safety
- **Prettier** - Code formatting
- **React Best Practices** - React conventions

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Atomix Design System](https://github.com/Shohojdhara/atomix)
- [Docker Documentation](https://docs.docker.com/)

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the respective directories
- Review the API documentation at `/api/schema/swagger-ui/`
