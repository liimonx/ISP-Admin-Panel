import { BaseApiService } from "../base/BaseApiService";
import { ENDPOINTS } from "../base/constants";

export class MonitoringService extends BaseApiService {
  private async retryApiCall<T>(apiCall: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      if (retries > 0) {
        console.warn(`Retrying API call in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryApiCall(apiCall, retries - 1, delay);
      }
      console.error("API call failed after retries:", error);
      throw error;
    }
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStats(): Promise<any> {
    return this.retryApiCall(() => this.get<any>(ENDPOINTS.MONITORING.STATS + '/'));
  }

  /**
   * Get router monitoring data
   */
  async getRouterMonitoring(routerId: number): Promise<any> {
    this.validateId(routerId, 'router');
    return this.retryApiCall(() => this.get<any>(`${ENDPOINTS.MONITORING.BASE}/routers/${routerId}/`));
  }

  /**
   * Get monitoring health check
   */
  async getMonitoringHealthCheck(): Promise<any> {
    return this.retryApiCall(() => this.get<any>(ENDPOINTS.MONITORING.HEALTH + '/'));
  }

  /**
   * Get router metrics
   */
  async getRouterMetrics(params?: Record<string, any>): Promise<any> {
    return this.retryApiCall(() => this.get<any>(ENDPOINTS.MONITORING.METRICS + '/', params));
  }

  /**
   * Get SNMP snapshots
   */
  async getSnmpSnapshots(params?: Record<string, any>): Promise<any> {
    return this.retryApiCall(() => this.get<any>(ENDPOINTS.MONITORING.SNMP_SNAPSHOTS + '/', params));
  }

  /**
   * Get usage snapshots
   */
  async getUsageSnapshots(params?: Record<string, any>): Promise<any> {
    return this.retryApiCall(() => this.get<any>(ENDPOINTS.MONITORING.USAGE_SNAPSHOTS + '/', params));
  }
}