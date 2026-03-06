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

/** Response shape returned by /api/core/search/ */
export interface GlobalSearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  url?: string;
}

/** Response shape returned by /api/core/notifications/ */
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  created_at: string;
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

  /**
   * Get system settings.
   * Endpoint: GET /api/core/settings/
   */
  async getSettings(): Promise<any> {
    return this.get<any>(ENDPOINTS.CORE.SETTINGS + "/");
  }

  /**
   * Update system settings.
   * Endpoint: PUT /api/core/settings/
   */
  async updateSettings(data: any): Promise<any> {
    return this.put<any>(ENDPOINTS.CORE.SETTINGS + "/", data);
  }

  /**
   * Get global search results.
   * Endpoint: GET /api/core/search/?q={query}
   */
  async globalSearch(query: string): Promise<GlobalSearchResult[]> {
    return this.get<GlobalSearchResult[]>(ENDPOINTS.CORE.GLOBAL_SEARCH + "/", { q: query });
  }

  /**
   * Get current user notifications.
   * Endpoint: GET /api/core/notifications/
   */
  async getNotifications(params?: Record<string, any>): Promise<any> {
    return this.get<any>(ENDPOINTS.CORE.NOTIFICATIONS + "/", params);
  }

  /**
   * Get unread notifications count.
   * Endpoint: GET /api/core/notifications/unread_count/
   */
  async getUnreadNotificationCount(): Promise<{ count: number }> {
    return this.get<{ count: number }>(ENDPOINTS.CORE.NOTIFICATIONS + "/unread_count/");
  }

  /**
   * Mark a specific notification as read.
   * Endpoint: POST /api/core/notifications/{id}/mark_read/
   */
  async markNotificationAsRead(id: number): Promise<any> {
    return this.post<any>(ENDPOINTS.CORE.NOTIFICATIONS + `/${id}/mark_read/`);
  }

  /**
   * Mark all notifications as read.
   * Endpoint: POST /api/core/notifications/mark_all_read/
   */
  async markAllNotificationsAsRead(): Promise<any> {
    return this.post<any>(ENDPOINTS.CORE.NOTIFICATIONS + "/mark_all_read/");
  }
}

