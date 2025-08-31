import axios, { AxiosResponse } from "axios";
import {
  ApiResponse,
  Customer,
  Plan,
  Subscription,
  Router,
  Invoice,
  Payment,
  User,
  Stats,
} from "@/types";


const API_BASE_URL = "/api";

// Standardized API response format from backend improvements
interface StandardApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    count?: number;
    total_items?: number;
    next?: string;
    previous?: string;
    next_page?: number;
    previous_page?: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  timestamp: string;
}

// Generic API service with enhanced error handling and standardized responses
class ApiService {
  private handleResponse<T>(response: AxiosResponse): T {
    const data: StandardApiResponse<T> = response.data;

    if (!data.success) {
      throw new Error(data.message || "API request failed");
    }

    return data.data;
  }

  private handlePaginatedResponse<T>(response: AxiosResponse): ApiResponse<T> {
    const data = response.data;

    // Handle new standardized format
    if (data.success !== undefined) {
      if (!data.success) {
        throw new Error(data.message || "API request failed");
      }

      // Handle both old and new pagination formats
      const pagination = data.pagination;
      if (pagination) {
        return {
          count: pagination.total_items || pagination.count || 0,
          next: pagination.next_page ? `?page=${pagination.next_page}` : undefined,
          previous: pagination.previous_page ? `?page=${pagination.previous_page}` : undefined,
          results: data.data,
        };
      }

      // Fallback for non-paginated responses
      return {
        count: Array.isArray(data.data) ? data.data.length : 0,
        next: undefined,
        previous: undefined,
        results: Array.isArray(data.data) ? data.data : [],
      };
    }

    // Handle legacy DRF pagination format
    if (data.count !== undefined && data.results !== undefined) {
      return {
        count: data.count,
        next: data.next,
        previous: data.previous,
        results: data.results,
      };
    }

    // Fallback for any other format
    return {
      count: Array.isArray(data) ? data.length : 0,
      next: undefined,
      previous: undefined,
      results: Array.isArray(data) ? data : [],
    };
  }

  // Health Check Endpoints
  async healthCheck(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/health/`);
    return this.handleResponse(response);
  }

  async detailedHealthCheck(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/health/detailed/`);
    return this.handleResponse(response);
  }

  // Customers
  async getCustomers(
    params?: Record<string, any>,
  ): Promise<ApiResponse<Customer>> {
    const response = await axios.get(`${API_BASE_URL}/customers/`, { params });
    return this.handlePaginatedResponse(response);
  }

  async getCustomer(id: number): Promise<Customer> {
    const response = await axios.get(`${API_BASE_URL}/customers/${id}/`);
    return this.handleResponse(response);
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const response = await axios.post(`${API_BASE_URL}/customers/`, data);
    return this.handleResponse(response);
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    const response = await axios.put(`${API_BASE_URL}/customers/${id}/`, data);
    return this.handleResponse(response);
  }

  async deleteCustomer(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/customers/${id}/`);
  }

  async getCustomerStats(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/customers/stats/`);
    return this.handleResponse(response);
  }

  async searchCustomers(
    query: string,
    params?: Record<string, any>,
  ): Promise<ApiResponse<Customer>> {
    const response = await axios.get(`${API_BASE_URL}/customers/search/`, {
      params: { q: query, ...params },
    });
    return this.handlePaginatedResponse(response);
  }

  async bulkUpdateCustomerStatus(
    customerIds: number[],
    status: string,
  ): Promise<any> {
    const response = await axios.post(
      `${API_BASE_URL}/customers/bulk-update-status/`,
      {
        customer_ids: customerIds,
        status,
      },
    );
    return this.handleResponse(response);
  }

  // Plans
  async getPlans(params?: Record<string, any>): Promise<ApiResponse<Plan>> {
    const response = await axios.get(`${API_BASE_URL}/plans/`, { params });
    return this.handlePaginatedResponse(response);
  }

  async getPlan(id: number): Promise<Plan> {
    const response = await axios.get(`${API_BASE_URL}/plans/${id}/`);
    return this.handleResponse(response);
  }

  async createPlan(data: Partial<Plan>): Promise<Plan> {
    const response = await axios.post(`${API_BASE_URL}/plans/`, data);
    return this.handleResponse(response);
  }

  async updatePlan(id: number, data: Partial<Plan>): Promise<Plan> {
    const response = await axios.put(`${API_BASE_URL}/plans/${id}/`, data);
    return this.handleResponse(response);
  }

  async deletePlan(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/plans/${id}/`);
  }

  async getActivePlans(): Promise<Plan[]> {
    const response = await axios.get(`${API_BASE_URL}/plans/active/`);
    return this.handleResponse(response);
  }

  async getFeaturedPlans(): Promise<Plan[]> {
    const response = await axios.get(`${API_BASE_URL}/plans/featured/`);
    return this.handleResponse(response);
  }

  // Subscriptions
  async getSubscriptions(
    params?: Record<string, any>,
  ): Promise<ApiResponse<Subscription>> {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/`, {
      params,
    });
    return this.handlePaginatedResponse(response);
  }

  async getSubscription(id: number): Promise<Subscription> {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/${id}/`);
    return this.handleResponse(response);
  }

  async createSubscription(data: Partial<Subscription>): Promise<Subscription> {
    const response = await axios.post(`${API_BASE_URL}/subscriptions/`, data);
    return this.handleResponse(response);
  }

  async updateSubscription(
    id: number,
    data: Partial<Subscription>,
  ): Promise<Subscription> {
    const response = await axios.put(
      `${API_BASE_URL}/subscriptions/${id}/`,
      data,
    );
    return this.handleResponse(response);
  }

  async deleteSubscription(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/subscriptions/${id}/`);
  }

  async updateSubscriptionStatus(
    id: number,
    status: string,
  ): Promise<Subscription> {
    const response = await axios.patch(
      `${API_BASE_URL}/subscriptions/${id}/status/`,
      { status },
    );
    return this.handleResponse(response);
  }

  async getActiveSubscriptions(): Promise<Subscription[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/subscriptions/active/`);
      return this.handleResponse(response);
    } catch (error) {
      console.warn("Active subscriptions endpoint not available, using mock data");
      return [];
    }
  }

  async getSuspendedSubscriptions(): Promise<Subscription[]> {
    const response = await axios.get(
      `${API_BASE_URL}/subscriptions/suspended/`,
    );
    return this.handleResponse(response);
  }

  // Routers
  async getRouters(params?: Record<string, any>): Promise<ApiResponse<Router>> {
    const response = await axios.get(`${API_BASE_URL}/network/routers/`, {
      params,
    });
    return this.handlePaginatedResponse(response);
  }

  async getRouter(id: number): Promise<Router> {
    const response = await axios.get(`${API_BASE_URL}/network/routers/${id}/`);
    return this.handleResponse(response);
  }

  async createRouter(data: Partial<Router>): Promise<Router> {
    const response = await axios.post(`${API_BASE_URL}/network/routers/`, data);
    return this.handleResponse(response);
  }

  async updateRouter(id: number, data: Partial<Router>): Promise<Router> {
    const response = await axios.put(
      `${API_BASE_URL}/network/routers/${id}/`,
      data,
    );
    return this.handleResponse(response);
  }

  async deleteRouter(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/network/routers/${id}/`);
  }

  async testRouterConnection(id: number): Promise<any> {
    const response = await axios.post(
      `${API_BASE_URL}/network/routers/${id}/test-connection/`,
    );
    return this.handleResponse(response);
  }

  async getRouterStats(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/network/routers/stats/`);
    return this.handleResponse(response);
  }

  // Enhanced Billing Endpoints
  async getInvoices(
    params?: Record<string, any>,
  ): Promise<ApiResponse<Invoice>> {
    const response = await axios.get(`${API_BASE_URL}/billing/invoices/`, {
      params,
    });
    return this.handlePaginatedResponse(response);
  }

  async getInvoice(id: number): Promise<Invoice> {
    const response = await axios.get(`${API_BASE_URL}/billing/invoices/${id}/`);
    return this.handleResponse(response);
  }

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    const response = await axios.post(
      `${API_BASE_URL}/billing/invoices/`,
      data,
    );
    return this.handleResponse(response);
  }

  async updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice> {
    const response = await axios.put(
      `${API_BASE_URL}/billing/invoices/${id}/`,
      data,
    );
    return this.handleResponse(response);
  }

  async deleteInvoice(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/billing/invoices/${id}/`);
  }

  async sendInvoice(id: number): Promise<any> {
    const response = await axios.post(
      `${API_BASE_URL}/billing/invoices/${id}/send/`,
    );
    return this.handleResponse(response);
  }

  async markInvoiceAsPaid(id: number): Promise<Invoice> {
    const response = await axios.post(
      `${API_BASE_URL}/billing/invoices/${id}/pay/`,
    );
    return this.handleResponse(response);
  }

  async generateInvoice(data: any): Promise<Invoice> {
    const response = await axios.post(
      `${API_BASE_URL}/billing/generate-invoice/`,
      data,
    );
    return this.handleResponse(response);
  }

  async bulkGenerateInvoices(data: any): Promise<any> {
    const response = await axios.post(
      `${API_BASE_URL}/billing/bulk-generate/`,
      data,
    );
    return this.handleResponse(response);
  }

  // Payments
  async getPayments(
    params?: Record<string, any>,
  ): Promise<ApiResponse<Payment>> {
    const response = await axios.get(`${API_BASE_URL}/billing/payments/`, {
      params,
    });
    return this.handlePaginatedResponse(response);
  }

  async getPayment(id: number): Promise<Payment> {
    const response = await axios.get(`${API_BASE_URL}/billing/payments/${id}/`);
    return this.handleResponse(response);
  }

  async recordPayment(data: any): Promise<Payment> {
    const response = await axios.post(
      `${API_BASE_URL}/billing/payments/`,
      data,
    );
    return this.handleResponse(response);
  }

  // Statistics Endpoints
  async getInvoiceStats(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/billing/invoices/stats/`);
    return this.handleResponse(response);
  }

  async getPaymentStats(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/billing/payments/stats/`);
    return this.handleResponse(response);
  }

  // Monitoring
  async getMonitoringStats(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/monitoring/stats/`);
    return this.handleResponse(response);
  }

  async getRouterMonitoring(routerId: number): Promise<any> {
    const response = await axios.get(
      `${API_BASE_URL}/monitoring/routers/${routerId}/`,
    );
    return this.handleResponse(response);
  }

  // Users (Admin only)
  async getUsers(params?: Record<string, any>): Promise<ApiResponse<User>> {
    const response = await axios.get(`${API_BASE_URL}/auth/users/`, { params });
    return this.handlePaginatedResponse(response);
  }

  async getUser(id: number): Promise<User> {
    const response = await axios.get(`${API_BASE_URL}/auth/users/${id}/`);
    return this.handleResponse(response);
  }

  async createUser(data: Partial<User>): Promise<User> {
    const response = await axios.post(
      `${API_BASE_URL}/auth/users/create/`,
      data,
    );
    return this.handleResponse(response);
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await axios.put(`${API_BASE_URL}/auth/users/${id}/`, data);
    return this.handleResponse(response);
  }

  async deleteUser(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/auth/users/${id}/`);
  }

  // Enhanced Dashboard Stats
  async getDashboardStats(): Promise<Stats> {
    const [customerStats, subscriptionStats, routerStats, invoiceStats] =
      await Promise.all([
        this.getCustomerStats(),
        this.getSubscriptions({ limit: 1 }),
        this.getRouterStats(),
        this.getInvoiceStats(),
      ]);

    return {
      total_customers: customerStats.total_customers || 0,
      active_customers: customerStats.active_customers || 0,
      total_subscriptions: subscriptionStats.count || 0,
      total_monthly_revenue: invoiceStats.total_monthly_revenue || 0,
      total_routers: routerStats.total_routers || 0,
      online_routers: routerStats.online_routers || 0,
    };
  }

  // Utility methods for error handling
  private handleApiError(error: any): never {
    if (error.response) {
      const data = error.response.data;
      if (data.message) {
        throw new Error(data.message);
      }
      throw new Error(`API Error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error("Network error - please check your connection");
    } else {
      throw new Error("Request failed - please try again");
    }
  }

  // Rate limit handling
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = 3,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (error.response?.status === 429 && retries > 0) {
        const delay = Math.pow(2, 3 - retries) * 1000; // exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retryWithBackoff(fn, retries - 1);
      }
      throw error;
    }
  }
}

export const apiService = new ApiService();
