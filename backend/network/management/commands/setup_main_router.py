from django.core.management.base import BaseCommand
from django.conf import settings
from network.models import Router


class Command(BaseCommand):
    help = 'Set up the main router configuration in the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update existing router configuration',
        )

    def handle(self, *args, **options):
        self.stdout.write('Setting up main router configuration...')
        
        try:
            # Get or create main router
            main_router, created = Router.objects.get_or_create(
                host=settings.MAIN_ROUTER_IP,
                defaults={
                    'name': 'Main Router',
                    'description': 'Primary router for the ISP network',
                    'router_type': 'mikrotik',
                    'api_port': settings.MAIN_ROUTER_API_PORT,
                    'ssh_port': settings.MAIN_ROUTER_SSH_PORT,
                    'username': settings.MAIN_ROUTER_USERNAME,
                    'password': settings.MAIN_ROUTER_PASSWORD,
                    'use_tls': settings.MAIN_ROUTER_USE_TLS,
                    'status': 'offline',  # Will be updated on first connection test
                    'location': 'Main Data Center',
                    'snmp_community': 'public',
                    'snmp_port': 161,
                    'notes': 'Main router for network management and monitoring',
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created main router: {main_router.name} ({main_router.host})'
                    )
                )
            else:
                if options['force']:
                    # Update existing router with new settings
                    main_router.name = 'Main Router'
                    main_router.description = 'Primary router for the ISP network'
                    main_router.router_type = 'mikrotik'
                    main_router.api_port = settings.MAIN_ROUTER_API_PORT
                    main_router.ssh_port = settings.MAIN_ROUTER_SSH_PORT
                    main_router.username = settings.MAIN_ROUTER_USERNAME
                    main_router.password = settings.MAIN_ROUTER_PASSWORD
                    main_router.use_tls = settings.MAIN_ROUTER_USE_TLS
                    main_router.location = 'Main Data Center'
                    main_router.notes = 'Main router for network management and monitoring'
                    main_router.save()
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Successfully updated main router: {main_router.name} ({main_router.host})'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Main router already exists: {main_router.name} ({main_router.host})'
                        )
                    )
                    self.stdout.write(
                        'Use --force to update existing configuration'
                    )
            
            # Display router configuration
            self.stdout.write('\nMain Router Configuration:')
            self.stdout.write(f'  Name: {main_router.name}')
            self.stdout.write(f'  Host: {main_router.host}')
            self.stdout.write(f'  API Port: {main_router.api_port}')
            self.stdout.write(f'  SSH Port: {main_router.ssh_port}')
            self.stdout.write(f'  Username: {main_router.username}')
            self.stdout.write(f'  Use TLS: {main_router.use_tls}')
            self.stdout.write(f'  Status: {main_router.status}')
            self.stdout.write(f'  Location: {main_router.location}')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to set up main router: {str(e)}')
            )
            raise
