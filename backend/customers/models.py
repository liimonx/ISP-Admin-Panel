from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator


class Customer(models.Model):
    """
    Customer model for storing customer information.
    """
    class Status(models.TextChoices):
        ACTIVE = 'active', _('Active')
        INACTIVE = 'inactive', _('Inactive')
        SUSPENDED = 'suspended', _('Suspended')
        CANCELLED = 'cancelled', _('Cancelled')
    
    # Basic Information
    name = models.CharField(max_length=255, help_text=_('Full name of the customer'))
    email = models.EmailField(unique=True, help_text=_('Email address'))
    phone = models.CharField(
        max_length=20,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message=_('Phone number must be entered in the format: +999999999. Up to 15 digits allowed.')
            )
        ],
        help_text=_('Phone number')
    )
    
    # Address Information
    address = models.TextField(help_text=_('Full address'))
    city = models.CharField(max_length=100, help_text=_('City'))
    state = models.CharField(max_length=100, help_text=_('State/Province'))
    postal_code = models.CharField(max_length=20, help_text=_('Postal/ZIP code'))
    country = models.CharField(max_length=100, default='Bangladesh', help_text=_('Country'))
    
    # Business Information
    company_name = models.CharField(max_length=255, blank=True, help_text=_('Company name (optional)'))
    tax_id = models.CharField(max_length=50, blank=True, help_text=_('Tax ID/VAT number (optional)'))
    
    # Status and Dates
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        help_text=_('Customer status')
    )
    
    # Notes and Additional Info
    notes = models.TextField(blank=True, help_text=_('Additional notes about the customer'))
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Customer')
        verbose_name_plural = _('Customers')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.email})"
    
    @property
    def full_address(self):
        """Return formatted full address."""
        parts = [self.address, self.city, self.state, self.postal_code, self.country]
        return ', '.join(filter(None, parts))
    
    @property
    def is_active(self):
        """Check if customer is active."""
        return self.status == self.Status.ACTIVE
    
    @property
    def is_suspended(self):
        """Check if customer is suspended."""
        return self.status == self.Status.SUSPENDED
    
    def get_active_subscriptions(self):
        """Get all active subscriptions for this customer."""
        return self.subscriptions.filter(status='active')
    
    def get_total_monthly_bill(self):
        """Calculate total monthly bill from active subscriptions."""
        active_subs = self.get_active_subscriptions().select_related('plan')
        return sum(sub.plan.price for sub in active_subs)
    
    def get_subscriptions_count(self):
        """Get total number of subscriptions for this customer."""
        return self.subscriptions.count()
    
    def get_active_subscriptions_count(self):
        """Get count of active subscriptions for this customer."""
        return self.subscriptions.filter(status='active').count()