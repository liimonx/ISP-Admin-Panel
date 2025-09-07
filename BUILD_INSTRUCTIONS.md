# ISP Admin - Build Instructions

This document provides comprehensive instructions for building and deploying the ISP Admin application.

## Prerequisites

### Required Software
- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Git** (for version control)
- **Node.js** (version 18 or higher) - for local development
- **Python** (version 3.9 or higher) - for local development

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: Minimum 10GB free space
- **OS**: Linux, macOS, or Windows with WSL2

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd bcn
```

### 2. Environment Setup
```bash
# Copy environment template
cp backend/env.example .env

# Edit environment variables
nano .env
```

### 3. Build and Run with Docker
```bash
# Build all images
./build-all.sh

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

## Detailed Build Instructions

### Frontend Build

#### Using Docker (Recommended)
```bash
# Build frontend only
./build-frontend.sh

# Or using Docker directly
docker build -t isp-admin-frontend:latest ./frontend
```

#### Local Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend Build

#### Using Docker (Recommended)
```bash
# Build backend only
./build-all.sh backend

# Or using Docker directly
docker build -t isp-admin-backend:latest ./backend
```

#### Local Development
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

## Docker Compose Services

The application consists of the following services:

### Core Services
- **frontend**: React application (Port 3000)
- **backend**: Django API server (Port 8000)
- **db**: PostgreSQL database (Port 5432)
- **redis**: Redis cache (Port 6379)

### Background Services
- **celery_worker**: Background task processing
- **celery_beat**: Scheduled task management
- **nginx**: Reverse proxy and load balancer (Port 80)

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
POSTGRES_DB=isp_admin
POSTGRES_USER=isp_admin
POSTGRES_PASSWORD=your_secure_password

# Django Configuration
SECRET_KEY=your_secret_key_here
DEBUG=False
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

### Optional Environment Variables
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

# Monitoring Configuration
SENTRY_DSN=your_sentry_dsn_here
```

## Build Scripts

### Available Scripts

1. **build-all.sh**: Builds all Docker images
   ```bash
   ./build-all.sh              # Build all images
   ./build-all.sh backend      # Build backend only
   ./build-all.sh frontend     # Build frontend only
   ./build-all.sh help         # Show help
   ```

2. **build-frontend.sh**: Builds frontend Docker image
   ```bash
   ./build-frontend.sh
   ```

### Script Features
- ✅ Automatic Docker health checks
- ✅ Multi-stage builds for optimization
- ✅ Security hardening (non-root user)
- ✅ Build caching for faster rebuilds
- ✅ Comprehensive error handling
- ✅ Build metadata and tagging

## Production Deployment

### 1. Production Environment Setup
```bash
# Use production environment file
cp backend/env.production.example .env

# Edit production settings
nano .env
```

### 2. SSL Certificate Setup
```bash
# Create SSL directory
mkdir -p ssl

# Copy your SSL certificates
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem
```

### 3. Production Build
```bash
# Build with production optimizations
./build-all.sh

# Start production services
docker-compose -f docker-compose.yml up -d
```

### 4. Health Checks
```bash
# Check all services
docker-compose ps

# Check service health
curl http://localhost/health
curl http://localhost:8000/health/
```

## Troubleshooting

### Common Issues

#### 1. Docker Not Running
```bash
# Start Docker Desktop or Docker daemon
sudo systemctl start docker  # Linux
# Or start Docker Desktop application
```

#### 2. Port Conflicts
```bash
# Check for port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000

# Stop conflicting services or change ports in docker-compose.yml
```

#### 3. Build Failures
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### 4. Database Connection Issues
```bash
# Check database service
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d db
```

### Debug Commands
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs frontend
docker-compose logs backend

# Execute commands in containers
docker-compose exec backend python manage.py shell
docker-compose exec frontend sh

# Check container status
docker-compose ps
docker stats
```

## Performance Optimization

### Frontend Optimizations
- ✅ Multi-stage Docker builds
- ✅ Nginx gzip compression
- ✅ Static asset caching
- ✅ Code splitting and lazy loading
- ✅ Production build optimizations

### Backend Optimizations
- ✅ Gunicorn with multiple workers
- ✅ Redis caching
- ✅ Database connection pooling
- ✅ Static file serving via Nginx
- ✅ Health checks and monitoring

### Infrastructure Optimizations
- ✅ Resource limits and requests
- ✅ Health checks for all services
- ✅ Graceful shutdown handling
- ✅ Log rotation and management
- ✅ Security hardening

## Monitoring and Maintenance

### Health Monitoring
```bash
# Check service health
curl http://localhost/health
curl http://localhost:8000/health/

# Monitor resource usage
docker stats

# Check logs
docker-compose logs -f --tail=100
```

### Backup and Recovery
```bash
# Backup database
docker-compose exec db pg_dump -U isp_admin isp_admin > backup.sql

# Restore database
docker-compose exec -T db psql -U isp_admin isp_admin < backup.sql
```

### Updates and Maintenance
```bash
# Update application
git pull
./build-all.sh
docker-compose up -d

# Clean up old images
docker image prune -a
```

## Security Considerations

### Production Security Checklist
- ✅ Use strong passwords and secrets
- ✅ Enable HTTPS with valid certificates
- ✅ Configure firewall rules
- ✅ Regular security updates
- ✅ Monitor access logs
- ✅ Backup data regularly
- ✅ Use non-root containers
- ✅ Limit container resources

### Network Security
- ✅ Use internal Docker networks
- ✅ Expose only necessary ports
- ✅ Implement rate limiting
- ✅ Use secure communication protocols
- ✅ Regular security audits

## Support and Documentation

### Additional Resources
- [Docker Documentation](https://docs.docker.com/)
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [Nginx Documentation](https://nginx.org/en/docs/)

### Getting Help
1. Check the logs: `docker-compose logs`
2. Review this documentation
3. Check GitHub issues
4. Contact the development team

---

**Last Updated**: $(date)
**Version**: 1.0.0
