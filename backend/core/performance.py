"""
Performance optimization utilities for the ISP Admin API.
"""
import functools
import time
import logging
from typing import Any, Callable, Optional
from django.core.cache import cache
from django.conf import settings
from django.db import connection
from django.http import HttpRequest
from rest_framework.request import Request

logger = logging.getLogger(__name__)


def cache_result(timeout: int = 300, key_prefix: str = None, vary_on: list = None):
    """
    Decorator to cache function results.

    Args:
        timeout: Cache timeout in seconds (default: 5 minutes)
        key_prefix: Prefix for cache key
        vary_on: List of parameter names to include in cache key
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key_parts = [key_prefix or f"{func.__module__}.{func.__name__}"]

            # Add varying parameters to cache key
            if vary_on:
                for param in vary_on:
                    if param in kwargs:
                        cache_key_parts.append(f"{param}:{kwargs[param]}")
                    elif args and len(args) > vary_on.index(param):
                        cache_key_parts.append(f"{param}:{args[vary_on.index(param)]}")

            cache_key = ":".join(str(part) for part in cache_key_parts)

            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                logger.debug(f"Cache hit for key: {cache_key}")
                return result

            # Execute function and cache result
            result = func(*args, **kwargs)
            
            # Don't cache Django response objects
            if hasattr(result, 'status_code') and hasattr(result, 'render'):
                logger.debug(f"Skipping cache for response object: {cache_key}")
                return result
            
            cache.set(cache_key, result, timeout)
            logger.debug(f"Cache set for key: {cache_key}")

            return result
        return wrapper
    return decorator


def measure_execution_time(func: Callable) -> Callable:
    """Decorator to measure and log function execution time."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()

        execution_time = (end_time - start_time) * 1000  # Convert to milliseconds

        logger.info(
            f"Function {func.__name__} executed in {execution_time:.2f}ms",
            extra={
                'function_name': func.__name__,
                'execution_time_ms': execution_time,
                'func_module': func.__module__
            }
        )

        return result
    return wrapper


def monitor_db_queries(func: Callable) -> Callable:
    """Decorator to monitor database queries for a function."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # Reset queries count
        initial_queries = len(connection.queries)

        result = func(*args, **kwargs)

        # Calculate queries made
        final_queries = len(connection.queries)
        queries_count = final_queries - initial_queries

        if queries_count > 5:  # Log if more than 5 queries
            logger.warning(
                f"Function {func.__name__} executed {queries_count} database queries",
                extra={
                    'function_name': func.__name__,
                    'db_queries_count': queries_count,
                    'func_module': func.__module__
                }
            )

        return result
    return wrapper


class QueryOptimizer:
    """Utility class for database query optimizations."""

    @staticmethod
    def prefetch_related_fields(queryset, *fields):
        """Add prefetch_related to queryset with error handling."""
        try:
            return queryset.prefetch_related(*fields)
        except Exception as e:
            logger.warning(f"Failed to prefetch fields {fields}: {str(e)}")
            return queryset

    @staticmethod
    def select_related_fields(queryset, *fields):
        """Add select_related to queryset with error handling."""
        try:
            return queryset.select_related(*fields)
        except Exception as e:
            logger.warning(f"Failed to select related fields {fields}: {str(e)}")
            return queryset

    @staticmethod
    def optimize_customer_queryset(queryset):
        """Optimize queryset for customer-related queries."""
        return queryset.select_related(
            'created_by'
        ).prefetch_related(
            'subscriptions',
            'subscriptions__plan',
            'invoices'
        )

    @staticmethod
    def optimize_subscription_queryset(queryset):
        """Optimize queryset for subscription-related queries."""
        return queryset.select_related(
            'customer',
            'plan'
        ).prefetch_related(
            'invoices',
            'network_services'
        )


class PerformanceMiddleware:
    """Middleware to track API performance metrics."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        initial_queries = len(connection.queries) if settings.DEBUG else 0

        response = self.get_response(request)

        end_time = time.time()
        final_queries = len(connection.queries) if settings.DEBUG else 0

        # Calculate metrics
        response_time = (end_time - start_time) * 1000  # milliseconds
        db_queries = final_queries - initial_queries

        # Add performance headers
        response['X-Response-Time'] = f"{response_time:.2f}ms"
        if settings.DEBUG:
            response['X-DB-Queries'] = str(db_queries)

        # Log slow requests
        if response_time > 1000:  # Log requests slower than 1 second
            logger.warning(
                f"Slow request detected: {request.method} {request.path}",
                extra={
                    'method': request.method,
                    'path': request.path,
                    'response_time_ms': response_time,
                    'db_queries': db_queries,
                    'status_code': response.status_code,
                    'user': str(request.user) if hasattr(request, 'user') else 'Anonymous'
                }
            )

        return response


class CacheManager:
    """Utility class for cache management."""

    CACHE_KEYS = {
        'customer_stats': 'customer_stats',
        'plan_list': 'plan_list',
        'subscription_stats': 'subscription_stats',
        'billing_stats': 'billing_stats_{month}_{year}',
        'network_devices': 'network_devices',
    }

    @staticmethod
    def get_cache_key(key_name: str, **kwargs) -> str:
        """Generate cache key with optional formatting."""
        key_template = CacheManager.CACHE_KEYS.get(key_name, key_name)
        return key_template.format(**kwargs)

    @staticmethod
    def invalidate_customer_cache(customer_id: int = None):
        """Invalidate customer-related cache entries."""
        cache.delete('customer_stats')
        if customer_id:
            cache.delete(f'customer_detail_{customer_id}')

    @staticmethod
    def invalidate_subscription_cache(subscription_id: int = None):
        """Invalidate subscription-related cache entries."""
        cache.delete('subscription_stats')
        if subscription_id:
            cache.delete(f'subscription_detail_{subscription_id}')

    @staticmethod
    def invalidate_billing_cache(month: int = None, year: int = None):
        """Invalidate billing-related cache entries."""
        if month and year:
            key = CacheManager.get_cache_key('billing_stats', month=month, year=year)
            cache.delete(key)
        else:
            # Invalidate all billing cache (less efficient but comprehensive)
            from django.utils import timezone
            now = timezone.now()
            for m in range(1, 13):
                for y in [now.year - 1, now.year, now.year + 1]:
                    key = CacheManager.get_cache_key('billing_stats', month=m, year=y)
                    cache.delete(key)


def bulk_create_optimized(model_class, objects_list, batch_size: int = 1000):
    """
    Optimized bulk create with batching.

    Args:
        model_class: Django model class
        objects_list: List of model instances to create
        batch_size: Number of objects to create in each batch

    Returns:
        List of created objects
    """
    created_objects = []

    for i in range(0, len(objects_list), batch_size):
        batch = objects_list[i:i + batch_size]
        batch_created = model_class.objects.bulk_create(batch, batch_size)
        created_objects.extend(batch_created)

        logger.debug(f"Bulk created {len(batch)} {model_class.__name__} objects")

    return created_objects


def bulk_update_optimized(objects_list, fields: list, batch_size: int = 1000):
    """
    Optimized bulk update with batching.

    Args:
        objects_list: List of model instances to update
        fields: List of field names to update
        batch_size: Number of objects to update in each batch

    Returns:
        Total number of updated objects
    """
    if not objects_list:
        return 0

    model_class = objects_list[0].__class__
    total_updated = 0

    for i in range(0, len(objects_list), batch_size):
        batch = objects_list[i:i + batch_size]
        model_class.objects.bulk_update(batch, fields, batch_size)
        total_updated += len(batch)

        logger.debug(f"Bulk updated {len(batch)} {model_class.__name__} objects")

    return total_updated


class APIPerformanceTracker:
    """Track API endpoint performance metrics."""

    @staticmethod
    def track_endpoint_performance(view_name: str, method: str, response_time: float,
                                 status_code: int, db_queries: int = 0):
        """Track performance metrics for an API endpoint."""
        cache_key = f"perf_stats:{view_name}:{method}"

        # Get existing stats or create new ones
        stats = cache.get(cache_key, {
            'total_requests': 0,
            'total_response_time': 0,
            'min_response_time': float('inf'),
            'max_response_time': 0,
            'total_db_queries': 0,
            'error_count': 0
        })

        # Update stats
        stats['total_requests'] += 1
        stats['total_response_time'] += response_time
        stats['min_response_time'] = min(stats['min_response_time'], response_time)
        stats['max_response_time'] = max(stats['max_response_time'], response_time)
        stats['total_db_queries'] += db_queries

        if status_code >= 400:
            stats['error_count'] += 1

        # Cache for 1 hour
        cache.set(cache_key, stats, 3600)

    @staticmethod
    def get_endpoint_stats(view_name: str, method: str) -> dict:
        """Get performance stats for an API endpoint."""
        cache_key = f"perf_stats:{view_name}:{method}"
        stats = cache.get(cache_key, {})

        if stats and stats.get('total_requests', 0) > 0:
            stats['avg_response_time'] = stats['total_response_time'] / stats['total_requests']
            stats['avg_db_queries'] = stats['total_db_queries'] / stats['total_requests']
            stats['error_rate'] = (stats['error_count'] / stats['total_requests']) * 100

        return stats
