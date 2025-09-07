import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Icon, Callout } from "@shohojdhara/atomix";
import { Subscription, Customer, Plan, Router } from "../types";
import { apiService } from "../services/apiService";
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
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState({
    customer_id: 0,
    plan_id: 0,
    router_id: 0,
    username: "",
    password: "",
    access_method: "pppoe" as const,
    static_ip: "",
    mac_address: "",
    status: "pending" as const,
    start_date: new Date().toISOString().split('T')[0],
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

  // Fetch subscriptions
  const {
    data: subscriptionsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["subscriptions", queryParams],
    queryFn: () => apiService.getSubscriptions(queryParams),
    staleTime: 30000, // 30 seconds
  });

  // Fetch customers for dropdown
  const { data: customersData } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => apiService.getCustomers({ limit: 1000 }),
    staleTime: 300000, // 5 minutes
  });

  // Fetch plans for dropdown
  const { data: plansData } = useQuery({
    queryKey: ["plans", "all"],
    queryFn: () => apiService.getPlans({ limit: 1000 }),
    staleTime: 300000, // 5 minutes
  });

  // Fetch routers for dropdown
  const { data: routersData } = useQuery({
    queryKey: ["routers", "all"],
    queryFn: () => apiService.getRouters({ limit: 1000 }),
    staleTime: 300000, // 5 minutes
  });

  // Create subscription mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('Creating subscription with data:', data);
      return apiService.createSubscription(data);
    },
    onSuccess: (result) => {
      console.log('Subscription created successfully:', result);
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Failed to create subscription:", error);
      if (error.message?.includes('Authentication error: 400') || error.message?.includes('401')) {
        alert('Authentication failed. Please log in with valid credentials (admin / changeme123!)');
      } else {
        alert(`Failed to create subscription: ${error.message || 'Unknown error'}`);
      }
    },
  });

  // Update subscription mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiService.updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setIsEditModalOpen(false);
      setSelectedSubscription(null);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Failed to update subscription:", error);
    },
  });

  // Update subscription status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiService.updateSubscriptionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: (error: any) => {
      console.error("Failed to update subscription status:", error);
    },
  });

  const resetForm = () => {
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
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      monthly_fee: 0,
      setup_fee: 0,
      data_used: 0,
      notes: "",
    });
  };

  const handleCreateSubscription = () => {
    setSelectedSubscription(null);
    setIsEditModalOpen(false);
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleEditSubscription = (subscription: Subscription) => {
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
  };

  const handleViewSubscription = (subscription: Subscription) => {
    // TODO: Implement subscription detail view
    console.log("View subscription:", subscription);
  };

  const handleUpdateStatus = (subscription: Subscription, status: string) => {
    updateStatusMutation.mutate({ id: subscription.id, status });
  };

  const handleDeleteSubscription = (subscription: Subscription) => {
    if (window.confirm(`Are you sure you want to delete the subscription for ${subscription.customer?.name}?`)) {
      // TODO: Implement delete subscription
      console.log("Delete subscription:", subscription);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.customer_id || !formData.plan_id || !formData.router_id || !formData.username) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!selectedSubscription && !formData.password) {
      alert('Password is required for new subscriptions');
      return;
    }
    
    // Transform form data to match backend expectations
    const submitData = {
      customer: formData.customer_id,
      plan: formData.plan_id,
      router: formData.router_id,
      username: formData.username,
      password: formData.password,
      access_method: formData.access_method,
      static_ip: formData.static_ip || null,
      mac_address: formData.mac_address || null,
      status: formData.status,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      monthly_fee: formData.monthly_fee,
      setup_fee: formData.setup_fee,
      notes: formData.notes || null,
    };
    
    console.log('Submitting transformed data:', submitData);
    
    if (selectedSubscription) {
      updateMutation.mutate({ id: selectedSubscription.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPlanFilter("all");
    setRouterFilter("all");
    setCurrentPage(1);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export subscriptions");
  };

  const totalPages = Math.ceil((subscriptionsData?.count || 0) / itemsPerPage);
  const subscriptions = subscriptionsData?.results || [];

  if (error) {
    return (
      <div className="u-p-6">
        <Callout variant="error" className="u-mb-4">
          <div className="u-d-flex u-align-items-center u-gap-2">
            <Icon name="Warning" size={20} />
            <div>
              <strong>Error loading subscriptions</strong>
              <p className="u-mb-0 u-mt-1">Please try refreshing the page or contact support if the problem persists.</p>
            </div>
          </div>
        </Callout>
      </div>
    );
  }

  return (
    <div className="u-p-6">
      {/* Page Header */}
      <div className="u-d-flex u-justify-content-between u-align-items-start u-mb-6">
        <div>
          <h1 className="u-fs-1 u-fw-bold u-text-primary-emphasis u-mb-2">
            <Icon name="Users" size={32} className="u-me-3" />
            Subscriptions
          </h1>
          <p className="u-text-secondary-emphasis-emphasis u-fs-5 u-mb-0">
            Manage customer subscriptions, service connections, and billing
          </p>
        </div>
        <div className="u-d-flex u-gap-3">
          <Button variant="outline" size="md" onClick={handleExport}>
            <Icon name="Download" size={16} />
            Export
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleCreateSubscription}
          >
            <Icon name="Plus" size={16} />
            Add Subscription
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="u-mb-6">
        <SubscriptionStats 
          subscriptions={subscriptions} 
          isLoading={isLoading} 
        />
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
        onClearFilters={handleClearFilters}
        onExport={handleExport}
        plans={plansData?.results?.map(p => ({ id: p.id, name: p.name })) || []}
        routers={routersData?.results?.map(r => ({ id: r.id, name: r.name })) || []}
      />

      {/* Subscriptions Table */}
      <SubscriptionTable
        subscriptions={subscriptions}
        isLoading={isLoading}
        onEdit={handleEditSubscription}
        onView={handleViewSubscription}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeleteSubscription}
        onCreate={handleCreateSubscription}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="u-d-flex u-justify-content-center u-align-items-center u-mt-6">
          <div className="u-d-flex u-align-items-center u-gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <Icon name="ArrowLeft" size={16} />
              Previous
            </Button>
            
            <div className="u-d-flex u-align-items-center u-gap-2">
              <span className="u-text-secondary-emphasis-emphasis u-fs-sm">
                Page {currentPage} of {totalPages}
              </span>
              <span className="u-text-secondary-emphasis-emphasis u-fs-sm">•</span>
              <span className="u-text-secondary-emphasis-emphasis u-fs-sm">
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
