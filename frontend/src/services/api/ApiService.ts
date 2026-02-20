import { Stats } from "@/types";
import { ServiceConfig } from "./base/types";
import { CustomerService } from "./services/CustomerService";
import { PlanService } from "./services/PlanService";
import { SubscriptionService } from "./services/SubscriptionService";
import { RouterService } from "./services/RouterService";
import { BillingService } from "./services/BillingService";
import { MonitoringService } from "./services/MonitoringService";
import { UserService } from "./services/UserService";
import { ReportService } from "./services/ReportService";
import { HealthService } from "./services/HealthService";

/**
 * Main API service that composes all individual services
 * Provides a unified interface while maintaining separation of concerns
 */
export class ApiService {
  // Individual service instances
  public readonly customers: CustomerService;
  public readonly plans: PlanService;
  public readonly subscriptions: SubscriptionService;
  public readonly routers: RouterService;
  public readonly billing: BillingService;
  public readonly monitoring: MonitoringService;
  public readonly users: UserService;
  public readonly reports: ReportService;
  public readonly health: HealthService;

  constructor(config?: Partial<ServiceConfig>) {
    // Initialize all service instances with the same configuration
    this.customers = new CustomerService(config);
    this.plans = new PlanService(config);
    this.subscriptions = new SubscriptionService(config);
    this.routers = new RouterService(config);
    this.billing = new BillingService(config);
    this.monitoring = new MonitoringService(config);
    this.users = new UserService(config);
    this.reports = new ReportService(config);
    this.health = new HealthService(config);
  }

  // Backward compatibility methods - delegate to appropriate services

  // Health Check Endpoints
  async healthCheck(): Promise<any> {
    return this.health.healthCheck();
  }

  async detailedHealthCheck(): Promise<any> {
    return this.health.detailedHealthCheck();
  }

  async readinessCheck(): Promise<any> {
    return this.health.readinessCheck();
  }

  async livenessCheck(): Promise<any> {
    return this.health.livenessCheck();
  }

  // Customer methods
  async getCustomers(params?: Record<string, any>) {
    return this.customers.getCustomers(params);
  }

  async getCustomer(id: number) {
    return this.customers.getCustomer(id);
  }

  async createCustomer(data: any) {
    return this.customers.createCustomer(data);
  }

  async updateCustomer(id: number, data: any) {
    return this.customers.updateCustomer(id, data);
  }

  async deleteCustomer(id: number) {
    return this.customers.deleteCustomer(id);
  }

  async getCustomerStats() {
    return this.customers.getCustomerStats();
  }

  async searchCustomers(query: string, params?: Record<string, any>) {
    return this.customers.searchCustomers(query, params);
  }

  async bulkUpdateCustomerStatus(customerIds: number[], status: string) {
    return this.customers.bulkUpdateCustomerStatus(customerIds, status);
  }

  // Plan methods
  async getPlans(params?: Record<string, any>) {
    return this.plans.getPlans(params);
  }

  async getPlan(id: number) {
    return this.plans.getPlan(id);
  }

  async createPlan(data: any) {
    return this.plans.createPlan(data);
  }

  async updatePlan(id: number, data: any) {
    return this.plans.updatePlan(id, data);
  }

  async deletePlan(id: number) {
    return this.plans.deletePlan(id);
  }

  async getActivePlans() {
    return this.plans.getActivePlans();
  }

  async getFeaturedPlans() {
    return this.plans.getFeaturedPlans();
  }

  // Subscription methods
  async getSubscriptions(params?: Record<string, any>) {
    return this.subscriptions.getSubscriptions(params);
  }

  async getSubscription(id: number) {
    return this.subscriptions.getSubscription(id);
  }

  async createSubscription(data: any) {
    return this.subscriptions.createSubscription(data);
  }

  async updateSubscription(id: number, data: any) {
    return this.subscriptions.updateSubscription(id, data);
  }

  async deleteSubscription(id: number) {
    return this.subscriptions.deleteSubscription(id);
  }

  async updateSubscriptionStatus(id: number, status: string) {
    return this.subscriptions.updateSubscriptionStatus(id, status);
  }

  async getActiveSubscriptions() {
    return this.subscriptions.getActiveSubscriptions();
  }

  async getSuspendedSubscriptions() {
    return this.subscriptions.getSuspendedSubscriptions();
  }

  async getExpiredSubscriptions() {
    return this.subscriptions.getExpiredSubscriptions();
  }

  async getSubscriptionStats() {
    return this.subscriptions.getSubscriptionStats();
  }

  async updateDataUsage(id: number, dataUsage: number) {
    return this.subscriptions.updateDataUsage(id, dataUsage);
  }

  async resetDataUsage(id: number) {
    return this.subscriptions.resetDataUsage(id);
  }

  async bulkUpdateSubscriptionStatus(
    subscriptionIds: number[],
    status: string,
  ) {
    return this.subscriptions.bulkUpdateSubscriptionStatus(
      subscriptionIds,
      status,
    );
  }

  // Router methods
  async getRouters(params?: Record<string, any>) {
    return this.routers.getRouters(params);
  }

  async getRouter(id: number) {
    return this.routers.getRouter(id);
  }

  async createRouter(data: any) {
    return this.routers.createRouter(data);
  }

  async updateRouter(id: number, data: any) {
    return this.routers.updateRouter(id, data);
  }

  async deleteRouter(id: number) {
    return this.routers.deleteRouter(id);
  }

  async testRouterConnection(id: number) {
    return this.routers.testRouterConnection(id);
  }

  async restartRouter(id: number) {
    return this.routers.restartRouter(id);
  }

  async getRouterStats() {
    return this.routers.getRouterStats();
  }

  async getRouterInterfaces(routerId: number) {
    return this.routers.getRouterInterfaces(routerId);
  }

  async getRouterBandwidth(routerId: number) {
    return this.routers.getRouterBandwidth(routerId);
  }

  async getRouterConnections(routerId: number) {
    return this.routers.getRouterConnections(routerId);
  }

  async getRouterResources(routerId: number) {
    return this.routers.getRouterResources(routerId);
  }

  // Main Router methods
  async getMainRouterStatus() {
    return this.routers.getMainRouterStatus();
  }

  async getMainRouterInterfaces() {
    return this.routers.getMainRouterInterfaces();
  }

  async getMainRouterBandwidth() {
    return this.routers.getMainRouterBandwidth();
  }

  async getMainRouterConnections() {
    return this.routers.getMainRouterConnections();
  }

  async getMainRouterDhcpLeases() {
    return this.routers.getMainRouterDhcpLeases();
  }

  async getMainRouterResources() {
    return this.routers.getMainRouterResources();
  }

  async getMainRouterLogs() {
    return this.routers.getMainRouterLogs();
  }

  async getMainRouterAlerts() {
    return this.routers.getMainRouterAlerts();
  }

  async executeMainRouterCommand(command: string) {
    return this.routers.executeMainRouterCommand(command);
  }

  async testMainRouterConnection() {
    return this.routers.testMainRouterConnection();
  }

  async restartMainRouter() {
    return this.routers.restartMainRouter();
  }

  // Billing methods
  async getInvoices(params?: Record<string, any>) {
    return this.billing.getInvoices(params);
  }

  async getInvoice(id: number) {
    return this.billing.getInvoice(id);
  }

  async createInvoice(data: any) {
    return this.billing.createInvoice(data);
  }

  async updateInvoice(id: number, data: any) {
    return this.billing.updateInvoice(id, data);
  }

  async deleteInvoice(id: number) {
    return this.billing.deleteInvoice(id);
  }

  async sendInvoice(id: number) {
    return this.billing.sendInvoice(id);
  }

  async markInvoiceAsPaid(id: number) {
    return this.billing.markInvoiceAsPaid(id);
  }

  async generateInvoice(data: any) {
    return this.billing.generateInvoice(data);
  }

  async bulkGenerateInvoices(data: any) {
    return this.billing.bulkGenerateInvoices(data);
  }

  async getInvoiceStats() {
    return this.billing.getInvoiceStats();
  }

  // Payment methods
  async getPayments(params?: Record<string, any>) {
    return this.billing.getPayments(params);
  }

  async getPayment(id: number) {
    return this.billing.getPayment(id);
  }

  async recordPayment(data: any) {
    return this.billing.recordPayment(data);
  }

  async refundPayment(id: number, data?: any) {
    return this.billing.refundPayment(id, data);
  }

  async getPaymentStats() {
    return this.billing.getPaymentStats();
  }

  // Monitoring methods
  async getMonitoringStats() {
    return this.monitoring.getMonitoringStats();
  }

  async getRouterMonitoring(routerId: number) {
    return this.monitoring.getRouterMonitoring(routerId);
  }

  async getMonitoringHealthCheck() {
    return this.monitoring.getMonitoringHealthCheck();
  }

  async getRouterMetrics(params?: Record<string, any>) {
    return this.monitoring.getRouterMetrics(params);
  }

  async getSnmpSnapshots(params?: Record<string, any>) {
    return this.monitoring.getSnmpSnapshots(params);
  }

  async getUsageSnapshots(params?: Record<string, any>) {
    return this.monitoring.getUsageSnapshots(params);
  }

  // User methods
  async getUsers(params?: Record<string, any>) {
    return this.users.getUsers(params);
  }

  async getUser(id: number) {
    return this.users.getUser(id);
  }

  async createUser(data: any) {
    return this.users.createUser(data);
  }

  async updateUser(id: number, data: any) {
    return this.users.updateUser(id, data);
  }

  async deleteUser(id: number) {
    return this.users.deleteUser(id);
  }

  // Report methods
  async getUsageReports(params?: Record<string, any>) {
    return this.reports.getUsageReports(params);
  }

  async getTopUsers(params?: Record<string, any>) {
    return this.reports.getTopUsers(params);
  }

  async getUsageTrends(params?: Record<string, any>) {
    return this.reports.getUsageTrends(params);
  }

  async getRevenueReports(params?: Record<string, any>) {
    return this.reports.getRevenueReports(params);
  }

  // Enhanced Dashboard Stats
  async getDashboardStats(): Promise<Stats> {
    const [customerStats, subscriptionStats, routerStats, invoiceStats] =
      await Promise.all([
        this.customers.getCustomerStats(),
        this.subscriptions.getSubscriptionStats(),
        this.routers.getRouterStats(),
        this.billing.getInvoiceStats(),
      ]);

    return {
      total_customers: customerStats.total_customers || 0,
      active_customers: customerStats.active_customers || 0,
      total_subscriptions: subscriptionStats.total_subscriptions || 0,
      total_monthly_revenue: invoiceStats.total_monthly_revenue || 0,
      total_routers: routerStats.total_routers || 0,
      online_routers: routerStats.online_routers || 0,
    };
  }
}
