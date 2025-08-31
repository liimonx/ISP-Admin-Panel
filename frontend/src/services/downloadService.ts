import axios from 'axios';

const API_BASE_URL = "/api";

class DownloadService {
  // Download invoice as PDF
  async downloadInvoicePDF(invoiceId: number): Promise<void> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/billing/invoices/${invoiceId}/download/`,
        {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download invoice PDF:', error);
      throw new Error('Failed to download invoice PDF');
    }
  }

  // Download payment receipt as PDF
  async downloadPaymentReceipt(paymentId: number): Promise<void> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/billing/payments/${paymentId}/receipt/`,
        {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-receipt-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download payment receipt:', error);
      throw new Error('Failed to download payment receipt');
    }
  }

  // Export invoices as CSV/Excel
  async exportInvoices(filters: any = {}, format: 'csv' | 'excel' = 'csv'): Promise<void> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/billing/invoices/export/`,
        {
          responseType: 'blob',
          params: { ...filters, format },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      const contentType = format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoices-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export invoices:', error);
      throw new Error('Failed to export invoices');
    }
  }

  // Export payments as CSV/Excel
  async exportPayments(filters: any = {}, format: 'csv' | 'excel' = 'csv'): Promise<void> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/billing/payments/export/`,
        {
          responseType: 'blob',
          params: { ...filters, format },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      const contentType = format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payments-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export payments:', error);
      throw new Error('Failed to export payments');
    }
  }

  // Generate and download billing report
  async downloadBillingReport(dateFrom: string, dateTo: string, format: 'pdf' | 'csv' | 'excel' = 'pdf'): Promise<void> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/billing/reports/`,
        {
          responseType: 'blob',
          params: { date_from: dateFrom, date_to: dateTo, format },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      let contentType = 'application/pdf';
      if (format === 'csv') contentType = 'text/csv';
      else if (format === 'excel') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `billing-report-${dateFrom}-to-${dateTo}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download billing report:', error);
      throw new Error('Failed to download billing report');
    }
  }

  // Fallback method for when backend endpoints don't exist yet
  async generateMockPDF(content: string, filename: string): Promise<void> {
    // This is a fallback that creates a simple text file
    // In a real implementation, you'd use a PDF library like jsPDF
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const downloadService = new DownloadService();
export default downloadService;
