#!/bin/bash

# Setup script for Main Router Integration
# This script configures the backend and database for the main router at 103.115.252.60

echo "🚀 Setting up Main Router Integration..."
echo "Router IP: 103.115.252.60"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Error: Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if containers are running
check_containers() {
    if ! docker-compose ps | grep -q "backend.*Up"; then
        echo "❌ Error: Backend container is not running. Please start the services first:"
        echo "   docker-compose up -d"
        exit 1
    fi
}

# Check prerequisites
echo "📋 Checking prerequisites..."
check_docker
check_containers
echo "✅ Prerequisites check passed"
echo ""

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec backend python manage.py makemigrations network
docker-compose exec backend python manage.py migrate
echo "✅ Database migrations completed"
echo ""

# Setup main router in database
echo "🔧 Setting up main router configuration..."
docker-compose exec backend python manage.py setup_main_router --force
echo "✅ Main router configuration completed"
echo ""

# Create superuser if it doesn't exist
echo "👤 Checking for superuser..."
if ! docker-compose exec backend python manage.py shell -c "from django.contrib.auth.models import User; User.objects.filter(is_superuser=True).exists()" 2>/dev/null | grep -q "True"; then
    echo "📝 Creating superuser..."
    docker-compose exec backend python manage.py createsuperuser --noinput
    echo "✅ Superuser created"
else
    echo "✅ Superuser already exists"
fi
echo ""

# Test the API endpoints
echo "🧪 Testing API endpoints..."
echo "Testing main router status endpoint..."
curl -s http://localhost:8000/api/network/main-router/status/ | python -m json.tool
echo ""

echo "Testing router statistics endpoint..."
curl -s http://localhost:8000/api/network/routers/stats/ | python -m json.tool
echo ""

echo "🎉 Main Router Integration Setup Complete!"
echo ""
echo "📊 Available Endpoints:"
echo "   • Main Router Status: http://localhost:8000/api/network/main-router/status/"
echo "   • Main Router Interfaces: http://localhost:8000/api/network/main-router/interfaces/"
echo "   • Main Router Bandwidth: http://localhost:8000/api/network/main-router/bandwidth/"
echo "   • Main Router Connections: http://localhost:8000/api/network/main-router/connections/"
echo "   • Main Router DHCP Leases: http://localhost:8000/api/network/main-router/dhcp-leases/"
echo "   • Main Router Resources: http://localhost:8000/api/network/main-router/resources/"
echo "   • Main Router Logs: http://localhost:8000/api/network/main-router/logs/"
echo "   • Main Router Alerts: http://localhost:8000/api/network/main-router/alerts/"
echo "   • Router Management: http://localhost:8000/api/network/routers/"
echo ""
echo "🔧 Next Steps:"
echo "   1. Update the router password in docker-compose.yml"
echo "   2. Configure real MikroTik API integration (remove mock mode)"
echo "   3. Set up SSL certificates for secure API communication"
echo "   4. Configure monitoring and alerting"
echo ""
echo "📚 Documentation:"
echo "   • Frontend Router Integration: frontend/README_ROUTER_INTEGRATION.md"
echo "   • Backend API Documentation: http://localhost:8000/api/docs/"
echo ""
