import React from "react";
import {
  Card,
  Input,
  Button,
  Select,
  Grid,
  GridCol,
} from "@shohojdhara/atomix";

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
  className = "",
}) => {
  return (
    <Card className={`u-mb-6 ${className}`}>
      <div className="u-p-4">
        <div className="u-flex u-justify-between u-items-center u-mb-4">
          <h3 className="u-fs-lg u-font-bold">Filter Subscriptions</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            iconName="X"
            iconSize={16}
          >
            Clear Filters
          </Button>
        </div>

        <Grid>
          {/* Search */}
          <GridCol xs={12} md={6} lg={3}>
            <label className="u-block u-fs-sm u-font-normal u-mb-1">
              Search Subscriptions
            </label>
            <Input
              className="u-w-100"
              placeholder="Search by customer, username..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </GridCol>

          {/* Status Filter */}
          <GridCol xs={12} md={6} lg={3}>
            <label className="u-block u-fs-sm u-font-normal u-mb-1">
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
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </GridCol>

          {/* Plan Filter */}
          <GridCol xs={12} md={6} lg={3}>
            <label className="u-block u-fs-sm u-font-normal u-mb-1">Plan</label>
            <Select
              value={planFilter}
              onChange={(e) => onPlanChange(e.target.value)}
              className="u-w-100"
              options={[
                { value: "all", label: "All Plans" },
                { value: "basic", label: "Basic Plan" },
                { value: "standard", label: "Standard Plan" },
                { value: "premium", label: "Premium Plan" },
                { value: "enterprise", label: "Enterprise Plan" },
              ]}
            />
          </GridCol>

          {/* Router Filter */}
          <GridCol xs={12} md={6} lg={3}>
            <label className="u-block u-fs-sm u-font-normal u-mb-1">
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
                { value: "router-3", label: "Router 3" },
              ]}
            />
          </GridCol>
        </Grid>
      </div>
    </Card>
  );
};

export default SubscriptionFilters;
