from rest_framework import status, generics, permissions, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.contrib.auth import update_session_auth_hash
from django.db import IntegrityError, transaction
from drf_spectacular.utils import extend_schema, OpenApiParameter
from core.responses import APIResponse, paginate_response
from .models import User
from .serializers import (
    UserSerializer, UserCreateSerializer, LoginSerializer,
    CustomTokenObtainPairSerializer, ChangePasswordSerializer
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token obtain view with additional user data."""
    serializer_class = CustomTokenObtainPairSerializer


@extend_schema(
    tags=['Authentication'],
    summary='User Login',
    description='Authenticate user and return JWT tokens with user data'
)
class LoginView(generics.GenericAPIView):
    """User login view."""
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        # Handle both DRF request and WSGIRequest
        if hasattr(request, 'data'):
            data = request.data
        else:
            # Parse JSON from request body
            import json
            try:
                data = json.loads(request.body.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                data = request.POST
        
        # Use serializer directly instead of through the view
        serializer = LoginSerializer(data=data)
        if not serializer.is_valid():
            raise serializers.ValidationError(serializer.errors)
        
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return APIResponse.success({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })


@extend_schema(
    tags=['Authentication'],
    summary='User Logout',
    description='Logout user by blacklisting refresh token'
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """User logout view."""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return APIResponse.success(message='Successfully logged out')
    except TokenError:
        return APIResponse.error('Invalid token', status_code=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return APIResponse.error('Logout failed', status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Users'],
    summary='Get Current User',
    description='Get current authenticated user information'
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user_view(request):
    """Get current user information."""
    serializer = UserSerializer(request.user)
    return APIResponse.success(serializer.data)


@extend_schema(
    tags=['Users'],
    summary='Create User',
    description='Create a new user account (Admin only)'
)
class UserCreateView(generics.CreateAPIView):
    """Create new user view (Admin only)."""
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def create(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                serializer = self.get_serializer(data=request.data)
                if serializer.is_valid():
                    user = serializer.save()
                    return APIResponse.success(
                        UserSerializer(user).data,
                        message='User created successfully',
                        status_code=status.HTTP_201_CREATED
                    )
                return APIResponse.validation_error(serializer.errors)
        except IntegrityError:
            return APIResponse.error('User with this username or email already exists', 
                                   status_code=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return APIResponse.error('Failed to create user', 
                                   status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Users'],
    summary='List Users',
    description='List all users (Admin only)'
)
class UserListView(generics.ListAPIView):
    """List all users view (Admin only)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None  # Disable default pagination
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Return standardized response format
        return APIResponse.success(
            data=serializer.data,
            message='Users retrieved successfully'
        )


@extend_schema(
    tags=['Users'],
    summary='Get User Details',
    description='Get specific user details (Admin only)'
)
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """User detail view (Admin only)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return APIResponse.success(serializer.data)
    
    def update(self, request, *args, **kwargs):
        partial = request.method == 'PATCH'
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            user = serializer.save()
            return APIResponse.success(
                UserSerializer(user).data,
                message='User updated successfully'
            )
        return APIResponse.validation_error(serializer.errors)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return APIResponse.success(
            message='User deleted successfully',
            status_code=status.HTTP_204_NO_CONTENT
        )


@extend_schema(
    tags=['Users'],
    summary='Change Password',
    description='Change current user password'
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """Change user password view."""
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        # Update session to prevent logout
        update_session_auth_hash(request, user)
        
        return APIResponse.success(message='Password changed successfully')
    return APIResponse.validation_error(serializer.errors)


@extend_schema(
    tags=['Users'],
    summary='Update Profile',
    description='Update current user profile information'
)
@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_profile_view(request):
    """Update user profile view."""
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        user = serializer.save()
        return APIResponse.success(
            UserSerializer(user).data,
            message='Profile updated successfully'
        )
    return APIResponse.validation_error(serializer.errors)
