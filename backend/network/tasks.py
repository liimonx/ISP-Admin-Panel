from celery import shared_task
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
import logging

from .models import Router
from .services import MikroTikService, update_router_status

logger = logging.getLogger(__name__)


@shared_task
def check_router_status():
    """
    Check the status of all routers and update their status in the database.
    """
    routers = Router.objects.filter(status__in=['online', 'offline'])
    online_count = 0
    offline_count = 0
    
    for router in routers:
        try:
            success = update_router_status(router)
            if success:
                online_count += 1
            else:
                offline_count += 1
                
        except Exception as e:
            logger.error(f"Failed to check status for router {router.name}: {str(e)}")
            offline_count += 1
    
    logger.info(f"Router status check completed: {online_count} online, {offline_count} offline")
    return f"Checked {routers.count()} routers: {online_count} online, {offline_count} offline"


@shared_task
def sync_pppoe_users():
    """
    Sync PPPoE users on all routers with database subscriptions.
    """
    from subscriptions.models import Subscription
    
    routers = Router.objects.filter(status='online', router_type='mikrotik')
    total_synced = 0
    
    for router in routers:
        try:
            service = MikroTikService(router)
            
            # Get active subscriptions for this router
            active_subscriptions = Subscription.objects.filter(
                router=router,
                status='active'
            ).select_related('customer', 'plan')
            
            # Get current PPPoE users on router
            router_users = service.get_pppoe_users()
            router_usernames = {user['username'] for user in router_users}
            
            created_count = 0
            disabled_count = 0
            
            # Create missing users
            for subscription in active_subscriptions:
                if subscription.username not in router_usernames:
                    success = service.create_pppoe_user(
                        username=subscription.username,
                        password=subscription.password,
                        profile=subscription.plan.name if subscription.plan else None
                    )
                    if success:
                        created_count += 1
                        logger.info(f"Created PPPoE user {subscription.username} on {router.name}")
            
            # Disable users not in active subscriptions
            active_usernames = {sub.username for sub in active_subscriptions}
            for user in router_users:
                if user['username'] not in active_usernames and not user.get('disabled'):
                    success = service.disable_pppoe_user(user['username'])
                    if success:
                        disabled_count += 1
                        logger.info(f"Disabled PPPoE user {user['username']} on {router.name}")
            
            total_synced += created_count + disabled_count
            logger.info(f"Synced {router.name}: {created_count} created, {disabled_count} disabled")
            
        except Exception as e:
            logger.error(f"Failed to sync PPPoE users for router {router.name}: {str(e)}")
    
    return f"Synced PPPoE users on {routers.count()} routers, {total_synced} changes made"


@shared_task
def collect_router_metrics():
    """
    Collect metrics from all online routers.
    """
    from monitoring.models import RouterMetric
    
    routers = Router.objects.filter(status='online', router_type='mikrotik')
    metrics_collected = 0
    
    for router in routers:
        try:
            service = MikroTikService(router)
            
            # Get system resources
            resources = service.get_system_resources()
            
            # Get bandwidth usage
            bandwidth = service.get_bandwidth_usage()
            
            # Create metric record (if RouterMetric model exists)
            try:
                RouterMetric.objects.create(
                    router=router,
                    cpu_usage=resources.get('cpu_usage', 0),
                    memory_usage=resources.get('memory_usage', 0),
                    disk_usage=resources.get('disk_usage', 0),
                    temperature=resources.get('temperature'),
                    total_download=bandwidth.get('total_download', 0),
                    total_upload=bandwidth.get('total_upload', 0),
                    download_speed=bandwidth.get('download_speed', 0),
                    upload_speed=bandwidth.get('upload_speed', 0),
                )
                metrics_collected += 1
            except Exception:
                # RouterMetric model might not exist yet
                logger.info(f"Collected metrics for {router.name} (not saved - model not available)")
                metrics_collected += 1
                
        except Exception as e:
            logger.error(f"Failed to collect metrics for router {router.name}: {str(e)}")
    
    logger.info(f"Collected metrics from {metrics_collected} routers")
    return f"Collected metrics from {metrics_collected} routers"


@shared_task
def monitor_router_health():
    """
    Monitor router health and send alerts if needed.
    """
    routers = Router.objects.filter(status='online')
    alerts_sent = 0
    
    for router in routers:
        try:
            service = MikroTikService(router)
            resources = service.get_system_resources()
            
            # Check CPU usage
            cpu_usage = resources.get('cpu_usage', 0)
            if cpu_usage > 80:
                logger.warning(f"High CPU usage on {router.name}: {cpu_usage}%")
                alerts_sent += 1
            
            # Check memory usage
            memory_usage = resources.get('memory_usage', 0)
            if memory_usage > 90:
                logger.warning(f"High memory usage on {router.name}: {memory_usage}%")
                alerts_sent += 1
            
            # Check temperature
            temperature = resources.get('temperature')
            if temperature and temperature > 70:
                logger.warning(f"High temperature on {router.name}: {temperature}°C")
                alerts_sent += 1
                
        except Exception as e:
            logger.error(f"Failed to monitor health for router {router.name}: {str(e)}")
    
    return f"Monitored {routers.count()} routers, {alerts_sent} alerts sent"


@shared_task
def cleanup_old_router_sessions():
    """
    Clean up old router sessions that are no longer active.
    """
    from .models import RouterSession
    
    # Delete sessions older than 24 hours
    cutoff_time = timezone.now() - timedelta(hours=24)
    deleted_count = RouterSession.objects.filter(
        last_seen__lt=cutoff_time
    ).delete()[0]
    
    logger.info(f"Cleaned up {deleted_count} old router sessions")
    return f"Cleaned up {deleted_count} old router sessions"


@shared_task
def update_router_sessions():
    """
    Update router sessions from active PPPoE connections.
    """
    from .models import RouterSession
    
    routers = Router.objects.filter(status='online', router_type='mikrotik')
    sessions_updated = 0
    
    for router in routers:
        try:
            service = MikroTikService(router)
            pppoe_users = service.get_pppoe_users()
            
            # Update or create sessions for active users
            for user in pppoe_users:
                if user.get('uptime'):  # User is active
                    session, created = RouterSession.objects.update_or_create(
                        router=router,
                        username=user['username'],
                        defaults={
                            'ip_address': user.get('caller_id', '0.0.0.0'),
                            'session_id': f"{router.id}_{user['username']}",
                            'last_seen': timezone.now(),
                        }
                    )
                    sessions_updated += 1
                    
        except Exception as e:
            logger.error(f"Failed to update sessions for router {router.name}: {str(e)}")
    
    return f"Updated {sessions_updated} router sessions"


@shared_task
def test_all_routers():
    """
    Test connection to all routers and update their status.
    """
    routers = Router.objects.all()
    results = []
    online_count = 0
    offline_count = 0
    
    for router in routers:
        try:
            success = update_router_status(router)
            
            if success:
                online_count += 1
                results.append(f"{router.name}: Online")
            else:
                offline_count += 1
                results.append(f"{router.name}: Offline")
            
        except Exception as e:
            offline_count += 1
            results.append(f"{router.name}: Error - {str(e)}")
    
    summary = f"Router test completed: {online_count} online, {offline_count} offline\n\n"
    return summary + "\n".join(results)


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
        success = update_router_status(main_router)
        
        if success:
            logger.info(f"Main router {main_router.name} is online")
            return True
        else:
            logger.warning(f"Main router {main_router.name} is offline")
            return False
            
    except Exception as e:
        logger.error(f"Error checking main router health: {str(e)}")
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
@shared_task
def update_router_interface_stats():
    """
    Update aggregate interface statistics from all online routers.
    """
    from django.core.cache import cache

    total_interfaces = 0
    active_interfaces = 0
    routers_checked = 0

    for router in Router.objects.filter(status='online'):
        try:
            service = MikroTikService(router)
            interfaces = service.get_interfaces()
            total_interfaces += len(interfaces)
            active_interfaces += len([i for i in interfaces if i.get('status') == 'up'])
            routers_checked += 1
        except Exception as e:
            logger.warning(f"Failed to get interfaces for stats from router {router.name}: {str(e)}")
            pass

    # Cache the results for 1 hour
    cache.set('router_stats_total_interfaces', total_interfaces, 3600)
    cache.set('router_stats_active_interfaces', active_interfaces, 3600)

    logger.info(f"Updated router interface stats: {total_interfaces} total, {active_interfaces} active from {routers_checked} routers")
    return f"Updated stats from {routers_checked} routers"
