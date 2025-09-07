#!/bin/bash

# ISP Admin Development Setup Script
# This script sets up the development environment for local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 ISP Admin Development Setup${NC}"
echo "================================="
echo ""

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ and try again.${NC}"
        echo "Download from: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Node.js version 18+ is required. Current version: $(node --version)${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js $(node --version) is installed${NC}"
}

# Check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.9+ and try again.${NC}"
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    echo -e "${GREEN}✅ Python $PYTHON_VERSION is installed${NC}"
}

# Setup frontend development environment
setup_frontend() {
    echo -e "${PURPLE}🎨 Setting up Frontend Development Environment...${NC}"
    
    if [ ! -d "./frontend" ]; then
        echo -e "${RED}❌ Frontend directory not found${NC}"
        return 1
    fi
    
    cd frontend
    
    # Install dependencies
    echo "Installing frontend dependencies..."
    npm install
    
    # Check if build works
    echo "Testing frontend build..."
    npm run build
    
    cd ..
    echo -e "${GREEN}✅ Frontend setup completed${NC}"
}

# Setup backend development environment
setup_backend() {
    echo -e "${PURPLE}🔧 Setting up Backend Development Environment...${NC}"
    
    if [ ! -d "./backend" ]; then
        echo -e "${RED}❌ Backend directory not found${NC}"
        return 1
    fi
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    echo "Activating virtual environment..."
    source venv/bin/activate
    
    # Install dependencies
    echo "Installing backend dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Setup environment file
    if [ ! -f ".env" ]; then
        echo "Creating environment file..."
        cp env.example .env
        echo -e "${YELLOW}⚠️  Please edit backend/.env with your configuration${NC}"
    fi
    
    # Run migrations
    echo "Running database migrations..."
    python manage.py migrate
    
    # Create superuser (optional)
    echo -e "${YELLOW}Do you want to create a superuser? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        python manage.py createsuperuser
    fi
    
    cd ..
    echo -e "${GREEN}✅ Backend setup completed${NC}"
}

# Create development environment file
create_dev_env() {
    echo -e "${PURPLE}📝 Creating Development Environment File...${NC}"
    
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Development Environment Configuration
# Database Configuration
POSTGRES_DB=isp_admin_dev
POSTGRES_USER=isp_admin
POSTGRES_PASSWORD=dev_password_123

# Django Configuration
SECRET_KEY=dev-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Main Router Configuration (Development)
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
EOF
        echo -e "${GREEN}✅ Development environment file created${NC}"
    else
        echo -e "${YELLOW}⚠️  .env file already exists, skipping creation${NC}"
    fi
}

# Show development instructions
show_dev_instructions() {
    echo -e "${BLUE}📋 Development Instructions${NC}"
    echo "============================="
    echo ""
    
    echo -e "${YELLOW}🚀 Starting Development Servers:${NC}"
    echo ""
    
    echo -e "${GREEN}Backend (Terminal 1):${NC}"
    echo "cd backend"
    echo "source venv/bin/activate"
    echo "python manage.py runserver"
    echo ""
    
    echo -e "${GREEN}Frontend (Terminal 2):${NC}"
    echo "cd frontend"
    echo "npm run dev"
    echo ""
    
    echo -e "${YELLOW}🌐 Access URLs:${NC}"
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:8000"
    echo "Admin Panel: http://localhost:8000/admin"
    echo ""
    
    echo -e "${YELLOW}🔧 Useful Commands:${NC}"
    echo "Backend migrations: python manage.py migrate"
    echo "Create superuser: python manage.py createsuperuser"
    echo "Collect static files: python manage.py collectstatic"
    echo "Frontend build: npm run build"
    echo "Frontend lint: npm run lint"
    echo ""
    
    echo -e "${YELLOW}🐳 Docker Development:${NC}"
    echo "Start with Docker: docker-compose up -d"
    echo "View logs: docker-compose logs -f"
    echo "Stop services: docker-compose down"
    echo ""
}

# Main setup function
main() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    check_nodejs
    check_python
    echo ""
    
    echo -e "${YELLOW}Setting up development environment...${NC}"
    create_dev_env
    setup_backend
    setup_frontend
    echo ""
    
    show_dev_instructions
    
    echo -e "${GREEN}🎉 Development environment setup completed!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Edit .env files with your configuration"
    echo "2. Start the development servers using the instructions above"
    echo "3. Access the application at http://localhost:3000"
    echo ""
}

# Parse command line arguments
case "${1:-}" in
    "frontend")
        check_nodejs
        setup_frontend
        ;;
    "backend")
        check_python
        setup_backend
        ;;
    "env")
        create_dev_env
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [frontend|backend|env|help]"
        echo ""
        echo "Options:"
        echo "  frontend  Setup only the frontend development environment"
        echo "  backend   Setup only the backend development environment"
        echo "  env       Create only the development environment file"
        echo "  help      Show this help message"
        echo ""
        echo "Default: Setup complete development environment"
        ;;
    *)
        main
        ;;
esac
