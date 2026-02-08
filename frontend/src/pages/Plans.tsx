import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Card,
  Button,
  Icon,
  Grid,
  GridCol,
  Badge,
  Input,
  Select,
  Modal,
  Callout,
  Spinner,
  DataTable,
  Pagination,
  Toggle,
  Textarea,
} from "@shohojdhara/atomix";
import { Plan } from "@/types";
import { apiService } from "@/services/apiService";
import { sanitizeText } from "@/utils/sanitizer";

const BILLING_CYCLES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const Plans: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [billingCycleFilter, setBillingCycleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    billing_cycle: "monthly" as "monthly" | "quarterly" | "yearly",
    download_speed: "",
    upload_speed: "",
    speed_unit: "mbps" as "mbps" | "gbps",
    data_quota: "",
    quota_unit: "gb" as "gb" | "tb" | "unlimited",
    setup_fee: "",
    features: "",
    is_active: true,
    is_featured: false,
    is_popular: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const itemsPerPage = 12;

  // Build query parameters
  const buildQueryParams = () => {
    const params: any = {
      page: currentPage,
      limit: itemsPerPage,
    };

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    if (statusFilter !== "all") {
      params.is_active = statusFilter === "active";
    }

    if (billingCycleFilter !== "all") {
      params.billing_cycle = billingCycleFilter;
    }

    return params;
  };

  // Fetch plans
  const {
    data: plansData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "plans",
      currentPage,
      searchQuery,
      statusFilter,
      billingCycleFilter,
    ],
    queryFn: () => apiService.plans.getPlans(buildQueryParams()),
    keepPreviousData: true,
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Fetch plan statistics
  const { data: planStats } = useQuery({
    queryKey: ["plan-stats"],
    queryFn: () => apiService.plans.getPlanStats(),
    staleTime: 60000, // 1 minute
    retry: 1,
  });

  // Create plan mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<Plan, "id" | "created_at" | "updated_at">) =>
      apiService.plans.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plan-stats"] });
      setIsCreateModalOpen(false);
      resetForm();
      toast.success("Plan created successfully");
    },
    onError: (error: any) => {
      console.error("Failed to create plan:", error);
      toast.error("Failed to create plan");
    },
  });

  // Update plan mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Plan> }) =>
      apiService.plans.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plan-stats"] });
      setIsEditModalOpen(false);
      setSelectedPlan(null);
      resetForm();
      toast.success("Plan updated successfully");
    },
    onError: (error: any) => {
      console.error("Failed to update plan:", error);
      toast.error("Failed to update plan");
    },
  });

  // Delete plan mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.plans.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plan-stats"] });
      setIsDeleteModalOpen(false);
      setSelectedPlan(null);
      toast.success("Plan deleted successfully");
    },
    onError: (error: any) => {
      console.error("Failed to delete plan:", error);
      toast.error("Failed to delete plan");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      billing_cycle: "monthly",
      download_speed: "",
      upload_speed: "",
      speed_unit: "mbps",
      data_quota: "",
      quota_unit: "gb",
      setup_fee: "",
      features: "",
      is_active: true,
      is_featured: false,
      is_popular: false,
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Plan name is required";
    }

    if (!formData.price) {
      errors.price = "Price is required";
    } else if (
      isNaN(parseFloat(formData.price)) ||
      parseFloat(formData.price) < 0
    ) {
      errors.price = "Please enter a valid price";
    }

    if (!formData.download_speed) {
      errors.download_speed = "Download speed is required";
    } else if (
      isNaN(parseFloat(formData.download_speed)) ||
      parseFloat(formData.download_speed) <= 0
    ) {
      errors.download_speed = "Please enter a valid download speed";
    }

    if (!formData.upload_speed) {
      errors.upload_speed = "Upload speed is required";
    } else if (
      isNaN(parseFloat(formData.upload_speed)) ||
      parseFloat(formData.upload_speed) <= 0
    ) {
      errors.upload_speed = "Please enter a valid upload speed";
    }

    if (!formData.setup_fee) {
      errors.setup_fee = "Setup fee is required";
    } else if (
      isNaN(parseFloat(formData.setup_fee)) ||
      parseFloat(formData.setup_fee) < 0
    ) {
      errors.setup_fee = "Please enter a valid setup fee";
    }

    if (
      formData.data_quota &&
      (isNaN(parseFloat(formData.data_quota)) ||
        parseFloat(formData.data_quota) < 0)
    ) {
      errors.data_quota = "Please enter a valid data quota";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleCreate = () => {
    if (!validateForm()) return;

    const sanitizedData = {
      ...formData,
      name: sanitizeText(formData.name),
      description: sanitizeText(formData.description),
      price: parseFloat(formData.price),
      setup_fee: parseFloat(formData.setup_fee),
      download_speed: parseInt(formData.download_speed),
      upload_speed: parseInt(formData.upload_speed),
      data_quota: formData.data_quota
        ? parseInt(formData.data_quota)
        : undefined,
      features: formData.features.split("\n").filter((f) => f.trim()),
    };

    createMutation.mutate(sanitizedData);
  };

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: plan.price.toString(),
      billing_cycle: plan.billing_cycle,
      download_speed: plan.download_speed.toString(),
      upload_speed: plan.upload_speed.toString(),
      speed_unit: plan.speed_unit,
      data_quota: plan.data_quota?.toString() || "",
      quota_unit: plan.quota_unit,
      setup_fee: plan.setup_fee.toString(),
      features: plan.features.join("\n"),
      is_active: plan.is_active,
      is_featured: plan.is_featured || false,
      is_popular: plan.is_popular || false,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!validateForm() || !selectedPlan) return;

    const sanitizedData = {
      name: sanitizeText(formData.name),
      description: sanitizeText(formData.description),
      price: parseFloat(formData.price),
      billing_cycle: formData.billing_cycle,
      setup_fee: parseFloat(formData.setup_fee),
      download_speed: parseInt(formData.download_speed),
      upload_speed: parseInt(formData.upload_speed),
      speed_unit: formData.speed_unit,
      data_quota: formData.data_quota
        ? parseInt(formData.data_quota)
        : undefined,
      quota_unit: formData.quota_unit,
      features: formData.features.split("\n").filter((f) => f.trim()),
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      is_popular: formData.is_popular,
    };

    updateMutation.mutate({ id: selectedPlan.id, data: sanitizedData });
  };

  const handleDelete = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPlan) {
      deleteMutation.mutate(selectedPlan.id);
    }
  };

  const getBillingCycleLabel = (cycle: string) => {
    return BILLING_CYCLES.find((c) => c.value === cycle)?.label || cycle;
  };

  const formatPrice = (price: number, cycle: string) => {
    const symbol = "৳"; // Bangladeshi Taka symbol
    return `${symbol}${price}/${cycle === "monthly" ? "mo" : cycle === "quarterly" ? "qtr" : "yr"}`;
  };

  if (error) {
    return (
      <div className="u-p-4">
        <Callout variant="error">
          <strong>Error loading plans:</strong> {error.message}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="u-ml-2"
          >
            Try Again
          </Button>
        </Callout>
      </div>
    );
  }

  return (
    <div className="u-p-6">
      {/* Header */}
      <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-6">
        <div>
          <h1 className="u-h2 u-mb-2">Plans Management</h1>
          <p className="u-text-secondary">
            Manage internet service plans and pricing
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          disabled={isLoading}
        >
          <Icon name="Plus" size={16} className="u-me-2" />
          Add Plan
        </Button>
      </div>

      {/* Statistics Cards */}
      {planStats && (
        <Grid className="u-mb-6">
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-d-flex u-align-items-center">
                <div className="u-bg-primary-subtle u-p-3 u-rounded u-me-3">
                  <Icon name="Package" size={24} className="u-text-primary" />
                </div>
                <div>
                  <h3 className="u-h4 u-mb-1">{planStats.total_plans || 0}</h3>
                  <p className="u-text-secondary u-mb-0">Total Plans</p>
                </div>
              </div>
            </Card>
          </GridCol>
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-d-flex u-align-items-center">
                <div className="u-bg-success-subtle u-p-3 u-rounded u-me-3">
                  <Icon
                    name="CheckCircle"
                    size={24}
                    className="u-text-success"
                  />
                </div>
                <div>
                  <h3 className="u-h4 u-mb-1">{planStats.active_plans || 0}</h3>
                  <p className="u-text-secondary u-mb-0">Active Plans</p>
                </div>
              </div>
            </Card>
          </GridCol>
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-d-flex u-align-items-center">
                <div className="u-bg-warning-subtle u-p-3 u-rounded u-me-3">
                  <Icon name="Star" size={24} className="u-text-warning" />
                </div>
                <div>
                  <h3 className="u-h4 u-mb-1">
                    {planStats.featured_plans || 0}
                  </h3>
                  <p className="u-text-secondary u-mb-0">Featured Plans</p>
                </div>
              </div>
            </Card>
          </GridCol>
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-d-flex u-align-items-center">
                <div className="u-bg-info-subtle u-p-3 u-rounded u-me-3">
                  <Icon name="TrendUp" size={24} className="u-text-info" />
                </div>
                <div>
                  <h3 className="u-h4 u-mb-1">
                    {planStats.popular_plans || 0}
                  </h3>
                  <p className="u-text-secondary u-mb-0">Popular Plans</p>
                </div>
              </div>
            </Card>
          </GridCol>
        </Grid>
      )}

      {/* Filters */}
      <Card className="u-p-4 u-mb-4">
        <Grid>
          <GridCol xs={12} md={4}>
            <Input
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="u-w-100"
            />
          </GridCol>
          <GridCol xs={6} md={4}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="u-w-100"
              options={[
                { value: "all", label: "All Statuses" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </GridCol>
          <GridCol xs={6} md={4}>
            <Select
              value={billingCycleFilter}
              onChange={(e) => setBillingCycleFilter(e.target.value)}
              className="u-w-100"
              options={[
                { value: "all", label: "All Billing Cycles" },
                ...BILLING_CYCLES,
              ]}
            />
          </GridCol>
        </Grid>
      </Card>

      {/* Plans Table */}
      <Card>
        {isLoading ? (
          <div className="u-text-center u-p-6">
            <Spinner size="lg" />
            <p className="u-mt-3 u-text-secondary">Loading plans...</p>
          </div>
        ) : (
          <>
            <DataTable
              data={
                plansData?.results?.map((plan: Plan) => ({
                  id: plan.id,
                  planName: (
                    <div>
                      <div className="u-fw-medium">{plan.name}</div>
                      {plan.description && (
                        <div className="u-text-secondary u-text-sm">
                          {plan.description.length > 50
                            ? `${plan.description.substring(0, 50)}...`
                            : plan.description}
                        </div>
                      )}
                      <div className="u-d-flex u-gap-2 u-mt-1">
                        {plan.is_featured && (
                          <Badge variant="warning" size="sm" label="Featured" />
                        )}
                        {plan.is_popular && (
                          <Badge variant="info" size="sm" label="Popular" />
                        )}
                      </div>
                    </div>
                  ),
                  price: (
                    <div>
                      <div className="u-fw-medium">
                        {formatPrice(plan.price, plan.billing_cycle)}
                      </div>
                      <div className="u-text-secondary u-text-sm">
                        {getBillingCycleLabel(plan.billing_cycle)}
                      </div>
                    </div>
                  ),
                  speed: `${plan.download_speed} ${plan.speed_unit.toUpperCase()}`,
                  dataLimit: plan.data_quota
                    ? `${plan.data_quota} ${plan.quota_unit.toUpperCase()}`
                    : "Unlimited",
                  status: (
                    <Badge
                      variant={plan.is_active ? "success" : "secondary"}
                      label={plan.is_active ? "Active" : "Inactive"}
                    />
                  ),
                  actions: (
                    <div className="u-d-flex u-gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(plan)}
                      >
                        <Icon name="Pencil" size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(plan)}
                      >
                        <Icon name="Trash" size={14} />
                      </Button>
                    </div>
                  ),
                })) || []
              }
              columns={[
                { key: "planName", title: "Plan Name" },
                { key: "price", title: "Price" },
                { key: "speed", title: "Speed" },
                { key: "dataLimit", title: "Data Limit" },
                { key: "status", title: "Status" },
                { key: "actions", title: "Actions" },
              ]}
            />

            {/* Pagination */}
            {plansData &&
              Math.ceil((plansData.count || 0) / itemsPerPage) > 1 && (
                <div className="u-p-4 u-border-top">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(
                      (plansData.count || 0) / itemsPerPage,
                    )}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}

            {plansData?.results?.length === 0 && (
              <div className="u-text-center u-p-6">
                <Icon
                  name="Package"
                  size={48}
                  className="u-text-secondary u-mb-3"
                />
                <h3 className="u-h5 u-mb-2">No plans found</h3>
                <p className="u-text-secondary u-mb-4">
                  {searchQuery ||
                  statusFilter !== "all" ||
                  billingCycleFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Get started by creating your first plan"}
                </p>
                <Button
                  variant="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Icon name="Plus" size={16} className="u-me-2" />
                  Add Plan
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create Plan Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create New Plan"
        size="lg"
      >
        <div className="u-space-y-4">
          <Grid>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Plan Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter plan name"
                className={formErrors.name ? "u-border-danger" : ""}
              />
              {formErrors.name && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.name}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Billing Cycle *
              </label>
              <Select
                value={formData.billing_cycle}
                onChange={(e) =>
                  handleInputChange("billing_cycle", e.target.value)
                }
                className="u-w-100"
                options={BILLING_CYCLES}
              />
            </GridCol>
          </Grid>

          <div>
            <label className="u-d-block u-mb-2 u-fw-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter plan description"
              rows={3}
            />
          </div>

          <Grid>
            <GridCol xs={12} md={4}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Price (৳) *
              </label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={formErrors.price ? "u-border-danger" : ""}
              />
              {formErrors.price && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.price}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={3}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Download Speed *
              </label>
              <Input
                type="number"
                value={formData.download_speed}
                onChange={(e) =>
                  handleInputChange("download_speed", e.target.value)
                }
                placeholder="100"
                min="1"
                className={formErrors.download_speed ? "u-border-danger" : ""}
              />
              {formErrors.download_speed && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.download_speed}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={3}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Upload Speed *
              </label>
              <Input
                type="number"
                value={formData.upload_speed}
                onChange={(e) =>
                  handleInputChange("upload_speed", e.target.value)
                }
                placeholder="50"
                min="1"
                className={formErrors.upload_speed ? "u-border-danger" : ""}
              />
              {formErrors.upload_speed && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.upload_speed}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={3}>
              <label className="u-d-block u-mb-2 u-fw-medium">Speed Unit</label>
              <Select
                value={formData.speed_unit}
                onChange={(e) =>
                  handleInputChange("speed_unit", e.target.value)
                }
                className="u-w-100"
                options={[
                  { value: "mbps", label: "Mbps" },
                  { value: "gbps", label: "Gbps" },
                ]}
              />
            </GridCol>
            <GridCol xs={12} md={3}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Setup Fee (৳) *
              </label>
              <Input
                type="number"
                value={formData.setup_fee}
                onChange={(e) => handleInputChange("setup_fee", e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={formErrors.setup_fee ? "u-border-danger" : ""}
              />
              {formErrors.setup_fee && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.setup_fee}
                </div>
              )}
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">Data Quota</label>
              <Input
                type="number"
                value={formData.data_quota}
                onChange={(e) =>
                  handleInputChange("data_quota", e.target.value)
                }
                placeholder="Leave empty for unlimited"
                min="0"
                className={formErrors.data_quota ? "u-border-danger" : ""}
              />
              {formErrors.data_quota && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.data_quota}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">Quota Unit</label>
              <Select
                value={formData.quota_unit}
                onChange={(e) =>
                  handleInputChange("quota_unit", e.target.value)
                }
                className="u-w-100"
                options={[
                  { value: "gb", label: "GB" },
                  { value: "tb", label: "TB" },
                  { value: "unlimited", label: "Unlimited" },
                ]}
              />
            </GridCol>
          </Grid>

          <div>
            <label className="u-d-block u-mb-2 u-fw-medium">Features</label>
            <Textarea
              value={formData.features}
              onChange={(e) => handleInputChange("features", e.target.value)}
              placeholder="List key features (one per line)"
              rows={4}
            />
          </div>

          <div className="u-d-flex u-flex-wrap u-gap-4">
            <div className="u-d-flex u-align-items-center">
              <Toggle
                initialOn={formData.is_active}
                onToggleOn={() =>
                  handleInputChange("is_active", !formData.is_active)
                }
                className="u-me-2"
              />
              <label>Active Plan</label>
            </div>
            <div className="u-d-flex u-align-items-center">
              <Toggle
                initialOn={formData.is_featured}
                onToggleOn={() =>
                  handleInputChange("is_featured", !formData.is_featured)
                }
                className="u-me-2"
              />
              <label>Featured Plan</label>
            </div>
            <div className="u-d-flex u-align-items-center">
              <Toggle
                initialOn={formData.is_popular}
                onToggleOn={() =>
                  handleInputChange("is_popular", !formData.is_popular)
                }
                className="u-me-2"
              />
              <label>Popular Plan</label>
            </div>
          </div>
        </div>

        <div className="u-d-flex u-justify-content-end u-gap-3 u-mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setIsCreateModalOpen(false);
              resetForm();
            }}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Spinner size="sm" className="u-me-2" />
                Creating...
              </>
            ) : (
              "Create Plan"
            )}
          </Button>
        </div>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPlan(null);
          resetForm();
        }}
        title="Edit Plan"
        size="lg"
      >
        <div className="u-space-y-4">
          <Grid>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Plan Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter plan name"
                className={formErrors.name ? "u-border-danger" : ""}
              />
              {formErrors.name && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.name}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Billing Cycle *
              </label>
              <Select
                value={formData.billing_cycle}
                onChange={(e) =>
                  handleInputChange("billing_cycle", e.target.value)
                }
                className="u-w-100"
                options={BILLING_CYCLES}
              />
            </GridCol>
          </Grid>

          <div>
            <label className="u-d-block u-mb-2 u-fw-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter plan description"
              rows={3}
            />
          </div>

          <Grid>
            <GridCol xs={12} md={4}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Price (৳) *
              </label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={formErrors.price ? "u-border-danger" : ""}
              />
              {formErrors.price && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.price}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={3}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Download Speed *
              </label>
              <Input
                type="number"
                value={formData.download_speed}
                onChange={(e) =>
                  handleInputChange("download_speed", e.target.value)
                }
                placeholder="100"
                min="1"
                className={formErrors.download_speed ? "u-border-danger" : ""}
              />
              {formErrors.download_speed && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.download_speed}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={3}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Upload Speed *
              </label>
              <Input
                type="number"
                value={formData.upload_speed}
                onChange={(e) =>
                  handleInputChange("upload_speed", e.target.value)
                }
                placeholder="50"
                min="1"
                className={formErrors.upload_speed ? "u-border-danger" : ""}
              />
              {formErrors.upload_speed && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.upload_speed}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={3}>
              <label className="u-d-block u-mb-2 u-fw-medium">Speed Unit</label>
              <Select
                value={formData.speed_unit}
                onChange={(e) =>
                  handleInputChange("speed_unit", e.target.value)
                }
                className="u-w-100"
                options={[
                  { value: "mbps", label: "Mbps" },
                  { value: "gbps", label: "Gbps" },
                ]}
              />
            </GridCol>
            <GridCol xs={12} md={3}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Setup Fee (৳) *
              </label>
              <Input
                type="number"
                value={formData.setup_fee}
                onChange={(e) => handleInputChange("setup_fee", e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={formErrors.setup_fee ? "u-border-danger" : ""}
              />
              {formErrors.setup_fee && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.setup_fee}
                </div>
              )}
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">Data Quota</label>
              <Input
                type="number"
                value={formData.data_quota}
                onChange={(e) =>
                  handleInputChange("data_quota", e.target.value)
                }
                placeholder="Leave empty for unlimited"
                min="0"
                className={formErrors.data_quota ? "u-border-danger" : ""}
              />
              {formErrors.data_quota && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.data_quota}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">Quota Unit</label>
              <Select
                value={formData.quota_unit}
                onChange={(e) =>
                  handleInputChange("quota_unit", e.target.value)
                }
                className="u-w-100"
                options={[
                  { value: "gb", label: "GB" },
                  { value: "tb", label: "TB" },
                  { value: "unlimited", label: "Unlimited" },
                ]}
              />
            </GridCol>
          </Grid>

          <div>
            <label className="u-d-block u-mb-2 u-fw-medium">Features</label>
            <Textarea
              value={formData.features}
              onChange={(e) => handleInputChange("features", e.target.value)}
              placeholder="List key features (one per line)"
              rows={4}
            />
          </div>

          <div className="u-d-flex u-flex-wrap u-gap-4">
            <div className="u-d-flex u-align-items-center">
              <Toggle
                initialOn={formData.is_active}
                onToggleOn={() =>
                  handleInputChange("is_active", !formData.is_active)
                }
                className="u-me-2"
              />
              <label>Active Plan</label>
            </div>
            <div className="u-d-flex u-align-items-center">
              <Toggle
                initialOn={formData.is_featured}
                onToggleOn={() =>
                  handleInputChange("is_featured", !formData.is_featured)
                }
                className="u-me-2"
              />
              <label>Featured Plan</label>
            </div>
            <div className="u-d-flex u-align-items-center">
              <Toggle
                initialOn={formData.is_popular}
                onToggleOn={() =>
                  handleInputChange("is_popular", !formData.is_popular)
                }
                className="u-me-2"
              />
              <label>Popular Plan</label>
            </div>
          </div>
        </div>

        <div className="u-d-flex u-justify-content-end u-gap-3 u-mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditModalOpen(false);
              setSelectedPlan(null);
              resetForm();
            }}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdate}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Spinner size="sm" className="u-me-2" />
                Updating...
              </>
            ) : (
              "Update Plan"
            )}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedPlan(null);
        }}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="u-text-center">
          <div className="u-bg-danger-subtle u-p-4 u-rounded-circle u-d-inline-flex u-mb-4">
            <Icon name="Trash" size={24} className="u-text-danger" />
          </div>
          <h3 className="u-h5 u-mb-3">Delete Plan</h3>
          <p className="u-text-secondary u-mb-4">
            Are you sure you want to delete{" "}
            <strong>{selectedPlan?.name}</strong>? This action cannot be undone.
          </p>
          <div className="u-d-flex u-justify-content-center u-gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedPlan(null);
              }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Spinner size="sm" className="u-me-2" />
                  Deleting...
                </>
              ) : (
                "Delete Plan"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Plans;
