from django.db import models
from django.utils.translation import gettext_lazy as _
from network.models import Router


class SNMPSnapshot(models.Model):
    """
    Model for storing SNMP polling data from routers.
    """
    router = models.ForeignKey(
        Router,
        on_delete=models.CASCADE,
        related_name='snmp_snapshots',
        help_text=_('Router for this snapshot')
    )
    
    # System Resources
    cpu_usage = models.FloatField(
        null=True,
        blank=True,
        help_text=_('CPU usage percentage')
    )
    memory_usage = models.FloatField(
        null=True,
        blank=True,
        help_text=_('Memory usage percentage')
    )
    disk_usage = models.FloatField(
        null=True,
        blank=True,
        help_text=_('Disk usage percentage')
    )
    
    # Network Interfaces
    interface_data = models.JSONField(
        default=dict,
        help_text=_('Interface bandwidth data')
    )
    
    # System Information
    uptime = models.BigIntegerField(
        null=True,
        blank=True,
        help_text=_('System uptime in seconds')
    )
    temperature = models.FloatField(
        null=True,
        blank=True,
        help_text=_('System temperature in Celsius')
    )
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('SNMP Snapshot')
        verbose_name_plural = _('SNMP Snapshots')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['router']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"SNMP Snapshot - {self.router.name} at {self.timestamp}"


class UsageSnapshot(models.Model):
    """
    Model for storing usage data snapshots.
    """
    router = models.ForeignKey(
        Router,
        on_delete=models.CASCADE,
        related_name='usage_snapshots',
        help_text=_('Router for this snapshot')
    )
    
    # Usage Statistics
    total_bytes_in = models.BigIntegerField(default=0, help_text=_('Total bytes received'))
    total_bytes_out = models.BigIntegerField(default=0, help_text=_('Total bytes sent'))
    active_connections = models.IntegerField(default=0, help_text=_('Active connections'))
    
    # PPPoE Statistics
    pppoe_users_count = models.IntegerField(default=0, help_text=_('Total PPPoE users'))
    pppoe_active_sessions = models.IntegerField(default=0, help_text=_('Active PPPoE sessions'))
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('Usage Snapshot')
        verbose_name_plural = _('Usage Snapshots')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['router']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"Usage Snapshot - {self.router.name} at {self.timestamp}"
    
    @property
    def total_bytes(self):
        """Get total bytes transferred."""
        return self.total_bytes_in + self.total_bytes_out
    
    @property
    def total_gb(self):
        """Get total data in GB."""
        return self.total_bytes / (1024 ** 3)
