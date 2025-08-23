import axios from 'axios';
import { AuthTokens, User } from '@/types';

const API_BASE_URL = '/api';

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.loadTokensFromStorage();
    this.setupAxiosInterceptors();
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private saveTokensToStorage(tokens: AuthTokens) {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    this.accessToken = tokens.access;
    this.refreshToken = tokens.refresh;
  }

  private setupAxiosInterceptors() {
    // Request interceptor to add auth header
    axios.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(username: string, password: string): Promise<AuthTokens> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
        username,
        password,
      });

      const tokens: AuthTokens = response.data;
      this.saveTokensToStorage(tokens);
      return tokens;
    } catch (error) {
      throw new Error('Invalid credentials');
    }
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
        refresh: this.refreshToken,
      });

      this.accessToken = response.data.access;
      localStorage.setItem('access_token', this.accessToken);
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me/`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get current user');
    }
  }

  logout(): void {
    this.clearTokens();
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.accessToken = null;
    this.refreshToken = null;
  }

  getStoredTokens(): { access: string; refresh: string } | null {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');

    if (access && refresh) {
      return { access, refresh };
    }

    return null;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export const authService = new AuthService();
