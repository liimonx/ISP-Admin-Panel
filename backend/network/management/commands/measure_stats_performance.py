from django.core.management.base import BaseCommand
from django.test import RequestFactory
from network.views import RouterViewSet
from network.models import Router
from unittest.mock import patch, MagicMock
import time
from django.core.cache import cache

class Command(BaseCommand):
    help = 'Measure performance of RouterViewSet.stats'

    def handle(self, *args, **options):
        # Setup
        self.stdout.write("Setting up test data...")
        Router.objects.all().delete()
        for i in range(10):
            Router.objects.create(
                name=f'Router {i}',
                host=f'192.168.1.{i}',
                status='online',
                router_type='mikrotik'
            )

        factory = RequestFactory()
        request = factory.get('/api/network/routers/stats/')
        view = RouterViewSet()
        view.request = request
        view.format_kwarg = None
        view.action = 'stats'

        # Clear cache
        cache.clear()

        # Mock MikroTikService
        # We need to patch where it is imported in views.py and tasks.py
        with patch('network.views.MikroTikService') as MockServiceView, \
             patch('network.tasks.MikroTikService') as MockServiceTask:

            # Setup mock behavior
            def delayed_get_interfaces():
                time.sleep(0.1)
                return [{'name': 'ether1', 'status': 'up'}]

            MockServiceView.return_value.get_interfaces.side_effect = delayed_get_interfaces
            MockServiceTask.return_value.get_interfaces.side_effect = delayed_get_interfaces

            # 1. Measure View Performance without cache (should be fast now, but return 0)
            self.stdout.write("\nMeasuring performance (Cache Empty)...")
            start_time = time.time()
            try:
                response = view.stats(request)
                if hasattr(response, 'data'):
                    interfaces = response.data.get('data', {}).get('total_interfaces')
                    self.stdout.write(f"Response total_interfaces: {interfaces}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error executing view: {e}"))
            end_time = time.time()
            self.stdout.write(self.style.SUCCESS(f"Execution time: {end_time - start_time:.4f} seconds"))

            # 2. Populate Cache via Task
            self.stdout.write("\nRunning background task to populate cache...")
            from network.tasks import update_router_interface_stats
            task_start_time = time.time()
            update_router_interface_stats()
            task_end_time = time.time()
            self.stdout.write(f"Task execution time: {task_end_time - task_start_time:.4f} seconds")

            # 3. Measure View Performance with cache
            self.stdout.write("\nMeasuring performance (Cache Populated)...")
            start_time = time.time()
            try:
                response = view.stats(request)
                if hasattr(response, 'data'):
                    interfaces = response.data.get('data', {}).get('total_interfaces')
                    self.stdout.write(f"Response total_interfaces: {interfaces}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error executing view: {e}"))
            end_time = time.time()
            self.stdout.write(self.style.SUCCESS(f"Execution time: {end_time - start_time:.4f} seconds"))
