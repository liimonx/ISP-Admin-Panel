"""
Management command to setup the main router in the database.
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from network.models import Router
from network.services import MikroTikService


class Command(BaseCommand):
    help = 'Setup the main router in the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--host',
            type=str,
            default=getattr(settings, 'MAIN_ROUTER_IP', '103.115.252.60'),
            help='Router IP address',
        )
        parser.add_argument(
            '--username',
            type=str,
            default=settings.MAIN_ROUTER_USERNAME,
            help='Router username',
        )
        parser.add_argument(
            '--password',
            type=str,
            default=settings.MAIN_ROUTER_PASSWORD,
            help='Router password',
        )
        parser.add_argument(
            '--api-port',
            type=int,
            default=getattr(settings, 'MAIN_ROUTER_API_PORT', 8728),
            help='Router API port',
        )
        parser.add_argument(
            '--ssh-port',
            type=int,
            default=getattr(settings, 'MAIN_ROUTER_SSH_PORT', 22),
            help='Router SSH port',
        )
        parser.add_argument(
            '--use-tls',
            action='store_true',
            default=getattr(settings, 'MAIN_ROUTER_USE_TLS', True),
            help='Use TLS for API connection',
        )
        parser.add_argument(
            '--test-connection',
            action='store_true',
            help='Test connection after setup',
        )

    def handle(self, *args, **options):
        host = options['host']
        username = options['username']
        password = options['password']
        api_port = options['api_port']
        ssh_port = options['ssh_port']
        use_tls = options['use_tls']
        test_connection = options['test_connection']

        if not password:
            self.stdout.write(
                self.style.WARNING(
                    'No password provided. Please set MAIN_ROUTER_PASSWORD in your .env file '
                    'or use --password argument.'
                )
            )
            return

        # Create or update the main router
        router, created = Router.objects.update_or_create(
            host=host,
            defaults={
                'name': 'Main Router',
                'description': 'Primary MikroTik router for ISP operations',
                'router_type': Router.RouterType.MIKROTIK,
                'api_port': api_port,
                'ssh_port': ssh_port,
                'username': username,
                'password': password,
                'use_tls': use_tls,
                'status': Router.Status.OFFLINE,
                'location': 'Main Data Center',
                'snmp_community': settings.SNMP_COMMUNITY,
                'snmp_port': 161,
                'notes': 'Main router configured via management command',
            }
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(f'✓ Created main router: {router.name} ({router.host})')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'✓ Updated main router: {router.name} ({router.host})')
            )

        # Display router configuration
        self.stdout.write('\nRouter Configuration:')
        self.stdout.write(f'  Name: {router.name}')
        self.stdout.write(f'  Host: {router.host}')
        self.stdout.write(f'  API Port: {router.api_port}')
        self.stdout.write(f'  SSH Port: {router.ssh_port}')
        self.stdout.write(f'  Username: {router.username}')
        self.stdout.write(f'  Use TLS: {router.use_tls}')
        self.stdout.write(f'  Status: {router.status}')

        # Test connection if requested
        if test_connection:
            self.stdout.write('\nTesting connection...')
            try:
                service = MikroTikService(router)
                result = service.test_connection()

                if result.get('success'):
                    router.status = Router.Status.ONLINE
                    router.save(update_fields=['status'])
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Connection successful!\n'
                            f'  Response time: {result.get("response_time_ms", 0)}ms\n'
                            f'  API version: {result.get("api_version", "Unknown")}\n'
                            f'  Router name: {result.get("router_name", "Unknown")}\n'
                            f'  Uptime: {result.get("uptime", "Unknown")}\n'
                            f'  CPU usage: {result.get("cpu_usage", 0)}%\n'
                            f'  Memory usage: {result.get("memory_usage", 0)}%'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(
                            f'✗ Connection failed: {result.get("error", "Unknown error")}'
                        )
                    )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Connection test failed: {str(e)}')
                )

        # Provide next steps
        self.stdout.write('\nNext steps:')
        self.stdout.write('1. Update your .env file with the correct router credentials')
        self.stdout.write('2. Set MIKROTIK_MOCK_MODE=False to enable real router connections')
        self.stdout.write('3. Test the connection: python manage.py test_router_connection --router-id ' + str(router.id))
        self.stdout.write('4. Start Celery workers: celery -A isp_admin worker --loglevel=info')
        self.stdout.write('5. Start Celery beat: celery -A isp_admin beat --loglevel=info')