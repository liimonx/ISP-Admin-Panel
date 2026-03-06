from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum, Count, Q
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender='subscriptions.Subscription')
def update_router_stats_on_save(sender, instance, **kwargs):
    """Update router statistics when a subscription is saved."""
    if instance.router:
        update_router_stats(instance.router)

@receiver(post_delete, sender='subscriptions.Subscription')
def update_router_stats_on_delete(sender, instance, **kwargs):
    """Update router statistics when a subscription is deleted."""
    if instance.router:
        update_router_stats(instance.router)

def update_router_stats(router):
    """Recalculate and update router denormalized statistics."""
    from subscriptions.models import Subscription
    
    try:
        stats = Subscription.objects.filter(router=router, status='active').aggregate(
            active_count=Count('id'),
            total_usage=Sum('data_used')
        )
        
        router.active_subscriptions_count = stats['active_count'] or 0
        router.total_bandwidth_usage = stats['total_usage'] or Decimal('0.00')
        router.save(update_fields=['active_subscriptions_count', 'total_bandwidth_usage'])
        
        logger.info(f"📊 Updated stats for router {router.name}: {router.active_subscriptions_count} active, {router.total_bandwidth_usage} GB")
    except Exception as e:
        logger.error(f"❌ Failed to update router stats for {router.name}: {str(e)}")
