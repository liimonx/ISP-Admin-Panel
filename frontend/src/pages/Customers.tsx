import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Button,
  Icon,
  Grid,
  GridCol,
  Badge,
  Avatar,
  Input,
  Select,
  Modal,
  Callout,
  Spinner,
  Textarea,
  DataTable,
  Pagination,
} from "@shohojdhara/atomix";
import { Customer } from "@/types";
import { apiService } from "@/services/apiService";
import { sanitizeText, sanitizeEmail, sanitizePhone } from "@/utils/sanitizer";

const Customers: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Bangladesh",
    company_name: "",
    tax_id: "",
    status: "active" as Customer["status"],
    notes: "",
  });

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
      params.status = statusFilter;
    }

    return params;
  };

  // Fetch customers
  const {
    data: customersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["customers", currentPage, searchQuery, statusFilter],
    queryFn: () => apiService.customers.getCustomers(buildQueryParams()),
    keepPreviousData: true,
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Fetch customer statistics
  const { data: customerStats } = useQuery({
    queryKey: ["customer-stats"],
    queryFn: () => apiService.customers.getCustomerStats(),
    staleTime: 60000, // 1 minute
    retry: 1,
  });

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<Customer, "id" | "created_at" | "updated_at">) =>
      apiService.customers.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Failed to create customer:", error);
    },
  });

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
      apiService.customers.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Failed to update customer:", error);
    },
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.customers.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
    },
    onError: (error: any) => {
      console.error("Failed to delete customer:", error);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      country: "Bangladesh",
      company_name: "",
      tax_id: "",
      status: "active",
      notes: "",
    });
  };

  const handleCreateCustomer = () => {
    setIsCreateModalOpen(true);
    resetForm();
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      postal_code: customer.postal_code,
      country: customer.country,
      company_name: customer.company_name || "",
      tax_id: customer.tax_id || "",
      status: customer.status,
      notes: customer.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleExport = async () => {
    try {
      // Create CSV content from current customers data
      const customers = customersData?.results || [];
      const headers = [
        "ID",
        "Name",
        "Email",
        "Phone",
        "Company",
        "Status",
        "City",
        "State",
        "Country",
        "Created",
      ];

      const csvContent = [
        headers.join(","),
        ...customers.map((customer) =>
          [
            customer.id,
            `"${customer.name}"`,
            customer.email,
            customer.phone,
            `"${customer.company_name || ""}"`,
            customer.status,
            `"${customer.city}"`,
            `"${customer.state}"`,
            `"${customer.country}"`,
            new Date(customer.created_at).toLocaleDateString(),
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const getStatusBadge = (status: Customer["status"]) => {
    const variants = {
      active: "success",
      inactive: "secondary",
      suspended: "warning",
      cancelled: "error",
    } as const;

    return (
      <Badge
        variant={variants[status]}
        size="sm"
        label={status.charAt(0).toUpperCase() + status.slice(1)}
      />
    );
  };

  if (error) {
    console.error("Customers loading error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Please try again.";
    return (
      <div className="u-p-6">
        <Callout variant="error" className="u-mb-4">
          <div className="u-flex u-items-center u-gap-3">
            <Icon name="Warning" size={20} />
            <div>
              <h3 className="u-mb-2">Failed to Load Customers</h3>
              <p className="u-mb-3">Error: {errorMessage}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <Icon name="ArrowClockwise" size={16} />
                Retry
              </Button>
            </div>
          </div>
        </Callout>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="u-mb-8">
        <div className="u-flex u-justify-between u-align-items-start u-mb-4">
          <div>
            <h1 className="u-text-3xl u-fw-bold u-mb-2 u-text-foreground">
              Customer Management
            </h1>
            <p className="u-text-secondary-emphasis u-text-lg">
              Manage your customer accounts, subscriptions, and billing
              information
            </p>
          </div>
          <div className="u-flex u-gap-3">
            <Button variant="outline" size="md" onClick={handleExport}>
              <Icon name="Download" size={16} />
              <span className="u-none u-sm-inline">Export</span>
            </Button>
            <Button variant="primary" size="md" onClick={handleCreateCustomer}>
              <Icon name="Plus" size={16} />
              <span className="u-none u-sm-inline">Add Customer</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="u-flex u-gap-6 u-text-sm">
          <div className="u-flex u-items-center u-gap-2">
            <div className="u-w-3 u-h-3 u-bg-success u-rounded-circle"></div>
            <span className="u-text-secondary-emphasis">
              Total:{" "}
              {customersData?.count || customerStats?.total_customers || 0}{" "}
              customers
            </span>
          </div>
          <div className="u-flex u-items-center u-gap-2">
            <div className="u-w-3 u-h-3 u-bg-primary u-rounded-circle"></div>
            <span className="u-text-secondary-emphasis">
              Active:{" "}
              {customersData?.results?.filter((c) => c.status === "active")
                .length ||
                customerStats?.active_customers ||
                0}
            </span>
          </div>
          <div className="u-flex u-items-center u-gap-2">
            <div className="u-w-3 u-h-3 u-bg-warning u-rounded-circle"></div>
            <span className="u-text-secondary-emphasis">
              Suspended:{" "}
              {customersData?.results?.filter((c) => c.status === "suspended")
                .length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="u-mb-8">
        <div className="u-flex u-gap-4 u-items-center u-flex-wrap">
          <div className="u-flex-1 u-min-w-300">
            <div className="u-relative">
              <Icon
                name="MagnifyingGlass"
                size={18}
                className="u-absolute u-left-3 u-top-50 u-transform-translate-y--50 u-text-secondary-emphasis"
              />
              <Input
                type="text"
                placeholder="Search by name, email, phone, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="u-ps-10"
              />
            </div>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="u-min-w-150"
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "suspended", label: "Suspended" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
          <Button variant="outline" size="md">
            <Icon name="Funnel" size={16} />
            <span className="u-none u-md-inline">Advanced Filters</span>
          </Button>
        </div>
      </Card>

      {/* Customers DataTable */}
      <Card>
        {isLoading ? (
          <div className="u-text-center u-p-6">
            <Spinner size="lg" />
            <p className="u-mt-3 u-text-secondary">Loading customers...</p>
          </div>
        ) : (
          <>
            <DataTable
              data={
                customersData?.results?.map((customer) => ({
                  id: customer.id,
                  customer: (
                    <div className="u-flex u-items-center">
                      <Avatar
                        size="sm"
                        initials={customer.name?.charAt(0) || "?"}
                        className="u-me-3"
                      />
                      <div>
                        <div className="u-fw-medium">
                          {sanitizeText(customer.name)}
                        </div>
                        {customer.company_name && (
                          <div className="u-text-secondary u-text-sm">
                            {sanitizeText(customer.company_name)}
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                  contact: (
                    <div>
                      <div className="u-text-sm u-mb-1">
                        <Icon
                          name="Envelope"
                          size={14}
                          className="u-me-2 u-text-secondary"
                        />
                        {sanitizeEmail(customer.email)}
                      </div>
                      <div className="u-text-sm">
                        <Icon
                          name="Phone"
                          size={14}
                          className="u-me-2 u-text-secondary"
                        />
                        {sanitizePhone(customer.phone)}
                      </div>
                    </div>
                  ),
                  location: (
                    <div>
                      <div className="u-text-sm">
                        {sanitizeText(customer.city)},{" "}
                        {sanitizeText(customer.state)}
                      </div>
                      <div className="u-text-secondary u-text-sm">
                        {sanitizeText(customer.country)}
                      </div>
                    </div>
                  ),
                  status: getStatusBadge(customer.status),
                  joined: new Date(customer.created_at).toLocaleDateString(),
                  actions: (
                    <div className="u-flex u-gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        <Icon name="Eye" size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <Icon name="Pencil" size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCustomer(customer)}
                        disabled={deleteMutation.isPending}
                      >
                        <Icon name="Trash" size={14} />
                      </Button>
                    </div>
                  ),
                })) || []
              }
              columns={[
                { key: "customer", title: "Customer" },
                { key: "contact", title: "Contact Info" },
                { key: "location", title: "Location" },
                { key: "status", title: "Status" },
                { key: "joined", title: "Joined" },
                { key: "actions", title: "Actions" },
              ]}
            />

            {/* Pagination */}
            {customersData &&
              Math.ceil((customersData.count || 0) / itemsPerPage) > 1 && (
                <div className="u-p-4 u-border-top">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(
                      (customersData.count || 0) / itemsPerPage,
                    )}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}

            {customersData?.results?.length === 0 && (
              <div className="u-text-center u-p-6">
                <Icon
                  name="Users"
                  size={48}
                  className="u-text-secondary u-mb-3"
                />
                <h3 className="u-h5 u-mb-2">No customers found</h3>
                <p className="u-text-secondary u-mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Get started by creating your first customer"}
                </p>
                <Button variant="primary" onClick={handleCreateCustomer}>
                  <Icon name="Plus" size={16} className="u-me-2" />
                  Add Customer
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* View Customer Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedCustomer(null);
        }}
        title="Customer Details"
        size="lg"
      >
        {selectedCustomer && (
          <div>
            <div className="u-flex u-items-center u-gap-3 u-mb-4">
              <Avatar
                initials={selectedCustomer.name?.charAt(0) || "?"}
                size="lg"
              />
              <div>
                <h2 className="u-mb-1">{selectedCustomer.name}</h2>
                {selectedCustomer.company_name && (
                  <p className="u-text-secondary-emphasis u-mb-1">
                    {selectedCustomer.company_name}
                  </p>
                )}
                {getStatusBadge(selectedCustomer.status)}
              </div>
            </div>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                    Email
                  </label>
                  <p>{selectedCustomer.email}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                    Phone
                  </label>
                  <p>{selectedCustomer.phone}</p>
                </div>
              </GridCol>
            </Grid>

            <div className="u-mb-3">
              <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                Address
              </label>
              <p>{selectedCustomer.address}</p>
            </div>

            <Grid>
              <GridCol xs={12} md={4}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                    City
                  </label>
                  <p>{selectedCustomer.city}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={4}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                    State
                  </label>
                  <p>{selectedCustomer.state}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={4}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                    Postal Code
                  </label>
                  <p>{selectedCustomer.postal_code}</p>
                </div>
              </GridCol>
            </Grid>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                    Country
                  </label>
                  <p>{selectedCustomer.country}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                    Tax ID
                  </label>
                  <p>{selectedCustomer.tax_id || "N/A"}</p>
                </div>
              </GridCol>
            </Grid>

            {selectedCustomer.notes && (
              <div className="u-mb-3">
                <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                  Notes
                </label>
                <p>{selectedCustomer.notes}</p>
              </div>
            )}

            <div className="u-mb-3">
              <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                Created
              </label>
              <p>{new Date(selectedCustomer.created_at).toLocaleString()}</p>
            </div>

            <div className="u-flex u-justify-end u-gap-2 u-mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditCustomer(selectedCustomer);
                }}
              >
                Edit Customer
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Customer Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedCustomer(null);
          resetForm();
        }}
        title={selectedCustomer ? "Edit Customer" : "Add New Customer"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Grid>
            <GridCol xs={12} md={6}>
              <label
                htmlFor="name"
                className="u-block u-fs-sm u-fw-medium u-mb-1"
              >
                Full Name *
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </GridCol>
            <GridCol xs={12} md={6}>
              <label
                htmlFor="email"
                className="u-block u-fs-sm u-fw-medium u-mb-1"
              >
                Email *
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <label
                htmlFor="phone"
                className="u-block u-fs-sm u-fw-medium u-mb-1"
              >
                Phone *
              </label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
            </GridCol>
            <GridCol xs={12} md={6}>
              <label
                htmlFor="company_name"
                className="u-block u-fs-sm u-fw-medium u-mb-1"
              >
                Company Name
              </label>
              <Input
                id="company_name"
                type="text"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
              />
            </GridCol>
          </Grid>

          <div className="u-mb-4">
            <label
              htmlFor="address"
              className="u-block u-fs-sm u-fw-medium u-mb-1"
            >
              Address *
            </label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
              rows={3}
            />
          </div>

          <Grid>
            <GridCol xs={12} md={4}>
              <label
                htmlFor="city"
                className="u-block u-fs-sm u-fw-medium u-mb-1"
              >
                City *
              </label>
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                required
              />
            </GridCol>
            <GridCol xs={12} md={4}>
              <label
                htmlFor="state"
                className="u-block u-fs-sm u-fw-medium u-mb-1"
              >
                State *
              </label>
              <Input
                id="state"
                type="text"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                required
              />
            </GridCol>
            <GridCol xs={12} md={4}>
              <label
                htmlFor="postal_code"
                className="u-block u-fs-sm u-fw-medium u-mb-1"
              >
                Postal Code *
              </label>
              <Input
                id="postal_code"
                type="text"
                value={formData.postal_code}
                onChange={(e) =>
                  setFormData({ ...formData, postal_code: e.target.value })
                }
                required
              />
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <label
                htmlFor="country"
                className="u-block u-fs-sm u-fw-medium u-mb-1"
              >
                Country *
              </label>
              <Input
                id="country"
                type="text"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                required
              />
            </GridCol>
            <GridCol xs={12} md={6}>
              <label
                htmlFor="tax_id"
                className="u-block u-fs-sm u-fw-medium u-mb-1"
              >
                Tax ID
              </label>
              <Input
                id="tax_id"
                type="text"
                value={formData.tax_id}
                onChange={(e) =>
                  setFormData({ ...formData, tax_id: e.target.value })
                }
              />
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <label
                htmlFor="status"
                className="u-block u-fs-sm u-fw-medium u-mb-1"
              >
                Status *
              </label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Customer["status"],
                  })
                }
                required
                className="u-w-100"
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "suspended", label: "Suspended" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
            </GridCol>
          </Grid>

          <div className="u-mb-4">
            <label
              htmlFor="notes"
              className="u-block u-fs-sm u-fw-medium u-mb-1"
            >
              Notes
            </label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="u-flex u-justify-end u-gap-2 u-mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedCustomer(null);
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
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Spinner size="sm" className="u-me-2" />
                  {selectedCustomer ? "Updating..." : "Creating..."}
                </>
              ) : selectedCustomer ? (
                "Update Customer"
              ) : (
                "Create Customer"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
