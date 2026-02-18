import React from 'react';
import { Card, Input, Button, Icon, Select } from '@shohojdhara/atomix';

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
        <div className="u-flex u-justify-between u-items-center u-mb-4">
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
            <Select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="u-w-full"
              options={[
                { value: "", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" }
              ]}
            />
          </div>

          {/* Billing Cycle Filter */}
          <div>
            <label className="u-block u-text-sm u-font-medium u-mb-1">
              Billing Cycle
            </label>
            <Select
              value={billingCycleFilter}
              onChange={(e) => onBillingCycleChange(e.target.value)}
              className="u-w-full"
              options={[
                { value: "", label: "All Cycles" },
                { value: "monthly", label: "Monthly" },
                { value: "quarterly", label: "Quarterly" },
                { value: "yearly", label: "Yearly" }
              ]}
            />
          </div>

          {/* Speed Range Filter */}
          <div>
            <label className="u-block u-text-sm u-font-medium u-mb-1">
              Speed Range
            </label>
            <Select
              value={speedRangeFilter}
              onChange={(e) => onSpeedRangeChange(e.target.value)}
              className="u-w-full"
              options={[
                { value: "", label: "All Speeds" },
                { value: "0-10", label: "0-10 Mbps" },
                { value: "10-50", label: "10-50 Mbps" },
                { value: "50-100", label: "50-100 Mbps" },
                { value: "100-500", label: "100-500 Mbps" },
                { value: "500+", label: "500+ Mbps" }
              ]}
            />
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="u-block u-text-sm u-font-medium u-mb-1">
              Price Range
            </label>
            <Select
              value={priceRangeFilter}
              onChange={(e) => onPriceRangeChange(e.target.value)}
              className="u-w-full"
              options={[
                { value: "", label: "All Prices" },
                { value: "0-25", label: "$0 - $25" },
                { value: "25-50", label: "$25 - $50" },
                { value: "50-100", label: "$50 - $100" },
                { value: "100-200", label: "$100 - $200" },
                { value: "200+", label: "$200+" }
              ]}
            />
          </div>

          {/* Special Filters */}
          <div>
            <label className="u-block u-text-sm u-font-medium u-mb-2">
              Special Filters
            </label>
            <div className="u-space-y-2">
              <label className="u-flex u-items-center u-gap-2">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => onFeaturedOnlyChange(e.target.checked)}
                />
                <span className="u-text-sm">Featured Only</span>
              </label>
              <label className="u-flex u-items-center u-gap-2">
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