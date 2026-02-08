from django.db import models
from django.utils.translation import gettext_lazy as _


class RouterMetric(models.Model):
    """
    Model for storing router performance metrics.
    """
    router = models.ForeignKey(
        'network.Router',
        on_delete=models.CASCADE,
        related_name='metrics',
        help_text=_('Router for this metric')
    )
    
    # System metrics
    cpu_usage = models.IntegerField(default=0, help_text=_('CPU usage percentage'))
    memory_usage = models.IntegerField(default=0, help_text=_('Memory usage percentage'))
    disk_usage = models.IntegerField(default=0, help_text=_('Disk usage percentage'))
    temperature = models.IntegerField(null=True, blank=True, help_text=_('Temperature in Celsius'))
    
    # Bandwidth metrics
    total_download = models.BigIntegerField(default=0, help_text=_('Total download bytes'))
    total_upload = models.BigIntegerField(default=0, help_text=_('Total upload bytes'))
    download_speed = models.BigIntegerField(default=0, help_text=_('Current download speed'))
    upload_speed = models.BigIntegerField(default=0, help_text=_('Current upload speed'))
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('Router Metric')
        verbose_name_plural = _('Router Metrics')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['router', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.router.name} - {self.timestamp}"


class SNMPSnapshot(models.Model):
    """
    Model for storing SNMP monitoring snapshots.
    """
    router = models.ForeignKey(
        'network.Router',
        on_delete=models.CASCADE,
        related_name='snmp_snapshots',
        help_text=_('Router for this snapshot')
    )
    
    # System metrics from SNMP
    cpu_usage = models.FloatField(default=0.0, help_text=_('CPU usage percentage'))
    memory_usage = models.FloatField(default=0.0, help_text=_('Memory usage percentage'))
    uptime = models.BigIntegerField(default=0, help_text=_('System uptime in seconds'))
    
    # Interface data (JSON field)
    interface_data = models.JSONField(default=dict, help_text=_('Interface statistics'))
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('SNMP Snapshot')
        verbose_name_plural = _('SNMP Snapshots')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['router', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.router.name} SNMP - {self.timestamp}"


class UsageSnapshot(models.Model):
    """
    Model for storing usage monitoring snapshots.
    """
    router = models.ForeignKey(
        'network.Router',
        on_delete=models.CASCADE,
        related_name='usage_snapshots',
        help_text=_('Router for this snapshot')
    )
    
    # Traffic metrics
    total_bytes_in = models.BigIntegerField(default=0, help_text=_('Total bytes received'))
    total_bytes_out = models.BigIntegerField(default=0, help_text=_('Total bytes sent'))
    
    # Connection metrics
    active_connections = models.IntegerField(default=0, help_text=_('Active connections count'))
    pppoe_users_count = models.IntegerField(default=0, help_text=_('Total PPPoE users'))
    pppoe_active_sessions = models.IntegerField(default=0, help_text=_('Active PPPoE sessions'))
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('Usage Snapshot')
        verbose_name_plural = _('Usage Snapshots')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['router', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.router.name} Usage - {self.timestamp}"