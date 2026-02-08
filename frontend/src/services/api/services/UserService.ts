import { User, ApiResponse } from "@/types";
import { BaseApiService } from "../base/BaseApiService";
import { ENDPOINTS } from "../base/constants";

export class UserService extends BaseApiService {
  /**
   * Get all users with optional filtering (Admin only)
   */
  async getUsers(params?: Record<string, any>): Promise<ApiResponse<User>> {
    return this.getPaginated<User>(ENDPOINTS.USERS.BASE, params);
  }

  /**
   * Get a specific user by ID
   */
  async getUser(id: number): Promise<User> {
    this.validateId(id, "user");
    return this.get<User>(`${ENDPOINTS.USERS.BASE}/${id}/`);
  }

  /**
   * Create a new user
   */
  async createUser(data: Partial<User>): Promise<User> {
    return this.post<User>(ENDPOINTS.USERS.CREATE + "/", data);
  }

  /**
   * Update an existing user
   */
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    this.validateId(id, "user");
    return this.put<User>(`${ENDPOINTS.USERS.BASE}/${id}/`, data);
  }

  /**
   * Delete a user
   */
  async deleteUser(id: number): Promise<void> {
    this.validateId(id, "user");
    return this.delete(`${ENDPOINTS.USERS.BASE}/${id}/`);
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<any> {
    return this.get<any>(ENDPOINTS.USERS.STATS + "/");
  }
}
