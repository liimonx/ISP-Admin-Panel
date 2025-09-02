import React from "react";
import { Card, Input, Button, Icon, Badge, Dropdown } from "@shohojdhara/atomix";

interface SubscriptionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  planFilter: string;
  onPlanChange: (plan: string) => void;
  routerFilter: string;
  onRouterChange: (router: string) => void;
  onClearFilters: () => void;
  onExport: () => void;
  plans?: Array<{ id: number; name: string }>;
  routers?: Array<{ id: number; name: string }>;
}

const SubscriptionFilters: React.FC<SubscriptionFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  planFilter,
  onPlanChange,
  routerFilter,
  onRouterChange,
  onClearFilters,
  onExport,
  plans = [],
  routers = [],
}) => {
  const statusOptions = [
    { value: "all", label: "All Status", count: 0 },
    { value: "active", label: "Active", count: 0 },
    { value: "inactive", label: "Inactive", count: 0 },
    { value: "suspended", label: "Suspended", count: 0 },
    { value: "cancelled", label: "Cancelled", count: 0 },
    { value: "pending", label: "Pending", count: 0 },
  ];

  const hasActiveFilters = statusFilter !== "all" || planFilter !== "all" || routerFilter !== "all" || searchQuery.trim();

  return (
    <Card className="u-p-4 u-mb-6 u-border-0 u-shadow-sm">
      <div className="u-d-flex u-flex-column u-gap-4">
        {/* Search and Quick Actions Row */}
        <div className="u-d-flex u-flex-wrap u-align-items-center u-gap-3">
          <div className="u-flex-grow-1" style={{ minWidth: "300px" }}>
            <div className="u-position-relative">
              <Input
                placeholder="Search by customer name, username, or email..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="u-ps-5"
              />
              <Icon 
                name="MagnifyingGlass" 
                size={16} 
                className="u-position-absolute u-top-50 u-start-0 u-translate-middle-y u-ms-3 u-text-secondary-emphasis" 
              />
            </div>
          </div>
          
          <div className="u-d-flex u-gap-2">
            <Button variant="outline" size="md" onClick={onExport}>
              <Icon name="Download" size={16} />
              Export
            </Button>
            
            <Dropdown
              menu={
                <div className="u-p-2">
                  <button className="dropdown-item u-d-flex u-align-items-center u-gap-2">
                    <Icon name="FileText" size={16} />
                    Export as CSV
                  </button>
                  <button className="dropdown-item u-d-flex u-align-items-center u-gap-2">
                    <Icon name="FileText" size={16} />
                    Export as Excel
                  </button>
                  <button className="dropdown-item u-d-flex u-align-items-center u-gap-2">
                    <Icon name="FileText" size={16} />
                    Export as PDF
                  </button>
                </div>
              }
            >
              <Button variant="ghost" size="md">
                <Icon name="DotsThreeVertical" size={16} />
              </Button>
            </Dropdown>
          </div>
        </div>

        {/* Filters Row */}
        <div className="u-d-flex u-flex-wrap u-align-items-center u-gap-3">
          {/* Status Filter */}
          <div className="u-d-flex u-flex-column u-gap-1">
            <label className="u-fs-sm u-fw-medium u-text-secondary-emphasis">Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              style={{ minWidth: "140px" }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Plan Filter */}
          <div className="u-d-flex u-flex-column u-gap-1">
            <label className="u-fs-sm u-fw-medium u-text-secondary-emphasis">Plan</label>
            <select
              className="form-select"
              value={planFilter}
              onChange={(e) => onPlanChange(e.target.value)}
              style={{ minWidth: "160px" }}
            >
              <option value="all">All Plans</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id.toString()}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>

          {/* Router Filter */}
          <div className="u-d-flex u-flex-column u-gap-1">
            <label className="u-fs-sm u-fw-medium u-text-secondary-emphasis">Router</label>
            <select
              className="form-select"
              value={routerFilter}
              onChange={(e) => onRouterChange(e.target.value)}
              style={{ minWidth: "160px" }}
            >
              <option value="all">All Routers</option>
              {routers.map((router) => (
                <option key={router.id} value={router.id.toString()}>
                  {router.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="u-d-flex u-align-items-end">
              <Button 
                variant="ghost" 
                size="md" 
                onClick={onClearFilters}
                className="u-text-error-emphasis"
              >
                <Icon name="X" size={16} />
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="u-d-flex u-flex-wrap u-align-items-center u-gap-2">
            <span className="u-fs-sm u-text-secondary-emphasis">Active filters:</span>
            
            {searchQuery.trim() && (
              <Badge variant="secondary" size="sm">
                Search: "{searchQuery.trim()}"
                <button 
                  className="u-ms-1 u-border-0 u-bg-transparent u-text-inherit"
                  onClick={() => onSearchChange("")}
                >
                  <Icon name="X" size={12} />
                </button>
              </Badge>
            )}
            
            {statusFilter !== "all" && (
              <Badge variant="secondary" size="sm">
                Status: {statusOptions.find(s => s.value === statusFilter)?.label}
                <button 
                  className="u-ms-1 u-border-0 u-bg-transparent u-text-inherit"
                  onClick={() => onStatusChange("all")}
                >
                  <Icon name="X" size={12} />
                </button>
              </Badge>
            )}
            
            {planFilter !== "all" && (
              <Badge variant="secondary" size="sm">
                Plan: {plans.find(p => p.id.toString() === planFilter)?.name}
                <button 
                  className="u-ms-1 u-border-0 u-bg-transparent u-text-inherit"
                  onClick={() => onPlanChange("all")}
                >
                  <Icon name="X" size={12} />
                </button>
              </Badge>
            )}
            
            {routerFilter !== "all" && (
              <Badge variant="secondary" size="sm">
                Router: {routers.find(r => r.id.toString() === routerFilter)?.name}
                <button 
                  className="u-ms-1 u-border-0 u-bg-transparent u-text-inherit"
                  onClick={() => onRouterChange("all")}
                >
                  <Icon name="X" size={12} />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default SubscriptionFilters;