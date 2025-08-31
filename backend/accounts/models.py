from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name=_('groups'),
        blank=True,
        help_text=_(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name="accounts_user_set",
        related_query_name="accounts_user",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
        related_name="accounts_user_set",
        related_query_name="accounts_user",
    )
    """
    Custom User model with role-based access control (RBAC).
    """
    class Role(models.TextChoices):
        ADMIN = 'admin', _('Administrator')
        SUPPORT = 'support', _('Support Staff')
        ACCOUNTANT = 'accountant', _('Accountant')
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.SUPPORT,
        help_text=_('User role for access control')
    )
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        help_text=_('Phone number for contact')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Designates whether this user should be treated as active.')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN
    
    @property
    def is_support(self):
        return self.role == self.Role.SUPPORT
    
    @property
    def is_accountant(self):
        return self.role == self.Role.ACCOUNTANT
    
    def has_permission(self, permission):
        """
        Check if user has specific permission based on role.
        """
        if self.is_admin:
            return True
        
        # Define role-based permissions
        role_permissions = {
            self.Role.SUPPORT: [
                'view_customer',
                'change_customer',
                'view_subscription',
                'change_subscription',
                'view_router',
                'view_monitoring',
            ],
            self.Role.ACCOUNTANT: [
                'view_customer',
                'view_subscription',
                'view_invoice',
                'change_invoice',
                'view_payment',
                'change_payment',
                'view_plan',
            ],
        }
        
        return permission in role_permissions.get(self.role, [])
