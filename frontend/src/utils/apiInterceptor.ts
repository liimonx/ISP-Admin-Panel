import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { apiRateLimiter } from './rateLimiter';
import { ApiErrorHandler, ErrorLogger, ErrorNotificationHandler, AppError } from './errorHandler';
import { authService } from '../services/authService';

interface RequestMetadata {
  startTime: number;
  endpoint: string;
  retryCount: number;
}

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  metadata?: RequestMetadata;
  _retry?: boolean;
}

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  config: ExtendedAxiosRequestConfig;
}

export class ApiRequestInterceptor {
  private isRefreshing = false;
  private failedQueue: PendingRequest[] = [];
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor() {
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  private setupRequestInterceptor(): void {
    axios.interceptors.request.use(
      async (config) => {
        // Add authentication header
        const token = authService.getAccessToken();
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Check rate limiting
        if (config.url && config.method) {
          const endpoint = this.extractEndpoint(config.url);
          const userId = authService.getUserRole() || 'anonymous';

          const rateLimitResult = apiRateLimiter.checkRequest(
            config.method.toUpperCase(),
            endpoint,
            userId
          );

          if (!rateLimitResult.allowed && rateLimitResult.retryAfter) {
            // Rate limited - wait before proceeding
            await this.waitForRateLimit(rateLimitResult.retryAfter);
          }

          // Add rate limit headers for monitoring
          config.headers['X-RateLimit-Remaining'] = rateLimitResult.remaining;
        }

        // Deduplication - prevent duplicate requests
        const requestKey = this.generateRequestKey(config);
        if (this.requestQueue.has(requestKey)) {
          return this.requestQueue.get(requestKey);
        }

        // Add request metadata
        config.metadata = {
          startTime: Date.now(),
          endpoint: this.extractEndpoint(config.url || ''),
          retryCount: config.metadata?.retryCount || 0,
        };

        return config;
      },
      (error) => {
        return Promise.reject(ApiErrorHandler.handleError(error));
      }
    );
  }

  private setupResponseInterceptor(): void {
    axios.interceptors.response.use(
      (response) => {
        // Remove from request queue on success
        const requestKey = this.generateRequestKey(response.config);
        this.requestQueue.delete(requestKey);

        // Log performance metrics
        this.logPerformanceMetrics(response);

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Remove from request queue on error
        if (originalRequest) {
          const requestKey = this.generateRequestKey(originalRequest);
          this.requestQueue.delete(requestKey);
        }

        // Handle different types of errors
        const handledError = await this.handleResponseError(error, originalRequest);

        // Log error
        ErrorLogger.log(handledError, {
                  endpoint: originalRequest?.url,
        method: originalRequest?.method,
        retryCount: originalRequest?.metadata?.retryCount || 0,
        });

        // Notify error handlers
        ErrorNotificationHandler.notify(handledError);

        return Promise.reject(handledError);
      }
    );
  }

  private async handleResponseError(error: AxiosError, originalRequest: any): Promise<AppError> {
    const handledError = ApiErrorHandler.handleError(error);

    // Handle rate limiting from server
    if (handledError.status === 429) {
      return this.handleServerRateLimit(error, originalRequest);
    }

    // Handle authentication errors
    if (handledError.status === 401) {
      return this.handleAuthenticationError(error, originalRequest);
    }

    // Handle retryable errors
    if (this.shouldRetryRequest(handledError, originalRequest)) {
      return this.retryRequest(originalRequest);
    }

    return handledError;
  }

  private async handleServerRateLimit(error: AxiosError, originalRequest: any): Promise<AppError> {
    const retryAfter = this.getRetryAfterFromHeaders(error.response);
            const endpoint = this.extractEndpoint(originalRequest?.url || '');
    const userId = authService.getUserRole() || 'anonymous';

    // Update local rate limiter
    apiRateLimiter.handleServerRateLimit(
      originalRequest.method?.toUpperCase(),
      endpoint,
      retryAfter,
      userId
    );

    // Wait and retry if retry count is acceptable
    if ((originalRequest?.metadata?.retryCount || 0) < 2) {
      await this.waitForRateLimit(retryAfter * 1000);
      return this.retryRequest(originalRequest);
    }

    return ApiErrorHandler.handleError(error);
  }

  private async handleAuthenticationError(error: AxiosError, originalRequest: any): Promise<AppError> {
    // Avoid infinite loops
    if (originalRequest?._retry || originalRequest?.url?.includes('/auth/')) {
      authService.clearTokens();
      this.redirectToLogin();
      return ApiErrorHandler.handleError(error);
    }

            if (originalRequest) {
          originalRequest._retry = true;
        }

    // Handle token refresh
    if (!this.isRefreshing) {
      this.isRefreshing = true;

      try {
        await authService.refreshAccessToken();
        this.processQueue(null);

        // Retry original request with new token
        if (originalRequest?.headers) {
          originalRequest.headers.Authorization = `Bearer ${authService.getAccessToken()}`;
        }
        const response = await axios(originalRequest);
        return response.data;
      } catch (refreshError) {
        this.processQueue(refreshError);
        authService.clearTokens();
        this.redirectToLogin();
        throw ApiErrorHandler.handleError(refreshError);
      } finally {
        this.isRefreshing = false;
      }
    }

    // Queue request while token is being refreshed
    return new Promise((resolve, reject) => {
      this.failedQueue.push({ resolve, reject, config: originalRequest });
    });
  }

  private shouldRetryRequest(error: AppError, originalRequest: ExtendedAxiosRequestConfig): boolean {
    const maxRetries = 3;
    const currentRetries = originalRequest?.metadata?.retryCount || 0;

    // Don't retry if max retries exceeded
    if (currentRetries >= maxRetries) {
      return false;
    }

    // Don't retry certain request types
    const nonRetryableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (nonRetryableMethods.includes(originalRequest?.method?.toUpperCase())) {
      return false;
    }

    // Only retry specific error types
    return ApiErrorHandler.shouldRetry(error);
  }

  private async retryRequest(originalRequest: any): Promise<any> {
    const retryCount = (originalRequest?.metadata?.retryCount || 0) + 1;
    const delay = ApiErrorHandler.getRetryDelay(retryCount);

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));

    // Update retry count
    originalRequest.metadata = {
      ...originalRequest?.metadata,
      retryCount,
    };

    try {
      const response = await axios(originalRequest);
      return response.data;
    } catch (error) {
      throw ApiErrorHandler.handleError(error);
    }
  }

  private processQueue(error: any): void {
    this.failedQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
      } else {
        if (config?.headers) {
          config.headers.Authorization = `Bearer ${authService.getAccessToken()}`;
        }
        resolve(axios(config));
      }
    });

    this.failedQueue.length = 0;
  }

  private getRetryAfterFromHeaders(response: any): number {
    const retryAfter = response?.headers['retry-after'] ||
                     response?.headers['Retry-After'] ||
                     response?.headers['x-ratelimit-reset'];

    return parseInt(retryAfter, 10) || 60; // Default to 60 seconds
  }

  private async waitForRateLimit(milliseconds: number): Promise<void> {
    const maxWait = 30 * 1000; // Maximum 30 seconds
    const waitTime = Math.min(milliseconds, maxWait);

    return new Promise(resolve => setTimeout(resolve, waitTime));
  }

  private extractEndpoint(url: string): string {
    // Remove base URL and query parameters
    const baseUrl = '/api';
    if (url.startsWith(baseUrl)) {
      url = url.substring(baseUrl.length);
    }

    // Remove query parameters
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      url = url.substring(0, queryIndex);
    }

    return url;
  }

  private generateRequestKey(config: AxiosRequestConfig): string {
    if (!config) {
      return 'unknown:unknown:{}:';
    }
    
    const method = config.method?.toUpperCase() || 'GET';
    const url = config.url || '';
    const params = JSON.stringify(config.params || {});
    const data = typeof config.data === 'object' ? JSON.stringify(config.data) : config.data || '';

    return `${method}:${url}:${params}:${data}`;
  }

  private logPerformanceMetrics(response: AxiosResponse): void {
    const startTime = response.config.metadata?.startTime;
    if (startTime) {
      const duration = Date.now() - startTime;
      const endpoint = response.config.metadata?.endpoint;

      // Log slow requests (>2 seconds)
      if (duration > 2000) {
        console.warn(`Slow API request detected: ${endpoint} took ${duration}ms`);
      }

      // Log performance data for monitoring
      if (process.env.NODE_ENV === 'development') {
        console.debug(`API Performance: ${endpoint} - ${duration}ms`);
      }
    }
  }

  private redirectToLogin(): void {
    // Avoid redirect loops
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Public method to clear request queue (useful for cleanup)
  clearRequestQueue(): void {
    this.requestQueue.clear();
    this.failedQueue.length = 0;
  }

  // Public method to get queue status
  getQueueStatus(): { requestQueue: number; failedQueue: number; isRefreshing: boolean } {
    return {
      requestQueue: this.requestQueue.size,
      failedQueue: this.failedQueue.length,
      isRefreshing: this.isRefreshing,
    };
  }
}

// Create and export singleton instance
export const apiInterceptor = new ApiRequestInterceptor();

// Export utilities for testing and debugging
export const interceptorUtils = {
  clearQueues: () => apiInterceptor.clearRequestQueue(),
  getStatus: () => apiInterceptor.getQueueStatus(),
};

export default apiInterceptor;
