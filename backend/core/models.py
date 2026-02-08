"""
Core models for system-wide settings and configuration.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
import json


class SystemSettings(models.Model):
    """
    System-wide settings and configuration model.
    """
    # General Settings
    company_name = models.CharField(
        max_length=255,
        default="ISP Admin Panel",
        help_text=_("Company name displayed in the system")
    )
    contact_email = models.EmailField(
        default="admin@ispadmin.com",
        help_text=_("Primary contact email address")
    )
    support_phone = models.CharField(
        max_length=50,
        default="+1 (555) 123-4567",
        help_text=_("Support phone number")
    )
    
    # Localization
    timezone = models.CharField(
        max_length=50,
        default="UTC",
        help_text=_("System timezone")
    )
    date_format = models.CharField(
        max_length=20,
        default="MM/DD/YYYY",
        help_text=_("Date format for display")
    )
    currency = models.CharField(
        max_length=3,
        default="USD",
        help_text=_("Default currency code")
    )
    language = models.CharField(
        max_length=10,
        default="en",
        help_text=_("System language code")
    )
    
    # System Configuration
    maintenance_mode = models.BooleanField(
        default=False,
        help_text=_("Enable maintenance mode")
    )
    auto_backup = models.BooleanField(
        default=True,
        help_text=_("Enable automatic backups")
    )
    backup_frequency = models.CharField(
        max_length=20,
        default="daily",
        choices=[
            ("hourly", _("Hourly")),
            ("daily", _("Daily")),
            ("weekly", _("Weekly")),
            ("monthly", _("Monthly")),
        ],
        help_text=_("Backup frequency")
    )
    
    # Notifications
    email_notifications = models.BooleanField(
        default=True,
        help_text=_("Enable email notifications")
    )
    sms_notifications = models.BooleanField(
        default=False,
        help_text=_("Enable SMS notifications")
    )
    
    # Security Settings
    api_rate_limit = models.PositiveIntegerField(
        default=1000,
        validators=[MinValueValidator(100), MaxValueValidator(10000)],
        help_text=_("API rate limit per hour")
    )
    session_timeout = models.PositiveIntegerField(
        default=30,
        validators=[MinValueValidator(5), MaxValueValidator(480)],
        help_text=_("Session timeout in minutes")
    )
    max_login_attempts = models.PositiveIntegerField(
        default=5,
        validators=[MinValueValidator(3), MaxValueValidator(10)],
        help_text=_("Maximum login attempts before lockout")
    )
    
    # Password Policy
    password_min_length = models.PositiveIntegerField(
        default=8,
        validators=[MinValueValidator(6), MaxValueValidator(20)],
        help_text=_("Minimum password length")
    )
    password_require_uppercase = models.BooleanField(
        default=True,
        help_text=_("Require uppercase letters in passwords")
    )
    password_require_lowercase = models.BooleanField(
        default=True,
        help_text=_("Require lowercase letters in passwords")
    )
    password_require_numbers = models.BooleanField(
        default=True,
        help_text=_("Require numbers in passwords")
    )
    password_require_special_chars = models.BooleanField(
        default=True,
        help_text=_("Require special characters in passwords")
    )
    
    # Advanced Settings
    log_level = models.CharField(
        max_length=20,
        default="info",
        choices=[
            ("debug", _("Debug")),
            ("info", _("Info")),
            ("warning", _("Warning")),
            ("error", _("Error")),
        ],
        help_text=_("System log level")
    )
    database_pool_size = models.PositiveIntegerField(
        default=10,
        validators=[MinValueValidator(5), MaxValueValidator(50)],
        help_text=_("Database connection pool size")
    )
    cache_ttl = models.PositiveIntegerField(
        default=3600,
        validators=[MinValueValidator(60), MaxValueValidator(86400)],
        help_text=_("Cache TTL in seconds")
    )
    custom_css = models.TextField(
        blank=True,
        help_text=_("Custom CSS styles")
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _("System Settings")
        verbose_name_plural = _("System Settings")
    
    def __str__(self):
        return f"System Settings - {self.company_name}"
    
    @classmethod
    def get_settings(cls):
        """Get or create system settings instance."""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings
    
    def get_password_policy(self):
        """Get password policy as dictionary."""
        return {
            "min_length": self.password_min_length,
            "require_uppercase": self.password_require_uppercase,
            "require_lowercase": self.password_require_lowercase,
            "require_numbers": self.password_require_numbers,
            "require_special_chars": self.password_require_special_chars,
        }
    
    def set_password_policy(self, policy_data):
        """Set password policy from dictionary."""
        self.password_min_length = policy_data.get("min_length", 8)
        self.password_require_uppercase = policy_data.get("require_uppercase", True)
        self.password_require_lowercase = policy_data.get("require_lowercase", True)
        self.password_require_numbers = policy_data.get("require_numbers", True)
        self.password_require_special_chars = policy_data.get("require_special_chars", True)
