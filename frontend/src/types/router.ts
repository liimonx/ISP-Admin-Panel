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

export interface RouterInterface {
  name: string;
  type: string;
  status: 'up' | 'down';
  ip_address: string;
  mac_address: string;
  speed: string;
}

export interface RouterBandwidth {
  total_download: number;
  total_upload: number;
  download_speed: number;
  upload_speed: number;
  interfaces: Record<string, {
    download: number;
    upload: number;
  }>;
}

export interface RouterResources {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  temperature?: number;
  uptime: string;
  load_average: number[];
}

export interface PPPoEUser {
  username: string;
  service: string;
  caller_id: string;
  uptime: string;
  limit_bytes_in: string;
  limit_bytes_out: string;
  disabled: boolean;
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

export interface RouterLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

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

export interface RouterStats {
  total_routers: number;
  online_routers: number;
  offline_routers: number;
  maintenance_routers: number;
  average_response_time: number;
  total_interfaces: number;
  active_interfaces: number;
  dhcp_leases: number;
  active_connections: number;
}