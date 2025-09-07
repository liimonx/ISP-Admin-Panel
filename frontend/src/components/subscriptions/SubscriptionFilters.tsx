import React from 'react';
import { Card, Input, Button, Icon } from '@shohojdhara/atomix';

export interface SubscriptionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  planFilter: string;
  onPlanChange: (plan: string) => void;
  routerFilter: string;
  onRouterChange: (router: string) => void;
  onReset: () => void;
  className?: string;
}

/**
 * SubscriptionFilters Component
 * 
 * A component for filtering subscriptions with various criteria.
 * Built using Atomix Card, Input, Button, and Icon components.
 */
export const SubscriptionFilters: React.FC<SubscriptionFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  planFilter,
  onPlanChange,
  routerFilter,
  onRouterChange,
  onReset,
  className = '',
}) => {
  return (
    <Card className={`u-mb-6 ${className}`}>
      <div className="u-p-4">
        <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-4">
          <h3 className="u-text-lg u-fw-semibold">Filter Subscriptions</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
          >
            <Icon name="X" size={16} />
            Clear Filters
          </Button>
        </div>

        <div className="u-grid u-grid-cols-1 u-gap-4 md:u-grid-cols-2 lg:u-grid-cols-4">
          {/* Search */}
          <div>
            <label className="u-d-block u-text-sm u-fw-medium u-mb-1">
              Search Subscriptions
            </label>
            <Input
              type="text"
              placeholder="Search by customer, username..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="u-d-block u-text-sm u-fw-medium u-mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="u-w-100 u-p-2 u-border u-rounded u-bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div>
            <label className="u-d-block u-text-sm u-fw-medium u-mb-1">
              Plan
            </label>
            <select
              value={planFilter}
              onChange={(e) => onPlanChange(e.target.value)}
              className="u-w-100 u-p-2 u-border u-rounded u-bg-white"
            >
              <option value="all">All Plans</option>
              <option value="basic">Basic Plan</option>
              <option value="standard">Standard Plan</option>
              <option value="premium">Premium Plan</option>
              <option value="enterprise">Enterprise Plan</option>
            </select>
          </div>

          {/* Router Filter */}
          <div>
            <label className="u-d-block u-text-sm u-fw-medium u-mb-1">
              Router
            </label>
            <select
              value={routerFilter}
              onChange={(e) => onRouterChange(e.target.value)}
              className="u-w-100 u-p-2 u-border u-rounded u-bg-white"
            >
              <option value="all">All Routers</option>
              <option value="router-1">Router 1</option>
              <option value="router-2">Router 2</option>
              <option value="router-3">Router 3</option>
            </select>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SubscriptionFilters;