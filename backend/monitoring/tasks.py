"""
Celery tasks for monitoring operations.
"""
import logging
from celery import shared_task
from django.utils import timezone
from network.models import Router
from network.services import RouterOSService, MikroTikService, parse_uptime
from .models import RouterMetric, SNMPSnapshot, UsageSnapshot

logger = logging.getLogger(__name__)


@shared_task
def poll_router_metrics():
    """
    Poll metrics from all routers and store in database.
    """
    logger.info("Starting router metrics polling...")
    
    try:
        # Get all routers
        routers = Router.objects.all()
        metrics_created = 0
        
        for router in routers:
            try:
                # Create router metric
                metric = create_router_metric(router)
                if metric:
                    metrics_created += 1
                    
                # Create SNMP snapshot
                snmp_snapshot = create_snmp_snapshot(router)
                if snmp_snapshot:
                    metrics_created += 1
                
                # Create usage snapshot
                usage_snapshot = create_usage_snapshot(router)
                if usage_snapshot:
                    metrics_created += 1
                    
            except Exception as e:
                logger.error(f"Failed to poll data from router {router.name}: {e}")
                continue
        
        logger.info(f"Router metrics polling completed. Created {metrics_created} records.")
        return f"Created {metrics_created} records"
        
    except Exception as e:
        logger.error(f"Router metrics polling failed: {e}")
        raise


@shared_task
def poll_snmp_usage():
    """
    Legacy task - redirects to poll_router_metrics.
    """
    return poll_router_metrics()


def create_router_metric(router):
    """
    Create router metric record.
    """
    try:
        service = MikroTikService(router)
        
        # Get system resources
        resources = service.get_system_resources()
        bandwidth = service.get_bandwidth_usage()
        
        if resources:
            # Create metric
            metric = RouterMetric.objects.create(
                router=router,
                cpu_usage=int(resources.get('cpu_usage', 0)),
                memory_usage=int(resources.get('memory_usage', 0)),
                disk_usage=int(resources.get('disk_usage', 0)),
                temperature=resources.get('temperature'),
                total_download=bandwidth.get('total_download', 0),
                total_upload=bandwidth.get('total_upload', 0),
                download_speed=bandwidth.get('download_speed', 0),
                upload_speed=bandwidth.get('upload_speed', 0),
            )
            
            logger.info(f"Created router metric for {router.name}")
            return metric
                
    except Exception as e:
        logger.error(f"Failed to create router metric for {router.name}: {e}")
        return None


def create_snmp_snapshot(router):
    """
    Create SNMP snapshot for a router.
    """
    try:
        service = MikroTikService(router)
        
        # Get system resources
        resources = service.get_system_resources()
        interfaces = service.get_interfaces()
        
        if resources:
            # Create snapshot
            snapshot = SNMPSnapshot.objects.create(
                router=router,
                cpu_usage=float(resources.get('cpu_usage', 0)),
                memory_usage=float(resources.get('memory_usage', 0)),
                uptime=parse_uptime(resources.get('uptime')),
                interface_data={'interfaces': interfaces}
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
        service = MikroTikService(router)
        
        # Get connections and users
        connections = service.get_connections()
        users = service.get_pppoe_users()
        bandwidth = service.get_bandwidth_usage()
        
        # Create snapshot
        snapshot = UsageSnapshot.objects.create(
            router=router,
            total_bytes_in=bandwidth.get('total_download', 0),
            total_bytes_out=bandwidth.get('total_upload', 0),
            active_connections=len(connections),
            pppoe_users_count=len(users),
            pppoe_active_sessions=len([u for u in users if u.get('uptime')])
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
                # Test connection using MikroTikService
                service = MikroTikService(router)
                result = service.test_connection()
                
                if result.get('success'):
                    if router.status != 'online':
                        router.status = 'online'
                        router.last_seen = timezone.now()
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
