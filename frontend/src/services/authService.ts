import axios, { AxiosResponse } from "axios";
import { AuthTokens, User } from "@/types";

const API_BASE_URL = "/api";

// Standardized API response format
interface StandardApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.loadTokensFromStorage();
    this.setupAxiosInterceptors();
  }

  private loadTokensFromStorage() {
    this.accessToken = sessionStorage.getItem('access_token');
    this.refreshToken = sessionStorage.getItem('refresh_token');
  }

  private saveTokensToStorage(tokens: AuthTokens) {
    this.accessToken = tokens.access;
    this.refreshToken = tokens.refresh;
    sessionStorage.setItem('access_token', tokens.access);
    sessionStorage.setItem('refresh_token', tokens.refresh);
  }

  private handleResponse<T>(response: AxiosResponse): T {
    const data: StandardApiResponse<T> = response.data;

    if (!data.success) {
      throw new Error(data.message || "Authentication failed");
    }

    return data.data;
  }

  private handleLegacyResponse<T>(response: AxiosResponse): T {
    // Handle legacy response format (without success field)
    return response.data;
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
      (error) => Promise.reject(error),
    );

    // Response interceptor to handle token refresh and rate limiting
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle rate limiting with exponential backoff
        if (error.response?.status === 429 && !originalRequest._retry) {
          originalRequest._retry = true;
          const retryAfter = error.response.headers["retry-after"] || 1;
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000),
          );
          return axios(originalRequest);
        }

        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            this.redirectToLogin();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.handleApiError(error));
      },
    );
  }

  private handleApiError(error: any): Error {
    if (error.response) {
      const data = error.response.data;
      if (data.message) {
        return new Error(data.message);
      }
      if (data.detail) {
        return new Error(data.detail);
      }
      return new Error(`Authentication error: ${error.response.status}`);
    } else if (error.request) {
      return new Error("Network error - please check your connection");
    } else {
      return new Error("Authentication request failed");
    }
  }

  private redirectToLogin(): void {
    // Avoid redirect loops
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  async login(username: string, password: string): Promise<AuthTokens> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
        username,
        password,
      });

      // Handle both old and new response formats
      let tokens: AuthTokens;
      if (response.data.success !== undefined) {
        // New standardized format
        const data = this.handleResponse<AuthTokens>(response);
        tokens = data;
      } else {
        // Legacy format
        tokens = this.handleLegacyResponse<AuthTokens>(response);
      }

      this.saveTokensToStorage(tokens);
      return tokens;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
        refresh: this.refreshToken,
      });

      // Handle both response formats
      let newAccessToken: string;
      if (response.data.success !== undefined) {
        const data = this.handleResponse<{ access: string }>(response);
        newAccessToken = data.access;
      } else {
        const data = this.handleLegacyResponse<{ access: string }>(response);
        newAccessToken = data.access;
      }

      this.accessToken = newAccessToken;
      sessionStorage.setItem('access_token', newAccessToken);
    } catch (error: any) {
      this.clearTokens();
      throw new Error("Failed to refresh token");
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me/`);

      if (response.data.success !== undefined) {
        return this.handleResponse<User>(response);
      } else {
        return this.handleLegacyResponse<User>(response);
      }
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/me/password/`, {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (response.data.success !== undefined) {
        this.handleResponse(response);
      }
      // For legacy format, no additional handling needed
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/auth/me/profile/`,
        profileData,
      );

      if (response.data.success !== undefined) {
        return this.handleResponse<User>(response);
      } else {
        return this.handleLegacyResponse<User>(response);
      }
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      // Attempt to notify server of logout
      if (this.accessToken) {
        await axios.post(`${API_BASE_URL}/auth/logout/`);
      }
    } catch (error) {
      // Ignore logout errors, still clear local tokens
      console.warn("Logout request failed:", error);
    } finally {
      this.clearTokens();
    }
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
  }

  getStoredTokens(): { access: string; refresh: string } | null {
    // Tokens are in httpOnly cookies, not accessible via JS
    if (this.accessToken && this.refreshToken) {
      return { access: this.accessToken, refresh: this.refreshToken };
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Utility method to check if token is expired
  isTokenExpired(): boolean {
    if (!this.accessToken) return true;

    try {
      const payload = JSON.parse(atob(this.accessToken.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Get user role from token
  getUserRole(): string | null {
    if (!this.accessToken) return null;

    try {
      const payload = JSON.parse(atob(this.accessToken.split(".")[1]));
      return payload.role || null;
    } catch (error) {
      return null;
    }
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    const role = this.getUserRole();

    const permissions: Record<string, string[]> = {
      admin: ["*"], // Admin has all permissions
      support: [
        "customers:read",
        "subscriptions:read",
        "invoices:read",
        "payments:read",
      ],
      accountant: ["invoices:*", "payments:*", "customers:read", "billing:*"],
    };

    if (!role) return false;

    const userPermissions = permissions[role] || [];
    return (
      userPermissions.includes("*") || userPermissions.includes(permission)
    );
  }

  // Auto-refresh token before it expires
  async ensureValidToken(): Promise<void> {
    if (!this.accessToken || this.isTokenExpired()) {
      if (this.refreshToken) {
        await this.refreshAccessToken();
      } else {
        this.clearTokens();
        this.redirectToLogin();
      }
    }
  }
}

export const authService = new AuthService();
