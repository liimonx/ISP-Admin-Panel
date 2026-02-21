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
