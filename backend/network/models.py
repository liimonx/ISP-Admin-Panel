from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from django.conf import settings
import os


class Router(models.Model):
    """
    Router model for managing MikroTik routers.
    """
    class Status(models.TextChoices):
        ONLINE = 'online', _('Online')
        OFFLINE = 'offline', _('Offline')
        MAINTENANCE = 'maintenance', _('Maintenance')
    
    class RouterType(models.TextChoices):
        MIKROTIK = 'mikrotik', _('MikroTik')
        CISCO = 'cisco', _('Cisco')
        OTHER = 'other', _('Other')
    
    # Basic Information
    name = models.CharField(max_length=255, help_text=_('Router name'))
    description = models.TextField(blank=True, help_text=_('Router description'))
    router_type = models.CharField(
        max_length=20,
        choices=RouterType.choices,
        default=RouterType.MIKROTIK,
        help_text=_('Router type')
    )
    
    # Network Configuration
    host = models.GenericIPAddressField(help_text=_('Router IP address'))
    api_port = models.IntegerField(
        default=8729,
        help_text=_('API port (8729 for MikroTik)')
    )
    ssh_port = models.IntegerField(
        default=22,
        help_text=_('SSH port')
    )
    
    # Authentication
    username = models.CharField(max_length=100, help_text=_('Router username'))
    password = models.CharField(max_length=100, help_text=_('Router password'))
    use_tls = models.BooleanField(default=True, help_text=_('Use TLS for API connection'))
    
    # Status and Monitoring
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OFFLINE,
        help_text=_('Router status')
    )
    last_seen = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('Last time router was online')
    )
    
    # Location Information
    location = models.CharField(max_length=255, blank=True, help_text=_('Router location'))
    coordinates = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('GPS coordinates (lat,lng)')
    )
    
    # Configuration
    snmp_community = models.CharField(
        max_length=100,
        default='public',
        help_text=_('SNMP community string')
    )
    snmp_port = models.IntegerField(
        default=161,
        help_text=_('SNMP port')
    )
    
    # Notes and Additional Info
    notes = models.TextField(blank=True, help_text=_('Additional notes'))
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Router')
        verbose_name_plural = _('Routers')
        ordering = ['name']
        indexes = [
            models.Index(fields=['host']),
            models.Index(fields=['status']),
            models.Index(fields=['router_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.host})"
    
    @property
    def is_online(self):
        """Check if router is online."""
        return self.status == self.Status.ONLINE
    
    @property
    def is_mikrotik(self):
        """Check if router is MikroTik."""
        return self.router_type == self.RouterType.MIKROTIK
    
    @property
    def api_url(self):
        """Get API URL for router."""
        protocol = 'https' if self.use_tls else 'http'
        return f"{protocol}://{self.host}:{self.api_port}"
    
    def get_active_subscriptions_count(self):
        """Get count of active subscriptions on this router."""
        return self.subscriptions.filter(status='active').count()
    
    def get_total_bandwidth_usage(self):
        """Get total bandwidth usage for this router."""
        active_subs = self.subscriptions.filter(status='active')
        return sum(sub.data_used for sub in active_subs)
    
    def get_total_bandwidth_usage_float(self):
        """Get total bandwidth usage as float for API responses."""
        return float(self.get_total_bandwidth_usage())
    
    def get_subscriptions_count(self):
        """Get total number of subscriptions on this router."""
        return self.subscriptions.count()
    
    def get_active_subscriptions_count(self):
        """Get count of active subscriptions on this router."""
        return self.subscriptions.filter(status='active').count()


class RouterSession(models.Model):
    """
    Model for tracking active sessions on routers.
    """
    router = models.ForeignKey(
        Router,
        on_delete=models.CASCADE,
        related_name='sessions',
        help_text=_('Router for this session')
    )
    username = models.CharField(max_length=100, help_text=_('Session username'))
    ip_address = models.GenericIPAddressField(help_text=_('Session IP address'))
    mac_address = models.CharField(
        max_length=17,
        null=True,
        blank=True,
        help_text=_('Session MAC address')
    )
    session_id = models.CharField(max_length=100, help_text=_('Router session ID'))
    
    # Usage Statistics
    bytes_in = models.BigIntegerField(default=0, help_text=_('Bytes received'))
    bytes_out = models.BigIntegerField(default=0, help_text=_('Bytes sent'))
    uptime = models.DurationField(null=True, blank=True, help_text=_('Session uptime'))
    
    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True, help_text=_('Session start time'))
    last_seen = models.DateTimeField(auto_now=True, help_text=_('Last activity time'))
    
    class Meta:
        verbose_name = _('Router Session')
        verbose_name_plural = _('Router Sessions')
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['router']),
            models.Index(fields=['username']),
            models.Index(fields=['ip_address']),
            models.Index(fields=['started_at']),
        ]
        unique_together = ['router', 'session_id']
    
    def __str__(self):
        return f"{self.username} on {self.router.name} ({self.ip_address})"
    
    @property
    def total_bytes(self):
        """Get total bytes transferred."""
        return self.bytes_in + self.bytes_out
    
    @property
    def total_gb(self):
        """Get total data in GB."""
        return self.total_bytes / (1024 ** 3)
