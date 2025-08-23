from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, LoginView, logout_view,
    current_user_view, UserCreateView, UserListView,
    UserDetailView, change_password_view, update_profile_view
)

app_name = 'accounts'

urlpatterns = [
    # Authentication
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', logout_view, name='logout'),
    
    # User Management
    path('me/', current_user_view, name='current_user'),
    path('me/password/', change_password_view, name='change_password'),
    path('me/profile/', update_profile_view, name='update_profile'),
    
    # Admin User Management
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/create/', UserCreateView.as_view(), name='user_create'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
]
