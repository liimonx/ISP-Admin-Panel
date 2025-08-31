import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { useState, useCallback, useRef } from "react";
import { apiService } from "@/services/apiService";
import { ApiErrorHandler, AppError, ErrorUtils } from "@/utils/errorHandler";
import { apiRateLimiter } from "@/utils/rateLimiter";
import { API_CONFIG, getRetryDelay } from "@/config/api";

// Enhanced API state interface
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  retryCount: number;
  isRateLimited: boolean;
  canRetry: boolean;
}

// Generic hook options interface
interface EnhancedApiOptions<T> {
  enabled?: boolean;
  retryOnMount?: boolean;
  cacheTime?: number;
  staleTime?: number;
  retry?: number | boolean;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
  onRetry?: (retryCount: number) => void;
}

// Enhanced generic hook for GET requests
export const useApiQuery = <T>(
  queryKey: (string | number)[],
  queryFn: () => Promise<T>,
  options?: EnhancedApiOptions<T>,
) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const queryOptions: UseQueryOptions<T, AppError> = {
    queryKey,
    queryFn: async () => {
      try {
        setIsRateLimited(false);
        const result = await queryFn();
        setRetryCount(0); // Reset on success
        return result;
      } catch (error) {
        const handledError = ApiErrorHandler.handleError(error);

        // Check if it's a rate limit error
        if (ErrorUtils.isRateLimitError(handledError)) {
          setIsRateLimited(true);
        }

        throw handledError;
      }
    },
    retry: (failureCount, error) => {
      if (options?.retry === false) return false;
      if (typeof options?.retry === "number" && failureCount >= options.retry)
        return false;

      const maxRetries =
        typeof options?.retry === "number"
          ? options.retry
          : API_CONFIG.RETRY.MAX_ATTEMPTS;
      if (failureCount >= maxRetries) return false;

      // Don't retry certain types of errors
      if (
        ErrorUtils.isAuthError(error) ||
        ErrorUtils.isValidationError(error)
      ) {
        return false;
      }

      return ApiErrorHandler.shouldRetry(error);
    },
    retryDelay: (attemptIndex, error) => {
      setRetryCount(attemptIndex);
      options?.onRetry?.(attemptIndex);

      if (ErrorUtils.isRateLimitError(error)) {
        // For rate limit errors, use the retry-after time
        return error.status === 429 ? 60000 : getRetryDelay(attemptIndex);
      }

      return options?.retryDelay || getRetryDelay(attemptIndex);
    },
    enabled: options?.enabled ?? true,
    cacheTime: options?.cacheTime || API_CONFIG.CACHE.DEFAULT_TTL,
    staleTime: options?.staleTime || API_CONFIG.CACHE.DEFAULT_TTL / 2,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    refetchOnWindowFocus: false,
    refetchOnMount: options?.retryOnMount ?? true,
  };

  const query = useQuery(queryOptions);

  const manualRetry = useCallback(async () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setIsRateLimited(false);
    await query.refetch();
  }, [query]);

  const canRetry =
    !query.isLoading &&
    query.error &&
    ApiErrorHandler.shouldRetry(query.error) &&
    retryCount < API_CONFIG.RETRY.MAX_ATTEMPTS;

  return {
    ...query,
    retryCount,
    isRateLimited,
    canRetry,
    manualRetry,
    state: {
      data: query.data || null,
      loading: query.isLoading,
      error: query.error || null,
      retryCount,
      isRateLimited,
      canRetry,
    } as ApiState<T>,
  };
};

// Enhanced generic hook for mutations
export const useApiMutation = <TData, TVariables>(
  mutationFn: (data: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: AppError, variables: TVariables) => void;
    onMutate?: (variables: TVariables) => Promise<any> | any;
    invalidateQueries?: string[];
    optimisticUpdate?: boolean;
  },
) => {
  const queryClient = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);

  const mutationOptions: UseMutationOptions<TData, AppError, TVariables> = {
    mutationFn: async (variables) => {
      try {
        const result = await mutationFn(variables);
        setRetryCount(0);
        return result;
      } catch (error) {
        const handledError = ApiErrorHandler.handleError(error);
        throw handledError;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate specified queries or all queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      } else {
        queryClient.invalidateQueries();
      }

      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      options?.onError?.(error, variables);
    },
    onMutate: options?.onMutate,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false; // Max 2 retries for mutations

      // Only retry for specific errors
      return (
        ApiErrorHandler.shouldRetry(error) &&
        !ErrorUtils.isValidationError(error)
      );
    },
    retryDelay: (attemptIndex) => {
      setRetryCount(attemptIndex);
      return getRetryDelay(attemptIndex);
    },
  };

  const mutation = useMutation(mutationOptions);

  return {
    ...mutation,
    retryCount,
  };
};

// Specific entity hooks with enhanced features
export const useCustomers = (
  params?: any,
  options?: EnhancedApiOptions<any>,
) => {
  return useApiQuery(
    ["customers", params],
    () => apiService.getCustomers(params),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      ...options,
    },
  );
};

export const useCustomer = (id: number, options?: EnhancedApiOptions<any>) => {
  return useApiQuery(["customer", id], () => apiService.getCustomer(id), {
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useCustomerSearch = (
  query: string,
  options?: EnhancedApiOptions<any>,
) => {
  return useApiQuery(
    ["customers", "search", query],
    () => apiService.searchCustomers(query),
    {
      enabled: query.length >= 2 && (options?.enabled ?? true),
      staleTime: 30 * 1000, // 30 seconds
      ...options,
    },
  );
};

export const usePlans = (params?: any, options?: EnhancedApiOptions<any>) => {
  return useApiQuery(["plans", params], () => apiService.getPlans(params), {
    staleTime: 10 * 60 * 1000, // 10 minutes (plans don't change often)
    ...options,
  });
};

export const useActivePlans = (options?: EnhancedApiOptions<any>) => {
  return useApiQuery(["plans", "active"], () => apiService.getActivePlans(), {
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

export const useFeaturedPlans = (options?: EnhancedApiOptions<any>) => {
  return useApiQuery(
    ["plans", "featured"],
    () => apiService.getFeaturedPlans(),
    {
      staleTime: 10 * 60 * 1000,
      ...options,
    },
  );
};

export const useSubscriptions = (
  params?: any,
  options?: EnhancedApiOptions<any>,
) => {
  return useApiQuery(
    ["subscriptions", params],
    () => apiService.getSubscriptions(params),
    {
      staleTime: 2 * 60 * 1000,
      ...options,
    },
  );
};

export const useSubscription = (
  id: number,
  options?: EnhancedApiOptions<any>,
) => {
  return useApiQuery(
    ["subscription", id],
    () => apiService.getSubscription(id),
    {
      enabled: !!id && (options?.enabled ?? true),
      staleTime: 5 * 60 * 1000,
      ...options,
    },
  );
};

export const useRouters = (params?: any, options?: EnhancedApiOptions<any>) => {
  return useApiQuery(["routers", params], () => apiService.getRouters(params), {
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useRouter = (id: number, options?: EnhancedApiOptions<any>) => {
  return useApiQuery(["router", id], () => apiService.getRouter(id), {
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useRouterMonitoring = (
  id: number,
  options?: EnhancedApiOptions<any>,
) => {
  return useApiQuery(
    ["router", "monitoring", id],
    () => apiService.getRouterMonitoring(id),
    {
      enabled: !!id && (options?.enabled ?? true),
      staleTime: 30 * 1000, // 30 seconds for real-time monitoring
      ...options,
    },
  );
};

export const useInvoices = (
  params?: any,
  options?: EnhancedApiOptions<any>,
) => {
  return useApiQuery(
    ["invoices", params],
    () => apiService.getInvoices(params),
    {
      staleTime: 2 * 60 * 1000,
      ...options,
    },
  );
};

export const useInvoice = (id: number, options?: EnhancedApiOptions<any>) => {
  return useApiQuery(["invoice", id], () => apiService.getInvoice(id), {
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const usePayments = (
  params?: any,
  options?: EnhancedApiOptions<any>,
) => {
  return useApiQuery(
    ["payments", params],
    () => apiService.getPayments(params),
    {
      staleTime: 2 * 60 * 1000,
      ...options,
    },
  );
};

export const useUsers = (params?: any, options?: EnhancedApiOptions<any>) => {
  return useApiQuery(["users", params], () => apiService.getUsers(params), {
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useUser = (id: number, options?: EnhancedApiOptions<any>) => {
  return useApiQuery(["user", id], () => apiService.getUser(id), {
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Stats hooks with appropriate refresh intervals
export const useDashboardStats = (options?: EnhancedApiOptions<any>) => {
  return useApiQuery(
    ["dashboard-stats"],
    () => apiService.getDashboardStats(),
    {
      staleTime: 60 * 1000, // 1 minute
      retry: 2, // Fewer retries for stats
      ...options,
    },
  );
};

export const useCustomerStats = (options?: EnhancedApiOptions<any>) => {
  return useApiQuery(
    ["customers", "stats"],
    () => apiService.getCustomerStats(),
    {
      staleTime: 2 * 60 * 1000,
      ...options,
    },
  );
};

export const useInvoiceStats = (options?: EnhancedApiOptions<any>) => {
  return useApiQuery(
    ["invoices", "stats"],
    () => apiService.getInvoiceStats(),
    {
      staleTime: 2 * 60 * 1000,
      ...options,
    },
  );
};

export const usePaymentStats = (options?: EnhancedApiOptions<any>) => {
  return useApiQuery(
    ["payments", "stats"],
    () => apiService.getPaymentStats(),
    {
      staleTime: 2 * 60 * 1000,
      ...options,
    },
  );
};

export const useRouterStats = (options?: EnhancedApiOptions<any>) => {
  return useApiQuery(["routers", "stats"], () => apiService.getRouterStats(), {
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

export const useMonitoringStats = (options?: EnhancedApiOptions<any>) => {
  return useApiQuery(
    ["monitoring", "stats"],
    () => apiService.getMonitoringStats(),
    {
      staleTime: 30 * 1000, // 30 seconds
      ...options,
    },
  );
};

// Health check hooks
export const useHealthCheck = (options?: EnhancedApiOptions<any>) => {
  return useApiQuery(["health"], () => apiService.healthCheck(), {
    staleTime: 30 * 1000,
    retry: 1, // Don't retry health checks too much
    ...options,
  });
};

export const useDetailedHealthCheck = (options?: EnhancedApiOptions<any>) => {
  return useApiQuery(
    ["health", "detailed"],
    () => apiService.detailedHealthCheck(),
    {
      staleTime: 60 * 1000,
      retry: 1,
      ...options,
    },
  );
};

// Mutation hooks with enhanced error handling
export const useCreateCustomer = () => {
  return useApiMutation(apiService.createCustomer, {
    invalidateQueries: ["customers"],
  });
};

export const useUpdateCustomer = () => {
  return useApiMutation(
    ({ id, data }: { id: number; data: any }) =>
      apiService.updateCustomer(id, data),
    {
      invalidateQueries: ["customers", "customer"],
    },
  );
};

export const useDeleteCustomer = () => {
  return useApiMutation(apiService.deleteCustomer, {
    invalidateQueries: ["customers"],
  });
};

export const useBulkUpdateCustomerStatus = () => {
  return useApiMutation(
    ({ customerIds, status }: { customerIds: number[]; status: string }) =>
      apiService.bulkUpdateCustomerStatus(customerIds, status),
    {
      invalidateQueries: ["customers"],
    },
  );
};

export const useCreatePlan = () => {
  return useApiMutation(apiService.createPlan, {
    invalidateQueries: ["plans"],
  });
};

export const useUpdatePlan = () => {
  return useApiMutation(
    ({ id, data }: { id: number; data: any }) =>
      apiService.updatePlan(id, data),
    {
      invalidateQueries: ["plans", "plan"],
    },
  );
};

export const useCreateSubscription = () => {
  return useApiMutation(apiService.createSubscription, {
    invalidateQueries: ["subscriptions", "customers"],
  });
};

export const useUpdateSubscriptionStatus = () => {
  return useApiMutation(
    ({ id, status }: { id: number; status: string }) =>
      apiService.updateSubscriptionStatus(id, status),
    {
      invalidateQueries: ["subscriptions", "subscription"],
    },
  );
};

export const useGenerateInvoice = () => {
  return useApiMutation(apiService.generateInvoice, {
    invalidateQueries: ["invoices", "customers"],
  });
};

export const useBulkGenerateInvoices = () => {
  return useApiMutation(apiService.bulkGenerateInvoices, {
    invalidateQueries: ["invoices"],
  });
};

export const useMarkInvoiceAsPaid = () => {
  return useApiMutation(apiService.markInvoiceAsPaid, {
    invalidateQueries: ["invoices", "invoice", "payments"],
  });
};

export const useSendInvoice = () => {
  return useApiMutation(apiService.sendInvoice, {
    invalidateQueries: ["invoices", "invoice"],
  });
};

export const useRecordPayment = () => {
  return useApiMutation(apiService.recordPayment, {
    invalidateQueries: ["payments", "invoices"],
  });
};

export const useTestRouterConnection = () => {
  return useApiMutation(apiService.testRouterConnection, {
    invalidateQueries: ["routers", "router"],
  });
};
