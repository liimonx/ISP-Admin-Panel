export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "support" | "accountant";
  phone?: string;
  is_active: boolean;
  date_joined: string;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  company_name?: string;
  tax_id?: string;
  status: "active" | "inactive" | "suspended" | "cancelled";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: number;
  name: string;
  description?: string;
  download_speed: number;
  upload_speed: number;
  speed_unit: "mbps" | "gbps";
  data_quota?: number;
  quota_unit: "gb" | "tb" | "unlimited";
  price: number;
  setup_fee: number;
  billing_cycle: "monthly" | "quarterly" | "yearly";
  is_active: boolean;
  is_featured: boolean;
  is_popular: boolean;
  features: string[];
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  customer: Customer;
  plan: Plan;
  router: Router;
  username: string;
  password?: string; // write-only field for create/update
  access_method: "pppoe" | "static_ip" | "dhcp";
  static_ip?: string;
  mac_address?: string;
  status: "active" | "inactive" | "suspended" | "cancelled" | "pending";
  start_date: string;
  end_date?: string;
  monthly_fee: number;
  setup_fee: number;
  data_used: number;
  data_reset_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Computed properties from backend
  is_active?: boolean;
  is_suspended?: boolean;
  is_expired?: boolean;
  days_remaining?: number;
  data_remaining?: number;
  data_usage_percentage?: number;

  // Helper properties for forms
  customer_id?: number;
  plan_id?: number;
  router_id?: number;
}

export interface Router {
  id: number;
  name: string;
  description?: string;
  router_type: "mikrotik" | "cisco" | "other";
  host: string;
  api_port: number;
  ssh_port: number;
  username: string;
  use_tls: boolean;
  status: "online" | "offline" | "maintenance";
  last_seen?: string;
  location?: string;
  coordinates?: string;
  snmp_community: string;
  snmp_port: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  get_active_subscriptions_count?: number;
  get_total_bandwidth_usage?: number;
}

export interface Invoice {
  id: number;
  customer: Customer;
  subscription?: Subscription;
  invoice_number: string;
  invoice_type: "monthly" | "setup" | "adjustment" | "other";
  billing_period_start: string;
  billing_period_end: string;
  subtotal: number | string;
  tax_amount: number | string;
  discount_amount: number | string;
  total_amount: number | string;
  paid_amount: number | string;
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
  issue_date: string;
  due_date: string;
  paid_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  invoice: Invoice;
  customer: Customer;
  payment_number: string;
  amount: number | string;
  payment_method:
    | "cash"
    | "bank_transfer"
    | "bkash"
    | "nagad"
    | "rocket"
    | "sslcommerz"
    | "stripe"
    | "other";
  status: "pending" | "completed" | "failed" | "cancelled" | "refunded";
  payment_date?: string;
  external_id?: string;
  transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

export interface ApiResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Legacy API response format (still supported)
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// New standardized API response format
export interface StandardApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    count: number;
    next?: string;
    previous?: string;
    page: number;
    page_size: number;
    total_pages: number;
  };
  timestamp: string;
}

// Enhanced error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface AppError extends Error {
  code: string;
  status: number;
  field?: string;
  timestamp: string;
}

// Subscription-specific types
export interface SubscriptionStats {
  total_subscriptions: number;
  active_subscriptions: number;
  suspended_subscriptions: number;
  pending_subscriptions: number;
  cancelled_subscriptions: number;
  total_monthly_revenue: number;
  total_data_used_gb: number;
  active_percentage: number;
}

export interface SubscriptionFilters {
  status?: string;
  plan?: string;
  router?: string;
  customer?: string;
  access_method?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface SubscriptionFormData {
  customer_id: number;
  plan_id: number;
  router_id: number;
  username: string;
  password: string;
  access_method: "pppoe" | "static_ip" | "dhcp";
  static_ip: string;
  mac_address: string;
  status: "pending" | "active" | "inactive" | "suspended" | "cancelled";
  start_date: string;
  end_date: string;
  monthly_fee: number;
  setup_fee: number;
  data_used: number;
  notes: string;
}

// Request metadata for tracking
export interface RequestMetadata {
  startTime: number;
  endpoint: string;
  retryCount: number;
}

// Rate limit information
export interface RateLimitInfo {
  allowed: boolean;
  retryAfter?: number;
  remaining?: number;
  resetTime?: number;
}

// API configuration types
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  rateLimitEnabled: boolean;
}

// Health check response
export interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  services: {
    database: "up" | "down";
    redis: "up" | "down";
    external_services: "up" | "down" | "partial";
  };
  response_time_ms: number;
}

export interface Stats {
  total_customers: number;
  active_customers: number;
  total_subscriptions: number;
  total_monthly_revenue: number;
  total_routers: number;
  online_routers: number;
}

// Monitoring types
export interface RouterMetric {
  id: number;
  router: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  temperature?: number;
  total_download: number;
  total_upload: number;
  download_speed: number;
  upload_speed: number;
  timestamp: string;
}

export interface MonitoringStats {
  total_routers: number;
  online_routers: number;
  offline_routers: number;
  maintenance_routers: number;
  total_metrics: number;
  latest_metric?: RouterMetric;
}

export interface RouterMonitoringData {
  router: {
    id: number;
    name: string;
    status: string;
    host: string;
  };
  metrics: RouterMetric[];
}

export interface MainRouterStatus {
  status: string;
  uptime: string;
  version: string;
  last_seen: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  temperature: number;
}

export interface BandwidthData {
  total_download: number;
  total_upload: number;
  download_speed: number;
  upload_speed: number;
  interfaces?: Record<
    string,
    {
      download: number;
      upload: number;
    }
  >;
}

export interface NetworkInterface {
  name: string;
  type: string;
  status: string;
  ip_address: string;
  mac_address: string;
  speed: string;
}

export interface RouterConnection {
  protocol: string;
  source: string;
  destination: string;
  state: string;
  duration: string;
}

export interface DHCPLease {
  ip_address: string;
  mac_address: string;
  hostname: string;
  status: string;
  expires: string;
}

export interface SystemResources {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  temperature: number;
  uptime: string;
  load_average: number[];
}

export interface RouterLog {
  timestamp: string;
  level: string;
  message: string;
}

export interface RouterAlert {
  id: string;
  title: string;
  message: string;
  severity: string;
  timestamp: string;
  acknowledged: boolean;
}
