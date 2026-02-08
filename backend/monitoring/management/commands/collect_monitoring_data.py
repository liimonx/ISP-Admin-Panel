from django.core.management.base import BaseCommand
from django.utils import timezone
from monitoring.tasks import poll_router_metrics, check_router_status


class Command(BaseCommand):
    help = 'Collect monitoring data from all routers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force collection even if recent data exists',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Starting monitoring data collection...')
        )

        try:
            # Check router status first
            self.stdout.write('Checking router status...')
            status_result = check_router_status()
            self.stdout.write(f'Status check: {status_result}')

            # Collect metrics
            self.stdout.write('Collecting router metrics...')
            metrics_result = poll_router_metrics()
            self.stdout.write(f'Metrics collection: {metrics_result}')

            self.stdout.write(
                self.style.SUCCESS('Monitoring data collection completed successfully!')
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error collecting monitoring data: {str(e)}')
            )
            raise