import React from 'react';
import { Card, Grid, GridCol, Icon } from '@shohojdhara/atomix';
import { StatCard } from '@/components/molecules/StatCard';

export interface PlanStatsProps {
  totalPlans: number;
  activePlans: number;
  totalSubscriptions: number;
  totalRevenue: number;
  isLoading?: boolean;
  className?: string;
}

/**
 * PlanStats Component
 * 
 * A component for displaying plan-related statistics.
 * Built using Atomix Card, Grid, and StatCard components.
 */
export const PlanStats: React.FC<PlanStatsProps> = ({
  totalPlans,
  activePlans,
  totalSubscriptions,
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
            title="Total Plans"
            value={totalPlans}
            icon="Lightning"
            iconColor="#7AFFD7"
            description="Internet plans available"
            loading={isLoading}
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Active Plans"
            value={activePlans}
            icon="CheckCircle"
            iconColor="#10B981"
            description="Currently active"
            loading={isLoading}
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Total Subscriptions"
            value={totalSubscriptions}
            icon="Users"
            iconColor="#3B82F6"
            description="Active subscriptions"
            loading={isLoading}
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon="CurrencyDollar"
            iconColor="#F59E0B"
            description="Monthly recurring revenue"
            loading={isLoading}
          />
        </GridCol>
      </Grid>
    </div>
  );
};

export default PlanStats;