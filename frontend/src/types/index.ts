export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'support' | 'accountant';
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
  status: 'active' | 'inactive' | 'suspended' | 'cancelled';
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
  speed_unit: 'mbps' | 'gbps';
  data_quota?: number;
  quota_unit: 'gb' | 'tb' | 'unlimited';
  price: number;
  setup_fee: number;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
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
  access_method: 'pppoe' | 'static_ip' | 'dhcp';
  static_ip?: string;
  mac_address?: string;
  status: 'active' | 'inactive' | 'suspended' | 'cancelled' | 'pending';
  start_date: string;
  end_date?: string;
  monthly_fee: number;
  setup_fee: number;
  data_used: number;
  data_reset_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Router {
  id: number;
  name: string;
  description?: string;
  router_type: 'mikrotik' | 'cisco' | 'other';
  host: string;
  api_port: number;
  ssh_port: number;
  username: string;
  use_tls: boolean;
  status: 'online' | 'offline' | 'maintenance';
  last_seen?: string;
  location?: string;
  coordinates?: string;
  snmp_community: string;
  snmp_port: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  customer: Customer;
  subscription?: Subscription;
  invoice_number: string;
  invoice_type: 'monthly' | 'setup' | 'adjustment' | 'other';
  billing_period_start: string;
  billing_period_end: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
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
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'bkash' | 'nagad' | 'rocket' | 'sslcommerz' | 'stripe' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
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

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface Stats {
  total_customers: number;
  active_customers: number;
  total_subscriptions: number;
  total_monthly_revenue: number;
  total_routers: number;
  online_routers: number;
}
