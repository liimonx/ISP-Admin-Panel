import React from 'react';
import { Card, Input, Button, Icon } from '@shohojdhara/atomix';

export interface PlanFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  billingCycleFilter: string;
  onBillingCycleChange: (cycle: string) => void;
  speedRangeFilter: string;
  onSpeedRangeChange: (range: string) => void;
  priceRangeFilter: string;
  onPriceRangeChange: (range: string) => void;
  featuredOnly: boolean;
  onFeaturedOnlyChange: (featured: boolean) => void;
  popularOnly: boolean;
  onPopularOnlyChange: (popular: boolean) => void;
  onReset: () => void;
  className?: string;
}

/**
 * PlanFilters Component
 * 
 * A component for filtering plans with various criteria.
 * Built using Atomix Card, Input, Button, and Icon components.
 */
export const PlanFilters: React.FC<PlanFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  billingCycleFilter,
  onBillingCycleChange,
  speedRangeFilter,
  onSpeedRangeChange,
  priceRangeFilter,
  onPriceRangeChange,
  featuredOnly,
  onFeaturedOnlyChange,
  popularOnly,
  onPopularOnlyChange,
  onReset,
  className = '',
}) => {
  return (
    <Card className={`u-mb-6 ${className}`}>
      <div className="u-p-4">
        <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-4">
          <h3 className="u-text-lg u-font-semibold">Filter Plans</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
          >
            <Icon name="X" size={16} />
            Clear Filters
          </Button>
        </div>

        <div className="u-grid u-grid-cols-1 u-gap-4 md:u-grid-cols-2 lg:u-grid-cols-3">
          {/* Search */}
          <div>
            <label className="u-block u-text-sm u-font-medium u-mb-1">
              Search Plans
            </label>
            <Input
              type="text"
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="u-block u-text-sm u-font-medium u-mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="u-w-full u-p-2 u-border u-rounded u-bg-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Billing Cycle Filter */}
          <div>
            <label className="u-block u-text-sm u-font-medium u-mb-1">
              Billing Cycle
            </label>
            <select
              value={billingCycleFilter}
              onChange={(e) => onBillingCycleChange(e.target.value)}
              className="u-w-full u-p-2 u-border u-rounded u-bg-white"
            >
              <option value="">All Cycles</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Speed Range Filter */}
          <div>
            <label className="u-block u-text-sm u-font-medium u-mb-1">
              Speed Range
            </label>
            <select
              value={speedRangeFilter}
              onChange={(e) => onSpeedRangeChange(e.target.value)}
              className="u-w-full u-p-2 u-border u-rounded u-bg-white"
            >
              <option value="">All Speeds</option>
              <option value="0-10">0-10 Mbps</option>
              <option value="10-50">10-50 Mbps</option>
              <option value="50-100">50-100 Mbps</option>
              <option value="100-500">100-500 Mbps</option>
              <option value="500+">500+ Mbps</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="u-block u-text-sm u-font-medium u-mb-1">
              Price Range
            </label>
            <select
              value={priceRangeFilter}
              onChange={(e) => onPriceRangeChange(e.target.value)}
              className="u-w-full u-p-2 u-border u-rounded u-bg-white"
            >
              <option value="">All Prices</option>
              <option value="0-25">$0 - $25</option>
              <option value="25-50">$25 - $50</option>
              <option value="50-100">$50 - $100</option>
              <option value="100-200">$100 - $200</option>
              <option value="200+">$200+</option>
            </select>
          </div>

          {/* Special Filters */}
          <div>
            <label className="u-block u-text-sm u-font-medium u-mb-2">
              Special Filters
            </label>
            <div className="u-space-y-2">
              <label className="u-d-flex u-align-items-center u-gap-2">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => onFeaturedOnlyChange(e.target.checked)}
                />
                <span className="u-text-sm">Featured Only</span>
              </label>
              <label className="u-d-flex u-align-items-center u-gap-2">
                <input
                  type="checkbox"
                  checked={popularOnly}
                  onChange={(e) => onPopularOnlyChange(e.target.checked)}
                />
                <span className="u-text-sm">Popular Only</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PlanFilters;