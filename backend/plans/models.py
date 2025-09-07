from django.db import models
from django.utils.translation import gettext_lazy as _
from decimal import Decimal


class Plan(models.Model):
    """
    Internet plan model for storing package information.
    """
    class SpeedUnit(models.TextChoices):
        MBPS = 'mbps', _('Mbps')
        GBPS = 'gbps', _('Gbps')
    
    class QuotaUnit(models.TextChoices):
        GB = 'gb', _('GB')
        TB = 'tb', _('TB')
        UNLIMITED = 'unlimited', _('Unlimited')
    
    class BillingCycle(models.TextChoices):
        MONTHLY = 'monthly', _('Monthly')
        QUARTERLY = 'quarterly', _('Quarterly')
        YEARLY = 'yearly', _('Yearly')
    
    # Basic Information
    name = models.CharField(max_length=255, help_text=_('Plan name'))
    description = models.TextField(blank=True, help_text=_('Plan description'))
    
    # Speed Configuration
    download_speed = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text=_('Download speed')
    )
    upload_speed = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text=_('Upload speed')
    )
    speed_unit = models.CharField(
        max_length=10,
        choices=SpeedUnit.choices,
        default=SpeedUnit.MBPS,
        help_text=_('Speed unit')
    )
    
    # Data Quota
    data_quota = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Data quota (leave empty for unlimited)')
    )
    quota_unit = models.CharField(
        max_length=10,
        choices=QuotaUnit.choices,
        default=QuotaUnit.GB,
        help_text=_('Quota unit')
    )
    
    # Pricing
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text=_('Monthly price')
    )
    setup_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text=_('One-time setup fee')
    )
    billing_cycle = models.CharField(
        max_length=20,
        choices=BillingCycle.choices,
        default=BillingCycle.MONTHLY,
        help_text=_('Billing cycle')
    )
    
    # Status and Features
    is_active = models.BooleanField(default=True, help_text=_('Is plan active'))
    is_featured = models.BooleanField(default=False, help_text=_('Is featured plan'))
    is_popular = models.BooleanField(default=False, help_text=_('Is popular plan'))
    
    # Additional Features
    features = models.JSONField(default=list, help_text=_('List of plan features'))
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Plan')
        verbose_name_plural = _('Plans')
        ordering = ['price']
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['price']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['is_popular']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.download_speed}{self.speed_unit} - ${self.price}"
    
    @property
    def is_unlimited(self):
        """Check if plan has unlimited data."""
        return self.quota_unit == self.QuotaUnit.UNLIMITED or self.data_quota is None
    
    @property
    def formatted_speed(self):
        """Get formatted speed string."""
        return f"{self.download_speed}/{self.upload_speed} {self.speed_unit}"
    
    @property
    def formatted_quota(self):
        """Get formatted quota string."""
        if self.is_unlimited:
            return "Unlimited"
        return f"{self.data_quota} {self.quota_unit}"
    
    @property
    def formatted_price(self):
        """Get formatted price string."""
        return f"${self.price}/month"
    
    def get_active_subscriptions_count(self):
        """Get count of active subscriptions for this plan."""
        return self.subscriptions.filter(status='active').count()
    
    def get_total_revenue(self):
        """Calculate total monthly revenue from this plan."""
        active_subs = self.subscriptions.filter(status='active')
        return self.price * active_subs.count()
    
    def get_subscribers_count(self):
        """Get total number of subscribers for this plan."""
        return self.subscriptions.count()
    
    def get_active_subscribers_count(self):
        """Get count of active subscribers for this plan."""
        return self.subscriptions.filter(status='active').count()
    
    def get_monthly_revenue(self):
        """Get monthly revenue from this plan."""
        return float(self.get_total_revenue())