import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { ApiErrorHandler, AppError, ErrorUtils } from '@/utils/errorHandler';
import { User, AuthTokens } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AppError | null;
  isRefreshing: boolean;
  tokenExpiry: Date | null;
}

interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthTokens>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<User>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  getUserRole: () => string | null;
  isTokenExpiring: () => boolean;
  timeUntilExpiry: () => number;
}

export const useAuth = (): AuthContextValue => {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    isRefreshing: false,
    tokenExpiry: null,
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const expiryWarningRef = useRef<NodeJS.Timeout | null>(null);

  // Query to get current user
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: authService.getCurrentUser,
    enabled: authService.isAuthenticated(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      const handledError = ApiErrorHandler.handleError(error);
      if (ErrorUtils.isAuthError(handledError)) {
        handleAuthError(handledError);
      }
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const tokens = await authService.login(credentials.username, credentials.password);

      // Set remember me preference
      if (credentials.rememberMe) {
        localStorage.setItem('auth_remember_me', 'true');
      } else {
        localStorage.removeItem('auth_remember_me');
      }

      return tokens;
    },
    onSuccess: (tokens) => {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        error: null,
        user: tokens.user,
        tokenExpiry: getTokenExpiry(tokens.access),
      }));

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['auth', 'currentUser'] });

      // Setup auto refresh
      setupTokenRefresh(tokens.access);
    },
    onError: (error: any) => {
      const handledError = ApiErrorHandler.handleError(error);
      setAuthState(prev => ({
        ...prev,
        error: handledError,
        isAuthenticated: false,
        user: null,
      }));
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      // Clear state regardless of success/failure
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isRefreshing: false,
        tokenExpiry: null,
      });

      // Clear all cached data
      queryClient.clear();

      // Clear refresh intervals
      clearTokenRefresh();

      // Clear remember me preference
      localStorage.removeItem('auth_remember_me');
    },
  });

  // Token refresh mutation
  const refreshMutation = useMutation({
    mutationFn: authService.refreshAccessToken,
    onMutate: () => {
      setAuthState(prev => ({ ...prev, isRefreshing: true }));
    },
    onSuccess: () => {
      const newToken = authService.getAccessToken();
      if (newToken) {
        setAuthState(prev => ({
          ...prev,
          isRefreshing: false,
          error: null,
          tokenExpiry: getTokenExpiry(newToken),
        }));

        // Setup next refresh
        setupTokenRefresh(newToken);
      }
    },
    onError: (error: any) => {
      const handledError = ApiErrorHandler.handleError(error);
      handleAuthError(handledError);
    },
    onSettled: () => {
      setAuthState(prev => ({ ...prev, isRefreshing: false }));
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(currentPassword, newPassword),
    onError: (error: any) => {
      const handledError = ApiErrorHandler.handleError(error);
      setAuthState(prev => ({ ...prev, error: handledError }));
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (updatedUser) => {
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        error: null,
      }));

      // Update cached user data
      queryClient.setQueryData(['auth', 'currentUser'], updatedUser);
    },
    onError: (error: any) => {
      const handledError = ApiErrorHandler.handleError(error);
      setAuthState(prev => ({ ...prev, error: handledError }));
    },
  });

  // Helper functions
  const getTokenExpiry = (token: string): Date | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  };

  const handleAuthError = useCallback((error: AppError) => {
    setAuthState(prev => ({
      ...prev,
      error,
      isAuthenticated: false,
      user: null,
    }));

    clearTokenRefresh();
    queryClient.clear();
  }, [queryClient]);

  const setupTokenRefresh = useCallback((token: string) => {
    clearTokenRefresh();

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const now = new Date();
    const timeUntilExpiry = expiry.getTime() - now.getTime();
    const refreshTime = timeUntilExpiry - (5 * 60 * 1000); // Refresh 5 minutes before expiry
    const warningTime = timeUntilExpiry - (10 * 60 * 1000); // Warn 10 minutes before expiry

    // Setup refresh timer
    if (refreshTime > 0) {
      refreshIntervalRef.current = setTimeout(() => {
        if (authService.isAuthenticated() && !authService.isTokenExpired()) {
          refreshMutation.mutate();
        }
      }, refreshTime);
    }

    // Setup expiry warning
    if (warningTime > 0) {
      expiryWarningRef.current = setTimeout(() => {
        // Emit token expiry warning event
        window.dispatchEvent(new CustomEvent('tokenExpiryWarning', {
          detail: { timeUntilExpiry: 10 * 60 * 1000 }
        }));
      }, warningTime);
    }
  }, [refreshMutation]);

  const clearTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearTimeout(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    if (expiryWarningRef.current) {
      clearTimeout(expiryWarningRef.current);
      expiryWarningRef.current = null;
    }
  }, []);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      const tokens = authService.getStoredTokens();

      if (tokens && !authService.isTokenExpired()) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          tokenExpiry: getTokenExpiry(tokens.access),
        }));

        setupTokenRefresh(tokens.access);
      } else if (tokens) {
        // Token exists but is expired, try to refresh
        try {
          await refreshMutation.mutateAsync();
        } catch (error) {
          // Refresh failed, clear tokens
          authService.clearTokens();
        }
      }

      setAuthState(prev => ({ ...prev, isLoading: false }));
    };

    initializeAuth();

    return () => {
      clearTokenRefresh();
    };
  }, [refreshMutation, setupTokenRefresh, clearTokenRefresh]);

  // Update user state when currentUser query updates
  useEffect(() => {
    if (currentUser) {
      setAuthState(prev => ({
        ...prev,
        user: currentUser,
        isLoading: isLoadingUser,
      }));
    } else if (!isLoadingUser && authService.isAuthenticated()) {
      // User query failed but we think we're authenticated
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [currentUser, isLoadingUser]);

  // Public methods
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthTokens> => {
    return loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  const logout = useCallback(async (): Promise<void> => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const refreshToken = useCallback(async (): Promise<void> => {
    return refreshMutation.mutateAsync();
  }, [refreshMutation]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<void> => {
    return changePasswordMutation.mutateAsync({ currentPassword, newPassword });
  }, [changePasswordMutation]);

  const updateProfile = useCallback(async (profileData: Partial<User>): Promise<User> => {
    return updateProfileMutation.mutateAsync(profileData);
  }, [updateProfileMutation]);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    return authService.hasPermission(permission);
  }, []);

  const getUserRole = useCallback((): string | null => {
    return authService.getUserRole();
  }, []);

  const isTokenExpiring = useCallback((): boolean => {
    if (!authState.tokenExpiry) return false;
    const now = new Date();
    const timeUntilExpiry = authState.tokenExpiry.getTime() - now.getTime();
    return timeUntilExpiry <= 10 * 60 * 1000; // Less than 10 minutes
  }, [authState.tokenExpiry]);

  const timeUntilExpiry = useCallback((): number => {
    if (!authState.tokenExpiry) return 0;
    const now = new Date();
    return Math.max(0, authState.tokenExpiry.getTime() - now.getTime());
  }, [authState.tokenExpiry]);

  return {
    ...authState,
    isLoading: authState.isLoading || isLoadingUser || loginMutation.isLoading || logoutMutation.isLoading,
    login,
    logout,
    refreshToken,
    changePassword,
    updateProfile,
    clearError,
    hasPermission,
    getUserRole,
    isTokenExpiring,
    timeUntilExpiry,
  };
};

export default useAuth;
