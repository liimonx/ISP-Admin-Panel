#!/bin/bash

# ISP Admin Docker Development Setup Script
# This script sets up the development environment for local Docker development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 ISP Admin Docker Development Setup${NC}"
echo "======================================"
echo ""

# Check if Docker and Docker Compose are installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install Docker and try again.${NC}"
        echo "Download from: https://www.docker.com/products/docker-desktop/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose and try again.${NC}"
        echo "Docker Desktop includes Docker Compose, or install separately from: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
}

# Create development environment file if it doesn't exist
create_dev_env() {
    if [ ! -f ".env" ]; then
        echo -e "${PURPLE}📝 Creating Development Environment File...${NC}"
        cat > .env << EOF
# Django Settings
DEBUG=True
SECRET_KEY=very-secure-test-key-for-development-only
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Database Configuration
POSTGRES_DB=isp_admin
POSTGRES_USER=isp_admin
POSTGRES_PASSWORD=isp_admin_password

# Redis
REDIS_URL=redis://redis:6379/0

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=5
JWT_REFRESH_TOKEN_LIFETIME=1

# Superuser Configuration
DJANGO_SUPERUSER_USERNAME=superadmin
DJANGO_SUPERUSER_EMAIL=superadmin@isp.com
DJANGO_SUPERUSER_PASSWORD=superadmin123!

# Main Router Settings
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

# Development Settings
DJANGO_SETTINGS_MODULE=isp_admin.settings
USE_POSTGRES=true
EOF
        echo -e "${GREEN}✅ Development environment file created${NC}"
    else
        echo -e "${GREEN}✅ .env file already exists${NC}"
    fi
}

# Build and start services
start_services() {
    echo -e "${PURPLE}🐳 Building and starting Docker services...${NC}"
    
    # Build all services
    echo "Building services..."
    docker-compose build
    
    # Start services in detached mode
    echo "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    echo "Waiting for services to be ready..."
    sleep 10
    
    # Check service status
    echo "Checking service status..."
    docker-compose ps
    
    echo -e "${GREEN}✅ Services started successfully${NC}"
}

# Create initial superuser
create_superuser() {
    echo -e "${PURPLE}👤 Creating superuser...${NC}"
    
    # Run createsuperuser command in the backend container
    echo "Creating Django superuser..."
    docker-compose exec backend python manage.py createsuperuser --noinput \
        --username ${DJANGO_SUPERUSER_USERNAME:-superadmin} \
        --email ${DJANGO_SUPERUSER_EMAIL:-superadmin@isp.com} || true
    
    echo -e "${GREEN}✅ Superuser creation attempted (you may need to set password manually)${NC}"
}

# Show development instructions
show_dev_instructions() {
    echo -e "${BLUE}📋 Docker Development Instructions${NC}"
    echo "=================================="
    echo ""
    
    echo -e "${YELLOW}🌐 Access URLs:${NC}"
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:8000"
    echo "Admin Panel: http://localhost:8000/admin"
    echo "Nginx (combined): http://localhost"
    echo ""
    
    echo -e "${YELLOW}🔧 Useful Commands:${NC}"
    echo "View logs: docker-compose logs -f"
    echo "View specific service logs: docker-compose logs -f backend"
    echo "Run Django commands: docker-compose exec backend python manage.py [command]"
    echo "Stop services: docker-compose down"
    echo "Stop and remove volumes: docker-compose down -v"
    echo "Rebuild services: docker-compose build"
    echo ""
    
    echo -e "${YELLOW}💡 Tips:${NC}"
    echo "1. The .env file contains your development configuration"
    echo "2. Database data is persisted in Docker volumes"
    echo "3. Static and media files are mounted from your local directories"
    echo "4. For frontend development, you can also run 'npm run dev' locally"
    echo "   and it will proxy API requests to http://localhost:8000"
    echo ""
}

# Main setup function
main() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    check_docker
    echo ""
    
    echo -e "${YELLOW}Setting up Docker development environment...${NC}"
    create_dev_env
    start_services
    create_superuser
    echo ""
    
    show_dev_instructions
    
    echo -e "${GREEN}🎉 Docker development environment setup completed!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Visit http://localhost:3000 to access the frontend"
    echo "2. Visit http://localhost:8000/admin to access the Django admin"
    echo "3. Use the superuser credentials from .env to log in"
    echo ""
}

# Run main function
main