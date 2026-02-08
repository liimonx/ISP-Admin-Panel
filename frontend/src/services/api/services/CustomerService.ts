import { Customer, ApiResponse } from "@/types";
import { BaseApiService } from "../base/BaseApiService";
import { ENDPOINTS, VALID_CUSTOMER_STATUSES } from "../base/constants";

export class CustomerService extends BaseApiService {
  /**
   * Get all customers with optional filtering
   */
  async getCustomers(params?: Record<string, any>): Promise<ApiResponse<Customer>> {
    return this.getPaginated<Customer>(ENDPOINTS.CUSTOMERS.BASE, params);
  }

  /**
   * Get a specific customer by ID
   */
  async getCustomer(id: number): Promise<Customer> {
    this.validateId(id, 'customer');
    return this.get<Customer>(`${ENDPOINTS.CUSTOMERS.BASE}/${id}/`);
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    return this.post<Customer>(ENDPOINTS.CUSTOMERS.BASE + '/', data);
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    this.validateId(id, 'customer');
    return this.put<Customer>(`${ENDPOINTS.CUSTOMERS.BASE}/${id}/`, data);
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(id: number): Promise<void> {
    this.validateId(id, 'customer');
    return this.delete(`${ENDPOINTS.CUSTOMERS.BASE}/${id}/`);
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(): Promise<any> {
    return this.get<any>(ENDPOINTS.CUSTOMERS.STATS + '/');
  }

  /**
   * Search customers by query
   */
  async searchCustomers(
    query: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<Customer>> {
    const sanitizedQuery = this.sanitizeSearchQuery(query);
    return this.getPaginated<Customer>(ENDPOINTS.CUSTOMERS.SEARCH + '/', {
      q: sanitizedQuery,
      ...params,
    });
  }

  /**
   * Bulk update customer status
   */
  async bulkUpdateCustomerStatus(
    customerIds: number[],
    status: string
  ): Promise<any> {
    this.validateStatus(status, VALID_CUSTOMER_STATUSES, 'customer');
    const validIds = this.validateIds(customerIds, 'customer');

    return this.post<any>(ENDPOINTS.CUSTOMERS.BULK_UPDATE_STATUS + '/', {
      customer_ids: validIds,
      status,
    });
  }
}