import React from 'react';
import { Card, Grid, GridCol } from '@shohojdhara/atomix';
import { StatCard } from '@/components/molecules/StatCard';

export interface SubscriptionStatsProps {
  totalSubscriptions: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  suspendedSubscriptions: number;
  totalRevenue: number;
  isLoading?: boolean;
  className?: string;
}

/**
 * SubscriptionStats Component
 * 
 * A component for displaying subscription-related statistics.
 * Built using Atomix Card, Grid, and StatCard components.
 */
export const SubscriptionStats: React.FC<SubscriptionStatsProps> = ({
  totalSubscriptions,
  activeSubscriptions,
  pendingSubscriptions,
  suspendedSubscriptions,
  totalRevenue,
  isLoading = false,
  className = '',
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className={className}>
      <Grid>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Total Subscriptions"
            value={totalSubscriptions}
            icon="CreditCard"
            iconColor="#7AFFD7"
            description="All subscriptions"
            loading={isLoading}
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Active Subscriptions"
            value={activeSubscriptions}
            icon="CheckCircle"
            iconColor="#10B981"
            description="Currently active"
            loading={isLoading}
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Pending Subscriptions"
            value={pendingSubscriptions}
            icon="Clock"
            iconColor="#F59E0B"
            description="Awaiting activation"
            loading={isLoading}
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Suspended Subscriptions"
            value={suspendedSubscriptions}
            icon="XCircle"
            iconColor="#EF4444"
            description="Temporarily suspended"
            loading={isLoading}
          />
        </GridCol>
      </Grid>

      {/* Revenue Card */}
      <Grid className="u-mt-4">
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(totalRevenue)}
            icon="CurrencyDollar"
            iconColor="#8B5CF6"
            description="From active subscriptions"
            loading={isLoading}
          />
        </GridCol>
      </Grid>
    </div>
  );
};

export default SubscriptionStats;