from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import update_session_auth_hash
from drf_spectacular.utils import extend_schema, OpenApiParameter
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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return Response({
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
        return Response({'message': 'Successfully logged out'})
    except Exception:
        return Response({'message': 'Successfully logged out'})


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
    return Response(serializer.data)


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
    serializer.is_valid(raise_exception=True)
    
    user = request.user
    user.set_password(serializer.validated_data['new_password'])
    user.save()
    
    # Update session to prevent logout
    update_session_auth_hash(request, user)
    
    return Response({'message': 'Password changed successfully'})


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
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
