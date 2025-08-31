"""
Celery configuration for isp_admin project.
"""

import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_admin.settings')

app = Celery('isp_admin')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Configure periodic tasks
app.conf.beat_schedule = {
    'check-main-router-health': {
        'task': 'network.tasks.check_main_router_health',
        'schedule': 300.0,  # Every 5 minutes
    },
    'sync-main-router-data': {
        'task': 'network.tasks.sync_main_router_data',
        'schedule': 900.0,  # Every 15 minutes
    },
    'backup-main-router-config': {
        'task': 'network.tasks.backup_main_router_config',
        'schedule': 86400.0,  # Daily
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
