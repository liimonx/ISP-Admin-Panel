import { Router, ApiResponse } from "@/types";
import { BaseApiService } from "../base/BaseApiService";
import { ENDPOINTS } from "../base/constants";

export class RouterService extends BaseApiService {
  /**
   * Get all routers with optional filtering
   */
  async getRouters(params?: Record<string, any>): Promise<ApiResponse<Router>> {
    return this.getPaginated<Router>(ENDPOINTS.ROUTERS.BASE, params);
  }

  /**
   * Get a specific router by ID
   */
  async getRouter(id: number): Promise<Router> {
    this.validateId(id, "router");
    return this.get<Router>(`${ENDPOINTS.ROUTERS.BASE}/${id}/`);
  }

  /**
   * Create a new router
   */
  async createRouter(data: Partial<Router>): Promise<Router> {
    return this.post<Router>(ENDPOINTS.ROUTERS.BASE + "/", data);
  }

  /**
   * Update an existing router
   */
  async updateRouter(id: number, data: Partial<Router>): Promise<Router> {
    this.validateId(id, "router");
    return this.put<Router>(`${ENDPOINTS.ROUTERS.BASE}/${id}/`, data);
  }

  /**
   * Delete a router
   */
  async deleteRouter(id: number): Promise<void> {
    this.validateId(id, "router");
    return this.delete(`${ENDPOINTS.ROUTERS.BASE}/${id}/`);
  }

  /**
   * Test router connection
   */
  async testRouterConnection(id: number): Promise<any> {
    this.validateId(id, "router");
    return this.post<any>(`${ENDPOINTS.ROUTERS.BASE}/${id}/test_connection/`);
  }

  /**
   * Restart a router
   */
  async restartRouter(id: number): Promise<any> {
    this.validateId(id, "router");
    return this.post<any>(`${ENDPOINTS.ROUTERS.BASE}/${id}/restart/`);
  }

  /**
   * Get router statistics
   */
  async getRouterStats(): Promise<any> {
    return this.get<any>(ENDPOINTS.ROUTERS.STATS + "/");
  }

  /**
   * Get router interfaces
   */
  async getRouterInterfaces(routerId: number): Promise<any> {
    this.validateId(routerId, "router");
    return this.get<any>(`${ENDPOINTS.ROUTERS.BASE}/${routerId}/interfaces/`);
  }

  /**
   * Get router bandwidth information
   */
  async getRouterBandwidth(routerId: number): Promise<any> {
    this.validateId(routerId, "router");
    return this.get<any>(`${ENDPOINTS.ROUTERS.BASE}/${routerId}/bandwidth/`);
  }

  /**
   * Get router connections
   */
  async getRouterConnections(routerId: number): Promise<any> {
    this.validateId(routerId, "router");
    return this.get<any>(`${ENDPOINTS.ROUTERS.BASE}/${routerId}/connections/`);
  }

  /**
   * Get router resources
   */
  async getRouterResources(routerId: number): Promise<any> {
    this.validateId(routerId, "router");
    return this.get<any>(`${ENDPOINTS.ROUTERS.BASE}/${routerId}/resources/`);
  }

  // Main Router specific methods
  /**
   * Get main router status
   */
  async getMainRouterStatus(): Promise<any> {
    return this.get<any>(`${ENDPOINTS.ROUTERS.MAIN_ROUTER}/status/`);
  }

  /**
   * Get main router interfaces
   */
  async getMainRouterInterfaces(): Promise<any> {
    return this.get<any>(`${ENDPOINTS.ROUTERS.MAIN_ROUTER}/interfaces/`);
  }

  /**
   * Get main router bandwidth
   */
  async getMainRouterBandwidth(params?: Record<string, any>): Promise<any> {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    return this.get<any>(
      `${ENDPOINTS.ROUTERS.MAIN_ROUTER}/bandwidth/${queryString}`,
    );
  }

  /**
   * Get main router connections
   */
  async getMainRouterConnections(params?: Record<string, any>): Promise<any> {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    return this.get<any>(
      `${ENDPOINTS.ROUTERS.MAIN_ROUTER}/connections/${queryString}`,
    );
  }

  /**
   * Get main router DHCP leases
   */
  async getMainRouterDhcpLeases(): Promise<any> {
    return this.get<any>(`${ENDPOINTS.ROUTERS.MAIN_ROUTER}/dhcp-leases/`);
  }

  /**
   * Get main router resources
   */
  async getMainRouterResources(params?: Record<string, any>): Promise<any> {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    return this.get<any>(
      `${ENDPOINTS.ROUTERS.MAIN_ROUTER}/resources/${queryString}`,
    );
  }

  /**
   * Get main router logs
   */
  async getMainRouterLogs(params?: Record<string, any>): Promise<any> {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    return this.get<any>(
      `${ENDPOINTS.ROUTERS.MAIN_ROUTER}/logs/${queryString}`,
    );
  }

  /**
   * Get main router alerts
   */
  async getMainRouterAlerts(): Promise<any> {
    return this.get<any>(`${ENDPOINTS.ROUTERS.MAIN_ROUTER}/alerts/`);
  }

  /**
   * Execute command on main router
   */
  async executeMainRouterCommand(command: string): Promise<any> {
    if (!command || typeof command !== "string") {
      throw new Error("Invalid command");
    }

    return this.post<any>(`${ENDPOINTS.ROUTERS.MAIN_ROUTER}/execute-command/`, {
      command,
    });
  }

  /**
   * Test main router connection
   */
  async testMainRouterConnection(): Promise<any> {
    return this.post<any>(`${ENDPOINTS.ROUTERS.MAIN_ROUTER}/test-connection/`);
  }

  /**
   * Restart main router
   */
  async restartMainRouter(): Promise<any> {
    try {
      return this.post<any>(`${ENDPOINTS.ROUTERS.MAIN_ROUTER}/restart/`);
    } catch (error) {
      console.error("Failed to restart main router:", error);
      throw error;
    }
  }
}
