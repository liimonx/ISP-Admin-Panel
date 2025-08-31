import { apiService } from '../services/apiService';
import { authService } from '../services/authService';
import { ApiErrorHandler, AppError } from './errorHandler';
import { apiRateLimiter } from './rateLimiter';
import { API_CONFIG, ENDPOINTS } from '../config/api';

export interface ApiTestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'warning';
  responseTime: number;
  statusCode?: number;
  error?: string;
  data?: any;
  timestamp: Date;
}

export interface ApiHealthReport {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  results: ApiTestResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
}

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  timestamp: Date;
  statusCode: number;
  dataSize?: number;
}

export class ApiTester {
  private performanceData: PerformanceMetrics[] = [];
  private maxMetricsHistory = 1000;

  /**
   * Test a single API endpoint
   */
  async testEndpoint(
    method: string,
    endpoint: string,
    data?: any,
    options: { timeout?: number; headers?: Record<string, string> } = {}
  ): Promise<ApiTestResult> {
    const startTime = Date.now();

    try {
      let response: any;
      const config = {
        timeout: options.timeout || API_CONFIG.TIMEOUT,
        headers: options.headers || {},
      };

      switch (method.toUpperCase()) {
        case 'GET':
          response = await fetch(endpoint, { ...config, method: 'GET' });
          break;
        case 'POST':
          response = await fetch(endpoint, {
            ...config,
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
              'Content-Type': 'application/json',
              ...config.headers,
            },
          });
          break;
        case 'PUT':
          response = await fetch(endpoint, {
            ...config,
            method: 'PUT',
            body: JSON.stringify(data),
            headers: {
              'Content-Type': 'application/json',
              ...config.headers,
            },
          });
          break;
        case 'DELETE':
          response = await fetch(endpoint, { ...config, method: 'DELETE' });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      const responseTime = Date.now() - startTime;
      const responseData = await response.json();

      // Record performance metrics
      this.recordPerformance({
        endpoint,
        method: method.toUpperCase(),
        responseTime,
        timestamp: new Date(),
        statusCode: response.status,
        dataSize: JSON.stringify(responseData).length,
      });

      return {
        endpoint,
        method: method.toUpperCase(),
        status: response.ok ? 'success' : 'error',
        responseTime,
        statusCode: response.status,
        data: responseData,
        timestamp: new Date(),
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        endpoint,
        method: method.toUpperCase(),
        status: 'error',
        responseTime,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test authentication endpoints
   */
  async testAuthEndpoints(): Promise<ApiTestResult[]> {
    const results: ApiTestResult[] = [];

    // Test login endpoint
    results.push(
      await this.testEndpoint('POST', `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, {
        username: 'test',
        password: 'invalid',
      })
    );

    // Test token refresh endpoint (should fail without valid token)
    results.push(
      await this.testEndpoint('POST', `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, {
        refresh: 'invalid_token',
      })
    );

    // Test current user endpoint (should fail without auth)
    results.push(
      await this.testEndpoint('GET', `${API_CONFIG.BASE_URL}${ENDPOINTS.AUTH.ME}`)
    );

    return results;
  }

  /**
   * Test health check endpoints
   */
  async testHealthEndpoints(): Promise<ApiTestResult[]> {
    const results: ApiTestResult[] = [];

    results.push(
      await this.testEndpoint('GET', `${API_CONFIG.BASE_URL}${ENDPOINTS.HEALTH.BASIC}`)
    );

    results.push(
      await this.testEndpoint('GET', `${API_CONFIG.BASE_URL}${ENDPOINTS.HEALTH.DETAILED}`)
    );

    results.push(
      await this.testEndpoint('GET', `${API_CONFIG.BASE_URL}${ENDPOINTS.HEALTH.READY}`)
    );

    results.push(
      await this.testEndpoint('GET', `${API_CONFIG.BASE_URL}${ENDPOINTS.HEALTH.LIVE}`)
    );

    return results;
  }

  /**
   * Test CRUD operations for a resource
   */
  async testCrudEndpoints(
    resourcePath: string,
    sampleData: any
  ): Promise<ApiTestResult[]> {
    const results: ApiTestResult[] = [];
    const baseUrl = `${API_CONFIG.BASE_URL}${resourcePath}`;

    // Test LIST (GET)
    results.push(await this.testEndpoint('GET', `${baseUrl}/`));

    // Test CREATE (POST)
    const createResult = await this.testEndpoint('POST', `${baseUrl}/`, sampleData);
    results.push(createResult);

    // If creation was successful, test other operations
    if (createResult.status === 'success' && createResult.data?.id) {
      const id = createResult.data.id;

      // Test READ (GET by ID)
      results.push(await this.testEndpoint('GET', `${baseUrl}/${id}/`));

      // Test UPDATE (PUT)
      results.push(
        await this.testEndpoint('PUT', `${baseUrl}/${id}/`, {
          ...sampleData,
          updated: true,
        })
      );

      // Test DELETE
      results.push(await this.testEndpoint('DELETE', `${baseUrl}/${id}/`));
    }

    return results;
  }

  /**
   * Run comprehensive API health check
   */
  async runHealthCheck(): Promise<ApiHealthReport> {
    const results: ApiTestResult[] = [];

    // Test health endpoints
    const healthResults = await this.testHealthEndpoints();
    results.push(...healthResults);

    // Test auth endpoints
    const authResults = await this.testAuthEndpoints();
    results.push(...authResults);

    // Test basic resource endpoints (read-only)
    const resourceTests = [
      this.testEndpoint('GET', `${API_CONFIG.BASE_URL}${ENDPOINTS.CUSTOMERS.LIST}`),
      this.testEndpoint('GET', `${API_CONFIG.BASE_URL}${ENDPOINTS.PLANS.LIST}`),
      this.testEndpoint('GET', `${API_CONFIG.BASE_URL}${ENDPOINTS.SUBSCRIPTIONS.LIST}`),
    ];

    const resourceResults = await Promise.all(resourceTests);
    results.push(...resourceResults);

    // Calculate summary
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    const totalResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0);
    const averageResponseTime = totalResponseTime / results.length;

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (failed === 0) {
      overall = 'healthy';
    } else if (failed < results.length / 2) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      timestamp: new Date(),
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        averageResponseTime,
      },
    };
  }

  /**
   * Test rate limiting
   */
  async testRateLimit(
    endpoint: string,
    requestCount: number = 10,
    intervalMs: number = 100
  ): Promise<{
    rateLimited: boolean;
    successfulRequests: number;
    rateLimitedRequests: number;
    results: ApiTestResult[];
  }> {
    const results: ApiTestResult[] = [];
    let successfulRequests = 0;
    let rateLimitedRequests = 0;

    for (let i = 0; i < requestCount; i++) {
      const result = await this.testEndpoint('GET', endpoint);
      results.push(result);

      if (result.statusCode === 429) {
        rateLimitedRequests++;
      } else if (result.status === 'success') {
        successfulRequests++;
      }

      // Wait between requests
      if (i < requestCount - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    return {
      rateLimited: rateLimitedRequests > 0,
      successfulRequests,
      rateLimitedRequests,
      results,
    };
  }

  /**
   * Record performance metrics
   */
  private recordPerformance(metrics: PerformanceMetrics): void {
    this.performanceData.push(metrics);

    // Keep only the most recent metrics
    if (this.performanceData.length > this.maxMetricsHistory) {
      this.performanceData = this.performanceData.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * Get performance statistics for an endpoint
   */
  getPerformanceStats(endpoint: string, method?: string): {
    count: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
  } | null {
    const filtered = this.performanceData.filter(
      m => m.endpoint === endpoint && (!method || m.method === method)
    );

    if (filtered.length === 0) {
      return null;
    }

    const responseTimes = filtered.map(m => m.responseTime).sort((a, b) => a - b);
    const errorCount = filtered.filter(m => m.statusCode >= 400).length;

    return {
      count: filtered.length,
      averageResponseTime: responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length,
      minResponseTime: responseTimes[0],
      maxResponseTime: responseTimes[responseTimes.length - 1],
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
      errorRate: (errorCount / filtered.length) * 100,
    };
  }

  /**
   * Get all performance data
   */
  getAllPerformanceData(): PerformanceMetrics[] {
    return [...this.performanceData];
  }

  /**
   * Clear performance data
   */
  clearPerformanceData(): void {
    this.performanceData = [];
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): {
    totalRequests: number;
    uniqueEndpoints: number;
    averageResponseTime: number;
    errorRate: number;
    slowestEndpoints: Array<{ endpoint: string; method: string; avgResponseTime: number }>;
    topEndpoints: Array<{ endpoint: string; method: string; requestCount: number }>;
  } {
    if (this.performanceData.length === 0) {
      return {
        totalRequests: 0,
        uniqueEndpoints: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowestEndpoints: [],
        topEndpoints: [],
      };
    }

    const endpointStats = new Map<string, {
      count: number;
      totalResponseTime: number;
      errorCount: number;
    }>();

    this.performanceData.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      const stats = endpointStats.get(key) || {
        count: 0,
        totalResponseTime: 0,
        errorCount: 0,
      };

      stats.count++;
      stats.totalResponseTime += metric.responseTime;
      if (metric.statusCode >= 400) {
        stats.errorCount++;
      }

      endpointStats.set(key, stats);
    });

    const totalRequests = this.performanceData.length;
    const uniqueEndpoints = endpointStats.size;
    const totalResponseTime = this.performanceData.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalResponseTime / totalRequests;
    const totalErrors = this.performanceData.filter(m => m.statusCode >= 400).length;
    const errorRate = (totalErrors / totalRequests) * 100;

    // Calculate slowest endpoints
    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([key, stats]) => ({
        endpoint: key.split(' ')[1],
        method: key.split(' ')[0],
        avgResponseTime: stats.totalResponseTime / stats.count,
      }))
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 10);

    // Calculate most requested endpoints
    const topEndpoints = Array.from(endpointStats.entries())
      .map(([key, stats]) => ({
        endpoint: key.split(' ')[1],
        method: key.split(' ')[0],
        requestCount: stats.count,
      }))
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 10);

    return {
      totalRequests,
      uniqueEndpoints,
      averageResponseTime,
      errorRate,
      slowestEndpoints,
      topEndpoints,
    };
  }
}

/**
 * Mock API responses for testing
 */
export class ApiMocker {
  private mocks: Map<string, any> = new Map();
  private delays: Map<string, number> = new Map();
  private enabled = false;

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  mock(endpoint: string, response: any, delay: number = 0): void {
    this.mocks.set(endpoint, response);
    if (delay > 0) {
      this.delays.set(endpoint, delay);
    }
  }

  unmock(endpoint: string): void {
    this.mocks.delete(endpoint);
    this.delays.delete(endpoint);
  }

  async getMockResponse(endpoint: string): Promise<any> {
    if (!this.enabled || !this.mocks.has(endpoint)) {
      return null;
    }

    const delay = this.delays.get(endpoint) || 0;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return this.mocks.get(endpoint);
  }

  clearAll(): void {
    this.mocks.clear();
    this.delays.clear();
  }

  // Predefined mock responses
  setupCommonMocks(): void {
    this.mock('/api/health/', {
      success: true,
      data: { status: 'healthy', timestamp: new Date().toISOString() },
      message: 'System is healthy',
    });

    this.mock('/api/customers/', {
      success: true,
      data: [],
      pagination: { count: 0, next: null, previous: null },
      message: 'Customers retrieved successfully',
    });

    this.mock('/api/plans/', {
      success: true,
      data: [],
      pagination: { count: 0, next: null, previous: null },
      message: 'Plans retrieved successfully',
    });
  }
}

// Create singleton instances
export const apiTester = new ApiTester();
export const apiMocker = new ApiMocker();

// Utility functions for development
export const devUtils = {
  /**
   * Log API performance in development
   */
  logPerformance: (enabled: boolean = true) => {
    if (process.env.NODE_ENV !== 'development') return;

    if (enabled) {
      console.log('API Performance Logging Enabled');
      setInterval(() => {
        const report = apiTester.generatePerformanceReport();
        if (report.totalRequests > 0) {
          console.table({
            'Total Requests': report.totalRequests,
            'Unique Endpoints': report.uniqueEndpoints,
            'Average Response Time': `${report.averageResponseTime.toFixed(2)}ms`,
            'Error Rate': `${report.errorRate.toFixed(2)}%`,
          });
        }
      }, 30000); // Log every 30 seconds
    }
  },

  /**
   * Run quick health check
   */
  quickHealthCheck: async () => {
    console.log('Running API health check...');
    const report = await apiTester.runHealthCheck();
    console.log('Health Check Results:', report);
    return report;
  },

  /**
   * Test rate limiting
   */
  testRateLimit: async (endpoint: string = '/api/health/') => {
    console.log(`Testing rate limit for ${endpoint}...`);
    const result = await apiTester.testRateLimit(endpoint, 15, 100);
    console.log('Rate Limit Test Results:', result);
    return result;
  },

  /**
   * Enable mock mode
   */
  enableMocks: () => {
    apiMocker.enable();
    apiMocker.setupCommonMocks();
    console.log('API mocking enabled');
  },

  /**
   * Disable mock mode
   */
  disableMocks: () => {
    apiMocker.disable();
    console.log('API mocking disabled');
  },
};

// Expose to window in development
if (process.env.NODE_ENV === 'development') {
  (window as any).apiTester = apiTester;
  (window as any).apiMocker = apiMocker;
  (window as any).devUtils = devUtils;
}

export default { apiTester, apiMocker, devUtils };
