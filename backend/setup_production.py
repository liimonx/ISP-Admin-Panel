#!/usr/bin/env python
"""
Production setup script for ISP Admin Panel.
This script prepares the backend for real data and production use.
"""
import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_admin.settings')
django.setup()

from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.db import connection

User = get_user_model()


def run_command(command, *args, **kwargs):
    """Run a Django management command."""
    print(f"Running: {command} {' '.join(args)}")
    try:
        call_command(command, *args, **kwargs)
        print(f"✅ {command} completed successfully")
    except Exception as e:
        print(f"❌ {command} failed: {e}")
        return False
    return True


def check_database_connection():
    """Check if database connection is working."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("✅ Database connection is working")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


def main():
    """Main setup function."""
    print("🚀 Setting up ISP Admin Panel for production...")
    print("=" * 50)
    
    # Check database connection
    if not check_database_connection():
        print("❌ Cannot proceed without database connection")
        return
    
    # Apply migrations
    print("\n📦 Applying database migrations...")
    if not run_command('migrate', verbosity=0):
        return
    
    # Create admin user
    print("\n👤 Creating admin user...")
    if not run_command('create_admin'):
        return
    
    # Collect static files
    print("\n📁 Collecting static files...")
    if not run_command('collectstatic', '--noinput', verbosity=0):
        return
    
    # Seed with real data
    print("\n🌱 Seeding database with real data...")
    if not run_command('seed_real_data', '--customers=100', '--subscriptions=200'):
        return
    
    # Create superuser (backup)
    print("\n🔐 Creating backup superuser...")
    try:
        if not User.objects.filter(username='superadmin').exists():
            User.objects.create_superuser(
                username='superadmin',
                email='superadmin@isp.com',
                password='superadmin123!',
                first_name='Super',
                last_name='Admin'
            )
            print("✅ Backup superuser created: superadmin / superadmin123!")
        else:
            print("ℹ️  Backup superuser already exists")
    except Exception as e:
        print(f"❌ Failed to create backup superuser: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Production setup completed successfully!")
    print("\n📋 Summary:")
    print("• Database migrations applied")
    print("• Admin user created: admin / changeme123!")
    print("• Backup superuser: superadmin / superadmin123!")
    print("• Static files collected")
    print("• Real data seeded (100 customers, 200 subscriptions)")
    print("\n🔗 Access URLs:")
    print("• Frontend: http://localhost")
    print("• Backend API: http://localhost/api/")
    print("• Admin Panel: http://localhost/admin/")
    print("\n⚠️  Remember to:")
    print("• Change default passwords in production")
    print("• Configure proper environment variables")
    print("• Set up SSL certificates")
    print("• Configure backup strategies")


if __name__ == '__main__':
    main()
