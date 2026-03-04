from rest_framework import permissions

class IsNetworkAdmin(permissions.BasePermission):
    """
    Custom permission to only allow network admins to execute commands.
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Allow superusers
        if request.user.is_superuser:
            return True

        # Check for admin role or staff status
        # Adjusting based on User model properties
        return getattr(request.user, 'is_admin', False) or request.user.is_staff
