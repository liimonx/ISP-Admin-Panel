"""
Network services for MikroTik RouterOS API integration.
"""
import logging
import time
import re
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from .models import Router

try:
    from librouteros import connect
    from librouteros.exceptions import TrapError, FatalError, ConnectionError as RouterOSConnectionError
    ROUTEROS_AVAILABLE = True
except ImportError:
    ROUTEROS_AVAILABLE = False
    connect = None
    TrapError = FatalError = RouterOSConnectionError = Exception

logger = logging.getLogger(__name__)


class MikroTikService:
    """
    Service class for interacting with MikroTik routers via API.
    """
    
    def __init__(self, router: Router):
        self.router = router
        self.host = router.host
        self.port = router.api_port
        self.username = router.username
        self.password = router.password
        self.use_tls = router.use_tls
        self.connection = None
        
        # Use mock mode if librouteros is not available or in debug mode
        self._mock_mode = not ROUTEROS_AVAILABLE or getattr(settings, 'MIKROTIK_MOCK_MODE', False)
        
        if self._mock_mode:
            logger.warning(f"MikroTik service running in mock mode for {router.name}")
    
    def connect(self):
        """Establish connection to the router."""
        if self._mock_mode:
            return None
            
        try:
            self.connection = connect(
                username=self.username,
                password=self.password,
                host=self.host,
                port=self.port,
                timeout=30
            )
            return self.connection
        except Exception as e:
            logger.error(f"Failed to connect to {self.router.name}: {str(e)}")
            raise
    
    def disconnect(self):
        """Close connection to the router."""
        if self.connection:
            try:
                self.connection.close()
            except Exception as e:
                logger.warning(f"Error closing connection to {self.router.name}: {str(e)}")
            finally:
                self.connection = None
    
    def __enter__(self):
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()
    
    def test_connection(self) -> Dict[str, Any]:
        """Test connection to the router."""
        start_time = time.time()
        
        try:
            if self._mock_mode:
                # Mock connection test
                time.sleep(0.1)  # Simulate network delay
                return {
                    'success': True,
                    'response_time_ms': 45,
                    'api_version': '6.49.7',
                    'router_name': self.router.name,
                    'uptime': '15 days, 3 hours, 45 minutes',
                    'cpu_usage': 25,
                    'memory_usage': 45,
                }
            else:
                # Real MikroTik API connection
                with self:
                    # Test basic system resource command
                    resource = list(self.connection.path('system', 'resource').select('version', 'uptime', 'cpu-load', 'free-memory', 'total-memory'))
                    identity = list(self.connection.path('system', 'identity').select('name'))
                    
                    response_time = int((time.time() - start_time) * 1000)
                    
                    if resource and identity:
                        res = resource[0]
                        total_mem = int(res.get('total-memory', 0))
                        free_mem = int(res.get('free-memory', 0))
                        memory_usage = int(((total_mem - free_mem) / total_mem) * 100) if total_mem > 0 else 0
                        
                        return {
                            'success': True,
                            'response_time_ms': response_time,
                            'api_version': res.get('version', 'Unknown'),
                            'router_name': identity[0].get('name', self.router.name),
                            'uptime': res.get('uptime', 'Unknown'),
                            'cpu_usage': int(res.get('cpu-load', 0)),
                            'memory_usage': memory_usage,
                        }
                    else:
                        return {
                            'success': False,
                            'error': 'No response from router'
                        }
                        
        except Exception as e:
            logger.error(f"Connection test failed for {self.router.name}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'response_time_ms': int((time.time() - start_time) * 1000)
            }
    
    def get_interfaces(self) -> List[Dict[str, Any]]:
        """Get router interfaces."""
        if self._mock_mode:
            return [
                {
                    'name': 'ether1',
                    'type': 'Ethernet',
                    'status': 'up',
                    'ip_address': f'{self.host}/24',
                    'mac_address': '4C:5E:0C:12:34:56',
                    'speed': '1Gbps',
                },
                {
                    'name': 'ether2',
                    'type': 'Ethernet',
                    'status': 'up',
                    'ip_address': '192.168.1.1/24',
                    'mac_address': '4C:5E:0C:12:34:57',
                    'speed': '1Gbps',
                },
                {
                    'name': 'wlan1',
                    'type': 'Wireless',
                    'status': 'up',
                    'ip_address': '10.0.0.1/24',
                    'mac_address': '4C:5E:0C:12:34:58',
                    'speed': '300Mbps',
                },
            ]
        else:
            try:
                with self:
                    interfaces = list(self.connection.path('interface').select(
                        'name', 'type', 'running', 'mac-address'
                    ))
                    
                    result = []
                    for iface in interfaces:
                        # Get IP addresses for this interface
                        ip_addresses = list(self.connection.path('ip', 'address').select(
                            'address', 'interface'
                        ).where('interface', iface['name']))
                        
                        ip_addr = ip_addresses[0]['address'] if ip_addresses else 'No IP'
                        
                        result.append({
                            'name': iface.get('name', ''),
                            'type': iface.get('type', 'Unknown'),
                            'status': 'up' if iface.get('running') == 'true' else 'down',
                            'ip_address': ip_addr,
                            'mac_address': iface.get('mac-address', ''),
                            'speed': 'Unknown',  # Speed detection would need additional API calls
                        })
                    
                    return result
            except Exception as e:
                logger.error(f"Failed to get interfaces from {self.router.name}: {str(e)}")
                return []
    
    def get_bandwidth_usage(self) -> Dict[str, Any]:
        """Get bandwidth usage statistics."""
        if self._mock_mode:
            # Get fallback data from database instead of hardcoded values
            return self._get_bandwidth_fallback()
        else:
            try:
                with self:
                    # Get interface statistics
                    interfaces = list(self.connection.path('interface').select(
                        'name', 'rx-byte', 'tx-byte'
                    ))
                    
                    total_download = 0
                    total_upload = 0
                    interface_stats = {}
                    
                    for iface in interfaces:
                        rx_bytes = int(iface.get('rx-byte', 0))
                        tx_bytes = int(iface.get('tx-byte', 0))
                        
                        total_download += rx_bytes
                        total_upload += tx_bytes
                        
                        interface_stats[iface['name']] = {
                            'download': rx_bytes,
                            'upload': tx_bytes,
                        }
                    
                    return {
                        'total_download': total_download,
                        'total_upload': total_upload,
                        'download_speed': 0,  # Real-time speed would need monitoring
                        'upload_speed': 0,
                        'interfaces': interface_stats
                    }
            except Exception as e:
                logger.error(f"Failed to get bandwidth usage from {self.router.name}: {str(e)}")
                # Return database fallback instead of zeros
                return self._get_bandwidth_fallback()
    
    def _get_bandwidth_fallback(self) -> Dict[str, Any]:
        """Get bandwidth fallback data from database metrics."""
        try:
            from monitoring.models import RouterMetric
            
            # Get the latest metric for this router
            latest_metric = RouterMetric.objects.filter(
                router=self.router
            ).order_by('-timestamp').first()
            
            if latest_metric:
                return {
                    'total_download': latest_metric.total_download,
                    'total_upload': latest_metric.total_upload,
                    'download_speed': latest_metric.download_speed,
                    'upload_speed': latest_metric.upload_speed,
                    'interfaces': {}  # Interface breakdown not available from metrics
                }
            else:
                # No metrics available, return minimal data
                logger.warning(f"No bandwidth metrics available for router {self.router.name}")
                return {
                    'total_download': 0,
                    'total_upload': 0,
                    'download_speed': 0,
                    'upload_speed': 0,
                    'interfaces': {}
                }
        except Exception as e:
            logger.error(f"Failed to get bandwidth fallback for {self.router.name}: {str(e)}")
            return {
                'total_download': 0,
                'total_upload': 0,
                'download_speed': 0,
                'upload_speed': 0,
                'interfaces': {}
            }
    
    def get_connections(self) -> List[Dict[str, Any]]:
        """Get active connections."""
        if self._mock_mode:
            return [
                {
                    'protocol': 'TCP',
                    'source': '192.168.1.100:54321',
                    'destination': '8.8.8.8:443',
                    'state': 'established',
                    'duration': '00:15:30',
                },
                {
                    'protocol': 'UDP',
                    'source': '192.168.1.101:12345',
                    'destination': '1.1.1.1:53',
                    'state': 'established',
                    'duration': '00:02:15',
                },
            ]
        else:
            try:
                with self:
                    # Get active connections from connection tracking
                    connections = list(self.connection.path('ip', 'firewall', 'connection').select(
                        'protocol', 'src-address', 'dst-address', 'connection-state', 'timeout'
                    ))
                    
                    result = []
                    for conn in connections[:50]:  # Limit to 50 connections
                        result.append({
                            'protocol': conn.get('protocol', 'Unknown').upper(),
                            'source': conn.get('src-address', ''),
                            'destination': conn.get('dst-address', ''),
                            'state': conn.get('connection-state', 'unknown'),
                            'duration': conn.get('timeout', ''),
                        })
                    
                    return result
            except Exception as e:
                logger.error(f"Failed to get connections from {self.router.name}: {str(e)}")
                return []
    
    def get_dhcp_leases(self) -> List[Dict[str, Any]]:
        """Get DHCP leases."""
        if self._mock_mode:
            return [
                {
                    'ip_address': '192.168.1.100',
                    'mac_address': 'AA:BB:CC:DD:EE:FF',
                    'hostname': 'johns-iphone',
                    'status': 'active',
                    'expires': '2024-01-15T10:30:00Z',
                },
                {
                    'ip_address': '192.168.1.101',
                    'mac_address': '11:22:33:44:55:66',
                    'hostname': 'janes-laptop',
                    'status': 'active',
                    'expires': '2024-01-15T11:45:00Z',
                },
            ]
        else:
            try:
                with self:
                    # Get DHCP leases
                    leases = list(self.connection.path('ip', 'dhcp-server', 'lease').select(
                        'address', 'mac-address', 'host-name', 'status', 'expires-after'
                    ))
                    
                    result = []
                    for lease in leases:
                        expires_after = lease.get('expires-after', '')
                        expires = None
                        if expires_after:
                            try:
                                # Convert RouterOS time format to ISO format
                                expires = (timezone.now() + timedelta(seconds=int(expires_after))).isoformat()
                            except (ValueError, TypeError):
                                expires = expires_after
                        
                        result.append({
                            'ip_address': lease.get('address', ''),
                            'mac_address': lease.get('mac-address', ''),
                            'hostname': lease.get('host-name', ''),
                            'status': lease.get('status', 'unknown'),
                            'expires': expires,
                        })
                    
                    return result
            except Exception as e:
                logger.error(f"Failed to get DHCP leases from {self.router.name}: {str(e)}")
                return []
    
    def get_system_resources(self) -> Dict[str, Any]:
        """Get system resource usage."""
        if self._mock_mode:
            return {
                'cpu_usage': 25,
                'memory_usage': 45,
                'disk_usage': 12,
                'temperature': 45,
                'uptime': '15 days, 3 hours, 45 minutes',
                'load_average': [0.5, 0.3, 0.2],
            }
        else:
            try:
                with self:
                    # Get system resources
                    resource = list(self.connection.path('system', 'resource').select(
                        'uptime', 'cpu-load', 'free-memory', 'total-memory', 'free-hdd-space', 'total-hdd-space'
                    ))
                    
                    # Get system health (temperature, voltage, etc.)
                    health = []
                    try:
                        health = list(self.connection.path('system', 'health').select(
                            'name', 'value', 'type'
                        ))
                    except:
                        pass  # Health monitoring might not be available on all devices
                    
                    if resource:
                        res = resource[0]
                        total_mem = int(res.get('total-memory', 0))
                        free_mem = int(res.get('free-memory', 0))
                        memory_usage = int(((total_mem - free_mem) / total_mem) * 100) if total_mem > 0 else 0
                        
                        total_hdd = int(res.get('total-hdd-space', 0))
                        free_hdd = int(res.get('free-hdd-space', 0))
                        disk_usage = int(((total_hdd - free_hdd) / total_hdd) * 100) if total_hdd > 0 else 0
                        
                        # Extract temperature from health data
                        temperature = None
                        for h in health:
                            if 'temperature' in h.get('name', '').lower():
                                try:
                                    temperature = int(float(h.get('value', 0)))
                                    break
                                except (ValueError, TypeError):
                                    pass
                        
                        return {
                            'cpu_usage': int(res.get('cpu-load', 0)),
                            'memory_usage': memory_usage,
                            'disk_usage': disk_usage,
                            'temperature': temperature,
                            'uptime': res.get('uptime', 'Unknown'),
                            'load_average': [int(res.get('cpu-load', 0)) / 100],
                        }
                    else:
                        return {
                            'cpu_usage': 0,
                            'memory_usage': 0,
                            'disk_usage': 0,
                            'temperature': None,
                            'uptime': 'Unknown',
                            'load_average': [0],
                        }
            except Exception as e:
                logger.error(f"Failed to get system resources from {self.router.name}: {str(e)}")
                return {
                    'cpu_usage': 0,
                    'memory_usage': 0,
                    'disk_usage': 0,
                    'temperature': None,
                    'uptime': 'Unknown',
                    'load_average': [0],
                }
    
    def get_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get system logs."""
        if self._mock_mode:
            return [
                {
                    'timestamp': '2024-01-15T10:30:00Z',
                    'level': 'info',
                    'message': 'DHCP lease added: 192.168.1.100 -> AA:BB:CC:DD:EE:FF',
                },
                {
                    'timestamp': '2024-01-15T10:25:00Z',
                    'level': 'warning',
                    'message': 'High CPU usage detected: 85%',
                },
                {
                    'timestamp': '2024-01-15T10:20:00Z',
                    'level': 'info',
                    'message': 'Interface ether1 is up',
                },
            ][:limit]
        else:
            try:
                with self:
                    # Get system logs
                    logs = list(self.connection.path('log').select(
                        'time', 'topics', 'message'
                    ))
                    
                    result = []
                    for log in logs[-limit:]:  # Get last N logs
                        # Convert RouterOS time to ISO format
                        timestamp = log.get('time', '')
                        try:
                            # RouterOS time format might need conversion
                            if timestamp:
                                timestamp = timezone.now().isoformat()  # Fallback to current time
                        except:
                            timestamp = timezone.now().isoformat()
                        
                        # Determine log level from topics
                        topics = log.get('topics', '')
                        level = 'info'
                        if 'error' in topics.lower() or 'critical' in topics.lower():
                            level = 'error'
                        elif 'warning' in topics.lower():
                            level = 'warning'
                        
                        result.append({
                            'timestamp': timestamp,
                            'level': level,
                            'message': log.get('message', ''),
                        })
                    
                    return result
            except Exception as e:
                logger.error(f"Failed to get logs from {self.router.name}: {str(e)}")
                return []
    
    def get_pppoe_users(self) -> List[Dict[str, Any]]:
        """Get PPPoE users."""
        if self._mock_mode:
            return [
                {
                    'username': 'user1',
                    'service': 'pppoe1',
                    'caller_id': '192.168.1.100',
                    'uptime': '2h 30m',
                    'limit_bytes_in': '1G',
                    'limit_bytes_out': '1G',
                    'disabled': False,
                }
            ]
        else:
            try:
                with self:
                    # Get PPP secrets (users)
                    secrets = list(self.connection.path('ppp', 'secret').select(
                        'name', 'service', 'caller-id', 'limit-bytes-in', 'limit-bytes-out', 'disabled'
                    ))
                    
                    # Get active PPP sessions
                    active_sessions = list(self.connection.path('ppp', 'active').select(
                        'name', 'caller-id', 'uptime', 'service'
                    ))
                    
                    # Create a map of active sessions
                    active_map = {session['name']: session for session in active_sessions}
                    
                    result = []
                    for secret in secrets:
                        username = secret.get('name', '')
                        active_session = active_map.get(username, {})
                        
                        result.append({
                            'username': username,
                            'service': secret.get('service', ''),
                            'caller_id': active_session.get('caller-id', secret.get('caller-id', '')),
                            'uptime': active_session.get('uptime', ''),
                            'limit_bytes_in': secret.get('limit-bytes-in', ''),
                            'limit_bytes_out': secret.get('limit-bytes-out', ''),
                            'disabled': secret.get('disabled') == 'true',
                        })
                    
                    return result
            except Exception as e:
                logger.error(f"Failed to get PPPoE users from {self.router.name}: {str(e)}")
                return []
    
    def create_pppoe_user(self, username: str, password: str, profile: str = None, 
                         limit_bytes_in: str = None, limit_bytes_out: str = None) -> bool:
        """Create a PPPoE user."""
        if self._mock_mode:
            logger.info(f"Mock: Creating PPPoE user {username} on {self.router.name}")
            return True
        else:
            try:
                with self:
                    # Prepare user data
                    user_data = {
                        'name': username,
                        'password': password,
                        'service': 'pppoe',
                    }
                    
                    if profile:
                        user_data['profile'] = profile
                    if limit_bytes_in:
                        user_data['limit-bytes-in'] = limit_bytes_in
                    if limit_bytes_out:
                        user_data['limit-bytes-out'] = limit_bytes_out
                    
                    # Add PPP secret
                    self.connection.path('ppp', 'secret').add(**user_data)
                    logger.info(f"Created PPPoE user {username} on {self.router.name}")
                    return True
            except Exception as e:
                logger.error(f"Failed to create PPPoE user {username} on {self.router.name}: {str(e)}")
                return False
    
    def delete_pppoe_user(self, username: str) -> bool:
        """Delete a PPPoE user."""
        if self._mock_mode:
            logger.info(f"Mock: Deleting PPPoE user {username} from {self.router.name}")
            return True
        else:
            try:
                with self:
                    # Find the user
                    users = list(self.connection.path('ppp', 'secret').select('.id', 'name').where('name', username))
                    
                    if users:
                        user_id = users[0]['.id']
                        self.connection.path('ppp', 'secret').remove(user_id)
                        logger.info(f"Deleted PPPoE user {username} from {self.router.name}")
                        return True
                    else:
                        logger.warning(f"PPPoE user {username} not found on {self.router.name}")
                        return False
            except Exception as e:
                logger.error(f"Failed to delete PPPoE user {username} from {self.router.name}: {str(e)}")
                return False
    
    def enable_pppoe_user(self, username: str) -> bool:
        """Enable a PPPoE user."""
        if self._mock_mode:
            logger.info(f"Mock: Enabling PPPoE user {username} on {self.router.name}")
            return True
        else:
            try:
                with self:
                    users = list(self.connection.path('ppp', 'secret').select('.id', 'name').where('name', username))
                    
                    if users:
                        user_id = users[0]['.id']
                        self.connection.path('ppp', 'secret').update(user_id, disabled='false')
                        logger.info(f"Enabled PPPoE user {username} on {self.router.name}")
                        return True
                    else:
                        logger.warning(f"PPPoE user {username} not found on {self.router.name}")
                        return False
            except Exception as e:
                logger.error(f"Failed to enable PPPoE user {username} on {self.router.name}: {str(e)}")
                return False
    
    def disable_pppoe_user(self, username: str) -> bool:
        """Disable a PPPoE user."""
        if self._mock_mode:
            logger.info(f"Mock: Disabling PPPoE user {username} on {self.router.name}")
            return True
        else:
            try:
                with self:
                    users = list(self.connection.path('ppp', 'secret').select('.id', 'name').where('name', username))
                    
                    if users:
                        user_id = users[0]['.id']
                        self.connection.path('ppp', 'secret').update(user_id, disabled='true')
                        logger.info(f"Disabled PPPoE user {username} on {self.router.name}")
                        return True
                    else:
                        logger.warning(f"PPPoE user {username} not found on {self.router.name}")
                        return False
            except Exception as e:
                logger.error(f"Failed to disable PPPoE user {username} on {self.router.name}: {str(e)}")
                return False
    
    def execute_command(self, command: str) -> str:
        """Execute a command on the router."""
        if self._mock_mode:
            return f"Command executed: {command}\nResult: Mock response for {command}"
        else:
            try:
                with self:
                    # This is a simplified command execution
                    # In practice, you'd need to parse the command and call appropriate API methods
                    logger.warning(f"Command execution not implemented for: {command}")
                    return f"Command execution not implemented: {command}"
            except Exception as e:
                logger.error(f"Failed to execute command on {self.router.name}: {str(e)}")
                return f"Error executing command: {str(e)}"
    
    def restart_router(self) -> bool:
        """Restart the router."""
        if self._mock_mode:
            logger.warning(f"Mock router restart requested for {self.router.name}")
            return True
        else:
            try:
                with self:
                    self.connection.path('system').call('reboot')
                    logger.warning(f"Router restart initiated for {self.router.name}")
                    return True
            except Exception as e:
                logger.error(f"Failed to restart router {self.router.name}: {str(e)}")
                return False


def test_router_connection(router: Router) -> Dict[str, Any]:
    """
    Test connection to a router.
    This is a legacy function for backward compatibility.
    """
    service = MikroTikService(router)
    return service.test_connection()


def update_router_status(router: Router) -> bool:
    """
    Update router status based on connection test.
    """
    try:
        service = MikroTikService(router)
        result = service.test_connection()
        
        if result.get('success'):
            router.status = Router.Status.ONLINE
            router.last_seen = timezone.now()
        else:
            router.status = Router.Status.OFFLINE
        
        router.save(update_fields=['status', 'last_seen'])
        return result.get('success', False)
    except Exception as e:
        logger.error(f"Failed to update router status for {router.name}: {str(e)}")
        router.status = Router.Status.OFFLINE
        router.save(update_fields=['status'])
        return False


def parse_uptime(uptime_str: Any) -> int:
    """
    Parse MikroTik uptime string into seconds.
    Supports formats like '15 days, 3 hours, 45 minutes', '3w4d12:34:56', '4d12:34:56', '12:34:56'.
    """
    if not uptime_str or uptime_str == 'Unknown':
        return 0

    if isinstance(uptime_str, (int, float)):
        return int(uptime_str)

    # If it's already a timedelta
    if hasattr(uptime_str, 'total_seconds'):
        return int(uptime_str.total_seconds())

    if not isinstance(uptime_str, str):
        return 0

    total_seconds = 0

    # Handle mock format: "15 days, 3 hours, 45 minutes"
    if 'day' in uptime_str or 'hour' in uptime_str or 'minute' in uptime_str:
        # Regex to find numbers and their units
        parts = re.findall(r'(\d+)\s*(day|hour|minute|second)s?', uptime_str)
        if parts:
            for value, unit in parts:
                value = int(value)
                if unit == 'day':
                    total_seconds += value * 86400
                elif unit == 'hour':
                    total_seconds += value * 3600
                elif unit == 'minute':
                    total_seconds += value * 60
                elif unit == 'second':
                    total_seconds += value
            return total_seconds

    # Handle RouterOS format: [w]d]hh:mm:ss or hh:mm:ss
    # 2w1d12:34:56
    # 1d12:34:56
    # 12:34:56
    pattern = r'(?:(\d+)w)?(?:(\d+)d)?(?:(\d+):(\d+):(\d+))'
    match = re.search(pattern, uptime_str)
    if match:
        weeks, days, hours, minutes, seconds = match.groups()
        if weeks:
            total_seconds += int(weeks) * 604800
        if days:
            total_seconds += int(days) * 86400
        if hours:
            total_seconds += int(hours) * 3600
        if minutes:
            total_seconds += int(minutes) * 60
        if seconds:
            total_seconds += int(seconds)

    return total_seconds


class RouterOSService:
    """
    Legacy RouterOS service class for backward compatibility.
    """
    
    def __init__(self, router: Router):
        self.router = router
        self.service = MikroTikService(router)
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass
    
    def test_connection(self):
        return self.service.test_connection()
    
    def get_pppoe_users(self):
        return self.service.get_pppoe_users()
    
    def create_pppoe_user(self, username: str, password: str, profile: str = None):
        return self.service.create_pppoe_user(username, password, profile)
    
    def delete_pppoe_user(self, username: str):
        return self.service.delete_pppoe_user(username)
    
    def enable_pppoe_user(self, username: str):
        return self.service.enable_pppoe_user(username)
    
    def disable_pppoe_user(self, username: str):
        return self.service.disable_pppoe_user(username)
