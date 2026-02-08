#!/bin/bash

# MikroTik Router Setup Script for ISP Admin Panel
# This script helps you configure the ISP admin panel to work with real MikroTik routers

set -e

echo "🚀 MikroTik Router Integration Setup"
echo "===================================="
echo

# Check if we're in the right directory
if [ ! -f "backend/manage.py" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env file not found"
    echo "Please copy backend/env.example to backend/.env and configure it first"
    exit 1
fi

echo "📋 Current Configuration Check"
echo "-----------------------------"

# Check if librouteros is installed
cd backend
if python -c "import librouteros" 2>/dev/null; then
    echo "✅ librouteros library is installed"
else
    echo "❌ librouteros library not found"
    echo "Installing librouteros..."
    pip install librouteros==3.1.0
    echo "✅ librouteros installed successfully"
fi

# Check environment variables
echo
echo "🔧 Environment Configuration"
echo "----------------------------"

# Read current configuration
MAIN_ROUTER_IP=$(python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('MAIN_ROUTER_IP', 'Not set'))" 2>/dev/null || echo "Not set")
MIKROTIK_MOCK_MODE=$(python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('MIKROTIK_MOCK_MODE', 'True'))" 2>/dev/null || echo "True")

echo "Main Router IP: $MAIN_ROUTER_IP"
echo "Mock Mode: $MIKROTIK_MOCK_MODE"

if [ "$MAIN_ROUTER_IP" = "Not set" ] || [ "$MAIN_ROUTER_IP" = "103.115.252.60" ]; then
    echo
    echo "⚠️  Warning: Please update your .env file with your actual router IP address"
    echo "   Edit backend/.env and set MAIN_ROUTER_IP to your router's IP"
fi

echo
echo "🗄️  Database Setup"
echo "-----------------"

# Run migrations
echo "Running database migrations..."
python manage.py migrate

echo
echo "🔧 Router Configuration"
echo "----------------------"

# Setup main router
echo "Setting up main router in database..."
python manage.py setup_main_router

echo
echo "🧪 Connection Testing"
echo "--------------------"

# Ask user if they want to test connection
read -p "Do you want to test the router connection now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Testing router connection..."
    python manage.py test_router_connection --all --update-status || echo "⚠️  Connection test failed - this is normal if mock mode is enabled or router is not accessible"
fi

echo
echo "📊 Service Status Check"
echo "----------------------"

# Check if Redis is running
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running"
    else
        echo "❌ Redis is not running"
        echo "   Please start Redis: redis-server"
    fi
else
    echo "⚠️  Redis CLI not found - make sure Redis is installed and running"
fi

# Check if PostgreSQL is accessible (if using PostgreSQL)
DATABASE_URL=$(python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('DATABASE_URL', ''))" 2>/dev/null || echo "")
if [[ $DATABASE_URL == postgres* ]]; then
    echo "📊 Using PostgreSQL database"
    # Could add PostgreSQL connection test here
elif [[ $DATABASE_URL == sqlite* ]] || [ -z "$DATABASE_URL" ]; then
    echo "📊 Using SQLite database"
fi

echo
echo "🎯 Next Steps"
echo "============"
echo
echo "1. 📝 Configure your router credentials in backend/.env:"
echo "   - MAIN_ROUTER_IP=your.router.ip.address"
echo "   - MAIN_ROUTER_USERNAME=your_api_username"
echo "   - MAIN_ROUTER_PASSWORD=your_api_password"
echo "   - MIKROTIK_MOCK_MODE=False (to enable real router connections)"
echo
echo "2. 🔧 Configure your MikroTik router:"
echo "   - Enable API service: /ip service enable api"
echo "   - Create API user with appropriate permissions"
echo "   - Configure firewall rules if needed"
echo
echo "3. 🚀 Start the services:"
echo "   Terminal 1: python manage.py runserver"
echo "   Terminal 2: celery -A isp_admin worker --loglevel=info"
echo "   Terminal 3: celery -A isp_admin beat --loglevel=info"
echo
echo "4. 🧪 Test the integration:"
echo "   python manage.py test_router_connection --all"
echo "   python manage.py manage_pppoe_users --router-id 1 --action list"
echo
echo "5. 📖 Read the documentation:"
echo "   - MIKROTIK_INTEGRATION.md for detailed setup guide"
echo "   - API documentation at http://localhost:8000/api/docs/"
echo
echo "✨ Setup completed! Your ISP admin panel is ready for MikroTik integration."
echo
echo "💡 Tip: Start with MIKROTIK_MOCK_MODE=True for testing, then switch to False for production."

cd ..