import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiter, ApiRateLimiter } from './rateLimiter';

describe('RateLimiter', () => {
  const config = {
    maxRequests: 3,
    windowMs: 1000,
    retryAfterMs: 2000
  };

  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(config);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within limit', () => {
    const key = 'test-key';

    // First request
    let result = rateLimiter.isAllowed(key);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);

    // Second request
    result = rateLimiter.isAllowed(key);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);

    // Third request
    result = rateLimiter.isAllowed(key);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('should block requests exceeding limit', () => {
    const key = 'test-key';

    // Use up all requests
    rateLimiter.isAllowed(key);
    rateLimiter.isAllowed(key);
    rateLimiter.isAllowed(key);

    // Fourth request should be blocked
    const result = rateLimiter.isAllowed(key);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBe(2000); // Configured retryAfterMs
  });

  it('should use default retry calculation if retryAfterMs is not provided', () => {
    const customConfig = { maxRequests: 1, windowMs: 1000 }; // No retryAfterMs
    const customLimiter = new RateLimiter(customConfig);
    const key = 'test-key';

    // Set time to 0
    vi.setSystemTime(0);

    customLimiter.isAllowed(key); // 1st request, timestamp 0

    // Advance time to 500ms
    vi.setSystemTime(500);

    const result = customLimiter.isAllowed(key); // 2nd request, blocked
    expect(result.allowed).toBe(false);
    // retryAfter = windowMs (1000) - (now (500) - timestamp (0)) = 500
    expect(result.retryAfter).toBe(500);
  });

  it('should reset limit after window expires', () => {
    const key = 'test-key';

    rateLimiter.isAllowed(key);
    rateLimiter.isAllowed(key);
    rateLimiter.isAllowed(key);

    expect(rateLimiter.isAllowed(key).allowed).toBe(false);

    // Advance time past windowMs
    vi.advanceTimersByTime(1001);

    const result = rateLimiter.isAllowed(key);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2); // Count resets to 1 (current request)
  });

  it('should reset specific key', () => {
    const key = 'test-key';
    rateLimiter.isAllowed(key);
    rateLimiter.isAllowed(key);
    rateLimiter.isAllowed(key);

    expect(rateLimiter.isAllowed(key).allowed).toBe(false);

    rateLimiter.reset(key);

    expect(rateLimiter.isAllowed(key).allowed).toBe(true);
  });

  it('should clear all records', () => {
    const key1 = 'key1';
    const key2 = 'key2';

    rateLimiter.isAllowed(key1);
    rateLimiter.isAllowed(key2);

    rateLimiter.clearAll();

    expect(rateLimiter.getUsage(key1)).toBeNull();
    expect(rateLimiter.getUsage(key2)).toBeNull();
  });

  it('should cleanup expired records', () => {
    const key1 = 'expired';
    const key2 = 'active';

    vi.setSystemTime(0);
    rateLimiter.isAllowed(key1);

    vi.advanceTimersByTime(500);
    rateLimiter.isAllowed(key2);

    // Advance time so key1 is expired (1000ms window) but key2 is not
    vi.advanceTimersByTime(600);
    // Time is 1100.
    // key1 timestamp 0. 1100 - 1000 = 100. 0 < 100 -> Expired.
    // key2 timestamp 500. 1100 - 1000 = 100. 500 > 100 -> Not expired.

    rateLimiter.cleanup();

    expect(rateLimiter.getUsage(key1)).toBeNull();
    expect(rateLimiter.getUsage(key2)).not.toBeNull();
  });

  it('should get usage statistics', () => {
    const key = 'test-key';
    vi.setSystemTime(1000);

    rateLimiter.isAllowed(key);
    rateLimiter.isAllowed(key);

    const usage = rateLimiter.getUsage(key);
    expect(usage).toEqual({
      count: 2,
      remaining: 1,
      resetTime: 2000 // 1000 + 1000 windowMs
    });
  });

  it('should return null usage for unknown key', () => {
    expect(rateLimiter.getUsage('unknown')).toBeNull();
  });
});

describe('ApiRateLimiter', () => {
  let apiRateLimiterInstance: ApiRateLimiter;

  beforeEach(() => {
    apiRateLimiterInstance = new ApiRateLimiter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should use default config for unknown endpoints', () => {
    // Default config: maxRequests: 60
    const method = 'GET';
    const endpoint = '/api/unknown/';

    for (let i = 0; i < 60; i++) {
      expect(apiRateLimiterInstance.checkRequest(method, endpoint).allowed).toBe(true);
    }

    expect(apiRateLimiterInstance.checkRequest(method, endpoint).allowed).toBe(false);
  });

  it('should use specific config for known endpoints', () => {
    // 'POST:/api/auth/login/': maxRequests: 10
    const method = 'POST';
    const endpoint = '/api/auth/login/';

    for (let i = 0; i < 10; i++) {
      expect(apiRateLimiterInstance.checkRequest(method, endpoint).allowed).toBe(true);
    }

    expect(apiRateLimiterInstance.checkRequest(method, endpoint).allowed).toBe(false);
  });

  it('should distinguish users', () => {
    const method = 'POST';
    const endpoint = '/api/auth/login/';
    const user1 = 'user1';
    const user2 = 'user2';

    // Exhaust user1 limit
    for (let i = 0; i < 10; i++) {
      apiRateLimiterInstance.checkRequest(method, endpoint, user1);
    }
    expect(apiRateLimiterInstance.checkRequest(method, endpoint, user1).allowed).toBe(false);

    // User2 should still be allowed
    expect(apiRateLimiterInstance.checkRequest(method, endpoint, user2).allowed).toBe(true);
  });

  it('should handle server rate limit', () => {
    const method = 'GET';
    const endpoint = '/api/test/';

    apiRateLimiterInstance.handleServerRateLimit(method, endpoint, 60);

    const result = apiRateLimiterInstance.checkRequest(method, endpoint);
    expect(result.allowed).toBe(false);
  });

  it('should get wait time', () => {
    const method = 'GET';
    const endpoint = '/api/test/';

    apiRateLimiterInstance.handleServerRateLimit(method, endpoint, 60);

    // retryAfterMs for default config is 60000 (1 minute)
    // When handleServerRateLimit is called, it sets count to maxRequests.
    // So next checkRequest will fail with retryAfterMs from config.

    const waitTime = apiRateLimiterInstance.getWaitTime(method, endpoint);
    expect(waitTime).toBe(60000);
  });

  it('should get wait time as 0 when allowed', () => {
    const method = 'GET';
    const endpoint = '/api/test/';
    expect(apiRateLimiterInstance.getWaitTime(method, endpoint)).toBe(0);
  });

  it('should get usage stats', () => {
     const method = 'GET';
     const endpoint = '/api/test/';

     apiRateLimiterInstance.checkRequest(method, endpoint);

     const stats = apiRateLimiterInstance.getUsageStats(method, endpoint);
     expect(stats).toBeTruthy();
     expect(stats?.count).toBe(1);
  });

  it('should cleanup all limiters', () => {
      const method = 'GET';
      const endpoint = '/api/test/';

      vi.setSystemTime(100000);

      // Initialize a limiter and make a request
      apiRateLimiterInstance.checkRequest(method, endpoint);

      vi.advanceTimersByTime(60001); // Advance past default windowMs (60000)

      apiRateLimiterInstance.cleanup();

      const stats = apiRateLimiterInstance.getUsageStats(method, endpoint);
      expect(stats).toBeNull();
  });

  it('should reset all limiters', () => {
      const method = 'GET';
      const endpoint = '/api/test/';
      apiRateLimiterInstance.checkRequest(method, endpoint);

      apiRateLimiterInstance.resetAll();

      expect(apiRateLimiterInstance.getUsageStats(method, endpoint)).toBeNull();
  });
});
