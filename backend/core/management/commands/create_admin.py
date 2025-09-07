"""
Management command to create or update admin user.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.management import call_command

User = get_user_model()


class Command(BaseCommand):
    help = 'Create or update admin user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Admin username (default: admin)',
        )
        parser.add_argument(
            '--email',
            type=str,
            default='admin@isp.com',
            help='Admin email (default: admin@isp.com)',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='changeme123!',
            help='Admin password (default: changeme123!)',
        )
        parser.add_argument(
            '--first-name',
            type=str,
            default='Admin',
            help='Admin first name (default: Admin)',
        )
        parser.add_argument(
            '--last-name',
            type=str,
            default='User',
            help='Admin last name (default: User)',
        )

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Updated admin user: {username}')
            )
        else:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Created admin user: {username}')
            )

        self.stdout.write(f'Username: {username}')
        self.stdout.write(f'Email: {email}')
        self.stdout.write(f'Password: {password}')
