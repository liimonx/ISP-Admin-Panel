import { Invoice, Payment, ApiResponse } from "@/types";
import { BaseApiService } from "../base/BaseApiService";
import { ENDPOINTS } from "../base/constants";

export class BillingService extends BaseApiService {
  // Invoice methods
  /**
   * Get all invoices with optional filtering
   */
  async getInvoices(
    params?: Record<string, any>,
  ): Promise<ApiResponse<Invoice>> {
    return this.getPaginated<Invoice>(ENDPOINTS.BILLING.INVOICES, params);
  }

  /**
   * Get a specific invoice by ID
   */
  async getInvoice(id: number): Promise<Invoice> {
    this.validateId(id, "invoice");
    return this.get<Invoice>(`${ENDPOINTS.BILLING.INVOICES}/${id}/`);
  }

  /**
   * Create a new invoice
   */
  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    return this.post<Invoice>(ENDPOINTS.BILLING.INVOICES + "/", data);
  }

  /**
   * Update an existing invoice
   */
  async updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice> {
    this.validateId(id, "invoice");
    return this.put<Invoice>(`${ENDPOINTS.BILLING.INVOICES}/${id}/`, data);
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(id: number): Promise<void> {
    this.validateId(id, "invoice");
    return this.delete(`${ENDPOINTS.BILLING.INVOICES}/${id}/`);
  }

  /**
   * Send an invoice
   */
  async sendInvoice(id: number): Promise<any> {
    this.validateId(id, "invoice");
    return this.post<any>(`${ENDPOINTS.BILLING.INVOICES}/${id}/send/`);
  }

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(id: number): Promise<Invoice> {
    this.validateId(id, "invoice");
    return this.post<Invoice>(`${ENDPOINTS.BILLING.INVOICES}/${id}/pay/`);
  }

  /**
   * Generate a new invoice
   */
  async generateInvoice(data: any): Promise<Invoice> {
    return this.post<Invoice>(ENDPOINTS.BILLING.GENERATE + "/", data);
  }

  /**
   * Bulk generate invoices
   */
  async bulkGenerateInvoices(data: any): Promise<any> {
    return this.post<any>(ENDPOINTS.BILLING.BULK_GENERATE + "/", data);
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(): Promise<any> {
    return this.get<any>(ENDPOINTS.BILLING.INVOICE_STATS);
  }

  // Payment methods
  /**
   * Get all payments with optional filtering
   */
  async getPayments(
    params?: Record<string, any>,
  ): Promise<ApiResponse<Payment>> {
    return this.getPaginated<Payment>(ENDPOINTS.PAYMENTS.BASE, params);
  }

  /**
   * Get a specific payment by ID
   */
  async getPayment(id: number): Promise<Payment> {
    this.validateId(id, "payment");
    return this.get<Payment>(`${ENDPOINTS.PAYMENTS.BASE}/${id}/`);
  }

  /**
   * Record a new payment
   */
  async recordPayment(data: any): Promise<Payment> {
    return this.post<Payment>(ENDPOINTS.PAYMENTS.BASE + "/", data);
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(): Promise<any> {
    return this.get<any>(ENDPOINTS.BILLING.PAYMENT_STATS);
  }

  /**
   * Get billing audit trail
   */
  async getAuditTrail(params?: Record<string, any>): Promise<any> {
    return this.getPaginated<any>(
      `${ENDPOINTS.BILLING.INVOICES}/audit-trail/`,
      params,
    );
  }
}
