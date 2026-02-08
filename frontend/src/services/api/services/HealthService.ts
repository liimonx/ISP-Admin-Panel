import { BaseApiService } from "../base/BaseApiService";
import { ENDPOINTS } from "../base/constants";

export class HealthService extends BaseApiService {
  /**
   * Basic health check
   */
  async healthCheck(): Promise<any> {
    return this.get<any>(ENDPOINTS.HEALTH.BASE + '/');
  }

  /**
   * Detailed health check
   */
  async detailedHealthCheck(): Promise<any> {
    return this.get<any>(ENDPOINTS.HEALTH.DETAILED + '/');
  }

  /**
   * Readiness check
   */
  async readinessCheck(): Promise<any> {
    return this.get<any>(ENDPOINTS.HEALTH.READY + '/');
  }

  /**
   * Liveness check
   */
  async livenessCheck(): Promise<any> {
    return this.get<any>(ENDPOINTS.HEALTH.LIVE + '/');
  }
}