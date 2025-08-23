import axios from 'axios';
import { ApiResponse, Customer, Plan, Subscription, Router, Invoice, Payment, User, Stats } from '@/types';

const API_BASE_URL = '/api';

// Generic API service
class ApiService {
  // Customers
  async getCustomers(params?: Record<string, any>): Promise<ApiResponse<Customer>> {
    const response = await axios.get(`${API_BASE_URL}/customers/`, { params });
    return response.data;
  }

  async getCustomer(id: number): Promise<Customer> {
    const response = await axios.get(`${API_BASE_URL}/customers/${id}/`);
    return response.data;
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const response = await axios.post(`${API_BASE_URL}/customers/`, data);
    return response.data;
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    const response = await axios.put(`${API_BASE_URL}/customers/${id}/`, data);
    return response.data;
  }

  async deleteCustomer(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/customers/${id}/`);
  }

  async getCustomerStats(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/customers/stats/`);
    return response.data;
  }

  // Plans
  async getPlans(params?: Record<string, any>): Promise<ApiResponse<Plan>> {
    const response = await axios.get(`${API_BASE_URL}/plans/`, { params });
    return response.data;
  }

  async getPlan(id: number): Promise<Plan> {
    const response = await axios.get(`${API_BASE_URL}/plans/${id}/`);
    return response.data;
  }

  async createPlan(data: Partial<Plan>): Promise<Plan> {
    const response = await axios.post(`${API_BASE_URL}/plans/`, data);
    return response.data;
  }

  async updatePlan(id: number, data: Partial<Plan>): Promise<Plan> {
    const response = await axios.put(`${API_BASE_URL}/plans/${id}/`, data);
    return response.data;
  }

  async deletePlan(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/plans/${id}/`);
  }

  async getActivePlans(): Promise<Plan[]> {
    const response = await axios.get(`${API_BASE_URL}/plans/active/`);
    return response.data;
  }

  async getFeaturedPlans(): Promise<Plan[]> {
    const response = await axios.get(`${API_BASE_URL}/plans/featured/`);
    return response.data;
  }

  // Subscriptions
  async getSubscriptions(params?: Record<string, any>): Promise<ApiResponse<Subscription>> {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/`, { params });
    return response.data;
  }

  async getSubscription(id: number): Promise<Subscription> {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/${id}/`);
    return response.data;
  }

  async createSubscription(data: Partial<Subscription>): Promise<Subscription> {
    const response = await axios.post(`${API_BASE_URL}/subscriptions/`, data);
    return response.data;
  }

  async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription> {
    const response = await axios.put(`${API_BASE_URL}/subscriptions/${id}/`, data);
    return response.data;
  }

  async deleteSubscription(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/subscriptions/${id}/`);
  }

  async updateSubscriptionStatus(id: number, status: string): Promise<Subscription> {
    const response = await axios.patch(`${API_BASE_URL}/subscriptions/${id}/status/`, { status });
    return response.data;
  }

  async getActiveSubscriptions(): Promise<Subscription[]> {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/active/`);
    return response.data;
  }

  async getSuspendedSubscriptions(): Promise<Subscription[]> {
    const response = await axios.get(`${API_BASE_URL}/subscriptions/suspended/`);
    return response.data;
  }

  // Routers
  async getRouters(params?: Record<string, any>): Promise<ApiResponse<Router>> {
    const response = await axios.get(`${API_BASE_URL}/network/routers/`, { params });
    return response.data;
  }

  async getRouter(id: number): Promise<Router> {
    const response = await axios.get(`${API_BASE_URL}/network/routers/${id}/`);
    return response.data;
  }

  async createRouter(data: Partial<Router>): Promise<Router> {
    const response = await axios.post(`${API_BASE_URL}/network/routers/`, data);
    return response.data;
  }

  async updateRouter(id: number, data: Partial<Router>): Promise<Router> {
    const response = await axios.put(`${API_BASE_URL}/network/routers/${id}/`, data);
    return response.data;
  }

  async deleteRouter(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/network/routers/${id}/`);
  }

  async testRouterConnection(id: number): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/network/routers/${id}/test-connection/`);
    return response.data;
  }

  async getRouterStats(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/network/routers/stats/`);
    return response.data;
  }

  // Billing
  async getInvoices(params?: Record<string, any>): Promise<ApiResponse<Invoice>> {
    const response = await axios.get(`${API_BASE_URL}/billing/invoices/`, { params });
    return response.data;
  }

  async getInvoice(id: number): Promise<Invoice> {
    const response = await axios.get(`${API_BASE_URL}/billing/invoices/${id}/`);
    return response.data;
  }

  async getPayments(params?: Record<string, any>): Promise<ApiResponse<Payment>> {
    const response = await axios.get(`${API_BASE_URL}/billing/payments/`, { params });
    return response.data;
  }

  async getPayment(id: number): Promise<Payment> {
    const response = await axios.get(`${API_BASE_URL}/billing/payments/${id}/`);
    return response.data;
  }

  async getInvoiceStats(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/billing/invoices/stats/`);
    return response.data;
  }

  async getPaymentStats(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/billing/payments/stats/`);
    return response.data;
  }

  // Monitoring
  async getMonitoringStats(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/monitoring/stats/`);
    return response.data;
  }

  async getRouterMonitoring(routerId: number): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/monitoring/routers/${routerId}/`);
    return response.data;
  }

  // Users (Admin only)
  async getUsers(params?: Record<string, any>): Promise<ApiResponse<User>> {
    const response = await axios.get(`${API_BASE_URL}/auth/users/`, { params });
    return response.data;
  }

  async getUser(id: number): Promise<User> {
    const response = await axios.get(`${API_BASE_URL}/auth/users/${id}/`);
    return response.data;
  }

  async createUser(data: Partial<User>): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/auth/users/create/`, data);
    return response.data;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await axios.put(`${API_BASE_URL}/auth/users/${id}/`, data);
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/auth/users/${id}/`);
  }

  // Dashboard stats
  async getDashboardStats(): Promise<Stats> {
    const [customerStats, subscriptionStats, routerStats, invoiceStats] = await Promise.all([
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
}

export const apiService = new ApiService();
