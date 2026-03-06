import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_admin.settings')
django.setup()

from customers.models import Customer
from core.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()
admin_user = User.objects.filter(is_superuser=True).first()

if admin_user:
    Customer.objects.get_or_create(
        name="Test Customer 1", 
        email="test@example.com", 
        phone="555-1234",
        address="123 Fake St",
        status="active"
    )

    Notification.objects.get_or_create(
        user=admin_user,
        title="Welcome to BCN",
        message="Your account has been successfully created.",
        type="success"
    )

    Notification.objects.get_or_create(
        user=admin_user,
        title="Network Alert",
        message="Main router latency is high.",
        type="warning"
    )
    print("Test data created successfully.")
else:
    print("No admin user found.")
