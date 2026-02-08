import axios from 'axios';
import { RATE_LIMIT_CONFIG, REFRESH_INTERVALS } from '@/services/api/base/constants';

// API Configuration
export const API_CONFIG = {
  // Base URL - this will be proxied to the Django backend
  baseURL: '/api',
  
  // Timeout settings
  timeout: 30000, // 30 seconds
  
  // Retry settings
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
  },
  
  // Cache settings
  CACHE: {
    DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
    STALE_TIME: 2.5 * 60 * 1000, // 2.5 minutes
  },
  
  // Rate limiting
  rateLimitEnabled: true,
  rateLimitRequests: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE - RATE_LIMIT_CONFIG.REQUEST_BUFFER,
  rateLimitWindow: 60000, // 1 minute
  
  // Refresh intervals
  refreshIntervals: REFRESH_INTERVALS,
};

// Retry delay function with exponential backoff
export const getRetryDelay = (attempt: number): number => {
  const baseDelay = API_CONFIG.RETRY.BASE_DELAY;
  const maxDelay = API_CONFIG.RETRY.MAX_DELAY;
  return Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
};

// Create axios instance with default configuration
export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Tokens are now in httpOnly cookies, no need to add Authorization header
    // The browser will automatically include cookies
    config.withCredentials = true;
    
    // Add request timestamp for tracking
    (config as any).metadata = { startTime: Date.now() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log successful requests (sanitized)
    const duration = Date.now() - (response.config as any).metadata?.startTime;
    const method = response.config.method?.toUpperCase() || 'UNKNOWN';
    const url = response.config.url?.substring(0, 100) || 'unknown';
    console.debug(`API Request: ${method} ${url} - ${duration}ms`);
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token via httpOnly cookie
        const response = await axios.post('/api/auth/token/refresh/', {}, {
          withCredentials: true
        });
        
        // Retry original request - cookies will be included automatically
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
      }
    }
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || RATE_LIMIT_CONFIG.RETRY_AFTER_DEFAULT;
      if (retryAfter) {
        await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
        return apiClient(originalRequest);
      }
    }
    
    // Log error details
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    
    return Promise.reject(error);
  }
);

// Health check function
export const checkApiHealth = async () => {
  try {
    const response = await apiClient.get('/health/');
    return response.data;
  } catch (error) {
    console.error('API Health Check Failed:', error);
    throw error;
  }
};

// Export default axios instance
export default apiClient;