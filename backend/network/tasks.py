from celery import shared_task
from django.utils import timezone
from django.conf import settings
import logging

from .models import Router
from .services import MikroTikService

logger = logging.getLogger(__name__)


@shared_task
def check_main_router_health():
    """
    Periodic task to check the health of the main router.
    This task runs every 5 minutes by default.
    """
    try:
        # Get the main router
        main_router = Router.objects.filter(host=settings.MAIN_ROUTER_IP).first()
        
        if not main_router:
            logger.warning("Main router not found in database")
            return False
        
        # Test connection
        service = MikroTikService(main_router)
        result = service.test_connection()
        
        if result.get('success', False):
            # Update router status to online
            main_router.status = 'online'
            main_router.last_seen = timezone.now()
            main_router.save()
            
            logger.info(f"Main router {main_router.name} is online")
            return True
        else:
            # Update router status to offline
            main_router.status = 'offline'
            main_router.save()
            
            logger.warning(f"Main router {main_router.name} is offline")
            return False
            
    except Exception as e:
        logger.error(f"Error checking main router health: {str(e)}")
        
        # Update router status to offline on error
        try:
            main_router = Router.objects.filter(host=settings.MAIN_ROUTER_IP).first()
            if main_router:
                main_router.status = 'offline'
                main_router.save()
        except Exception:
            pass
        
        return False


@shared_task
def sync_main_router_data():
    """
    Periodic task to sync data from the main router.
    This task runs every 15 minutes by default.
    """
    try:
        # Get the main router
        main_router = Router.objects.filter(host=settings.MAIN_ROUTER_IP).first()
        
        if not main_router:
            logger.warning("Main router not found in database")
            return False
        
        # Only sync if router is online
        if main_router.status != 'online':
            logger.info(f"Main router {main_router.name} is offline, skipping sync")
            return False
        
        service = MikroTikService(main_router)
        
        # Sync various data (for now, just log that we would sync)
        logger.info(f"Syncing data from main router {main_router.name}")
        
        # In the future, you could sync:
        # - DHCP leases
        # - Active connections
        # - System resources
        # - Interface statistics
        # - Log entries
        
        return True
        
    except Exception as e:
        logger.error(f"Error syncing main router data: {str(e)}")
        return False


@shared_task
def backup_main_router_config():
    """
    Periodic task to backup the main router configuration.
    This task runs daily by default.
    """
    try:
        # Get the main router
        main_router = Router.objects.filter(host=settings.MAIN_ROUTER_IP).first()
        
        if not main_router:
            logger.warning("Main router not found in database")
            return False
        
        # Only backup if router is online
        if main_router.status != 'online':
            logger.info(f"Main router {main_router.name} is offline, skipping backup")
            return False
        
        logger.info(f"Backing up configuration from main router {main_router.name}")
        
        # In the future, you could:
        # - Export router configuration
        # - Save to file or database
        # - Create versioned backups
        
        return True
        
    except Exception as e:
        logger.error(f"Error backing up main router config: {str(e)}")
        return False
