import { Plan, ApiResponse } from "@/types";
import { BaseApiService } from "../base/BaseApiService";
import { ENDPOINTS } from "../base/constants";

export class PlanService extends BaseApiService {
  /**
   * Get all plans with optional filtering
   */
  async getPlans(params?: Record<string, any>): Promise<ApiResponse<Plan>> {
    return this.getPaginated<Plan>(ENDPOINTS.PLANS.BASE, params);
  }

  /**
   * Get a specific plan by ID
   */
  async getPlan(id: number): Promise<Plan> {
    this.validateId(id, "plan");
    return this.get<Plan>(`${ENDPOINTS.PLANS.BASE}/${id}/`);
  }

  /**
   * Create a new plan
   */
  async createPlan(data: Partial<Plan>): Promise<Plan> {
    return this.post<Plan>(ENDPOINTS.PLANS.BASE + "/", data);
  }

  /**
   * Update an existing plan
   */
  async updatePlan(id: number, data: Partial<Plan>): Promise<Plan> {
    this.validateId(id, "plan");
    return this.put<Plan>(`${ENDPOINTS.PLANS.BASE}/${id}/`, data);
  }

  /**
   * Delete a plan
   */
  async deletePlan(id: number): Promise<void> {
    this.validateId(id, "plan");
    return this.delete(`${ENDPOINTS.PLANS.BASE}/${id}/`);
  }

  /**
   * Get all active plans
   */
  async getActivePlans(): Promise<Plan[]> {
    return this.get<Plan[]>(ENDPOINTS.PLANS.ACTIVE + "/");
  }

  /**
   * Get featured plans
   */
  async getFeaturedPlans(): Promise<Plan[]> {
    return this.get<Plan[]>(ENDPOINTS.PLANS.FEATURED + "/");
  }

  /**
   * Get plan statistics
   */
  async getPlanStats(): Promise<any> {
    return this.get<any>(ENDPOINTS.PLANS.STATS + "/");
  }
}
