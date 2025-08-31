import axios, { AxiosResponse } from "axios";
import { Router } from "@/types";

// Main router configuration
const MAIN_ROUTER_IP = "103.115.252.60";
const MAIN_ROUTER_CONFIG = {
  host: MAIN_ROUTER_IP,
  api_port: 8728,
  ssh_port: 22,
  router_type: "mikrotik" as const,
};

// MikroTik API integration service
class RouterService {
  private baseUrl = "/api/network";

  // Test connection to a specific router
  async testRouterConnection(routerId: number): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/routers/${routerId}/test-connection/`);
      return response.data;
    } catch (error) {
      console.error("Router connection test failed:", error);
      throw error;
    }
  }

  // Test connection to main router specifically
  async testMainRouterConnection(): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/routers/main/test-connection/`, {
        host: MAIN_ROUTER_IP,
        api_port: MAIN_ROUTER_CONFIG.api_port,
        router_type: MAIN_ROUTER_CONFIG.router_type,
      });
      return response.data;
    } catch (error) {
      console.error("Main router connection test failed:", error);
      throw error;
    }
  }

  // Get main router status and statistics
  async getMainRouterStatus(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/status/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router status:", error);
      throw error;
    }
  }

  // Get main router interface statistics
  async getMainRouterInterfaces(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/interfaces/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router interfaces:", error);
      throw error;
    }
  }

  // Get main router bandwidth usage
  async getMainRouterBandwidth(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/bandwidth/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router bandwidth:", error);
      throw error;
    }
  }

  // Get main router active connections
  async getMainRouterConnections(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/connections/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router connections:", error);
      throw error;
    }
  }

  // Get main router DHCP leases
  async getMainRouterDHCPLeases(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/dhcp-leases/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router DHCP leases:", error);
      throw error;
    }
  }

  // Get main router firewall rules
  async getMainRouterFirewallRules(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/firewall-rules/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router firewall rules:", error);
      throw error;
    }
  }

  // Get main router system resources
  async getMainRouterResources(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/resources/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router resources:", error);
      throw error;
    }
  }

  // Execute command on main router
  async executeMainRouterCommand(command: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/routers/main/execute/`, {
        command,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to execute command on main router:", error);
      throw error;
    }
  }

  // Get main router logs
  async getMainRouterLogs(limit: number = 100): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/logs/`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to get main router logs:", error);
      throw error;
    }
  }

  // Get main router configuration backup
  async getMainRouterBackup(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/backup/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router backup:", error);
      throw error;
    }
  }

  // Restore main router configuration
  async restoreMainRouterBackup(backupData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/routers/main/restore/`, backupData);
      return response.data;
    } catch (error) {
      console.error("Failed to restore main router backup:", error);
      throw error;
    }
  }

  // Get main router wireless clients
  async getMainRouterWirelessClients(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/wireless-clients/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router wireless clients:", error);
      throw error;
    }
  }

  // Get main router queue tree
  async getMainRouterQueueTree(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/queue-tree/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router queue tree:", error);
      throw error;
    }
  }

  // Add bandwidth limit to a client
  async addBandwidthLimit(clientIP: string, downloadLimit: string, uploadLimit: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/routers/main/bandwidth-limit/`, {
        client_ip: clientIP,
        download_limit: downloadLimit,
        upload_limit: uploadLimit,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to add bandwidth limit:", error);
      throw error;
    }
  }

  // Remove bandwidth limit from a client
  async removeBandwidthLimit(clientIP: string): Promise<any> {
    try {
      const response = await axios.delete(`${this.baseUrl}/routers/main/bandwidth-limit/`, {
        data: { client_ip: clientIP },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to remove bandwidth limit:", error);
      throw error;
    }
  }

  // Get main router real-time monitoring data
  async getMainRouterRealTimeData(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/realtime/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router real-time data:", error);
      throw error;
    }
  }

  // Get main router alerts and notifications
  async getMainRouterAlerts(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/alerts/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router alerts:", error);
      throw error;
    }
  }

  // Acknowledge main router alert
  async acknowledgeMainRouterAlert(alertId: string): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/routers/main/alerts/${alertId}/acknowledge/`);
      return response.data;
    } catch (error) {
      console.error("Failed to acknowledge main router alert:", error);
      throw error;
    }
  }

  // Get main router performance metrics
  async getMainRouterPerformanceMetrics(timeRange: string = "24h"): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/performance/`, {
        params: { time_range: timeRange },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to get main router performance metrics:", error);
      throw error;
    }
  }

  // Get main router security status
  async getMainRouterSecurityStatus(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/security/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router security status:", error);
      throw error;
    }
  }

  // Update main router security settings
  async updateMainRouterSecuritySettings(settings: any): Promise<any> {
    try {
      const response = await axios.put(`${this.baseUrl}/routers/main/security/`, settings);
      return response.data;
    } catch (error) {
      console.error("Failed to update main router security settings:", error);
      throw error;
    }
  }

  // Get main router firmware information
  async getMainRouterFirmwareInfo(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/firmware/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router firmware info:", error);
      throw error;
    }
  }

  // Check for main router firmware updates
  async checkMainRouterFirmwareUpdates(): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/routers/main/firmware/check-updates/`);
      return response.data;
    } catch (error) {
      console.error("Failed to check main router firmware updates:", error);
      throw error;
    }
  }

  // Update main router firmware
  async updateMainRouterFirmware(): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/routers/main/firmware/update/`);
      return response.data;
    } catch (error) {
      console.error("Failed to update main router firmware:", error);
      throw error;
    }
  }

  // Get main router configuration summary
  async getMainRouterConfigSummary(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/config-summary/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router config summary:", error);
      throw error;
    }
  }

  // Export main router configuration
  async exportMainRouterConfig(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/export-config/`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error("Failed to export main router config:", error);
      throw error;
    }
  }

  // Import main router configuration
  async importMainRouterConfig(configFile: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('config_file', configFile);
      
      const response = await axios.post(`${this.baseUrl}/routers/main/import-config/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to import main router config:", error);
      throw error;
    }
  }

  // Get main router health check
  async getMainRouterHealthCheck(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/health-check/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router health check:", error);
      throw error;
    }
  }

  // Restart main router
  async restartMainRouter(): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/routers/main/restart/`);
      return response.data;
    } catch (error) {
      console.error("Failed to restart main router:", error);
      throw error;
    }
  }

  // Shutdown main router
  async shutdownMainRouter(): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/routers/main/shutdown/`);
      return response.data;
    } catch (error) {
      console.error("Failed to shutdown main router:", error);
      throw error;
    }
  }

  // Get main router temperature and environmental data
  async getMainRouterEnvironmentalData(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/environmental/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router environmental data:", error);
      throw error;
    }
  }

  // Get main router power consumption
  async getMainRouterPowerConsumption(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/routers/main/power-consumption/`);
      return response.data;
    } catch (error) {
      console.error("Failed to get main router power consumption:", error);
      throw error;
    }
  }

  // Utility method to format bandwidth values
  formatBandwidth(bytes: number): string {
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    let value = bytes;
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    
    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }

  // Utility method to format data usage
  formatDataUsage(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    
    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }

  // Utility method to get connection status color
  getConnectionStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      case 'maintenance':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  // Utility method to get router type icon
  getRouterTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'mikrotik':
        return 'Router';
      case 'cisco':
        return 'Server';
      default:
        return 'Globe';
    }
  }
}

export const routerService = new RouterService();
export { MAIN_ROUTER_IP, MAIN_ROUTER_CONFIG };
