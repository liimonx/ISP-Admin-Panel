"""
Health check and monitoring utilities for the ISP Admin API.
"""
import logging
import time
import psutil
from typing import Dict, Any
from django.conf import settings
from django.core.cache import cache
from django.db import connections
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


class HealthChecker:
    """Health check utility class."""

    @staticmethod
    def check_database() -> Dict[str, Any]:
        """Check database connectivity and performance."""
        try:
            start_time = time.time()

            # Test default database connection
            db_conn = connections['default']
            with db_conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()

            response_time = (time.time() - start_time) * 1000

            return {
                'status': 'healthy',
                'response_time_ms': round(response_time, 2),
                'message': 'Database connection successful'
            }
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Database connection failed'
            }

    @staticmethod
    def check_cache() -> Dict[str, Any]:
        """Check cache connectivity and performance."""
        try:
            start_time = time.time()
            test_key = f"health_check_{timezone.now().timestamp()}"
            test_value = "health_check_value"

            # Test cache write
            cache.set(test_key, test_value, 60)

            # Test cache read
            cached_value = cache.get(test_key)

            # Cleanup
            cache.delete(test_key)

            response_time = (time.time() - start_time) * 1000

            if cached_value == test_value:
                return {
                    'status': 'healthy',
                    'response_time_ms': round(response_time, 2),
                    'message': 'Cache operations successful'
                }
            else:
                return {
                    'status': 'unhealthy',
                    'message': 'Cache read/write mismatch'
                }
        except Exception as e:
            logger.error(f"Cache health check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Cache connection failed'
            }

    @staticmethod
    def check_disk_space() -> Dict[str, Any]:
        """Check disk space usage."""
        try:
            disk_usage = psutil.disk_usage('/')
            free_space_gb = disk_usage.free / (1024**3)
            total_space_gb = disk_usage.total / (1024**3)
            usage_percentage = (disk_usage.used / disk_usage.total) * 100

            status_level = 'healthy'
            if usage_percentage > 90:
                status_level = 'critical'
            elif usage_percentage > 80:
                status_level = 'warning'

            return {
                'status': status_level,
                'free_space_gb': round(free_space_gb, 2),
                'total_space_gb': round(total_space_gb, 2),
                'usage_percentage': round(usage_percentage, 2),
                'message': f'Disk usage at {usage_percentage:.1f}%'
            }
        except Exception as e:
            logger.error(f"Disk space check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Disk space check failed'
            }

    @staticmethod
    def check_memory() -> Dict[str, Any]:
        """Check memory usage."""
        try:
            memory = psutil.virtual_memory()
            memory_usage_percentage = memory.percent
            available_memory_gb = memory.available / (1024**3)
            total_memory_gb = memory.total / (1024**3)

            status_level = 'healthy'
            if memory_usage_percentage > 90:
                status_level = 'critical'
            elif memory_usage_percentage > 80:
                status_level = 'warning'

            return {
                'status': status_level,
                'usage_percentage': round(memory_usage_percentage, 2),
                'available_memory_gb': round(available_memory_gb, 2),
                'total_memory_gb': round(total_memory_gb, 2),
                'message': f'Memory usage at {memory_usage_percentage:.1f}%'
            }
        except Exception as e:
            logger.error(f"Memory check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Memory check failed'
            }

    @staticmethod
    def check_cpu() -> Dict[str, Any]:
        """Check CPU usage."""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()

            status_level = 'healthy'
            if cpu_percent > 90:
                status_level = 'critical'
            elif cpu_percent > 80:
                status_level = 'warning'

            return {
                'status': status_level,
                'usage_percentage': round(cpu_percent, 2),
                'cpu_count': cpu_count,
                'message': f'CPU usage at {cpu_percent:.1f}%'
            }
        except Exception as e:
            logger.error(f"CPU check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'CPU check failed'
            }

    @staticmethod
    def check_celery() -> Dict[str, Any]:
        """Check Celery worker status."""
        try:
            from celery import current_app

            # Get active workers
            inspect = current_app.control.inspect()
            active_workers = inspect.active()

            if active_workers:
                worker_count = len(active_workers)
                return {
                    'status': 'healthy',
                    'worker_count': worker_count,
                    'workers': list(active_workers.keys()),
                    'message': f'{worker_count} Celery workers active'
                }
            else:
                return {
                    'status': 'unhealthy',
                    'worker_count': 0,
                    'message': 'No Celery workers found'
                }
        except ImportError:
            return {
                'status': 'disabled',
                'message': 'Celery not configured'
            }
        except Exception as e:
            logger.error(f"Celery check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Celery check failed'
            }

    @staticmethod
    def get_application_info() -> Dict[str, Any]:
        """Get application information."""
        return {
            'name': 'ISP Admin Panel API',
            'version': '1.0.0',
            'debug_mode': settings.DEBUG,
            'timezone': str(settings.TIME_ZONE),
            'database_engine': settings.DATABASES['default']['ENGINE'],
            'python_version': psutil.__version__,
            'timestamp': timezone.now().isoformat()
        }

    @classmethod
    def perform_health_check(cls) -> Dict[str, Any]:
        """Perform comprehensive health check."""
        start_time = time.time()

        checks = {
            'database': cls.check_database(),
            'cache': cls.check_cache(),
            'disk_space': cls.check_disk_space(),
            'memory': cls.check_memory(),
            'cpu': cls.check_cpu(),
            'celery': cls.check_celery(),
        }

        # Determine overall status
        overall_status = 'healthy'
        for check_name, check_result in checks.items():
            if check_result.get('status') == 'critical':
                overall_status = 'critical'
                break
            elif check_result.get('status') == 'unhealthy':
                overall_status = 'unhealthy'
            elif check_result.get('status') == 'warning' and overall_status == 'healthy':
                overall_status = 'warning'

        total_time = (time.time() - start_time) * 1000

        return {
            'status': overall_status,
            'timestamp': timezone.now().isoformat(),
            'response_time_ms': round(total_time, 2),
            'application': cls.get_application_info(),
            'checks': checks
        }


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check_view(request):
    """
    Health check endpoint for monitoring systems.

    Returns basic health status without detailed information.
    """
    try:
        # Quick database check
        db_status = HealthChecker.check_database()

        if db_status['status'] == 'healthy':
            return JsonResponse({
                'status': 'healthy',
                'timestamp': timezone.now().isoformat(),
                'message': 'Service is running normally'
            })
        else:
            return JsonResponse({
                'status': 'unhealthy',
                'timestamp': timezone.now().isoformat(),
                'message': 'Service is experiencing issues'
            }, status=503)

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JsonResponse({
            'status': 'unhealthy',
            'timestamp': timezone.now().isoformat(),
            'message': 'Health check failed',
            'error': str(e)
        }, status=503)


@api_view(['GET'])
@permission_classes([AllowAny])
def detailed_health_check_view(request):
    """
    Detailed health check endpoint with comprehensive system information.

    Should be restricted to internal monitoring or admin users in production.
    """
    try:
        health_data = HealthChecker.perform_health_check()

        # Determine HTTP status code based on health status
        if health_data['status'] in ['critical', 'unhealthy']:
            status_code = 503
        elif health_data['status'] == 'warning':
            status_code = 200  # Still operational but with warnings
        else:
            status_code = 200

        return JsonResponse(health_data, status=status_code)

    except Exception as e:
        logger.error(f"Detailed health check failed: {str(e)}")
        return JsonResponse({
            'status': 'unhealthy',
            'timestamp': timezone.now().isoformat(),
            'message': 'Detailed health check failed',
            'error': str(e)
        }, status=503)


@api_view(['GET'])
@permission_classes([AllowAny])
def readiness_check_view(request):
    """
    Readiness check endpoint for Kubernetes/container orchestration.

    Checks if the application is ready to serve traffic.
    """
    try:
        # Check critical dependencies
        db_status = HealthChecker.check_database()
        cache_status = HealthChecker.check_cache()

        if (db_status['status'] == 'healthy' and
            cache_status['status'] == 'healthy'):
            return JsonResponse({
                'ready': True,
                'timestamp': timezone.now().isoformat()
            })
        else:
            return JsonResponse({
                'ready': False,
                'timestamp': timezone.now().isoformat(),
                'issues': {
                    'database': db_status['status'],
                    'cache': cache_status['status']
                }
            }, status=503)

    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return JsonResponse({
            'ready': False,
            'timestamp': timezone.now().isoformat(),
            'error': str(e)
        }, status=503)


@api_view(['GET'])
@permission_classes([AllowAny])
def liveness_check_view(request):
    """
    Liveness check endpoint for Kubernetes/container orchestration.

    Simple check to verify the application process is alive.
    """
    return JsonResponse({
        'alive': True,
        'timestamp': timezone.now().isoformat()
    })
