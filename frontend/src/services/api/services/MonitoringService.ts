import { BaseApiService } from "../base/BaseApiService";
import { ENDPOINTS } from "../base/constants";

export class MonitoringService extends BaseApiService {
  /**
   * Get monitoring statistics
   */
  async getMonitoringStats(): Promise<any> {
    return this.get<any>(ENDPOINTS.MONITORING.STATS + '/');
  }

  /**
   * Get router monitoring data
   */
  async getRouterMonitoring(routerId: number): Promise<any> {
    this.validateId(routerId, 'router');
    return this.get<any>(`${ENDPOINTS.MONITORING.BASE}/routers/${routerId}/`);
  }

  /**
   * Get monitoring health check
   */
  async getMonitoringHealthCheck(): Promise<any> {
    return this.get<any>(ENDPOINTS.MONITORING.HEALTH + '/');
  }

  /**
   * Get router metrics
   */
  async getRouterMetrics(params?: Record<string, any>): Promise<any> {
    return this.get<any>(ENDPOINTS.MONITORING.METRICS + '/', params);
  }

  /**
   * Get SNMP snapshots
   */
  async getSnmpSnapshots(params?: Record<string, any>): Promise<any> {
    return this.get<any>(ENDPOINTS.MONITORING.SNMP_SNAPSHOTS + '/', params);
  }

  /**
   * Get usage snapshots
   */
  async getUsageSnapshots(params?: Record<string, any>): Promise<any> {
    return this.get<any>(ENDPOINTS.MONITORING.USAGE_SNAPSHOTS + '/', params);
  }
}