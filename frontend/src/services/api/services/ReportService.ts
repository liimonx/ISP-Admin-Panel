import { BaseApiService } from "../base/BaseApiService";
import { ENDPOINTS } from "../base/constants";

export class ReportService extends BaseApiService {
  /**
   * Get usage reports
   */
  async getUsageReports(params?: Record<string, any>): Promise<any> {
    return this.get<any>(ENDPOINTS.REPORTS.USAGE + '/', params);
  }

  /**
   * Get top users report
   */
  async getTopUsers(params?: Record<string, any>): Promise<any> {
    return this.get<any>(ENDPOINTS.REPORTS.TOP_USERS + '/', params);
  }

  /**
   * Get usage trends report
   */
  async getUsageTrends(params?: Record<string, any>): Promise<any> {
    return this.get<any>(ENDPOINTS.REPORTS.USAGE_TRENDS + '/', params);
  }

  /**
   * Get revenue reports
   */
  async getRevenueReports(params?: Record<string, any>): Promise<any> {
    return this.get<any>(ENDPOINTS.REPORTS.REVENUE + '/', params);
  }

  /**
   * Get customer reports
   */
  async getCustomerReports(params?: Record<string, any>): Promise<any> {
    return this.get<any>(ENDPOINTS.REPORTS.CUSTOMERS + '/', params);
  }

  /**
   * Get network reports with router and bandwidth metrics
   */
  async getNetworkReports(params?: Record<string, any>): Promise<any> {
    return this.get<any>(ENDPOINTS.REPORTS.NETWORK + '/', params);
  }
}
