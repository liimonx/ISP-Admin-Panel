// API Configuration
export const API_BASE_URL = "/api";

// Default configuration values
export const DEFAULT_CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second base delay
};

// Valid status values for validation
export const VALID_CUSTOMER_STATUSES = [
  "active",
  "inactive",
  "suspended",
] as const;
export const VALID_SUBSCRIPTION_STATUSES = [
  "active",
  "inactive",
  "suspended",
  "cancelled",
  "pending",
] as const;

// API endpoints grouped by domain
export const ENDPOINTS = {
  HEALTH: {
    BASE: "/health",
    DETAILED: "/health/detailed",
    READY: "/health/ready",
    LIVE: "/health/live",
  },
  CUSTOMERS: {
    BASE: "/customers",
    STATS: "/customers/stats",
    SEARCH: "/customers/search",
    BULK_UPDATE_STATUS: "/customers/bulk-update-status",
  },
  PLANS: {
    BASE: "/plans",
    ACTIVE: "/plans/active",
    FEATURED: "/plans/featured",
    STATS: "/plans/stats",
  },
  SUBSCRIPTIONS: {
    BASE: "/subscriptions",
    ACTIVE: "/subscriptions/active",
    SUSPENDED: "/subscriptions/suspended",
    EXPIRED: "/subscriptions/expired",
    STATS: "/subscriptions/stats",
    BULK_UPDATE_STATUS: "/subscriptions/bulk-update-status",
    EXPORT: "/subscriptions/export",
    REVENUE: "/subscriptions/revenue",
    USAGE_ANALYTICS: "/subscriptions/usage-analytics",
  },
  ROUTERS: {
    BASE: "/network/routers",
    STATS: "/network/routers/stats",
    MAIN_ROUTER: "/network/main-router",
  },
  BILLING: {
    INVOICES: "/billing/invoices",
    PAYMENTS: "/billing/payments",
    GENERATE: "/billing/generate-invoice",
    BULK_GENERATE: "/billing/bulk-generate",
    INVOICE_STATS: "/billing/invoices/stats",
    PAYMENT_STATS: "/billing/payments/stats",
    STATS: "/billing/stats",
  },
  PAYMENTS: {
    BASE: "/payments/payments",
    STATS: "/billing/payments/stats",
  },
  MONITORING: {
    BASE: "/monitoring",
    STATS: "/monitoring/stats",
    HEALTH: "/monitoring/health",
    METRICS: "/monitoring/metrics",
    SNMP_SNAPSHOTS: "/monitoring/snmp-snapshots",
    USAGE_SNAPSHOTS: "/monitoring/usage-snapshots",
  },
  USERS: {
    BASE: "/auth/users",
    CREATE: "/auth/users/create",
    STATS: "/auth/users/stats",
  },
  REPORTS: {
    USAGE: "/reports/usage",
    TOP_USERS: "/reports/top-users",
    USAGE_TRENDS: "/reports/usage-trends",
    REVENUE: "/reports/revenue",
  },
  CORE: {
    DASHBOARD_STATS: "/core/dashboard/stats",
    STATS_ALL: "/core/stats/all",
    STATS_CUSTOMERS: "/core/stats/customers",
    STATS_INVOICES: "/core/stats/invoices",
    STATS_PAYMENTS: "/core/stats/payments",
    STATS_PLANS: "/core/stats/plans",
    STATS_ROUTERS: "/core/stats/routers",
    STATS_SUBSCRIPTIONS: "/core/stats/subscriptions",
    ANALYTICS_PAYMENT_METHODS: "/core/analytics/payment-methods",
    ANALYTICS_TOP_CUSTOMERS: "/core/analytics/top-customers",
    TRENDS_DAILY: "/core/trends/daily",
    TRENDS_MONTHLY: "/core/trends/monthly",
  },
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Refresh intervals based on data frequency (in milliseconds)
export const REFRESH_INTERVALS = {
  HIGH_FREQUENCY: 5000, // 5 seconds for bandwidth data
  MEDIUM_FREQUENCY: 15000, // 15 seconds for connections/status
  LOW_FREQUENCY: 30000, // 30 seconds for resources/interfaces
  BACKGROUND: 60000, // 1 minute for less critical data
} as const;

// Rate limiting configuration based on backend limits
export const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 200,
  REQUEST_BUFFER: 20, // Buffer to prevent hitting the limit
  RETRY_AFTER_DEFAULT: 60, // Default retry after time in seconds
} as const;
