#!/bin/bash

# Docker Production Setup Script for ISP Admin Panel
# This script sets up the application for production use with Docker

set -e

echo "🚀 Setting up ISP Admin Panel for Docker Production..."
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it and try again."
    exit 1
fi

echo "✅ Docker and docker-compose are available"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp backend/env.example .env
    echo "⚠️  Please edit .env file with your production values before continuing"
    echo "   Key values to update:"
    echo "   - SECRET_KEY"
    echo "   - POSTGRES_PASSWORD"
    echo "   - MAIN_ROUTER_PASSWORD"
    echo "   - Payment provider credentials"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

# Generate secure passwords if not provided in environment
echo "🔐 Generating secure passwords..."

if [ -z "$ADMIN_PASSWORD" ]; then
    if command -v openssl >/dev/null 2>&1; then
        ADMIN_PASSWORD=$(openssl rand -base64 12)
    else
        ADMIN_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(12))")
    fi
fi

if [ -z "$DJANGO_SUPERUSER_PASSWORD" ]; then
    if command -v openssl >/dev/null 2>&1; then
        DJANGO_SUPERUSER_PASSWORD=$(openssl rand -base64 12)
    else
        DJANGO_SUPERUSER_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(12))")
    fi
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Run database migrations
echo "📦 Running database migrations..."
docker-compose exec backend python manage.py migrate

# Create admin user
echo "👤 Creating admin user..."
docker-compose exec backend python manage.py create_admin --password "$ADMIN_PASSWORD"

# Collect static files
echo "📁 Collecting static files..."
docker-compose exec backend python manage.py collectstatic --noinput

# Seed with real data
echo "🌱 Seeding database with real data..."
docker-compose exec backend python manage.py seed_real_data --customers=100 --subscriptions=200

# Create backup superuser
echo "🔐 Creating backup superuser..."
docker-compose exec -e DJANGO_SUPERUSER_PASSWORD="$DJANGO_SUPERUSER_PASSWORD" backend python manage.py shell -c "
import os
from django.contrib.auth import get_user_model
User = get_user_model()
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
if not User.objects.filter(username='superadmin').exists():
    User.objects.create_superuser(
        username='superadmin',
        email='superadmin@isp.com',
        password=password,
        first_name='Super',
        last_name='Admin'
    )
    print(f'Backup superuser created: superadmin / {password}')
else:
    print('Backup superuser already exists')
"

echo ""
echo "=================================================="
echo "🎉 Docker Production Setup Completed Successfully!"
echo ""
echo "📋 Summary:"
echo "• All Docker services are running"
echo "• Database migrations applied"
echo "• Admin user created: admin / $ADMIN_PASSWORD"
echo "• Backup superuser: superadmin / $DJANGO_SUPERUSER_PASSWORD"
echo "• Static files collected"
echo "• Real data seeded (100 customers, 200 subscriptions)"
echo ""
echo "🔗 Access URLs:"
echo "• Frontend: http://localhost"
echo "• Backend API: http://localhost/api/"
echo "• Admin Panel: http://localhost/admin/"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "⚠️  Important Security Notes:"
echo "• Change default passwords in production"
echo "• Update .env file with secure values"
echo "• Configure SSL certificates"
echo "• Set up proper backup strategies"
echo "• Monitor logs: docker-compose logs -f"
echo ""
echo "🛠️  Useful Commands:"
echo "• View logs: docker-compose logs -f [service]"
echo "• Restart service: docker-compose restart [service]"
echo "• Stop all services: docker-compose down"
echo "• Update and restart: docker-compose up -d --build"
