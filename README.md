# ISP Admin - Internet Service Provider Management System

A comprehensive web-based management system for Internet Service Providers (ISPs) built with Django REST Framework backend and React frontend.

## 🚀 Features

### Core Functionality

- **Customer Management**: Complete customer lifecycle management
- **Subscription Management**: Plan-based subscription system with automated billing
- **Network Management**: Router and network infrastructure monitoring
- **Billing & Payments**: Automated invoicing and payment processing
- **Reports & Analytics**: Comprehensive reporting and dashboard analytics
- **User Management**: Role-based access control and authentication

### Technical Features

- **Modern Architecture**: Microservices-based architecture with Docker
- **Real-time Monitoring**: Live network status and performance metrics
- **API-First Design**: RESTful APIs with comprehensive documentation
- **Responsive UI**: Modern, mobile-friendly user interface
- **Security**: JWT authentication, HTTPS, and security best practices
- **Scalability**: Horizontal scaling with load balancing

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Django)      │◄──►│   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   Redis         │    │   Celery        │
│   (Reverse      │    │   (Cache)       │    │   (Background   │
│   Proxy)        │    │   Port: 6379    │    │   Tasks)        │
│   Port: 80      │    └─────────────────┘    └─────────────────┘
└─────────────────┘
```

## 🛠️ Technology Stack

### Backend

- **Framework**: Django 4.2+ with Django REST Framework
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Task Queue**: Celery with Redis broker
- **Authentication**: JWT with djangorestframework-simplejwt
- **API Documentation**: Django REST Framework browsable API

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Custom Atomix Design System
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Styling**: SCSS with CSS Modules

### Infrastructure

- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx
- **Process Management**: Gunicorn
- **Monitoring**: Health checks and logging
- **Security**: HTTPS, CORS, CSRF protection

## 📦 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bcn
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Start with Docker (Recommended)

```bash
# Build and start all services
./build-all.sh
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Access the Application

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Admin Panel**: [http://localhost:8000/admin](http://localhost:8000/admin)

## 🔧 Development Setup

### Docker Development Setup

For local development with Docker, follow these steps:

1. **Prerequisites**:
   - Install [Docker](https://www.docker.com/products/docker-desktop/)
   - Install [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

2. **Setup**:
   ```bash
   # Make the setup script executable (if not already)
   chmod +x setup-docker-dev.sh
   
   # Run the Docker development setup
   ./setup-docker-dev.sh
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin
   - Combined via Nginx: http://localhost

4. **Useful Docker commands**:
   ```bash
   # View logs
   docker-compose logs -f
   
   # View specific service logs
   docker-compose logs -f backend
   
   # Run Django commands
   docker-compose exec backend python manage.py [command]
   
   # Stop services
   docker-compose down
   
   # Stop and remove volumes (resets database)
   docker-compose down -v
   
   # Rebuild services
   docker-compose build
   ```

5. **Configuration**:
   - The `.env` file contains your development configuration
   - Database data is persisted in Docker volumes
   - Static and media files are mounted from your local directories

6. **Alternative frontend development**:
   You can also run the frontend locally with hot reloading:
   ```bash
   cd frontend
   npm run dev
   ```
   This will proxy API requests to http://localhost:8000 automatically.

### Local Development

```bash
# Setup development environment
./setup-dev.sh

# Start backend (Terminal 1)
cd backend
source venv/bin/activate
python manage.py runserver

# Start frontend (Terminal 2)
cd frontend
npm run dev
```

### Available Scripts

#### Build Scripts

- `./build-all.sh` - Build all Docker images
- `./build-frontend.sh` - Build frontend only
- `./setup-dev.sh` - Setup development environment
- `./deploy.sh` - Production deployment

#### Frontend Scripts

```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

#### Backend Scripts

```bash
cd backend
python manage.py runserver     # Start development server
python manage.py migrate       # Run database migrations
python manage.py collectstatic # Collect static files
python manage.py createsuperuser # Create admin user
```

## 📁 Project Structure

```
bcn/
├── backend/                 # Django backend
│   ├── accounts/           # User management
│   ├── billing/            # Billing and invoicing
│   ├── customers/          # Customer management
│   ├── network/            # Network and router management
│   ├── plans/              # Subscription plans
│   ├── subscriptions/      # Subscription management
│   ├── payments/           # Payment processing
│   ├── monitoring/         # System monitoring
│   ├── reports/            # Reporting system
│   ├── core/               # Core utilities
│   └── isp_admin/          # Django project settings
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   └── dist/               # Build output
├── nginx/                  # Nginx configuration
├── ssl/                    # SSL certificates
├── docker-compose.yml      # Docker Compose configuration
├── .env                    # Environment configuration (single file for dev)
├── .env.example            # Environment configuration template
├── build-all.sh           # Build script
├── setup-dev.sh           # Development setup
├── setup-docker-dev.sh    # Docker development setup
├── deploy.sh              # Deployment script
└── README.md              # This file
```

## 🔐 Environment Configuration

### Single Environment File Approach

The project uses a single `.env` file for both local and Docker development:

- **For Docker**: Uses PostgreSQL with credentials from `.env`
- **For local development**: Set `USE_POSTGRES=false` in `.env` to use SQLite instead

### Required Environment Variables

Create a `.env` file in the project root by copying the example:

```bash
cp .env.example .env
```

Key environment variables in `.env`:

```env
# Database Configuration
POSTGRES_DB=isp_admin
POSTGRES_USER=isp_admin
POSTGRES_PASSWORD=your_secure_password
USE_POSTGRES=true  # Set to false to use SQLite for local development

# Django Configuration
SECRET_KEY=your_secret_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Main Router Configuration
MAIN_ROUTER_IP=103.115.252.60
MAIN_ROUTER_API_PORT=8728
MAIN_ROUTER_SSH_PORT=22
MAIN_ROUTER_USERNAME=admin
MAIN_ROUTER_PASSWORD=your_router_password
MAIN_ROUTER_USE_TLS=True

# Network Configuration
ROUTER_API_TIMEOUT=30
ROUTER_CONNECTION_RETRIES=3
ROUTER_HEALTH_CHECK_INTERVAL=300
```

## 🚀 Deployment

### Production Deployment

```bash
# Full deployment with backup
./deploy.sh

# Or step by step
./build-all.sh
docker-compose up -d
```

### Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up
docker-compose down -v --rmi all
```

## 📊 API Documentation

### Authentication

- **Login**: `POST /api/auth/login/`
- **Logout**: `POST /api/auth/logout/`
- **Refresh Token**: `POST /api/auth/token/refresh/`

### Core Endpoints

- **Customers**: `/api/customers/`
- **Subscriptions**: `/api/subscriptions/`
- **Plans**: `/api/plans/`
- **Billing**: `/api/billing/`
- **Network**: `/api/network/`
- **Reports**: `/api/reports/`

### API Documentation

Access the interactive API documentation at:

- **Browsable API**: [http://localhost:8000/api/](http://localhost:8000/api/)
- **Swagger UI**: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)

## 🧪 Testing

### Backend Tests

```bash
cd backend
python manage.py test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Integration Tests

```bash
# Run with Docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📈 Monitoring & Health Checks

### Health Endpoints

- **Frontend**: `GET /health`
- **Backend**: `GET /api/health/`
- **Database**: Built-in PostgreSQL health checks
- **Redis**: Built-in Redis health checks

### Monitoring

- **Logs**: `docker-compose logs -f`
- **Metrics**: Built-in performance monitoring
- **Alerts**: Automated alerting system

## 🔒 Security

### Security Features

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **HTTPS**: SSL/TLS encryption
- **CORS**: Cross-origin resource sharing
- **CSRF**: Cross-site request forgery protection
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting
- **Security Headers**: Security-focused HTTP headers

### Security Best Practices

- Regular security updates
- Environment variable protection
- Database connection encryption
- Secure cookie handling
- Input validation and sanitization

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards

- **Backend**: Follow Django best practices and PEP 8
- **Frontend**: Follow React best practices and ESLint rules
- **Commits**: Use conventional commit messages
- **Documentation**: Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

1. Check the [documentation](BUILD_INSTRUCTIONS.md)
2. Review [GitHub issues](https://github.com/your-repo/issues)
3. Contact the development team

### Troubleshooting

- **Common Issues**: See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md#troubleshooting)
- **Logs**: Check `docker-compose logs`
- **Health Checks**: Verify all services are running

## 🗺️ Roadmap

### Upcoming Features

- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Automated network provisioning
- [ ] Integration with external billing systems
- [ ] Multi-tenant support
- [ ] Advanced reporting features

### Version History

- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Enhanced dashboard and reporting
- **v1.2.0**: Mobile responsiveness improvements
- **v2.0.0**: Planned major UI/UX overhaul

**Last Updated**: $(date)**Version**: 1.0.0**Maintainer**: Development Team