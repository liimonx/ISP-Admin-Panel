import React from 'react';
import { Card, Input, Button, Icon, Select } from '@shohojdhara/atomix';

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
            <Select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="u-w-100"
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "pending", label: "Pending" },
                { value: "suspended", label: "Suspended" },
                { value: "cancelled", label: "Cancelled" }
              ]}
            />
          </div>

          {/* Plan Filter */}
          <div>
            <label className="u-d-block u-text-sm u-fw-medium u-mb-1">
              Plan
            </label>
            <Select
              value={planFilter}
              onChange={(e) => onPlanChange(e.target.value)}
              className="u-w-100"
              options={[
                { value: "all", label: "All Plans" },
                { value: "basic", label: "Basic Plan" },
                { value: "standard", label: "Standard Plan" },
                { value: "premium", label: "Premium Plan" },
                { value: "enterprise", label: "Enterprise Plan" }
              ]}
            />
          </div>

          {/* Router Filter */}
          <div>
            <label className="u-d-block u-text-sm u-fw-medium u-mb-1">
              Router
            </label>
            <Select
              value={routerFilter}
              onChange={(e) => onRouterChange(e.target.value)}
              className="u-w-100"
              options={[
                { value: "all", label: "All Routers" },
                { value: "router-1", label: "Router 1" },
                { value: "router-2", label: "Router 2" },
                { value: "router-3", label: "Router 3" }
              ]}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SubscriptionFilters;