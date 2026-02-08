import { apiService } from './apiService';
import { Invoice, Payment, ApiResponse } from '../types';

export interface BillingFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customer_id?: number;
  date_from?: string;
  date_to?: string;
  payment_method?: string;
}

export interface PaymentData {
  invoice_id: number;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  notes?: string;
}

export interface InvoiceGenerationData {
  customer_id: number;
  subscription_id?: number;
  invoice_type: 'monthly' | 'setup' | 'adjustment' | 'other';
  billing_period_start: string;
  billing_period_end: string;
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  notes?: string;
}

export interface BillingStats {
  total_revenue: number;
  total_invoices: number;
  pending_invoices: number;
  overdue_invoices: number;
  paid_invoices: number;
  collection_rate: number;
  monthly_revenue: number;
  outstanding_amount: number;
}

export interface PaymentStats {
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  average_payment_amount: number;
  payment_methods_distribution: Record<string, number>;
}

class BillingService {
  // Invoice Operations
  async getInvoices(filters: BillingFilters = {}): Promise<ApiResponse<Invoice>> {
    return apiService.getInvoices(filters);
  }

  async getInvoice(id: number): Promise<Invoice> {
    return apiService.getInvoice(id);
  }

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    return apiService.createInvoice(data);
  }

  async updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice> {
    return apiService.updateInvoice(id, data);
  }

  async deleteInvoice(id: number): Promise<void> {
    return apiService.deleteInvoice(id);
  }

  async sendInvoice(id: number): Promise<any> {
    return apiService.sendInvoice(id);
  }

  async markInvoiceAsPaid(id: number): Promise<Invoice> {
    return apiService.markInvoiceAsPaid(id);
  }

  async generateInvoice(data: InvoiceGenerationData): Promise<Invoice> {
    return apiService.generateInvoice(data);
  }

  async bulkGenerateInvoices(data: { customer_ids: number[]; invoice_type: string }): Promise<any> {
    return apiService.bulkGenerateInvoices(data);
  }

  // Payment Operations
  async getPayments(filters: BillingFilters = {}): Promise<ApiResponse<Payment>> {
    return apiService.getPayments(filters);
  }

  async getPayment(id: number): Promise<Payment> {
    return apiService.getPayment(id);
  }

  async recordPayment(data: PaymentData): Promise<Payment> {
    return apiService.recordPayment(data);
  }

  async refundPayment(id: number, reason?: string): Promise<Payment> {
    try {
      const response = await fetch(`/api/billing/payments/${id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error(`Failed to refund payment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }

  // Statistics
  async getInvoiceStats(): Promise<BillingStats> {
    return apiService.getInvoiceStats();
  }

  async getPaymentStats(): Promise<PaymentStats> {
    return apiService.getPaymentStats();
  }

  // Enhanced filtering methods
  async getOverdueInvoices(): Promise<ApiResponse<Invoice>> {
    return this.getInvoices({ status: 'overdue' });
  }

  async getPendingInvoices(): Promise<ApiResponse<Invoice>> {
    return this.getInvoices({ status: 'pending' });
  }

  async getPaidInvoices(): Promise<ApiResponse<Invoice>> {
    return this.getInvoices({ status: 'paid' });
  }

  async getInvoicesByCustomer(customerId: number): Promise<ApiResponse<Invoice>> {
    return this.getInvoices({ customer_id: customerId });
  }

  async getPaymentsByCustomer(customerId: number): Promise<ApiResponse<Payment>> {
    return this.getPayments({ customer_id: customerId });
  }

  async getPaymentsByMethod(paymentMethod: string): Promise<ApiResponse<Payment>> {
    return this.getPayments({ payment_method: paymentMethod });
  }

  // Date range queries
  async getInvoicesByDateRange(dateFrom: string, dateTo: string): Promise<ApiResponse<Invoice>> {
    return this.getInvoices({ date_from: dateFrom, date_to: dateTo });
  }

  async getPaymentsByDateRange(dateFrom: string, dateTo: string): Promise<ApiResponse<Payment>> {
    return this.getPayments({ date_from: dateFrom, date_to: dateTo });
  }

  // Export functionality
  async exportInvoices(filters: BillingFilters = {}, format: 'pdf' | 'csv' | 'excel' = 'pdf'): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      queryParams.append('format', format);

      const response = await fetch(`/api/billing/invoices/export?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to export invoices: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting invoices:', error);
      throw error;
    }
  }

  async exportPayments(filters: BillingFilters = {}, format: 'pdf' | 'csv' | 'excel' = 'pdf'): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      queryParams.append('format', format);

      const response = await fetch(`/api/billing/payments/export?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to export payments: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting payments:', error);
      throw error;
    }
  }

  // Download functionality
  async downloadInvoicePDF(id: number): Promise<Blob> {
    try {
      const response = await fetch(`/api/billing/invoices/${id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download invoice PDF: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      throw error;
    }
  }

  async downloadPaymentReceipt(id: number): Promise<Blob> {
    try {
      const response = await fetch(`/api/billing/payments/${id}/receipt`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download payment receipt: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading payment receipt:', error);
      throw error;
    }
  }

  // Utility methods
  calculateOutstandingAmount(invoices: Invoice[]): number {
    return invoices
      .filter(invoice => invoice.status === 'pending' || invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + (Number(invoice.total_amount) - Number(invoice.paid_amount)), 0);
  }

  calculateOverdueAmount(invoices: Invoice[]): number {
    return invoices
      .filter(invoice => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + (Number(invoice.total_amount) - Number(invoice.paid_amount)), 0);
  }

  calculateCollectionRate(invoices: Invoice[]): number {
    if (invoices.length === 0) return 0;
    
    const totalAmount = invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);
    const paidAmount = invoices.reduce((sum, invoice) => sum + Number(invoice.paid_amount), 0);
    
    return totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: 'Cash',
      bank_transfer: 'Bank Transfer',
      bkash: 'bKash',
      nagad: 'Nagad',
      rocket: 'Rocket',
      sslcommerz: 'SSLCommerz',
      stripe: 'Stripe',
      other: 'Other',
    };
    return labels[method] || method;
  }

  getInvoiceStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      pending: 'Pending',
      paid: 'Paid',
      overdue: 'Overdue',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }

  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pending',
      completed: 'Completed',
      failed: 'Failed',
      refunded: 'Refunded',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }
}

export const billingService = new BillingService();
export default billingService;
