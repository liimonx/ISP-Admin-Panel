"""
Django settings for isp_admin project.
"""

import os
from pathlib import Path
from datetime import timedelta
import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Initialize environ
env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env.bool('DEBUG', default=False)

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',
]

LOCAL_APPS = [
    'core',
    'accounts',
    'customers',
    'plans',
    'subscriptions',
    'billing',
    'network',
    'monitoring',
    'payments',
    'reports',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    # 'core.middleware.SecurityHeadersMiddleware',  # Temporarily disabled
    # 'core.middleware.RateLimitMiddleware',  # Temporarily disabled
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    # 'core.middleware.PerformanceMiddleware',  # Temporarily disabled
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    # 'core.middleware.RequestLoggingMiddleware',  # Temporarily disabled
    # 'core.middleware.APIVersionMiddleware',  # Temporarily disabled
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 'core.middleware.PerformanceHeadersMiddleware',  # Temporarily disabled
]

ROOT_URLCONF = 'isp_admin.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'isp_admin.wsgi.application'

# Database
DATABASES = {
    'default': env.db('DATABASE_URL', default='postgres://user:password@localhost:5432/isp_admin')
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    # 'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',  # Temporarily disabled
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=env.int('JWT_ACCESS_TOKEN_LIFETIME', default=5)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=env.int('JWT_REFRESH_TOKEN_LIFETIME', default=1)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

# API Documentation
SPECTACULAR_SETTINGS = {
    'TITLE': 'ISP Admin Panel API',
    'DESCRIPTION': 'API for ISP Admin Panel with customer management, billing, and network monitoring',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api/',
}

# Celery Configuration
CELERY_BROKER_URL = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Celery Beat Schedule
CELERY_BEAT_SCHEDULE = {
    'generate-monthly-invoices': {
        'task': 'billing.tasks.generate_monthly_invoices',
        'schedule': timedelta(days=1),
    },
    'enforce-overdue-invoices': {
        'task': 'billing.tasks.enforce_overdue_invoices',
        'schedule': timedelta(hours=1),
    },
    'poll-snmp-usage': {
        'task': 'monitoring.tasks.poll_snmp_usage',
        'schedule': timedelta(minutes=5),
    },
}

# Payment Provider Settings
STRIPE_SECRET_KEY = env('STRIPE_SECRET_KEY', default='')
STRIPE_PUBLISHABLE_KEY = env('STRIPE_PUBLISHABLE_KEY', default='')
BKASH_APP_KEY = env('BKASH_APP_KEY', default='')
BKASH_APP_SECRET = env('BKASH_APP_SECRET', default='')
SSLCOMMERZ_STORE_ID = env('SSLCOMMERZ_STORE_ID', default='')
SSLCOMMERZ_STORE_PASSWORD = env('SSLCOMMERZ_STORE_PASSWORD', default='')

# RouterOS Settings
ROUTEROS_DEFAULT_PORT = env.int('ROUTEROS_DEFAULT_PORT', default=8729)
ROUTEROS_DEFAULT_USERNAME = env('ROUTEROS_DEFAULT_USERNAME', default='admin')
ROUTEROS_DEFAULT_PASSWORD = env('ROUTEROS_DEFAULT_PASSWORD', default='')

# SNMP Settings
SNMP_COMMUNITY = env('SNMP_COMMUNITY', default='public')
SNMP_TIMEOUT = env.int('SNMP_TIMEOUT', default=1)
SNMP_RETRIES = env.int('SNMP_RETRIES', default=3)

# Rate Limiting Settings
RATE_LIMITS = {
    'authenticated': env.int('RATE_LIMIT_AUTHENTICATED', default=200),  # requests per minute
    'anonymous': env.int('RATE_LIMIT_ANONYMOUS', default=60),
    'login': env.int('RATE_LIMIT_LOGIN', default=10),
    'password_reset': env.int('RATE_LIMIT_PASSWORD_RESET', default=5),
}

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'json': {
            'format': '{"level": "%(levelname)s", "time": "%(asctime)s", "module": "%(module)s", "message": "%(message)s"}',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'django.log'),
            'maxBytes': 1024*1024*15,  # 15MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'core': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'billing': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
import os
log_dir = os.path.join(BASE_DIR, 'logs')
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Performance Settings
CONN_MAX_AGE = env.int('CONN_MAX_AGE', default=60)
DATABASES['default']['CONN_MAX_AGE'] = CONN_MAX_AGE

# Cache Configuration
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': env('REDIS_URL', default='redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Main Router Configuration
MAIN_ROUTER_IP = env('MAIN_ROUTER_IP', default='103.115.252.60')
MAIN_ROUTER_API_PORT = env.int('MAIN_ROUTER_API_PORT', default=8728)
MAIN_ROUTER_SSH_PORT = env.int('MAIN_ROUTER_SSH_PORT', default=22)
MAIN_ROUTER_USERNAME = env('MAIN_ROUTER_USERNAME', default='admin')
MAIN_ROUTER_PASSWORD = env('MAIN_ROUTER_PASSWORD', default='')
MAIN_ROUTER_USE_TLS = env.bool('MAIN_ROUTER_USE_TLS', default=True)

# Router API Configuration
ROUTER_API_TIMEOUT = env.int('ROUTER_API_TIMEOUT', default=30)
ROUTER_CONNECTION_RETRIES = env.int('ROUTER_CONNECTION_RETRIES', default=3)
ROUTER_HEALTH_CHECK_INTERVAL = env.int('ROUTER_HEALTH_CHECK_INTERVAL', default=300)
