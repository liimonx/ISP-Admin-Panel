import os

# Set required environment variables for testing
os.environ.setdefault('MAIN_ROUTER_IP', '127.0.0.1')

from .settings import *

# Use in-memory cache for tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Disable Celery
CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = 'memory://'
