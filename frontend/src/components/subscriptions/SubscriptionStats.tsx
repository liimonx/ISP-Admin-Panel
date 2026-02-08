import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Grid, GridCol, Icon } from "@shohojdhara/atomix";
import { subscriptionService } from "../../services/api";
import { SubscriptionStats as SubscriptionStatsType } from "../../types";
import { StatCard } from "../molecules/StatCard";

export interface SubscriptionStatsProps {
  totalSubscriptions?: number;
  activeSubscriptions?: number;
  pendingSubscriptions?: number;
  suspendedSubscriptions?: number;
  totalRevenue?: number;
  isLoading?: boolean;
  className?: string;
  refreshInterval?: number;
}

/**
 * SubscriptionStats Component
 *
 * A component for displaying subscription-related statistics with real-time data
 * from the backend stats endpoint. Falls back to props if provided.
 */
export const SubscriptionStats: React.FC<SubscriptionStatsProps> = ({
  totalSubscriptions,
  activeSubscriptions,
  pendingSubscriptions,
  suspendedSubscriptions,
  totalRevenue,
  isLoading: propIsLoading = false,
  className = "",
  refreshInterval = 30000, // 30 seconds
}) => {
  // Fetch real-time stats from backend
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["subscription-stats"],
    queryFn: () => subscriptionService.getSubscriptionStats(),
    refetchInterval: refreshInterval,
    staleTime: 15000, // Consider data stale after 15 seconds
    retry: 2,
    retryDelay: 1000,
  });

  // Use backend data if available, otherwise fall back to props
  const stats: SubscriptionStatsType = statsData || {
    total_subscriptions: totalSubscriptions || 0,
    active_subscriptions: activeSubscriptions || 0,
    pending_subscriptions: pendingSubscriptions || 0,
    suspended_subscriptions: suspendedSubscriptions || 0,
    cancelled_subscriptions: 0,
    total_monthly_revenue: totalRevenue || 0,
    total_data_used_gb: 0,
    active_percentage: 0,
  };

  const isLoading = propIsLoading || statsLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const formatDataUsage = (gb: number) => {
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(1)} TB`;
    }
    return `${gb.toFixed(1)} GB`;
  };

  // Calculate trends (mock data - you can implement actual trend calculation)
  const calculateTrend = (
    current: number,
    previous: number = current * 0.9,
  ) => ({
    value: Math.round(((current - previous) / previous) * 100),
    isPositive: current >= previous,
  });

  return (
    <div className={className}>
      {statsError && (
        <div className="u-mb-4">
          <Card className="u-border-warning">
            <div className="u-p-3 u-d-flex u-align-items-center u-gap-2 u-text-warning">
              <Icon name="Warning" size={20} />
              <div>
                <strong>Stats unavailable</strong>
                <p className="u-mb-0 u-fs-sm">
                  Using fallback data. Stats will refresh automatically.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Grid>
        <GridCol xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Subscriptions"
            value={stats.total_subscriptions}
            icon="Users"
            iconColor="#6366F1"
            description="All registered subscriptions"
            trend={calculateTrend(stats.total_subscriptions)}
            loading={isLoading}
          />
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Subscriptions"
            value={stats.active_subscriptions}
            icon="CheckCircle"
            iconColor="#10B981"
            description={`${formatPercentage(stats.active_percentage)} of total`}
            trend={calculateTrend(stats.active_subscriptions)}
            loading={isLoading}
          />
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <StatCard
            title="Pending Subscriptions"
            value={stats.pending_subscriptions}
            icon="Clock"
            iconColor="#F59E0B"
            description="Awaiting activation"
            trend={calculateTrend(stats.pending_subscriptions)}
            loading={isLoading}
          />
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <StatCard
            title="Suspended"
            value={stats.suspended_subscriptions}
            icon="PauseCircle"
            iconColor="#EF4444"
            description="Temporarily suspended"
            trend={calculateTrend(
              stats.suspended_subscriptions,
              stats.suspended_subscriptions * 1.1,
            )}
            loading={isLoading}
          />
        </GridCol>
      </Grid>

      {/* Revenue and Usage Row */}
      <Grid className="u-mt-4">
        <GridCol xs={12} sm={6} lg={3}>
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(stats.total_monthly_revenue)}
            icon="CurrencyDollar"
            iconColor="#8B5CF6"
            description="From active subscriptions"
            trend={calculateTrend(stats.total_monthly_revenue)}
            loading={isLoading}
          />
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <StatCard
            title="Data Usage"
            value={formatDataUsage(stats.total_data_used_gb)}
            icon="Activity"
            iconColor="#06B6D4"
            description="Total data consumed"
            loading={isLoading}
          />
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <StatCard
            title="Cancelled"
            value={stats.cancelled_subscriptions}
            icon="XCircle"
            iconColor="#64748B"
            description="Cancelled subscriptions"
            loading={isLoading}
          />
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card className="u-h-100">
            <div className="u-p-4">
              <div className="u-d-flex u-align-items-center u-justify-content-between u-mb-3">
                <div
                  className="u-d-flex u-align-items-center u-justify-content-center u-rounded-circle"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#10B98120",
                    color: "#10B981",
                  }}
                >
                  <Icon name="ArrowClockwise" size={24} />
                </div>
                <button
                  onClick={() => refetchStats()}
                  className="u-btn u-btn-sm u-btn-outline-secondary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div
                      className="u-spinner-border u-spinner-border-sm"
                      role="status"
                      style={{ width: "16px", height: "16px" }}
                    >
                      <span className="u-visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    <Icon name="ArrowClockwise" size={16} />
                  )}
                </button>
              </div>

              <div className="u-mb-2">
                <h3 className="u-fs-2 u-fw-bold u-mb-0 u-text-primary-emphasis">
                  Live
                </h3>
              </div>

              <div>
                <p className="u-fs-sm u-fw-medium u-mb-1 u-text-secondary-emphasis">
                  Real-time Stats
                </p>
                <p className="u-fs-xs u-mb-0 u-text-muted">
                  Auto-refresh every {refreshInterval / 1000}s
                </p>
              </div>
            </div>
          </Card>
        </GridCol>
      </Grid>
    </div>
  );
};

export default SubscriptionStats;
