interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfterMs?: number;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

export class RateLimiter {
  private requests: Map<string, RequestRecord> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if a request is allowed for the given key
   * @param key - Unique identifier for the request (e.g., endpoint, user)
   * @returns Object containing whether request is allowed and retry info
   */
  isAllowed(key: string): { allowed: boolean; retryAfter?: number; remaining?: number } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create request record
    let record = this.requests.get(key);

    if (!record || record.timestamp < windowStart) {
      // First request in window or window has expired
      record = { timestamp: now, count: 1 };
      this.requests.set(key, record);

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1
      };
    }

    if (record.count >= this.config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = this.config.retryAfterMs || (this.config.windowMs - (now - record.timestamp));

      return {
        allowed: false,
        retryAfter,
        remaining: 0
      };
    }

    // Increment request count
    record.count++;
    this.requests.set(key, record);

    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count
    };
  }

  /**
   * Reset rate limit for a specific key
   * @param key - Unique identifier to reset
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limit records
   */
  clearAll(): void {
    this.requests.clear();
  }

  /**
   * Clean up expired records
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, record] of this.requests.entries()) {
      if (record.timestamp < windowStart) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Get current usage statistics
   * @param key - Unique identifier
   * @returns Current usage stats or null if no record exists
   */
  getUsage(key: string): { count: number; remaining: number; resetTime: number } | null {
    const record = this.requests.get(key);
    if (!record) return null;

    const remaining = Math.max(0, this.config.maxRequests - record.count);
    const resetTime = record.timestamp + this.config.windowMs;

    return {
      count: record.count,
      remaining,
      resetTime
    };
  }
}

export class ApiRateLimiter {
  private limiters: Map<string, RateLimiter> = new Map();
  private defaultConfig: RateLimitConfig = {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
    retryAfterMs: 60 * 1000
  };

  private endpointConfigs: Record<string, RateLimitConfig> = {
    // Authentication endpoints
    'POST:/api/auth/login/': {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
      retryAfterMs: 60 * 1000
    },
    'POST:/api/auth/token/refresh/': {
      maxRequests: 20,
      windowMs: 60 * 1000,
      retryAfterMs: 30 * 1000
    },

    // Bulk operations
    'POST:/api/customers/bulk-update-status/': {
      maxRequests: 5,
      windowMs: 60 * 1000,
      retryAfterMs: 120 * 1000
    },
    'POST:/api/billing/bulk-generate/': {
      maxRequests: 3,
      windowMs: 60 * 1000,
      retryAfterMs: 180 * 1000
    },

    // Resource creation
    'POST:/api/customers/': {
      maxRequests: 30,
      windowMs: 60 * 1000
    },
    'POST:/api/plans/': {
      maxRequests: 20,
      windowMs: 60 * 1000
    },
    'POST:/api/subscriptions/': {
      maxRequests: 25,
      windowMs: 60 * 1000
    },

    // Monitoring and stats (higher limits for dashboards)
    'GET:/api/monitoring/stats/': {
      maxRequests: 120,
      windowMs: 60 * 1000
    },
    'GET:/api/customers/stats/': {
      maxRequests: 100,
      windowMs: 60 * 1000
    }
  };

  /**
   * Get rate limiter for a specific endpoint
   * @param method - HTTP method
   * @param endpoint - API endpoint path
   * @returns RateLimiter instance
   */
  private getLimiter(method: string, endpoint: string): RateLimiter {
    const key = `${method}:${endpoint}`;

    if (!this.limiters.has(key)) {
      const config = this.endpointConfigs[key] || this.defaultConfig;
      this.limiters.set(key, new RateLimiter(config));
    }

    return this.limiters.get(key)!;
  }

  /**
   * Check if request is allowed for endpoint
   * @param method - HTTP method
   * @param endpoint - API endpoint path
   * @param userId - Optional user identifier for per-user limits
   * @returns Rate limit result
   */
  checkRequest(
    method: string,
    endpoint: string,
    userId?: string
  ): { allowed: boolean; retryAfter?: number; remaining?: number } {
    const limiter = this.getLimiter(method, endpoint);
    const key = userId ? `${method}:${endpoint}:${userId}` : `${method}:${endpoint}`;

    return limiter.isAllowed(key);
  }

  /**
   * Record a successful request
   * @param method - HTTP method
   * @param endpoint - API endpoint path
   * @param userId - Optional user identifier
   */
  recordRequest(method: string, endpoint: string, userId?: string): void {
    // Request is already recorded in checkRequest
    // This method is here for potential future use
  }

  /**
   * Handle rate limit error from server
   * @param method - HTTP method
   * @param endpoint - API endpoint path
   * @param retryAfter - Retry after seconds from server
   * @param userId - Optional user identifier
   */
  handleServerRateLimit(
    method: string,
    endpoint: string,
    retryAfter: number,
    userId?: string
  ): void {
    const limiter = this.getLimiter(method, endpoint);
    const key = userId ? `${method}:${endpoint}:${userId}` : `${method}:${endpoint}`;

    // Mark as rate limited for the specified duration
    const record = { timestamp: Date.now(), count: limiter['config'].maxRequests };
    limiter['requests'].set(key, record);
  }

  /**
   * Get wait time before next request
   * @param method - HTTP method
   * @param endpoint - API endpoint path
   * @param userId - Optional user identifier
   * @returns Wait time in milliseconds or 0 if no wait needed
   */
  getWaitTime(method: string, endpoint: string, userId?: string): number {
    const result = this.checkRequest(method, endpoint, userId);
    return result.retryAfter || 0;
  }

  /**
   * Clean up expired rate limit records
   */
  cleanup(): void {
    for (const limiter of this.limiters.values()) {
      limiter.cleanup();
    }
  }

  /**
   * Reset rate limits for all endpoints
   */
  resetAll(): void {
    for (const limiter of this.limiters.values()) {
      limiter.clearAll();
    }
  }

  /**
   * Get usage statistics for an endpoint
   * @param method - HTTP method
   * @param endpoint - API endpoint path
   * @param userId - Optional user identifier
   * @returns Usage statistics or null
   */
  getUsageStats(
    method: string,
    endpoint: string,
    userId?: string
  ): { count: number; remaining: number; resetTime: number } | null {
    const limiter = this.getLimiter(method, endpoint);
    const key = userId ? `${method}:${endpoint}:${userId}` : `${method}:${endpoint}`;

    return limiter.getUsage(key);
  }
}

// Global rate limiter instance
export const apiRateLimiter = new ApiRateLimiter();

// Cleanup expired records every 5 minutes
setInterval(() => {
  apiRateLimiter.cleanup();
}, 5 * 60 * 1000);

export default apiRateLimiter;
