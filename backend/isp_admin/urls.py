"""
URL configuration for isp_admin project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from core.health import (
    health_check_view, detailed_health_check_view,
    readiness_check_view, liveness_check_view
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Health Check Endpoints
    path('health/', health_check_view, name='health-check'),
    path('health/detailed/', detailed_health_check_view, name='detailed-health-check'),
    path('health/ready/', readiness_check_view, name='readiness-check'),
    path('health/live/', liveness_check_view, name='liveness-check'),

    # API Health Checks
    path('api/health/', health_check_view, name='api-health-check'),
    path('api/health/detailed/', detailed_health_check_view, name='api-detailed-health-check'),
    path('api/health/ready/', readiness_check_view, name='api-readiness-check'),
    path('api/health/live/', liveness_check_view, name='api-liveness-check'),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API Endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/customers/', include('customers.urls')),
    path('api/plans/', include('plans.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/network/', include('network.urls')),
    path('api/monitoring/', include('monitoring.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/core/', include('core.urls')),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
