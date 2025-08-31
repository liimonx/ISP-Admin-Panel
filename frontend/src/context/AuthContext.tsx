import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthTokens } from '@/types';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthTokens }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      const tokens = authService.getStoredTokens();
      if (tokens) {
        try {
          // Check if we have cached user data
          const cachedUser = localStorage.getItem('cached_user');
          if (cachedUser) {
            try {
              const user = JSON.parse(cachedUser);
              dispatch({ type: 'LOGIN_SUCCESS', payload: { ...tokens, user } });
              // Fetch fresh user data in background
              setTimeout(async () => {
                try {
                  const freshUser = await authService.getCurrentUser();
                  localStorage.setItem('cached_user', JSON.stringify(freshUser));
                  dispatch({ type: 'UPDATE_USER', payload: freshUser });
                } catch (error) {
                  console.warn('Failed to fetch fresh user data:', error);
                }
              }, 100);
              return;
            } catch (error) {
              console.warn('Failed to parse cached user data:', error);
            }
          }
          
          const user = await authService.getCurrentUser();
          localStorage.setItem('cached_user', JSON.stringify(user));
          dispatch({ type: 'LOGIN_SUCCESS', payload: { ...tokens, user } });
        } catch (error) {
          authService.clearTokens();
          localStorage.removeItem('cached_user');
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const tokens = await authService.login(username, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: tokens });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('cached_user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
