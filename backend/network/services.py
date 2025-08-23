"""
Network services for MikroTik RouterOS API integration.
"""
import logging
from typing import Dict, List, Optional, Any
from librouteros import connect
from librouteros.exceptions import ConnectionError, TrapError
from django.conf import settings
from .models import Router, RouterSession

logger = logging.getLogger(__name__)


class RouterOSService:
    """
    Service class for MikroTik RouterOS API operations.
    """
    
    def __init__(self, router: Router):
        self.router = router
        self.connection = None
    
    def connect(self) -> bool:
        """
        Connect to MikroTik router via API.
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            if self.router.use_tls:
                self.connection = connect(
                    username=self.router.username,
                    password=self.router.password,
                    host=self.router.host,
                    port=self.router.api_port,
                    ssl_wrapper=True
                )
            else:
                self.connection = connect(
                    username=self.router.username,
                    password=self.router.password,
                    host=self.router.host,
                    port=self.router.api_port
                )
            
            # Update router status
            self.router.status = Router.Status.ONLINE
            self.router.save()
            
            logger.info(f"Successfully connected to router {self.router.name}")
            return True
            
        except (ConnectionError, TrapError) as e:
            logger.error(f"Failed to connect to router {self.router.name}: {e}")
            self.router.status = Router.Status.OFFLINE
            self.router.save()
            return False
    
    def disconnect(self):
        """Disconnect from router."""
        if self.connection:
            self.connection.close()
            self.connection = None
    
    def get_pppoe_users(self) -> List[Dict[str, Any]]:
        """
        Get all PPPoE users from router.
        
        Returns:
            List[Dict]: List of PPPoE user dictionaries
        """
        if not self.connection:
            if not self.connect():
                return []
        
        try:
            users = self.connection.path('pppoe', 'secret').select()
            return list(users)
        except Exception as e:
            logger.error(f"Failed to get PPPoE users from {self.router.name}: {e}")
            return []
    
    def create_pppoe_user(self, username: str, password: str, profile: str = None) -> bool:
        """
        Create a new PPPoE user on the router.
        
        Args:
            username: PPPoE username
            password: PPPoE password
            profile: Service profile name (optional)
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.connection:
            if not self.connect():
                return False
        
        try:
            user_data = {
                'name': username,
                'password': password,
                'service': 'pppoe'
            }
            
            if profile:
                user_data['profile'] = profile
            
            self.connection.path('pppoe', 'secret').add(**user_data)
            logger.info(f"Created PPPoE user {username} on {self.router.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create PPPoE user {username} on {self.router.name}: {e}")
            return False
    
    def update_pppoe_user(self, username: str, password: str = None, profile: str = None) -> bool:
        """
        Update an existing PPPoE user.
        
        Args:
            username: PPPoE username
            password: New password (optional)
            profile: New service profile (optional)
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.connection:
            if not self.connect():
                return False
        
        try:
            # Find user by name
            users = self.connection.path('pppoe', 'secret').select().where(name=username)
            user = list(users)[0] if users else None
            
            if not user:
                logger.error(f"PPPoE user {username} not found on {self.router.name}")
                return False
            
            # Update user
            update_data = {}
            if password:
                update_data['password'] = password
            if profile:
                update_data['profile'] = profile
            
            if update_data:
                self.connection.path('pppoe', 'secret').update(id=user['id'], **update_data)
                logger.info(f"Updated PPPoE user {username} on {self.router.name}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update PPPoE user {username} on {self.router.name}: {e}")
            return False
    
    def delete_pppoe_user(self, username: str) -> bool:
        """
        Delete a PPPoE user from the router.
        
        Args:
            username: PPPoE username to delete
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.connection:
            if not self.connect():
                return False
        
        try:
            # Find user by name
            users = self.connection.path('pppoe', 'secret').select().where(name=username)
            user = list(users)[0] if users else None
            
            if not user:
                logger.error(f"PPPoE user {username} not found on {self.router.name}")
                return False
            
            # Delete user
            self.connection.path('pppoe', 'secret').remove(id=user['id'])
            logger.info(f"Deleted PPPoE user {username} from {self.router.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete PPPoE user {username} from {self.router.name}: {e}")
            return False
    
    def enable_pppoe_user(self, username: str) -> bool:
        """
        Enable a PPPoE user.
        
        Args:
            username: PPPoE username to enable
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.connection:
            if not self.connect():
                return False
        
        try:
            # Find user by name
            users = self.connection.path('pppoe', 'secret').select().where(name=username)
            user = list(users)[0] if users else None
            
            if not user:
                logger.error(f"PPPoE user {username} not found on {self.router.name}")
                return False
            
            # Enable user
            self.connection.path('pppoe', 'secret').update(id=user['id'], disabled='no')
            logger.info(f"Enabled PPPoE user {username} on {self.router.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to enable PPPoE user {username} on {self.router.name}: {e}")
            return False
    
    def disable_pppoe_user(self, username: str) -> bool:
        """
        Disable a PPPoE user.
        
        Args:
            username: PPPoE username to disable
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.connection:
            if not self.connect():
                return False
        
        try:
            # Find user by name
            users = self.connection.path('pppoe', 'secret').select().where(name=username)
            user = list(users)[0] if users else None
            
            if not user:
                logger.error(f"PPPoE user {username} not found on {self.router.name}")
                return False
            
            # Disable user
            self.connection.path('pppoe', 'secret').update(id=user['id'], disabled='yes')
            logger.info(f"Disabled PPPoE user {username} on {self.router.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to disable PPPoE user {username} on {self.router.name}: {e}")
            return False
    
    def get_active_sessions(self) -> List[Dict[str, Any]]:
        """
        Get active PPPoE sessions from router.
        
        Returns:
            List[Dict]: List of active session dictionaries
        """
        if not self.connection:
            if not self.connect():
                return []
        
        try:
            sessions = self.connection.path('pppoe', 'active').select()
            return list(sessions)
        except Exception as e:
            logger.error(f"Failed to get active sessions from {self.router.name}: {e}")
            return []
    
    def get_queues(self) -> List[Dict[str, Any]]:
        """
        Get queue tree from router.
        
        Returns:
            List[Dict]: List of queue dictionaries
        """
        if not self.connection:
            if not self.connect():
                return []
        
        try:
            queues = self.connection.path('queue', 'simple').select()
            return list(queues)
        except Exception as e:
            logger.error(f"Failed to get queues from {self.router.name}: {e}")
            return []
    
    def create_queue(self, name: str, target: str, max_limit: str = None) -> bool:
        """
        Create a simple queue for bandwidth limiting.
        
        Args:
            name: Queue name
            target: Target IP address
            max_limit: Maximum bandwidth limit (e.g., "10M/10M")
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.connection:
            if not self.connect():
                return False
        
        try:
            queue_data = {
                'name': name,
                'target': target
            }
            
            if max_limit:
                queue_data['max-limit'] = max_limit
            
            self.connection.path('queue', 'simple').add(**queue_data)
            logger.info(f"Created queue {name} on {self.router.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create queue {name} on {self.router.name}: {e}")
            return False
    
    def delete_queue(self, name: str) -> bool:
        """
        Delete a queue from the router.
        
        Args:
            name: Queue name to delete
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.connection:
            if not self.connect():
                return False
        
        try:
            # Find queue by name
            queues = self.connection.path('queue', 'simple').select().where(name=name)
            queue = list(queues)[0] if queues else None
            
            if not queue:
                logger.error(f"Queue {name} not found on {self.router.name}")
                return False
            
            # Delete queue
            self.connection.path('queue', 'simple').remove(id=queue['id'])
            logger.info(f"Deleted queue {name} from {self.router.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete queue {name} from {self.router.name}: {e}")
            return False
    
    def get_system_resources(self) -> Optional[Dict[str, Any]]:
        """
        Get system resource information from router.
        
        Returns:
            Dict: System resource information or None if failed
        """
        if not self.connection:
            if not self.connect():
                return None
        
        try:
            resources = self.connection.path('system', 'resource').select()
            resource = list(resources)[0] if resources else None
            return resource
        except Exception as e:
            logger.error(f"Failed to get system resources from {self.router.name}: {e}")
            return None
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.disconnect()


def test_router_connection(router: Router) -> Dict[str, Any]:
    """
    Test connection to a router.
    
    Args:
        router: Router instance to test
    
    Returns:
        Dict: Test results
    """
    result = {
        'success': False,
        'message': '',
        'details': {}
    }
    
    try:
        with RouterOSService(router) as service:
            if service.connect():
                result['success'] = True
                result['message'] = 'Connection successful'
                
                # Get system resources
                resources = service.get_system_resources()
                if resources:
                    result['details']['resources'] = resources
                
                # Get PPPoE users count
                users = service.get_pppoe_users()
                result['details']['pppoe_users_count'] = len(users)
                
                # Get active sessions count
                sessions = service.get_active_sessions()
                result['details']['active_sessions_count'] = len(sessions)
                
            else:
                result['message'] = 'Failed to connect to router'
    
    except Exception as e:
        result['message'] = f'Connection test failed: {str(e)}'
        logger.error(f"Router connection test failed for {router.name}: {e}")
    
    return result
