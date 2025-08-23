from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from customers.models import Customer
from plans.models import Plan
from network.models import Router


class Subscription(models.Model):
    """
    Subscription model linking customers to plans and routers.
    """
    class Status(models.TextChoices):
        ACTIVE = 'active', _('Active')
        INACTIVE = 'inactive', _('Inactive')
        SUSPENDED = 'suspended', _('Suspended')
        CANCELLED = 'cancelled', _('Cancelled')
        PENDING = 'pending', _('Pending')
    
    class AccessMethod(models.TextChoices):
        PPPOE = 'pppoe', _('PPPoE')
        STATIC_IP = 'static_ip', _('Static IP')
        DHCP = 'dhcp', _('DHCP')
    
    # Relationships
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='subscriptions',
        help_text=_('Customer for this subscription')
    )
    plan = models.ForeignKey(
        Plan,
        on_delete=models.PROTECT,
        related_name='subscriptions',
        help_text=_('Internet plan for this subscription')
    )
    router = models.ForeignKey(
        Router,
        on_delete=models.PROTECT,
        related_name='subscriptions',
        help_text=_('Router for this subscription')
    )
    
    # Connection Details
    username = models.CharField(
        max_length=100,
        unique=True,
        help_text=_('Username for PPPoE or router access')
    )
    password = models.CharField(
        max_length=100,
        help_text=_('Password for PPPoE or router access')
    )
    access_method = models.CharField(
        max_length=20,
        choices=AccessMethod.choices,
        default=AccessMethod.PPPOE,
        help_text=_('Access method for this subscription')
    )
    
    # Network Configuration
    static_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text=_('Static IP address (if applicable)')
    )
    mac_address = models.CharField(
        max_length=17,
        null=True,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
                message=_('Enter a valid MAC address')
            )
        ],
        help_text=_('MAC address of customer device')
    )
    
    # Status and Dates
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        help_text=_('Subscription status')
    )
    start_date = models.DateField(help_text=_('Subscription start date'))
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text=_('Subscription end date (optional)')
    )
    
    # Billing Information
    monthly_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text=_('Monthly fee for this subscription')
    )
    setup_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text=_('One-time setup fee')
    )
    
    # Usage Tracking
    data_used = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        help_text=_('Data used in GB')
    )
    data_reset_date = models.DateField(
        null=True,
        blank=True,
        help_text=_('Date when data usage was last reset')
    )
    
    # Notes and Additional Info
    notes = models.TextField(blank=True, help_text=_('Additional notes'))
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Subscription')
        verbose_name_plural = _('Subscriptions')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer']),
            models.Index(fields=['plan']),
            models.Index(fields=['router']),
            models.Index(fields=['status']),
            models.Index(fields=['username']),
            models.Index(fields=['start_date']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.customer.name} - {self.plan.name} ({self.status})"
    
    @property
    def is_active(self):
        """Check if subscription is active."""
        return self.status == self.Status.ACTIVE
    
    @property
    def is_suspended(self):
        """Check if subscription is suspended."""
        return self.status == self.Status.SUSPENDED
    
    @property
    def is_expired(self):
        """Check if subscription has expired."""
        if not self.end_date:
            return False
        from django.utils import timezone
        return timezone.now().date() > self.end_date
    
    @property
    def days_remaining(self):
        """Get days remaining until expiration."""
        if not self.end_date:
            return None
        from django.utils import timezone
        remaining = self.end_date - timezone.now().date()
        return remaining.days
    
    @property
    def data_remaining(self):
        """Get remaining data quota."""
        if self.plan.is_unlimited:
            return float('inf')
        if not self.plan.data_quota:
            return float('inf')
        remaining = float(self.plan.data_quota) - float(self.data_used)
        return max(0, remaining)
    
    @property
    def data_usage_percentage(self):
        """Get data usage as percentage."""
        if self.plan.is_unlimited or not self.plan.data_quota:
            return 0
        if self.plan.data_quota == 0:
            return 0
        return (float(self.data_used) / float(self.plan.data_quota)) * 100
    
    def activate(self):
        """Activate the subscription."""
        self.status = self.Status.ACTIVE
        self.save()
    
    def suspend(self):
        """Suspend the subscription."""
        self.status = self.Status.SUSPENDED
        self.save()
    
    def cancel(self):
        """Cancel the subscription."""
        self.status = self.Status.CANCELLED
        self.save()
    
    def reset_data_usage(self):
        """Reset data usage counter."""
        self.data_used = 0
        from django.utils import timezone
        self.data_reset_date = timezone.now().date()
        self.save()
    
    def add_data_usage(self, bytes_used):
        """Add data usage in bytes."""
        # Convert bytes to GB
        gb_used = bytes_used / (1024 ** 3)
        self.data_used += gb_used
        self.save()
