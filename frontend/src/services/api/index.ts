// Export all types
export * from "./base/types";
export * from "./base/constants";

// Export all service classes
export { BaseApiService } from "./base/BaseApiService";
export { CustomerService } from "./services/CustomerService";
export { PlanService } from "./services/PlanService";
export { SubscriptionService } from "./services/SubscriptionService";
export { RouterService } from "./services/RouterService";
export { BillingService } from "./services/BillingService";
export { MonitoringService } from "./services/MonitoringService";
export { UserService } from "./services/UserService";
export { ReportService } from "./services/ReportService";
export { HealthService } from "./services/HealthService";
export { ApiService } from "./ApiService";

// Import the ApiService class to create an instance
import { ApiService } from "./ApiService";

// Create and export the singleton instance
export const apiService = new ApiService();

// Export individual service instances for direct access if needed
export const customerService = apiService.customers;
export const planService = apiService.plans;
export const subscriptionService = apiService.subscriptions;
export const routerService = apiService.routers;
export const billingService = apiService.billing;
export const monitoringService = apiService.monitoring;
export const userService = apiService.users;
export const reportService = apiService.reports;
export const healthService = apiService.health;