import { BaseApiService } from "../base/BaseApiService";
import { ENDPOINTS } from "../base/constants";

/** Response shape returned by /api/core/dashboard/stats/ */
export interface DashboardStats {
  total_customers: number;
  active_customers: number;
  total_subscriptions: number;
  active_subscriptions: number;
  total_monthly_revenue: number;
  total_revenue: number;
  total_routers: number;
  online_routers: number;
  pending_invoices: number;
  overdue_invoices: number;
  [key: string]: unknown;
}

/** Response shape returned by /api/core/stats/all/ */
export interface AllStats {
  customers?: Record<string, unknown>;
  subscriptions?: Record<string, unknown>;
  invoices?: Record<string, unknown>;
  payments?: Record<string, unknown>;
  plans?: Record<string, unknown>;
  routers?: Record<string, unknown>;
  [key: string]: unknown;
}

export class CoreService extends BaseApiService {
  /**
   * Get comprehensive dashboard statistics in a single request.
   * Endpoint: GET /api/core/dashboard/stats/
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return this.get<DashboardStats>(ENDPOINTS.CORE.DASHBOARD_STATS + "/");
  }

  /**
   * Get ALL statistics across every entity in a single request.
   * Endpoint: GET /api/core/stats/all/
   */
  async getAllStats(): Promise<AllStats> {
    return this.get<AllStats>(ENDPOINTS.CORE.STATS_ALL + "/");
  }

  /**
   * Get customer-specific statistics.
   * Endpoint: GET /api/core/stats/customers/
   */
  async getCustomerStats(): Promise<any> {
    return this.get<any>(ENDPOINTS.CORE.STATS_CUSTOMERS + "/");
  }

  /**
   * Get invoice-specific statistics.
   * Endpoint: GET /api/core/stats/invoices/
   */
  async getInvoiceStats(): Promise<any> {
    return this.get<any>(ENDPOINTS.CORE.STATS_INVOICES + "/");
  }

  /**
   * Get payment-specific statistics.
   * Endpoint: GET /api/core/stats/payments/
   */
  async getPaymentStats(): Promise<any> {
    return this.get<any>(ENDPOINTS.CORE.STATS_PAYMENTS + "/");
  }

  /**
   * Get plan-specific statistics.
   * Endpoint: GET /api/core/stats/plans/
   */
  async getPlanStats(): Promise<any> {
    return this.get<any>(ENDPOINTS.CORE.STATS_PLANS + "/");
  }

  /**
   * Get router-specific statistics.
   * Endpoint: GET /api/core/stats/routers/
   */
  async getRouterStats(): Promise<any> {
    return this.get<any>(ENDPOINTS.CORE.STATS_ROUTERS + "/");
  }

  /**
   * Get subscription-specific statistics.
   * Endpoint: GET /api/core/stats/subscriptions/
   */
  async getSubscriptionStats(): Promise<any> {
    return this.get<any>(ENDPOINTS.CORE.STATS_SUBSCRIPTIONS + "/");
  }

  /**
   * Get payment method distribution analytics (cash, bKash, Nagad, etc.).
   * Endpoint: GET /api/core/analytics/payment-methods/
   */
  async getPaymentMethodAnalytics(): Promise<any> {
    return this.get<any>(ENDPOINTS.CORE.ANALYTICS_PAYMENT_METHODS + "/");
  }

  /**
   * Get top customers by revenue.
   * Endpoint: GET /api/core/analytics/top-customers/
   */
  async getTopCustomers(params?: Record<string, any>): Promise<any> {
    return this.get<any>(ENDPOINTS.CORE.ANALYTICS_TOP_CUSTOMERS + "/", params);
  }

  /**
   * Get daily trend data (revenue, subscriptions, etc.).
   * Endpoint: GET /api/core/trends/daily/
   */
  async getDailyTrends(params?: Record<string, any>): Promise<any> {
    return this.get<any>(ENDPOINTS.CORE.TRENDS_DAILY + "/", params);
  }

  /**
   * Get monthly trend data.
   * Endpoint: GET /api/core/trends/monthly/
   */
  async getMonthlyTrends(params?: Record<string, any>): Promise<any> {
    return this.get<any>(ENDPOINTS.CORE.TRENDS_MONTHLY + "/", params);
  }
}
