"""
Celery tasks for monitoring operations.
"""
import logging
from celery import shared_task
from django.utils import timezone
from network.models import Router
from network.services import RouterOSService
from .models import SNMPSnapshot, UsageSnapshot

logger = logging.getLogger(__name__)


@shared_task
def poll_snmp_usage():
    """
    Poll SNMP data from all routers and store snapshots.
    """
    logger.info("Starting SNMP usage polling...")
    
    try:
        # Get all online routers
        online_routers = Router.objects.filter(status='online')
        
        snapshots_created = 0
        
        for router in online_routers:
            try:
                # Create SNMP snapshot
                snmp_snapshot = create_snmp_snapshot(router)
                if snmp_snapshot:
                    snapshots_created += 1
                
                # Create usage snapshot
                usage_snapshot = create_usage_snapshot(router)
                if usage_snapshot:
                    snapshots_created += 1
                    
            except Exception as e:
                logger.error(f"Failed to poll data from router {router.name}: {e}")
                continue
        
        logger.info(f"SNMP usage polling completed. Created {snapshots_created} snapshots.")
        return f"Created {snapshots_created} snapshots"
        
    except Exception as e:
        logger.error(f"SNMP usage polling failed: {e}")
        raise


def create_snmp_snapshot(router):
    """
    Create SNMP snapshot for a router.
    """
    try:
        # For now, we'll use RouterOS API instead of SNMP
        # In a real implementation, you would use pysnmp to poll SNMP data
        with RouterOSService(router) as service:
            # Get system resources
            resources = service.get_system_resources()
            
            if resources:
                # Create snapshot
                snapshot = SNMPSnapshot.objects.create(
                    router=router,
                    cpu_usage=float(resources.get('cpu-load', 0)),
                    memory_usage=float(resources.get('free-memory', 0)) / float(resources.get('total-memory', 1)) * 100,
                    uptime=int(resources.get('uptime', 0)),
                    interface_data={}  # TODO: Get interface data
                )
                
                logger.info(f"Created SNMP snapshot for router {router.name}")
                return snapshot
                
    except Exception as e:
        logger.error(f"Failed to create SNMP snapshot for router {router.name}: {e}")
        return None


def create_usage_snapshot(router):
    """
    Create usage snapshot for a router.
    """
    try:
        with RouterOSService(router) as service:
            # Get active sessions
            sessions = service.get_active_sessions()
            
            # Get PPPoE users
            users = service.get_pppoe_users()
            
            # Calculate totals
            total_bytes_in = sum(int(session.get('bytes-in', 0)) for session in sessions)
            total_bytes_out = sum(int(session.get('bytes-out', 0)) for session in sessions)
            
            # Create snapshot
            snapshot = UsageSnapshot.objects.create(
                router=router,
                total_bytes_in=total_bytes_in,
                total_bytes_out=total_bytes_out,
                active_connections=len(sessions),
                pppoe_users_count=len(users),
                pppoe_active_sessions=len(sessions)
            )
            
            logger.info(f"Created usage snapshot for router {router.name}")
            return snapshot
            
    except Exception as e:
        logger.error(f"Failed to create usage snapshot for router {router.name}: {e}")
        return None


@shared_task
def cleanup_old_snapshots():
    """
    Clean up old monitoring snapshots.
    """
    logger.info("Starting old snapshot cleanup...")
    
    try:
        # Keep snapshots for 30 days
        cutoff_date = timezone.now() - timezone.timedelta(days=30)
        
        # Delete old SNMP snapshots
        old_snmp_snapshots = SNMPSnapshot.objects.filter(timestamp__lt=cutoff_date)
        snmp_deleted = old_snmp_snapshots.count()
        old_snmp_snapshots.delete()
        
        # Delete old usage snapshots
        old_usage_snapshots = UsageSnapshot.objects.filter(timestamp__lt=cutoff_date)
        usage_deleted = old_usage_snapshots.count()
        old_usage_snapshots.delete()
        
        total_deleted = snmp_deleted + usage_deleted
        
        logger.info(f"Old snapshot cleanup completed. Deleted {total_deleted} snapshots.")
        return f"Deleted {total_deleted} snapshots"
        
    except Exception as e:
        logger.error(f"Old snapshot cleanup failed: {e}")
        raise


@shared_task
def check_router_status():
    """
    Check status of all routers and update their online/offline status.
    """
    logger.info("Starting router status check...")
    
    try:
        routers = Router.objects.all()
        status_updates = 0
        
        for router in routers:
            try:
                # Test connection
                with RouterOSService(router) as service:
                    if service.connect():
                        if router.status != 'online':
                            router.status = 'online'
                            router.save()
                            status_updates += 1
                            logger.info(f"Router {router.name} is now online")
                    else:
                        if router.status != 'offline':
                            router.status = 'offline'
                            router.save()
                            status_updates += 1
                            logger.info(f"Router {router.name} is now offline")
                            
            except Exception as e:
                logger.error(f"Failed to check status for router {router.name}: {e}")
                # Mark as offline if connection fails
                if router.status != 'offline':
                    router.status = 'offline'
                    router.save()
                    status_updates += 1
                continue
        
        logger.info(f"Router status check completed. Updated {status_updates} routers.")
        return f"Updated {status_updates} router statuses"
        
    except Exception as e:
        logger.error(f"Router status check failed: {e}")
        raise
