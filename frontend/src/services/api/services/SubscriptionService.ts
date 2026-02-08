import { Subscription, ApiResponse } from "@/types";
import { BaseApiService } from "../base/BaseApiService";
import { ENDPOINTS, VALID_SUBSCRIPTION_STATUSES } from "../base/constants";

export class SubscriptionService extends BaseApiService {
  /**
   * Get all subscriptions with optional filtering
   */
  async getSubscriptions(
    params?: Record<string, any>,
  ): Promise<ApiResponse<Subscription>> {
    const response = await this.getPaginated<Subscription>(
      ENDPOINTS.SUBSCRIPTIONS.BASE,
      params,
    );

    // Handle backend response format - it may return both data and results
    if (response && typeof response === "object" && "success" in response) {
      const backendResponse = response as any;
      if (backendResponse.success && backendResponse.results) {
        return {
          count: backendResponse.count || backendResponse.results.length,
          results: backendResponse.results,
          next: backendResponse.next || null,
          previous: backendResponse.previous || null,
        };
      }
    }

    return response;
  }

  /**
   * Get a specific subscription by ID
   */
  async getSubscription(id: number): Promise<Subscription> {
    this.validateId(id, "subscription");
    return this.get<Subscription>(`${ENDPOINTS.SUBSCRIPTIONS.BASE}/${id}/`);
  }

  /**
   * Create a new subscription
   */
  async createSubscription(data: Partial<Subscription>): Promise<Subscription> {
    // Transform data to match backend expectations
    const transformedData = {
      customer: data.customer_id || data.customer?.id,
      plan: data.plan_id || data.plan?.id,
      router: data.router_id || data.router?.id,
      username: data.username,
      password: data.password,
      access_method: data.access_method || "pppoe",
      static_ip: data.static_ip || undefined,
      mac_address: data.mac_address || undefined,
      status: data.status || "pending",
      start_date: data.start_date,
      end_date: data.end_date || null,
      monthly_fee: data.monthly_fee || 0,
      setup_fee: data.setup_fee || 0,
      notes: data.notes || null,
    };

    return this.post<Subscription>(
      ENDPOINTS.SUBSCRIPTIONS.BASE + "/",
      transformedData,
    );
  }

  /**
   * Update an existing subscription
   */
  async updateSubscription(
    id: number,
    data: Partial<Subscription>,
  ): Promise<Subscription> {
    this.validateId(id, "subscription");

    // Transform data to match backend expectations
    const transformedData = {
      customer: data.customer_id || data.customer?.id,
      plan: data.plan_id || data.plan?.id,
      router: data.router_id || data.router?.id,
      username: data.username,
      password: data.password,
      access_method: data.access_method,
      static_ip: data.static_ip || undefined,
      mac_address: data.mac_address || undefined,
      status: data.status,
      start_date: data.start_date,
      end_date: data.end_date || null,
      monthly_fee: data.monthly_fee,
      setup_fee: data.setup_fee,
      notes: data.notes || undefined,
    };

    return this.put<Subscription>(
      `${ENDPOINTS.SUBSCRIPTIONS.BASE}/${id}/`,
      transformedData,
    );
  }

  /**
   * Delete a subscription
   */
  async deleteSubscription(id: number): Promise<void> {
    this.validateId(id, "subscription");
    return this.delete(`${ENDPOINTS.SUBSCRIPTIONS.BASE}/${id}/`);
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(
    id: number,
    status: string,
  ): Promise<Subscription> {
    this.validateId(id, "subscription");
    this.validateStatus(status, VALID_SUBSCRIPTION_STATUSES, "subscription");

    return this.patch<Subscription>(
      `${ENDPOINTS.SUBSCRIPTIONS.BASE}/${id}/status/`,
      { status },
    );
  }

  /**
   * Get active subscriptions
   */
  async getActiveSubscriptions(): Promise<ApiResponse<Subscription>> {
    const response = await this.get<any>(ENDPOINTS.SUBSCRIPTIONS.ACTIVE + "/");

    // Transform response to match expected format
    if (response.success && Array.isArray(response.data)) {
      return {
        count: response.data.length,
        results: response.data,
        next: null,
        previous: null,
      };
    }

    return response;
  }

  /**
   * Get suspended subscriptions
   */
  async getSuspendedSubscriptions(): Promise<ApiResponse<Subscription>> {
    const response = await this.get<any>(
      ENDPOINTS.SUBSCRIPTIONS.SUSPENDED + "/",
    );

    // Transform response to match expected format
    if (response.success && Array.isArray(response.data)) {
      return {
        count: response.data.length,
        results: response.data,
        next: null,
        previous: null,
      };
    }

    return response;
  }

  /**
   * Get expired subscriptions
   */
  async getExpiredSubscriptions(): Promise<ApiResponse<Subscription>> {
    const response = await this.get<any>(ENDPOINTS.SUBSCRIPTIONS.EXPIRED + "/");

    // Transform response to match expected format
    if (Array.isArray(response)) {
      return {
        count: response.length,
        results: response,
        next: null,
        previous: null,
      };
    }

    return response;
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats(): Promise<any> {
    const response = await this.get<any>(ENDPOINTS.SUBSCRIPTIONS.STATS + "/");

    // Handle both success wrapper and direct response
    if (response.success) {
      return response.data;
    }

    return response;
  }

  /**
   * Update data usage for a subscription
   */
  async updateDataUsage(id: number, bytesUsed: number): Promise<Subscription> {
    this.validateId(id, "subscription");

    if (typeof bytesUsed !== "number" || bytesUsed < 0) {
      throw new Error("Invalid data usage value");
    }

    return this.post<Subscription>(
      `${ENDPOINTS.SUBSCRIPTIONS.BASE}/${id}/data-usage/`,
      {
        bytes_used: bytesUsed,
      },
    );
  }

  /**
   * Reset data usage for a subscription
   */
  async resetDataUsage(id: number): Promise<Subscription> {
    this.validateId(id, "subscription");
    return this.post<Subscription>(
      `${ENDPOINTS.SUBSCRIPTIONS.BASE}/${id}/reset-data-usage/`,
    );
  }

  /**
   * Bulk update subscription status
   */
  async bulkUpdateSubscriptionStatus(
    subscriptionIds: number[],
    status: string,
  ): Promise<any> {
    this.validateStatus(status, VALID_SUBSCRIPTION_STATUSES, "subscription");
    const validIds = this.validateIds(subscriptionIds, "subscription");

    return this.post<any>(ENDPOINTS.SUBSCRIPTIONS.BULK_UPDATE_STATUS + "/", {
      subscription_ids: validIds,
      status,
    });
  }

  /**
   * Export subscriptions data
   */
  async exportSubscriptions(params?: Record<string, any>): Promise<Blob> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          queryParams.append(key, String(value));
        }
      });
    }

    // Use direct fetch since we need blob response
    const token = localStorage.getItem("token");
    const response = await fetch(
      `/api${ENDPOINTS.SUBSCRIPTIONS.BASE}/export/?${queryParams}`,
      {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Get subscription data usage statistics
   */
  async getSubscriptionDataUsage(id: number): Promise<any> {
    this.validateId(id, "subscription");
    return this.get<any>(`${ENDPOINTS.SUBSCRIPTIONS.BASE}/${id}/data-usage/`);
  }

  /**
   * Get subscription billing history
   */
  async getSubscriptionBillingHistory(id: number): Promise<any> {
    this.validateId(id, "subscription");
    return this.get<any>(
      `${ENDPOINTS.SUBSCRIPTIONS.BASE}/${id}/billing-history/`,
    );
  }

  /**
   * Activate a subscription
   */
  async activateSubscription(id: number): Promise<Subscription> {
    return this.updateSubscriptionStatus(id, "active");
  }

  /**
   * Suspend a subscription
   */
  async suspendSubscription(id: number): Promise<Subscription> {
    return this.updateSubscriptionStatus(id, "suspended");
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(id: number): Promise<Subscription> {
    return this.updateSubscriptionStatus(id, "cancelled");
  }

  /**
   * Reactivate a suspended subscription
   */
  async reactivateSubscription(id: number): Promise<Subscription> {
    return this.updateSubscriptionStatus(id, "active");
  }

  /**
   * Get subscription revenue analytics
   */
  async getSubscriptionRevenue(params?: Record<string, any>): Promise<any> {
    return this.get<any>(`${ENDPOINTS.SUBSCRIPTIONS.BASE}/revenue/`, params);
  }

  /**
   * Get subscription usage analytics
   */
  async getSubscriptionUsageAnalytics(
    params?: Record<string, any>,
  ): Promise<any> {
    return this.get<any>(
      `${ENDPOINTS.SUBSCRIPTIONS.BASE}/usage-analytics/`,
      params,
    );
  }

  /**
   * Validate subscription data before submission
   */
  validateSubscriptionData(data: Partial<Subscription>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Required fields validation
    if (!data.customer_id && !data.customer?.id) {
      errors.push("Customer is required");
    }

    if (!data.plan_id && !data.plan?.id) {
      errors.push("Plan is required");
    }

    if (!data.router_id && !data.router?.id) {
      errors.push("Router is required");
    }

    if (!data.username || data.username.trim().length === 0) {
      errors.push("Username is required");
    }

    if (!data.start_date) {
      errors.push("Start date is required");
    }

    // Validate access method
    if (
      data.access_method &&
      !["pppoe", "static_ip", "dhcp"].includes(data.access_method)
    ) {
      errors.push("Invalid access method");
    }

    // Validate status
    if (
      data.status &&
      !["active", "inactive", "suspended", "cancelled", "pending"].includes(
        data.status,
      )
    ) {
      errors.push("Invalid status");
    }

    // Validate fees
    if (data.monthly_fee !== undefined && data.monthly_fee < 0) {
      errors.push("Monthly fee cannot be negative");
    }

    if (data.setup_fee !== undefined && data.setup_fee < 0) {
      errors.push("Setup fee cannot be negative");
    }

    // Validate dates
    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      if (startDate >= endDate) {
        errors.push("End date must be after start date");
      }
    }

    // Validate static IP format if provided
    if (data.static_ip && data.static_ip.trim()) {
      const ipRegex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(data.static_ip.trim())) {
        errors.push("Invalid static IP address format");
      }
    }

    // Validate MAC address format if provided
    if (data.mac_address && data.mac_address.trim()) {
      const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
      if (!macRegex.test(data.mac_address.trim())) {
        errors.push("Invalid MAC address format");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
