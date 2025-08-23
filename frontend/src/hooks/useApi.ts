import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/apiService';

// Generic hook for GET requests
export const useApiQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: any
) => {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
};

// Generic hook for mutations (POST, PUT, DELETE)
export const useApiMutation = <T, V>(
  mutationFn: (data: V) => Promise<T>,
  options?: any
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries();
    },
    ...options,
  });
};

// Specific hooks for different entities
export const useCustomers = (params?: any) => {
  return useApiQuery(['customers', params], () => apiService.getCustomers(params));
};

export const useCustomer = (id: number) => {
  return useApiQuery(['customer', id], () => apiService.getCustomer(id), {
    enabled: !!id,
  });
};

export const usePlans = (params?: any) => {
  return useApiQuery(['plans', params], () => apiService.getPlans(params));
};

export const usePlan = (id: number) => {
  return useApiQuery(['plan', id], () => apiService.getPlan(id), {
    enabled: !!id,
  });
};

export const useSubscriptions = (params?: any) => {
  return useApiQuery(['subscriptions', params], () => apiService.getSubscriptions(params));
};

export const useSubscription = (id: number) => {
  return useApiQuery(['subscription', id], () => apiService.getSubscription(id), {
    enabled: !!id,
  });
};

export const useRouters = (params?: any) => {
  return useApiQuery(['routers', params], () => apiService.getRouters(params));
};

export const useRouter = (id: number) => {
  return useApiQuery(['router', id], () => apiService.getRouter(id), {
    enabled: !!id,
  });
};

export const useInvoices = (params?: any) => {
  return useApiQuery(['invoices', params], () => apiService.getInvoices(params));
};

export const useInvoice = (id: number) => {
  return useApiQuery(['invoice', id], () => apiService.getInvoice(id), {
    enabled: !!id,
  });
};

export const usePayments = (params?: any) => {
  return useApiQuery(['payments', params], () => apiService.getPayments(params));
};

export const usePayment = (id: number) => {
  return useApiQuery(['payment', id], () => apiService.getPayment(id), {
    enabled: !!id,
  });
};

export const useUsers = (params?: any) => {
  return useApiQuery(['users', params], () => apiService.getUsers(params));
};

export const useUser = (id: number) => {
  return useApiQuery(['user', id], () => apiService.getUser(id), {
    enabled: !!id,
  });
};

export const useDashboardStats = () => {
  return useApiQuery(['dashboard-stats'], () => apiService.getDashboardStats());
};
