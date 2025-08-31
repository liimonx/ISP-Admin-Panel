#!/bin/bash

# Quick setup script for ISP Admin Panel
# This script will set up the backend to run locally for testing

set -e  # Exit on any error

echo "🚀 ISP Admin Panel Quick Setup"
echo "================================"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Set environment variables for local development
export DEBUG=True
export SECRET_KEY=dev-secret-key-change-in-production
export ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
export DATABASE_URL=postgresql://isp_admin:isp_admin_password@localhost:5432/isp_admin
export REDIS_URL=redis://127.0.0.1:6379/0

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Check if PostgreSQL and Redis are running via Docker
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up db redis -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose exec -T db pg_isready -U isp_admin -d isp_admin; do
    sleep 2
done

# Navigate to backend directory
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run migrations
echo "🗄️  Running database migrations..."
python manage.py migrate

# Create superuser and demo data
echo "👤 Setting up demo users and data..."
python manage.py setup_isp

# Start the development server
echo "🚀 Starting Django development server..."
echo ""
echo "Demo Credentials:"
echo "=================="
echo "Admin User:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Support User:"
echo "  Username: support"
echo "  Password: support123"
echo ""
echo "Accountant User:"
echo "  Username: accountant"
echo "  Password: accountant123"
echo ""
echo "🌐 Backend will be available at: http://localhost:8000"
echo "🌐 Frontend should be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python manage.py runserver 0.0.0.0:8000
