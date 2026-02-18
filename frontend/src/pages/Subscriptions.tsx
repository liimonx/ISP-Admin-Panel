import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Icon, Callout } from "@shohojdhara/atomix";
import { Toast } from "../components/ui/Toast";
import { Subscription, SubscriptionFormData } from "../types";
import {
  subscriptionService,
  customerService,
  planService,
  routerService,
} from "../services/api";
import {
  SubscriptionStats,
  SubscriptionFilters,
  SubscriptionTable,
  SubscriptionModal,
} from "../components/subscriptions";

const Subscriptions: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [routerFilter, setRouterFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "warning">(
    "success",
  );

  const [formData, setFormData] = useState<SubscriptionFormData>({
    customer_id: 0,
    plan_id: 0,
    router_id: 0,
    username: "",
    password: "",
    access_method: "pppoe",
    static_ip: "",
    mac_address: "",
    status: "pending",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    monthly_fee: 0,
    setup_fee: 0,
    data_used: 0,
    notes: "",
  });

  const itemsPerPage = 15;

  // Build query parameters
  const queryParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      limit: itemsPerPage,
    };

    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (statusFilter !== "all") params.status = statusFilter;
    if (planFilter !== "all") params.plan = planFilter;
    if (routerFilter !== "all") params.router = routerFilter;

    return params;
  }, [currentPage, searchQuery, statusFilter, planFilter, routerFilter]);

  // Fetch subscriptions with error handling
  const {
    data: subscriptionsData,
    isLoading: subscriptionsLoading,
    error: subscriptionsError,
    refetch: refetchSubscriptions,
  } = useQuery({
    queryKey: ["subscriptions", queryParams],
    queryFn: async () => {
      console.log("🔄 Fetching subscriptions with params:", queryParams);
      const result = await subscriptionService.getSubscriptions(queryParams);
      console.log("📊 Subscriptions API response:", result);
      return result;
    },
    staleTime: 30000,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (
        error?.message?.includes("401") ||
        error?.message?.includes("Authentication")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    onSuccess: (data) => {
      console.log("✅ Subscriptions query succeeded:", data);
    },
    onError: (error: any) => {
      console.error("❌ Failed to fetch subscriptions:", error);
      showToastMessage(
        `Failed to load subscriptions: ${error.message || "Unknown error"}`,
        "error",
      );
    },
  });

  // Fetch supporting data
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => customerService.getCustomers({ limit: 1000 }),
    staleTime: 300000,
  });

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["plans", "all"],
    queryFn: () => planService.getPlans({ limit: 1000 }),
    staleTime: 300000,
  });

  const { data: routersData, isLoading: routersLoading } = useQuery({
    queryKey: ["routers", "all"],
    queryFn: () => routerService.getRouters({ limit: 1000 }),
    staleTime: 300000,
  });

  // Toast helper
  const showToastMessage = useCallback(
    (message: string, type: "success" | "error" | "warning" = "success") => {
      setToastMessage(message);
      setToastType(type);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    },
    [],
  );

  // Create subscription mutation
  const createMutation = useMutation({
    mutationFn: (data: SubscriptionFormData) => {
      // Validate data before sending
      const validation = subscriptionService.validateSubscriptionData(data);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      console.log("Creating subscription with data:", data);
      return subscriptionService.createSubscription(data);
    },
    onSuccess: (createdSubscription) => {
      console.log("✅ Subscription created successfully:", createdSubscription);

      // Invalidate and refetch queries immediately
      console.log("🔄 Invalidating subscription queries...");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-stats"] });

      // Force immediate refetch
      console.log("🔄 Force refetching subscriptions...");
      refetchSubscriptions().then(() => {
        console.log("✅ Subscriptions refetched after creation");
      });

      setIsCreateModalOpen(false);
      resetForm();
      showToastMessage("Subscription created successfully!", "success");
    },
    onError: (error: any) => {
      console.error("Failed to create subscription:", error);

      if (
        error.message?.includes("Authentication error: 400") ||
        error.message?.includes("401")
      ) {
        showToastMessage(
          "Authentication failed. Please log in again.",
          "error",
        );
      } else if (error.message?.includes("Validation failed:")) {
        showToastMessage(error.message, "error");
      } else {
        showToastMessage(
          `Failed to create subscription: ${error.message || "Unknown error"}`,
          "error",
        );
      }
    },
  });

  // Update subscription mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SubscriptionFormData }) => {
      const validation = subscriptionService.validateSubscriptionData(data);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }
      return subscriptionService.updateSubscription(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-stats"] });
      // Force immediate refetch
      refetchSubscriptions();
      setIsEditModalOpen(false);
      setSelectedSubscription(null);
      resetForm();
      showToastMessage("Subscription updated successfully!", "success");
    },
    onError: (error: any) => {
      console.error("Failed to update subscription:", error);
      showToastMessage(
        `Failed to update subscription: ${error.message || "Unknown error"}`,
        "error",
      );
    },
  });

  // Update subscription status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      subscriptionService.updateSubscriptionStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-stats"] });
      // Force immediate refetch
      refetchSubscriptions();
      showToastMessage(`Subscription ${status} successfully!`, "success");
    },
    onError: (error: any) => {
      console.error("Failed to update subscription status:", error);
      showToastMessage(
        `Failed to update status: ${error.message || "Unknown error"}`,
        "error",
      );
    },
  });

  // Bulk update status mutation
  const bulkUpdateStatusMutation = useMutation({
    mutationFn: ({
      subscriptionIds,
      status,
    }: {
      subscriptionIds: number[];
      status: string;
    }) =>
      subscriptionService.bulkUpdateSubscriptionStatus(subscriptionIds, status),
    onSuccess: (_, { subscriptionIds, status }) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-stats"] });
      // Force immediate refetch
      refetchSubscriptions();
      showToastMessage(
        `Successfully updated ${subscriptionIds.length} subscription${subscriptionIds.length > 1 ? "s" : ""} to ${status}`,
        "success",
      );
    },
    onError: (error: any) => {
      console.error("Failed to bulk update subscription status:", error);
      showToastMessage(
        `Failed to bulk update: ${error.message || "Unknown error"}`,
        "error",
      );
    },
  });

  // Delete subscription mutation
  const deleteSubscriptionMutation = useMutation({
    mutationFn: (id: number) => subscriptionService.deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-stats"] });
      // Force immediate refetch
      refetchSubscriptions();
      showToastMessage("Subscription deleted successfully!", "success");
    },
    onError: (error: any) => {
      console.error("Failed to delete subscription:", error);
      showToastMessage(
        `Failed to delete subscription: ${error.message || "Unknown error"}`,
        "error",
      );
    },
  });

  // Reset data usage mutation
  const resetDataUsageMutation = useMutation({
    mutationFn: (id: number) => subscriptionService.resetDataUsage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      showToastMessage("Data usage reset successfully!", "success");
    },
    onError: (error: any) => {
      console.error("Failed to reset data usage:", error);
      showToastMessage(
        `Failed to reset data usage: ${error.message || "Unknown error"}`,
        "error",
      );
    },
  });

  // Update data usage mutation
  const updateDataUsageMutation = useMutation({
    mutationFn: ({ id, dataUsage }: { id: number; dataUsage: number }) =>
      subscriptionService.updateDataUsage(id, dataUsage * 1024 * 1024 * 1024), // Convert GB to bytes
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      showToastMessage("Data usage updated successfully!", "success");
    },
    onError: (error: any) => {
      console.error("Failed to update data usage:", error);
      showToastMessage(
        `Failed to update data usage: ${error.message || "Unknown error"}`,
        "error",
      );
    },
  });

  const resetForm = useCallback(() => {
    setFormData({
      customer_id: 0,
      plan_id: 0,
      router_id: 0,
      username: "",
      password: "",
      access_method: "pppoe",
      static_ip: "",
      mac_address: "",
      status: "pending",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      monthly_fee: 0,
      setup_fee: 0,
      data_used: 0,
      notes: "",
    });
  }, []);

  const handleCreateSubscription = useCallback(() => {
    setSelectedSubscription(null);
    setIsEditModalOpen(false);
    resetForm();
    setIsCreateModalOpen(true);
  }, [resetForm]);

  const handleEditSubscription = useCallback((subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setFormData({
      customer_id: subscription.customer?.id || 0,
      plan_id: subscription.plan?.id || 0,
      router_id: subscription.router?.id || 0,
      username: subscription.username || "",
      password: "", // Don't populate existing password
      access_method: subscription.access_method,
      static_ip: subscription.static_ip || "",
      mac_address: subscription.mac_address || "",
      status: subscription.status,
      start_date: subscription.start_date || "",
      end_date: subscription.end_date || "",
      monthly_fee: subscription.monthly_fee || 0,
      setup_fee: subscription.setup_fee || 0,
      data_used: subscription.data_used || 0,
      notes: subscription.notes || "",
    });
    setIsEditModalOpen(true);
  }, []);

  const handleViewSubscription = useCallback(
    (subscription: Subscription) => {
      // For now, just open edit modal in view mode - could extend later
      handleEditSubscription(subscription);
    },
    [handleEditSubscription],
  );

  const handleUpdateStatus = useCallback(
    (subscription: Subscription, status: string) => {
      updateStatusMutation.mutate({ id: subscription.id, status });
    },
    [updateStatusMutation],
  );

  const handleBulkUpdateStatus = useCallback(
    (subscriptionIds: number[], status: string) => {
      if (subscriptionIds.length === 0) {
        showToastMessage("No subscriptions selected", "warning");
        return;
      }

      bulkUpdateStatusMutation.mutate({ subscriptionIds, status });
    },
    [bulkUpdateStatusMutation, showToastMessage],
  );

  const handleDeleteSubscription = useCallback(
    (subscription: Subscription) => {
      if (
        window.confirm(
          `Are you sure you want to delete the subscription for ${subscription.customer?.name}? This action cannot be undone.`,
        )
      ) {
        deleteSubscriptionMutation.mutate(subscription.id);
      }
    },
    [deleteSubscriptionMutation],
  );

  const handleResetDataUsage = useCallback(
    (subscription: Subscription) => {
      if (
        window.confirm(
          `Are you sure you want to reset data usage for ${subscription.customer?.name}? Current usage: ${subscription.data_used} GB`,
        )
      ) {
        resetDataUsageMutation.mutate(subscription.id);
      }
    },
    [resetDataUsageMutation],
  );

  const handleUpdateDataUsage = useCallback(
    (subscription: Subscription, currentUsage: number) => {
      const newUsage = prompt(
        `Update data usage for ${subscription.customer?.name}:`,
        currentUsage.toString(),
      );

      if (newUsage !== null) {
        const usage = parseFloat(newUsage);
        if (isNaN(usage) || usage < 0) {
          showToastMessage("Invalid data usage value", "error");
          return;
        }
        updateDataUsageMutation.mutate({
          id: subscription.id,
          dataUsage: usage,
        });
      }
    },
    [updateDataUsageMutation, showToastMessage],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (selectedSubscription) {
        updateMutation.mutate({ id: selectedSubscription.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    },
    [formData, selectedSubscription, createMutation, updateMutation],
  );

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setPlanFilter("all");
    setRouterFilter("all");
    setCurrentPage(1);
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const params = {
        search: searchQuery.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        plan: planFilter !== "all" ? planFilter : undefined,
        router: routerFilter !== "all" ? routerFilter : undefined,
      };

      const blob = await subscriptionService.exportSubscriptions(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `subscriptions-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToastMessage("Subscriptions exported successfully!", "success");
    } catch (error: any) {
      console.error("Error exporting subscriptions:", error);
      showToastMessage(
        `Failed to export subscriptions: ${error.message || "Unknown error"}`,
        "error",
      );
    }
  }, [searchQuery, statusFilter, planFilter, routerFilter, showToastMessage]);

  const totalPages = Math.ceil((subscriptionsData?.count || 0) / itemsPerPage);
  const subscriptions = subscriptionsData?.results || [];
  const isLoading = subscriptionsLoading;
  const anyLoading =
    subscriptionsLoading || customersLoading || plansLoading || routersLoading;

  // Handle critical errors
  if (subscriptionsError && !subscriptions.length) {
    return (
      <div className="u-p-6">
        <Callout variant="error" className="u-mb-4">
          <div className="u-flex u-items-center u-gap-2">
            <Icon name="Warning" size={20} />
            <div>
              <strong>Error loading subscriptions</strong>
              <p className="u-mb-0 u-mt-1">
                {subscriptionsError?.message ||
                  "Please try refreshing the page or contact support if the problem persists."}
              </p>
              <div className="u-mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchSubscriptions()}
                  disabled={subscriptionsLoading}
                >
                  {subscriptionsLoading ? (
                    <>
                      <div
                        className="u-spinner-border u-spinner-border-sm u-me-2"
                        role="status"
                      >
                        <span className="u-visually-hidden">Loading...</span>
                      </div>
                      Retrying...
                    </>
                  ) : (
                    <>
                      <Icon name="ArrowClockwise" size={16} />
                      Retry
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Callout>
      </div>
    );
  }

  return (
    <div className="u-p-6">
      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          variant={toastType}
          onClose={() => setShowToast(false)}
          className="u-position-fixed u-top-0 u-end-0 u-m-3"
          style={{ zIndex: 1050 }}
        />
      )}

      {/* Page Header */}
      <div className="u-flex u-justify-between u-align-items-start u-mb-6">
        <div>
          <h1 className="u-fs-1 u-fw-bold u-text-primary-emphasis u-mb-2">
            <Icon name="Users" size={32} className="u-me-3" />
            Subscriptions
          </h1>
          <p className="u-text-secondary-emphasis u-fs-5 u-mb-0">
            Manage customer subscriptions, service connections, and billing
          </p>
        </div>
        <div className="u-flex u-gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={handleExport}
            disabled={isLoading}
          >
            <Icon name="Download" size={16} />
            Export
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleCreateSubscription}
            disabled={anyLoading}
          >
            <Icon name="Plus" size={16} />
            Add Subscription
          </Button>
        </div>
      </div>

      {/* Error Banner for Non-Critical Issues */}
      {subscriptionsError && subscriptions.length > 0 && (
        <Callout variant="warning" className="u-mb-4">
          <div className="u-flex u-items-center u-gap-2">
            <Icon name="Warning" size={20} />
            <div>
              <strong>Partial data loaded</strong>
              <p className="u-mb-0 u-mt-1">
                Some data may be outdated. {subscriptionsError.message}
              </p>
            </div>
          </div>
        </Callout>
      )}

      {/* Statistics Cards */}
      <div className="u-mb-6">
        <SubscriptionStats refreshInterval={30000} isLoading={isLoading} />
      </div>

      {/* Filters */}
      <SubscriptionFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        planFilter={planFilter}
        onPlanChange={setPlanFilter}
        routerFilter={routerFilter}
        onRouterChange={setRouterFilter}
        onReset={handleClearFilters}
      />

      {/* Subscriptions Table */}
      <SubscriptionTable
        subscriptions={subscriptions}
        isLoading={isLoading}
        onEdit={handleEditSubscription}
        onView={handleViewSubscription}
        onUpdateStatus={handleUpdateStatus}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onDelete={handleDeleteSubscription}
        onCreate={handleCreateSubscription}
        onResetDataUsage={handleResetDataUsage}
        onUpdateDataUsage={handleUpdateDataUsage}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="u-flex u-justify-center u-items-center u-mt-6">
          <div className="u-flex u-items-center u-gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <Icon name="ArrowLeft" size={16} />
              Previous
            </Button>

            <div className="u-flex u-items-center u-gap-2">
              <span className="u-text-secondary-emphasis u-fs-sm">
                Page {currentPage} of {totalPages}
              </span>
              <span className="u-text-secondary-emphasis u-fs-sm">•</span>
              <span className="u-text-secondary-emphasis u-fs-sm">
                {subscriptionsData?.count || 0} total subscriptions
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
              <Icon name="ArrowRight" size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Subscription Modal */}
      <SubscriptionModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedSubscription(null);
          resetForm();
        }}
        subscription={selectedSubscription}
        mode={selectedSubscription ? "edit" : "create"}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        customers={customersData?.results || []}
        plans={plansData?.results || []}
        routers={routersData?.results || []}
      />
    </div>
  );
};

export default Subscriptions;
