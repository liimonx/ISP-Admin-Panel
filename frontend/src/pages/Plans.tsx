import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  Button, 
  Icon, 
  Grid, 
  GridCol, 
  Badge, 
  Callout,
  Spinner,
  Pagination,
  Select,
  Tooltip,
} from "@shohojdhara/atomix";
import { Plan } from "@/types";
import { apiService } from "@/services/apiService";
import { useCreatePlan, useUpdatePlan } from "@/hooks/useApi";
import { 
  PlanDetails, 
  PlanStats, 
  PlanFilters 
} from "@/components/plans";
import PlanForm from "@/components/forms/PlanForm";
import { success, error, info } from "@/utils/notifications";

const Plans: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    billing_cycle: "",
    speed_range: "",
    price_range: "",
    featured_only: false,
    popular_only: false,
  });
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // API queries and mutations
  const {
    data: plansData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["plans", currentPage, pageSize, sortBy, sortOrder, filters],
    queryFn: () =>
      apiService.getPlans({
        page: currentPage,
        page_size: pageSize,
        search: filters.search,
        ordering: `${sortOrder === 'desc' ? '-' : ''}${sortBy}`,
        is_active: filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined,
        billing_cycle: filters.billing_cycle || undefined,
        is_featured: filters.featured_only || undefined,
        is_popular: filters.popular_only || undefined,
      }),
    keepPreviousData: true,
  });

  const createPlanMutation = useCreatePlan();
  const updatePlanMutation = useUpdatePlan();
  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => apiService.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });

  // Computed values
  const plans = useMemo(() => plansData?.results || [], [plansData?.results]);
  const totalPlans = plansData?.count || 0;
  const totalPages = Math.ceil(totalPlans / pageSize);

  // Filter and sort plans client-side for additional filtering
  const filteredAndSortedPlans = useMemo(() => {
    let filtered = [...plans];

    // Speed range filtering
    if (filters.speed_range) {
      filtered = filtered.filter(plan => {
        const speed = plan.download_speed || 0;
        switch (filters.speed_range) {
          case 'low':
            return speed < 50;
          case 'medium':
            return speed >= 50 && speed < 200;
          case 'high':
            return speed >= 200;
          default:
            return true;
        }
      });
    }

    // Price range filtering
    if (filters.price_range) {
      filtered = filtered.filter(plan => {
        const price = plan.price || 0;
        switch (filters.price_range) {
          case 'low':
            return price < 50;
          case 'medium':
            return price >= 50 && price < 100;
          case 'high':
            return price >= 100;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [plans, filters.speed_range, filters.price_range]);

  // Event handlers
  const handleFiltersChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: "",
      status: "",
      billing_cycle: "",
      speed_range: "",
      price_range: "",
      featured_only: false,
      popular_only: false,
    });
    setCurrentPage(1);
  }, []);

  const handleCreatePlan = useCallback((planData: Partial<Plan>) => {
    createPlanMutation.mutate(planData, {
      onSuccess: () => {
        success("Plan created successfully!");
        setIsFormOpen(false);
        setEditingPlan(null);
      },
      onError: (error: any) => {
        error("Failed to create plan. Please try again.");
        console.error("Create plan error:", error);
      },
    });
  }, [createPlanMutation]);

  const handleUpdatePlan = useCallback((planData: Partial<Plan>) => {
    if (!editingPlan) return;
    
    updatePlanMutation.mutate(
      { id: editingPlan.id, data: planData },
      {
        onSuccess: () => {
          success("Plan updated successfully!");
          setIsFormOpen(false);
          setEditingPlan(null);
        },
        onError: (error: any) => {
          error("Failed to update plan. Please try again.");
          console.error("Update plan error:", error);
        },
      }
    );
  }, [updatePlanMutation, editingPlan]);

  const handleDeletePlan = useCallback((plan: Plan) => {
    if (window.confirm(`Are you sure you want to delete "${plan.name}"? This action cannot be undone.`)) {
      deletePlanMutation.mutate(plan.id, {
        onSuccess: () => {
          success("Plan deleted successfully!");
        },
        onError: (error: any) => {
          error("Failed to delete plan. Please try again.");
          console.error("Delete plan error:", error);
        },
      });
    }
  }, [deletePlanMutation]);

  const handleViewPlan = useCallback((plan: Plan) => {
    setSelectedPlan(plan);
    setIsDetailsOpen(true);
  }, []);

  const handleEditPlan = useCallback((plan: Plan) => {
    setEditingPlan(plan);
    setIsFormOpen(true);
  }, []);

  const handleExportPlans = useCallback(() => {
    // TODO: Implement export functionality
    info("Export functionality coming soon!");
  }, []);

  // Utility functions
  const formatSpeed = (speed: number | string | null | undefined, unit: string | null | undefined) => {
    if (speed === null || speed === undefined) return "0 Mbps";
    const numSpeed = typeof speed === 'string' ? parseFloat(speed) : speed;
    if (isNaN(numSpeed)) return "0 Mbps";
    const defaultUnit = unit || "Mbps";
    return `${numSpeed} ${defaultUnit.toUpperCase()}`;
  };

  const formatDataQuota = (quota: number | null, unit: string | null | undefined) => {
    if (!quota || !unit || unit === "unlimited") return "Unlimited";
    return `${quota} ${unit.toUpperCase()}`;
  };

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) return "$0.00";
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "$0.00";
    return `$${numPrice.toFixed(2)}`;
  };

  const getBillingCycleLabel = (cycle: string | null | undefined) => {
    if (!cycle) return "Monthly";
    const labels = {
      monthly: "Monthly",
      quarterly: "Quarterly",
      yearly: "Yearly",
    };
    return labels[cycle as keyof typeof labels] || cycle;
  };

  // Loading and error states
  if (error) {
    return (
      <div className="u-p-4">
        <Callout variant="error" title="Error Loading Plans">
          <p>Failed to load plans. Please check your connection and try again.</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="u-mt-3"
          >
            <Icon name="ArrowClockwise" size={16} />
            Retry
          </Button>
        </Callout>
      </div>
    );
  }

  return (
    <div className="u-space-y-6">
      {/* Page Header */}
      <div className="u-d-flex u-justify-content-between u-align-items-center">
        <div>
          <h1 className="u-text-3xl u-font-weight-bold u-mb-2">Internet Plans</h1>
          <p className="u-text-secondary">
            Manage your internet service plans and pricing strategies
          </p>
        </div>
        <div className="u-d-flex u-gap-3">
          <Button 
            variant="outline" 
            size="md"
            onClick={handleExportPlans}
          >
            <Icon name="Download" size={16} />
            Export
          </Button>
          <Button 
            variant="primary" 
            size="md"
            onClick={() => {
              setEditingPlan(null);
              setIsFormOpen(true);
            }}
          >
            <Icon name="Plus" size={16} />
            Add Plan
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <PlanStats plans={plans} />

      {/* Filters */}
      <PlanFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {/* Sort and View Controls */}
      <div className="u-d-flex u-justify-content-between u-align-items-center">
        <div className="u-d-flex u-gap-4 u-align-items-center">
          <div className="u-d-flex u-gap-2 u-align-items-center">
            <span className="u-text-sm u-font-weight-medium">Sort by:</span>
                         <Select
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value)}
               options={[
                 { value: "name", label: "Name" },
                 { value: "price", label: "Price" },
                 { value: "download_speed", label: "Download Speed" },
                 { value: "created_at", label: "Created Date" },
               ]}
               size="sm"
             />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <Icon 
                name={sortOrder === 'asc' ? "ArrowUp" : "ArrowDown"} 
                size={16} 
              />
            </Button>
          </div>
        </div>

        <div className="u-d-flex u-gap-2 u-align-items-center">
          <span className="u-text-sm u-text-secondary">
            {totalPlans} plan{totalPlans !== 1 ? 's' : ''} total
          </span>
                       <Select
               value={pageSize.toString()}
               onChange={(e) => {
                 setPageSize(Number(e.target.value));
                 setCurrentPage(1);
               }}
               options={[
                 { value: "12", label: "12 per page" },
                 { value: "24", label: "24 per page" },
                 { value: "48", label: "48 per page" },
               ]}
               size="sm"
             />
        </div>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="u-d-flex u-justify-content-center u-align-items-center u-py-12">
          <div className="u-text-center">
            <Spinner size="lg" className="u-mb-4" />
            <p className="u-text-secondary">Loading plans...</p>
          </div>
        </div>
      ) : filteredAndSortedPlans.length > 0 ? (
        <>
          <Grid className="u-mt-6">
            {filteredAndSortedPlans.map((plan) => (
              <GridCol key={plan.id} xs={12} md={6} lg={4} xl={3}>
                <Card className="u-h-100 u-position-relative u-transition-all u-duration-200 hover:u-shadow-lg">
                  {/* Plan Status Badges */}
                  <div className="u-position-absolute u-top-0 u-right-0 u-d-flex u-gap-1 u-flex-column">
                    {plan.is_popular && (
                      <Badge variant="primary" size="sm" label="Popular" />
                    )}
                    {plan.is_featured && (
                      <Badge variant="success" size="sm" label="Featured" />
                    )}
                    {!plan.is_active && (
                      <Badge variant="secondary" size="sm" label="Inactive" />
                    )}
                  </div>

                  {/* Plan Header */}
                  <div className="u-mb-4">
                    <h3 className="u-text-lg u-font-weight-semibold u-mb-2 u-pr-16">
                      {plan.name}
                    </h3>
                    {plan.description && (
                      <p className="u-text-secondary u-text-sm u-line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  {/* Plan Price */}
                  <div className="u-mb-4">
                    <div className="u-d-flex u-align-items-baseline u-gap-2">
                      <span className="u-text-2xl u-font-weight-bold u-text-primary">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="u-text-secondary">
                        /{getBillingCycleLabel(plan.billing_cycle)?.toLowerCase()}
                      </span>
                    </div>
                    {(plan.setup_fee && plan.setup_fee > 0) && (
                      <div className="u-text-sm u-text-secondary">
                        Setup fee: {formatPrice(plan.setup_fee)}
                      </div>
                    )}
                  </div>

                  {/* Plan Specs */}
                  <div className="u-mb-4 u-space-y-2">
                    <div className="u-d-flex u-justify-content-between u-align-items-center">
                      <span className="u-text-sm u-text-secondary">Download:</span>
                      <span className="u-font-weight-medium">
                        {formatSpeed(plan.download_speed, plan.speed_unit)}
                      </span>
                    </div>
                    <div className="u-d-flex u-justify-content-between u-align-items-center">
                      <span className="u-text-sm u-text-secondary">Upload:</span>
                      <span className="u-font-weight-medium">
                        {formatSpeed(plan.upload_speed, plan.speed_unit)}
                      </span>
                    </div>
                    <div className="u-d-flex u-justify-content-between u-align-items-center">
                      <span className="u-text-sm u-text-secondary">Data:</span>
                      <span className="u-font-weight-medium">
                        {formatDataQuota(plan.data_quota || 0, plan.quota_unit)}
                      </span>
                    </div>
                  </div>

                  {/* Plan Features Preview */}
                  {plan.features && plan.features.length > 0 && (
                    <div className="u-mb-4">
                      <h4 className="u-text-sm u-font-weight-medium u-mb-2">
                        Features:
                      </h4>
                      <div className="u-space-y-1">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <div
                            key={index}
                            className="u-d-flex u-align-items-center u-gap-2"
                          >
                            <Icon
                              name="Check"
                              size={14}
                              className="u-text-success"
                            />
                            <span className="u-text-sm u-line-clamp-1">{feature}</span>
                          </div>
                        ))}
                        {plan.features.length > 3 && (
                          <div className="u-text-sm u-text-secondary">
                            +{plan.features.length - 3} more features
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Plan Actions */}
                  <div className="u-d-flex u-gap-2 u-mt-auto">
                    <Tooltip content="View Details">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="u-flex-1"
                        onClick={() => handleViewPlan(plan)}
                      >
                        <Icon name="Eye" size={16} />
                        View
                      </Button>
                    </Tooltip>
                    <Tooltip content="Edit Plan">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="u-flex-1"
                        onClick={() => handleEditPlan(plan)}
                      >
                        <Icon name="Pencil" size={16} />
                        Edit
                      </Button>
                    </Tooltip>
                    <Tooltip content="Delete Plan">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePlan(plan)}
                        className="u-text-error hover:u-bg-error hover:u-text-white"
                        disabled={deletePlanMutation.isLoading}
                      >
                        <Icon name="Trash" size={16} />
                      </Button>
                    </Tooltip>
                  </div>
                </Card>
              </GridCol>
            ))}
          </Grid>

                     {/* Pagination */}
           {totalPages > 1 && (
             <div className="u-d-flex u-justify-content-center u-mt-8">
               <Pagination
                 currentPage={currentPage}
                 totalPages={totalPages}
                 onPageChange={setCurrentPage}
               />
             </div>
           )}
        </>
      ) : (
        /* Empty State */
        <Card>
          <div className="u-text-center u-py-12">
            <Icon
              name="Globe"
              size={64}
              className="u-text-secondary u-mb-4"
            />
            <h3 className="u-text-xl u-font-weight-semibold u-mb-2">
              {filters.search || Object.values(filters).some(f => f !== "" && f !== false)
                ? "No plans match your criteria"
                : "No plans found"
              }
            </h3>
            <p className="u-text-secondary u-mb-6 u-max-w-md u-mx-auto">
              {filters.search || Object.values(filters).some(f => f !== "" && f !== false)
                ? "Try adjusting your search criteria or filters to find what you're looking for."
                : "Get started by creating your first internet plan to offer to customers."
              }
            </p>
            <div className="u-d-flex u-gap-3 u-justify-content-center">
              {(filters.search || Object.values(filters).some(f => f !== "" && f !== false)) && (
                <Button variant="outline" onClick={handleResetFilters}>
                  <Icon name="X" size={16} />
                  Clear Filters
                </Button>
              )}
              <Button 
                variant="primary"
                onClick={() => {
                  setEditingPlan(null);
                  setIsFormOpen(true);
                }}
              >
                <Icon name="Plus" size={16} />
                Create Your First Plan
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modals */}
      <PlanForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPlan(null);
        }}
        plan={editingPlan}
        onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan}
        isLoading={createPlanMutation.isLoading || updatePlanMutation.isLoading}
      />

      <PlanDetails
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        onEdit={() => {
          if (selectedPlan) {
            setEditingPlan(selectedPlan);
            setIsDetailsOpen(false);
            setIsFormOpen(true);
          }
        }}
      />
    </div>
  );
};

export default Plans;
