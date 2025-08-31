import React from 'react';
import { Card, Icon } from '@shohojdhara/atomix';
import { Plan } from '@/types';

interface PlanStatsProps {
  plans: Plan[];
}

const PlanStats: React.FC<PlanStatsProps> = ({ plans }) => {
  const stats = React.useMemo(() => {
    const totalPlans = plans.length;
    const activePlans = plans.filter(plan => plan.is_active).length;
    const featuredPlans = plans.filter(plan => plan.is_featured).length;
    const popularPlans = plans.filter(plan => plan.is_popular).length;
    
    const totalRevenue = plans.reduce((sum, plan) => sum + (plan.price || 0), 0);
    const avgPrice = totalPlans > 0 ? totalRevenue / totalPlans : 0;
    
    const speedRanges = {
      low: plans.filter(plan => (plan.download_speed || 0) < 50).length,
      medium: plans.filter(plan => (plan.download_speed || 0) >= 50 && (plan.download_speed || 0) < 200).length,
      high: plans.filter(plan => (plan.download_speed || 0) >= 200).length,
    };

    return {
      totalPlans,
      activePlans,
      featuredPlans,
      popularPlans,
      totalRevenue,
      avgPrice,
      speedRanges,
    };
  }, [plans]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getActivePercentage = () => {
    return stats.totalPlans > 0 ? Math.round((stats.activePlans / stats.totalPlans) * 100) : 0;
  };

  return (
    <div className="u-grid u-grid-cols-2 u-md:grid-cols-4 u-gap-4 u-mb-6">
      {/* Total Plans */}
      <Card className="u-p-4">
        <div className="u-d-flex u-align-items-center u-justify-content-between">
          <div>
            <div className="u-text-sm u-text-secondary u-mb-1">Total Plans</div>
            <div className="u-text-2xl u-font-weight-bold">{stats.totalPlans}</div>
          </div>
          <div className="u-bg-primary u-p-3 u-border-radius-full">
            <Icon name="Globe" size={20} className="u-text-white" />
          </div>
        </div>
      </Card>

      {/* Active Plans */}
      <Card className="u-p-4">
        <div className="u-d-flex u-align-items-center u-justify-content-between">
          <div>
            <div className="u-text-sm u-text-secondary u-mb-1">Active Plans</div>
            <div className="u-text-2xl u-font-weight-bold">{stats.activePlans}</div>
            <div className="u-text-sm u-text-success">{getActivePercentage()}% active</div>
          </div>
          <div className="u-bg-success u-p-3 u-border-radius-full">
            <Icon name="CheckCircle" size={20} className="u-text-white" />
          </div>
        </div>
      </Card>

      {/* Featured Plans */}
      <Card className="u-p-4">
        <div className="u-d-flex u-align-items-center u-justify-content-between">
          <div>
            <div className="u-text-sm u-text-secondary u-mb-1">Featured Plans</div>
            <div className="u-text-2xl u-font-weight-bold">{stats.featuredPlans}</div>
          </div>
          <div className="u-bg-warning u-p-3 u-border-radius-full">
            <Icon name="Star" size={20} className="u-text-white" />
          </div>
        </div>
      </Card>

      {/* Average Price */}
      <Card className="u-p-4">
        <div className="u-d-flex u-align-items-center u-justify-content-between">
          <div>
            <div className="u-text-sm u-text-secondary u-mb-1">Avg. Price</div>
            <div className="u-text-2xl u-font-weight-bold">{formatCurrency(stats.avgPrice)}</div>
            <div className="u-text-sm u-text-secondary">per month</div>
          </div>
          <div className="u-bg-info u-p-3 u-border-radius-full">
            <Icon name="CurrencyDollar" size={20} className="u-text-white" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PlanStats;
