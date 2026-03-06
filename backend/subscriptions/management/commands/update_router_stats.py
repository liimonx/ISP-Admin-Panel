from django.core.management.base import BaseCommand
from network.models import Router
from subscriptions.signals import update_router_stats

class Command(BaseCommand):
    help = 'Update denormalized statistics for all routers'

    def handle(self, *args, **options):
        routers = Router.objects.all()
        count = routers.count()
        self.stdout.write(f'Updating stats for {count} routers...')
        
        for router in routers:
            try:
                update_router_stats(router)
                self.stdout.write(self.style.SUCCESS(f'Successfully updated stats for router "{router.name}"'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to update stats for router "{router.name}": {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS(f'Finished updating {count} routers.'))
