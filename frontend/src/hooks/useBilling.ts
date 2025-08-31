import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService, BillingFilters, PaymentData, InvoiceGenerationData } from '../services/billingService';
import { notificationManager } from '../utils/notifications';

export const useBilling = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<BillingFilters>({
    page: 1,
    limit: 12,
  });

  // Invoices
  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    error: invoicesError,
  } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => billingService.getInvoices(filters),
  });

  // Payments
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    error: paymentsError,
  } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => billingService.getPayments(filters),
  });

  // Invoice Stats
  const {
    data: invoiceStats,
    error: statsError,
  } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: () => billingService.getInvoiceStats(),
  });

  // Payment Stats
  const {
    data: paymentStats,
    error: paymentStatsError,
  } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: () => billingService.getPaymentStats(),
  });

  // Mutations
  const recordPaymentMutation = useMutation({
    mutationFn: (data: PaymentData) => billingService.recordPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      notificationManager.success('Payment recorded successfully');
    },
    onError: (error: any) => {
      notificationManager.error('Failed to record payment: ' + (error.message || 'Unknown error'));
    },
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: (invoiceId: number) => billingService.sendInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      notificationManager.success('Invoice sent successfully');
    },
    onError: (error: any) => {
      notificationManager.error('Failed to send invoice: ' + (error.message || 'Unknown error'));
    },
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: (data: InvoiceGenerationData) => billingService.generateInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      notificationManager.success('Invoice generated successfully');
    },
    onError: (error: any) => {
      notificationManager.error('Failed to generate invoice: ' + (error.message || 'Unknown error'));
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => billingService.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      notificationManager.success('Invoice updated successfully');
    },
    onError: (error: any) => {
      notificationManager.error('Failed to update invoice: ' + (error.message || 'Unknown error'));
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: number) => billingService.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      notificationManager.success('Invoice deleted successfully');
    },
    onError: (error: any) => {
      notificationManager.error('Failed to delete invoice: ' + (error.message || 'Unknown error'));
    },
  });

  // Calculated stats
  const calculatedStats = useMemo(() => {
    if (!invoicesData?.results) {
      return {
        outstandingAmount: 0,
        overdueAmount: 0,
        pendingAmount: 0,
        collectionRate: 0,
      };
    }

    const outstandingAmount = billingService.calculateOutstandingAmount(invoicesData.results);
    const overdueAmount = billingService.calculateOverdueAmount(invoicesData.results);
    const collectionRate = billingService.calculateCollectionRate(invoicesData.results);

    const pendingAmount = invoicesData.results
      .filter((invoice) => invoice.status === 'pending')
      .reduce((sum, invoice) => sum + (Number(invoice.total_amount) - Number(invoice.paid_amount)), 0);

    return {
      outstandingAmount,
      overdueAmount,
      pendingAmount,
      collectionRate,
    };
  }, [invoicesData]);

  // Filter methods
  const updateFilters = (newFilters: Partial<BillingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset to first page when filters change
  };

  const setPage = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const setSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const setStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status: status === 'all' ? undefined : status, page: 1 }));
  };

  const setDateRange = (dateFrom: string, dateTo: string) => {
    setFilters(prev => ({ ...prev, date_from: dateFrom, date_to: dateTo, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 12 });
  };

  // Action methods
  const recordPayment = (data: PaymentData) => {
    recordPaymentMutation.mutate(data);
  };

  const sendInvoice = (invoiceId: number) => {
    sendInvoiceMutation.mutate(invoiceId);
  };

  const generateInvoice = (data: InvoiceGenerationData) => {
    generateInvoiceMutation.mutate(data);
  };

  const updateInvoice = (id: number, data: any) => {
    updateInvoiceMutation.mutate({ id, data });
  };

  const deleteInvoice = (id: number) => {
    deleteInvoiceMutation.mutate(id);
  };

  // Error handling
  const hasError = invoicesError || paymentsError || statsError || paymentStatsError;
  const errorMessage = 
    (invoicesError as Error)?.message || 
    (paymentsError as Error)?.message || 
    (statsError as Error)?.message || 
    (paymentStatsError as Error)?.message || 
    'An error occurred while loading billing data';

  return {
    // Data
    invoices: invoicesData?.results || [],
    payments: paymentsData?.results || [],
    invoiceStats: invoiceStats || {},
    paymentStats: paymentStats || {},
    calculatedStats,
    
    // Loading states
    invoicesLoading,
    paymentsLoading,
    isLoading: invoicesLoading || paymentsLoading,
    
    // Error states
    hasError,
    errorMessage,
    
    // Pagination
    pagination: {
      currentPage: filters.page || 1,
      totalPages: invoicesData ? Math.ceil(invoicesData.count / (filters.limit || 12)) : 0,
      totalItems: invoicesData?.count || 0,
      hasNextPage: invoicesData ? !!invoicesData.next : false,
      hasPreviousPage: invoicesData ? !!invoicesData.previous : false,
    },
    
    // Filters
    filters,
    updateFilters,
    setPage,
    setSearch,
    setStatusFilter,
    setDateRange,
    clearFilters,
    
    // Actions
    recordPayment,
    sendInvoice,
    generateInvoice,
    updateInvoice,
    deleteInvoice,
    
    // Mutation states
    isRecordingPayment: recordPaymentMutation.isPending,
    isSendingInvoice: sendInvoiceMutation.isPending,
    isGeneratingInvoice: generateInvoiceMutation.isPending,
    isUpdatingInvoice: updateInvoiceMutation.isPending,
    isDeletingInvoice: deleteInvoiceMutation.isPending,
    
    // Utility methods
    getPaymentMethodLabel: billingService.getPaymentMethodLabel,
    getInvoiceStatusLabel: billingService.getInvoiceStatusLabel,
    getPaymentStatusLabel: billingService.getPaymentStatusLabel,
  };
};
