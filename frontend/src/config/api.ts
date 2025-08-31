import axios from 'axios';

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
  rateLimitRequests: 100,
  rateLimitWindow: 60000, // 1 minute
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
    // Add authentication token if available
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
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
    // Log successful requests
    const duration = Date.now() - (response.config as any).metadata?.startTime;
    console.debug(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh/', {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
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
