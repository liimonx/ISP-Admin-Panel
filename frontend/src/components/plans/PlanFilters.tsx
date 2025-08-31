import React, { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Checkbox,
  Icon,
} from '@shohojdhara/atomix';

interface PlanFiltersProps {
  filters: {
    search: string;
    status: string;
    billing_cycle: string;
    speed_range: string;
    price_range: string;
    featured_only: boolean;
    popular_only: boolean;
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

const PlanFilters: React.FC<PlanFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.search ||
      filters.status ||
      filters.billing_cycle ||
      filters.speed_range ||
      filters.price_range ||
      filters.featured_only ||
      filters.popular_only
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status) count++;
    if (filters.billing_cycle) count++;
    if (filters.speed_range) count++;
    if (filters.price_range) count++;
    if (filters.featured_only) count++;
    if (filters.popular_only) count++;
    return count;
  };

  return (
    <Card className="u-mb-6">
      <div className="u-space-y-4">
        {/* Basic Search */}
        <div className="u-d-flex u-gap-4 u-align-items-end">
          <div className="u-flex-1">
            <label className="u-block u-mb-2 u-font-weight-medium">Search Plans</label>
            <Input
              type="text"
              placeholder="Search by name, description, or features..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
            {isExpanded ? "Hide" : "Advanced"} Filters
            {hasActiveFilters() && (
              <span className="u-bg-primary u-text-white u-px-2 u-py-1 u-border-radius-full u-text-xs u-ml-2">
                {getActiveFiltersCount()}
              </span>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="u-space-y-4 u-pt-4 u-border-top">
            <div className="u-grid u-grid-cols-2 u-md:grid-cols-4 u-gap-4">
              {/* Status Filter */}
              <div>
                <label className="u-block u-mb-2 u-font-weight-medium">Status</label>
                <Select
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                />
              </div>

              {/* Billing Cycle Filter */}
              <div>
                <label className="u-block u-mb-2 u-font-weight-medium">Billing Cycle</label>
                <Select
                  value={filters.billing_cycle}
                  onChange={(value) => handleFilterChange('billing_cycle', value)}
                  options={[
                    { value: '', label: 'All Cycles' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'yearly', label: 'Yearly' },
                  ]}
                />
              </div>

              {/* Speed Range Filter */}
              <div>
                <label className="u-block u-mb-2 u-font-weight-medium">Speed Range</label>
                <Select
                  value={filters.speed_range}
                  onChange={(value) => handleFilterChange('speed_range', value)}
                  options={[
                    { value: '', label: 'All Speeds' },
                    { value: 'low', label: 'Low (< 50 Mbps)' },
                    { value: 'medium', label: 'Medium (50-200 Mbps)' },
                    { value: 'high', label: 'High (> 200 Mbps)' },
                  ]}
                />
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="u-block u-mb-2 u-font-weight-medium">Price Range</label>
                <Select
                  value={filters.price_range}
                  onChange={(value) => handleFilterChange('price_range', value)}
                  options={[
                    { value: '', label: 'All Prices' },
                    { value: 'low', label: 'Low (< $50)' },
                    { value: 'medium', label: 'Medium ($50-$100)' },
                    { value: 'high', label: 'High (> $100)' },
                  ]}
                />
              </div>
            </div>

            {/* Checkbox Filters */}
            <div className="u-d-flex u-gap-6 u-flex-wrap">
              <Checkbox
                checked={filters.featured_only}
                onChange={(checked) => handleFilterChange('featured_only', checked)}
                label="Featured Plans Only"
              />
              <Checkbox
                checked={filters.popular_only}
                onChange={(checked) => handleFilterChange('popular_only', checked)}
                label="Popular Plans Only"
              />
            </div>

            {/* Filter Actions */}
            <div className="u-d-flex u-justify-content-between u-align-items-center u-pt-4 u-border-top">
              <div className="u-text-sm u-text-secondary">
                {hasActiveFilters() ? (
                  `${getActiveFiltersCount()} filter${getActiveFiltersCount() !== 1 ? 's' : ''} active`
                ) : (
                  'No filters applied'
                )}
              </div>
              <div className="u-d-flex u-gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  disabled={!hasActiveFilters()}
                >
                  <Icon name="X" size={16} />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PlanFilters;
