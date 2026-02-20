#!/usr/bin/env python
"""
Production setup script for ISP Admin Panel.
This script prepares the backend for real data and production use.
"""
import os
import sys
import secrets
import string
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


def generate_secure_password(length=16):
    """Generate a secure random password."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for i in range(length))


def run_command(command, *args, **kwargs):
    """Run a Django management command."""
    # Mask sensitive arguments for logging
    safe_args = []
    for arg in args:
        if isinstance(arg, str) and arg.startswith('--password='):
            safe_args.append('--password=******')
        else:
            safe_args.append(str(arg))

    print(f"Running: {command} {' '.join(safe_args)}")
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
    admin_username = os.environ.get('DJANGO_ADMIN_USERNAME', 'admin')
    admin_email = os.environ.get('DJANGO_ADMIN_EMAIL', 'admin@isp.com')
    admin_password = os.environ.get('DJANGO_ADMIN_PASSWORD')

    if not admin_password:
        admin_password = generate_secure_password()
        admin_password_source = "generated"
    else:
        admin_password_source = "env"

    if not run_command('create_admin',
                      f'--username={admin_username}',
                      f'--email={admin_email}',
                      f'--password={admin_password}'):
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

    superuser_username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'superadmin')
    superuser_email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'superadmin@isp.com')
    superuser_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

    if not superuser_password:
        superuser_password = generate_secure_password()
        superuser_password_source = "generated"
    else:
        superuser_password_source = "env"

    try:
        if not User.objects.filter(username=superuser_username).exists():
            User.objects.create_superuser(
                username=superuser_username,
                email=superuser_email,
                password=superuser_password,
                first_name='Super',
                last_name='Admin'
            )
            if superuser_password_source == "generated":
                print(f"✅ Backup superuser created: {superuser_username} / {superuser_password}")
            else:
                print(f"✅ Backup superuser created: {superuser_username} / [HIDDEN] (from env)")
        else:
            print("ℹ️  Backup superuser already exists")
    except Exception as e:
        print(f"❌ Failed to create backup superuser: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Production setup completed successfully!")
    print("\n📋 Summary:")
    print("• Database migrations applied")

    if admin_password_source == "generated":
        print(f"• Admin user created: {admin_username} / {admin_password}")
    else:
        print(f"• Admin user created: {admin_username} / [HIDDEN] (from env)")

    if superuser_password_source == "generated":
        print(f"• Backup superuser: {superuser_username} / {superuser_password}")
    else:
        print(f"• Backup superuser: {superuser_username} / [HIDDEN] (from env)")

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
