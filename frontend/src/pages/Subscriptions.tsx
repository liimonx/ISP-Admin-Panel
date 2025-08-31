import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Button,
  Icon,
  Input,
  Badge,
  Modal,
  Grid,
  GridCol,
  Avatar,
  Dropdown,
  DataTable,
  Callout,
} from "@shohojdhara/atomix";
import { Subscription, Customer, Plan, Router } from "../types";
import { apiService } from "../services/apiService";
import { formatCurrency } from "../utils/formatters";

const Subscriptions: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [formData, setFormData] = useState({
    customer_id: 0,
    plan_id: 0,
    router_id: 0,
    username: "",
    access_method: "pppoe" as const,
    static_ip: "",
    mac_address: "",
    status: "active" as const,
    start_date: "",
    end_date: "",
    monthly_fee: 0,
    setup_fee: 0,
    data_used: 0,
    notes: "",
  });

  const itemsPerPage = 10;

  // Fetch subscriptions
  const {
    data: subscriptionsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["subscriptions", currentPage, searchQuery, statusFilter],
    queryFn: () =>
      apiService.getSubscriptions({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  // Fetch customers for dropdown
  const { data: customersData } = useQuery({
    queryKey: ["customers"],
    queryFn: () => apiService.getCustomers({ limit: 1000 }),
  });

  // Fetch plans for dropdown
  const { data: plansData } = useQuery({
    queryKey: ["plans"],
    queryFn: () => apiService.getPlans({ limit: 1000 }),
  });

  // Fetch routers for dropdown
  const { data: routersData } = useQuery({
    queryKey: ["routers"],
    queryFn: () => apiService.getRouters({ limit: 1000 }),
  });

  // Create subscription mutation
  const createMutation = useMutation({
    mutationFn: (
      data: Omit<
        Subscription,
        "id" | "created_at" | "updated_at" | "customer" | "plan" | "router"
      >,
    ) => apiService.createSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setIsCreateModalOpen(false);
      resetForm();
    },
  });

  // Update subscription mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Subscription> }) =>
      apiService.updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setIsEditModalOpen(false);
      setSelectedSubscription(null);
      resetForm();
    },
  });

  // Update subscription status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiService.updateSubscriptionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  const resetForm = () => {
    setFormData({
      customer_id: 0,
      plan_id: 0,
      router_id: 0,
      username: "",
      access_method: "pppoe",
      static_ip: "",
      mac_address: "",
      status: "active",
      start_date: "",
      end_date: "",
      monthly_fee: 0,
      setup_fee: 0,
      data_used: 0,
      notes: "",
    });
  };

  const handleCreateSubscription = () => {
    setIsCreateModalOpen(true);
    resetForm();
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setFormData({
      customer_id: subscription.customer?.id || 0,
      plan_id: subscription.plan?.id || 0,
      router_id: subscription.router?.id || 0,
      username: subscription.username || "",
      access_method: subscription.access_method as any,
      static_ip: subscription.static_ip || "",
      mac_address: subscription.mac_address || "",
      status: subscription.status as any,
      start_date: subscription.start_date || "",
      end_date: subscription.end_date || "",
      monthly_fee: subscription.monthly_fee || 0,
      setup_fee: subscription.setup_fee || 0,
      data_used: subscription.data_used || 0,
      notes: subscription.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStatus = (subscription: Subscription, status: string) => {
    updateStatusMutation.mutate({ id: subscription.id, status });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubscription) {
      updateMutation.mutate({ id: selectedSubscription.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusBadge = (status: Subscription["status"]) => {
    const variants = {
      active: "success",
      inactive: "secondary",
      suspended: "warning",
      cancelled: "error",
      pending: "primary",
    } as const;

    return (
      <Badge
        variant={variants[status]}
        size="sm"
        label={status.charAt(0).toUpperCase() + status.slice(1)}
      />
    );
  };

  const getAccessMethodBadge = (method: Subscription["access_method"]) => {
    const labels = {
      pppoe: "PPPoE",
      static_ip: "Static IP",
      dhcp: "DHCP",
    };

    return <Badge variant="secondary" size="sm" label={labels[method]} />;
  };

  const totalPages = Math.ceil((subscriptionsData?.count || 0) / itemsPerPage);

  if (error) {
    return (
      <Callout variant="error" className="u-mb-4">
        Error loading subscriptions. Please try again.
      </Callout>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-6">
        <div>
          <h1 className="u-mb-2">Subscriptions</h1>
          <p className="u-text-secondery">
            Manage customer subscriptions and service connections
          </p>
        </div>
        <div className="u-d-flex u-gap-2">
          <Button variant="outline" size="md">
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

      {/* Filters and Search */}
      <Card className="u-mb-6">
        <Grid>
          <GridCol xs={12} md={6} lg={4}>
            <Input
              placeholder="Search subscriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </GridCol>
          <GridCol xs={12} md={6} lg={3}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending">Pending</option>
            </select>
          </GridCol>
          <GridCol xs={12} md={12} lg={5}>
            <div className="u-d-flex u-justify-content-end u-gap-2">
              <Button variant="outline" size="md">
                <Icon name="Funnel" size={16} />
                More Filters
              </Button>
              <Button variant="ghost" size="md">
                Clear
              </Button>
            </div>
          </GridCol>
        </Grid>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        {isLoading ? (
          <div className="u-d-flex u-justify-content-center u-align-items-center u-py-8">
            <div className="u-text-center">
              <Icon
                name="Spinner"
                size={32}
                className="u-text-primary u-mb-2"
              />
              <p>Loading subscriptions...</p>
            </div>
          </div>
        ) : (
          <>
            <DataTable
              data={
                subscriptionsData?.results?.map((subscription) => ({
                  id: subscription.id,
                  customer: (
                    <div className="u-d-flex u-align-items-center u-gap-3">
                      <Avatar
                        initials={subscription.customer?.name?.charAt(0) || '?'}
                        size="sm"
                      />
                      <div>
                        <div className="u-font-weight-medium">
                          {subscription.customer?.name || 'Unknown Customer'}
                        </div>
                        <div className="u-text-sm u-text-secondery">
                          {subscription.customer?.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  ),
                  plan: (
                    <div>
                      <div className="u-font-weight-medium">
                        {subscription.plan?.name || 'Unknown Plan'}
                      </div>
                      <div className="u-text-sm u-text-secondery">
                        {subscription.plan?.download_speed || 0}/
                        {subscription.plan?.upload_speed || 0}{" "}
                        {subscription.plan?.speed_unit?.toUpperCase() || 'MBPS'}
                      </div>
                    </div>
                  ),
                  connection: (
                    <div>
                      <div className="u-text-sm u-mb-1">
                        {getAccessMethodBadge(subscription.access_method)}
                      </div>
                      <div className="u-text-xs u-text-secondery">
                        {subscription.username || 'No username'}
                      </div>
                      {subscription.static_ip && (
                        <div className="u-text-xs u-text-secondery">
                          IP: {subscription.static_ip}
                        </div>
                      )}
                    </div>
                  ),
                  status: getStatusBadge(subscription.status),
                  monthlyFee: (
                    <div className="u-font-weight-medium">
                      ${formatCurrency(subscription.monthly_fee)}
                    </div>
                  ),
                  startDate: (
                    <div className="u-text-sm">
                      {subscription.start_date ? new Date(subscription.start_date).toLocaleDateString() : 'No date'}
                    </div>
                  ),
                  actions: (
                    <Dropdown
                      menu={
                        <div>
                          <button
                            onClick={() => handleEditSubscription(subscription)}
                            className="dropdown-item"
                          >
                            <Icon name="Pencil" size={16} />
                            Edit
                          </button>
                          <button className="dropdown-item">
                            <Icon name="Eye" size={16} />
                            View Details
                          </button>
                          {subscription.status === "active" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(subscription, "suspended")
                              }
                              className="dropdown-item"
                            >
                              <Icon name="Pause" size={16} />
                              Suspend
                            </button>
                          )}
                          {subscription.status === "suspended" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(subscription, "active")
                              }
                              className="dropdown-item"
                            >
                              <Icon name="Play" size={16} />
                              Activate
                            </button>
                          )}
                          {subscription.status !== "cancelled" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(subscription, "cancelled")
                              }
                              className="dropdown-item u-text-error"
                            >
                              <Icon name="X" size={16} />
                              Cancel
                            </button>
                          )}
                          <button className="dropdown-item">
                            <Icon name="Receipt" size={16} />
                            Billing History
                          </button>
                        </div>
                      }
                    >
                      <Button variant="ghost" size="sm">
                        <Icon name="DotsThreeVertical" size={16} />
                      </Button>
                    </Dropdown>
                  ),
                })) || []
              }
              columns={[
                { key: "customer", title: "Customer" },
                { key: "plan", title: "Plan" },
                { key: "connection", title: "Connection" },
                { key: "status", title: "Status" },
                { key: "monthlyFee", title: "Monthly Fee" },
                { key: "startDate", title: "Start Date" },
                { key: "actions", title: "Actions" },
              ]}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="u-d-flex u-justify-content-center u-mt-6">
                <div className="pagination-controls">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="u-mx-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create/Edit Subscription Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedSubscription(null);
          resetForm();
        }}
        title={
          selectedSubscription ? "Edit Subscription" : "Add New Subscription"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Grid>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">Customer *</label>
                <select
                  className="form-select"
                  value={formData.customer_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_id: parseInt(e.target.value),
                    })
                  }
                  required
                >
                  <option value={0}>Select Customer</option>
                  {customersData?.results?.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.email}
                    </option>
                  ))}
                </select>
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">Plan *</label>
                <select
                  className="form-select"
                  value={formData.plan_id}
                  onChange={(e) => {
                    const planId = parseInt(e.target.value);
                    const selectedPlan = plansData?.results?.find(
                      (p) => p.id === planId,
                    );
                    setFormData({
                      ...formData,
                      plan_id: planId,
                      monthly_fee: selectedPlan?.price || 0,
                      setup_fee: selectedPlan?.setup_fee || 0,
                    });
                  }}
                  required
                >
                  <option value={0}>Select Plan</option>
                  {plansData?.results?.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price}/month
                    </option>
                  ))}
                </select>
              </div>
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">Router *</label>
                <select
                  className="form-select"
                  value={formData.router_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      router_id: parseInt(e.target.value),
                    })
                  }
                  required
                >
                  <option value={0}>Select Router</option>
                  {routersData?.results?.map((router) => (
                    <option key={router.id} value={router.id}>
                      {router.name} - {router.host}
                    </option>
                  ))}
                </select>
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">Username *</label>
                <input
                  className="form-input"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">Access Method *</label>
                <select
                  className="form-select"
                  value={formData.access_method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      access_method: e.target.value as any,
                    })
                  }
                  required
                >
                  <option value="pppoe">PPPoE</option>
                  <option value="static_ip">Static IP</option>
                  <option value="dhcp">DHCP</option>
                </select>
              </div>
            </GridCol>
            {(formData.access_method as string) === "static_ip" && (
              <GridCol xs={12} md={6}>
                <div className="form-field">
                  <label className="form-label">Static IP</label>
                  <input
                    className="form-input"
                    value={formData.static_ip}
                    onChange={(e) =>
                      setFormData({ ...formData, static_ip: e.target.value })
                    }
                    placeholder="192.168.1.100"
                  />
                </div>
              </GridCol>
            )}
            {(formData.access_method as string) === "dhcp" && (
              <GridCol xs={12} md={6}>
                <div className="form-field">
                  <label className="form-label">MAC Address</label>
                  <input
                    className="form-input"
                    value={formData.mac_address}
                    onChange={(e) =>
                      setFormData({ ...formData, mac_address: e.target.value })
                    }
                    placeholder="00:11:22:33:44:55"
                  />
                </div>
              </GridCol>
            )}
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">Status *</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as any,
                    })
                  }
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">Start Date *</label>
                <input
                  className="form-input"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  required
                />
              </div>
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">Monthly Fee *</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  value={formData.monthly_fee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthly_fee: parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">Setup Fee</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  value={formData.setup_fee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      setup_fee: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12}>
              <div className="form-field">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
            </GridCol>
          </Grid>

          <div className="u-d-flex u-justify-content-end u-gap-2 u-mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedSubscription(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {selectedSubscription
                ? "Update Subscription"
                : "Create Subscription"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Subscriptions;
