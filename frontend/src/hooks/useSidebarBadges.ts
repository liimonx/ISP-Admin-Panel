import { useQuery } from "@tanstack/react-query";
import { apiService } from "../services/apiService";

interface BadgeData {
  customers: {
    total: number;
    active: number;
  };
  subscriptions: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
  };
  monitoring: {
    alerts: number;
    warnings: number;
  };
  routers: {
    total: number;
    online: number;
    offline: number;
  };
}

export const useSidebarBadges = () => {
  // Fetch customer stats
  const { data: customerStats, isLoading: customersLoading, error: customersError } = useQuery({
    queryKey: ["customer-stats"],
    queryFn: () => apiService.getCustomerStats(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch subscription stats
  const { data: subscriptionStats, isLoading: subscriptionsLoading, error: subscriptionsError } = useQuery({
    queryKey: ["subscription-stats"],
    queryFn: () => apiService.getSubscriptionStats(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch router stats
  const { data: routerStats, isLoading: routersLoading, error: routersError } = useQuery({
    queryKey: ["router-stats"],
    queryFn: () => apiService.getRouterStats(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch monitoring stats
  const { data: monitoringStats, isLoading: monitoringLoading, error: monitoringError } = useQuery({
    queryKey: ["monitoring-stats"],
    queryFn: () => apiService.getMonitoringStats(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds for monitoring
    retry: 3,
    retryDelay: 1000,
  });

  const isLoading = customersLoading || subscriptionsLoading || routersLoading || monitoringLoading;
  const hasError = customersError || subscriptionsError || routersError || monitoringError;

  const badgeData: BadgeData = {
    customers: {
      total: customerStats?.total_customers || 0,
      active: customerStats?.active_customers || 0,
    },
    subscriptions: {
      total: subscriptionStats?.total_subscriptions || 0,
      active: subscriptionStats?.active_subscriptions || 0,
      pending: subscriptionStats?.pending_subscriptions || 0,
      suspended: subscriptionStats?.suspended_subscriptions || 0,
    },
    monitoring: {
      alerts: monitoringStats?.alerts || 0,
      warnings: monitoringStats?.warnings || 0,
    },
    routers: {
      total: routerStats?.total_routers || 0,
      online: routerStats?.online_routers || 0,
      offline: routerStats?.offline_routers || 0,
    },
  };

  return {
    badgeData,
    isLoading,
    hasError,
    errors: {
      customers: customersError,
      subscriptions: subscriptionsError,
      routers: routersError,
      monitoring: monitoringError,
    },
    refetch: () => {
      // This will trigger refetch of all queries
      return Promise.all([
        customerStats,
        subscriptionStats,
        routerStats,
        monitoringStats,
      ]);
    },
  };
};
