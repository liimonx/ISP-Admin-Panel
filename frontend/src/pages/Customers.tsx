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
    staleTime: 60000,
  });

  // Fetch customer statistics
  const { data: customerStats } = useQuery({
    queryKey: ["customer-stats"],
    queryFn: () => apiService.customers.getCustomerStats(),
    staleTime: 300000,
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

  const totalPages = Math.ceil((customersData?.count || 0) / itemsPerPage);

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                iconName="ArrowClockwise"
                iconSize={"sm"}
              >
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
        <div className="u-flex u-justify-between u-items-start u-mb-4">
          <div>
            <h1 className="u-fs-2xl u-font-bold u-mb-2 u-text-foreground">
              Customer Management
            </h1>
            <p className="u-text-secondary-emphasis u-fs-base">
              Manage your customer accounts, subscriptions, and billing
              information
            </p>
          </div>
          <div className="u-flex u-gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={handleExport}
              iconName="Download"
              iconSize={"sm"}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleCreateCustomer}
              iconName="Plus"
              iconSize={"sm"}
            >
              Add Customer
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <Grid>
          <GridCol xs={12} md={3}>
            <Card>
              <div className="u-flex u-items-center u-justify-between">
                <div>
                  <div className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                    Total Customers
                  </div>
                  <div className="u-fs-xl u-font-bold">
                    {customersData?.count ||
                      customerStats?.total_customers ||
                      0}
                  </div>
                </div>
                <div className="u-bg-primary-subtle u-p-3 u-rounded">
                  <Icon name="Users" size={"lg"} className="u-text-primary" />
                </div>
              </div>
            </Card>
          </GridCol>
          <GridCol xs={12} md={3}>
            <Card>
              <div className="u-flex u-items-center u-justify-between">
                <div>
                  <div className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                    Active
                  </div>
                  <div className="u-fs-xl u-font-bold">
                    {customerStats?.active_customers ||
                      customersData?.results?.filter(
                        (c) => c.status === "active",
                      ).length ||
                      0}
                  </div>
                </div>
                <div className="u-bg-success-subtle u-p-3 u-rounded">
                  <Icon
                    name="CheckCircle"
                    size={"lg"}
                    className="u-text-success"
                  />
                </div>
              </div>
            </Card>
          </GridCol>
          <GridCol xs={12} md={3}>
            <Card>
              <div className="u-flex u-items-center u-justify-between">
                <div>
                  <div className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                    Suspended
                  </div>
                  <div className="u-fs-xl u-font-bold">
                    {customersData?.results?.filter(
                      (c) => c.status === "suspended",
                    ).length || 0}
                  </div>
                </div>
                <div className="u-bg-warning-subtle u-p-3 u-rounded">
                  <Icon name="Warning" size={"lg"} className="u-text-warning" />
                </div>
              </div>
            </Card>
          </GridCol>
          <GridCol xs={12} md={3}>
            <Card>
              <div className="u-flex u-items-center u-justify-between">
                <div>
                  <div className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                    Inactive
                  </div>
                  <div className="u-fs-xl u-font-bold">
                    {customersData?.results?.filter(
                      (c) => c.status === "inactive",
                    ).length || 0}
                  </div>
                </div>
                <div className="u-bg-secondary-subtle u-p-3 u-rounded">
                  <Icon
                    name="UserMinus"
                    size={"lg"}
                    className="u-text-secondary-emphasis"
                  />
                </div>
              </div>
            </Card>
          </GridCol>
        </Grid>
      </div>

      {/* Search and Filters */}
      <Card className="u-mb-6">
        <Grid>
          <GridCol xs={12} md={6} lg={4}>
            <Input
              placeholder="Search by name, email, phone, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </GridCol>
          <GridCol xs={12} md={6} lg={3}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "suspended", label: "Suspended" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </GridCol>
          <GridCol xs={12} md={12} lg={5}>
            <div className="u-flex u-justify-end u-gap-2">
              <Button
                variant="outline"
                size="md"
                iconName="Funnel"
                iconSize={"sm"}
              >
                Advanced Filters
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
              >
                Clear
              </Button>
            </div>
          </GridCol>
        </Grid>
      </Card>

      {/* Customers DataTable */}
      <Card>
        {isLoading ? (
          <div className="u-text-center u-p-6">
            <Spinner size="lg" />
            <p className="u-mt-3 u-text-secondary-emphasis">
              Loading customers...
            </p>
          </div>
        ) : (
          <>
            <DataTable
              data={customersData?.results || []}
              columns={[
                {
                  key: "customer",
                  title: "Customer",
                  render: (_, customer: any) => (
                    <div className="u-flex u-items-center">
                      <Avatar
                        size="sm"
                        initials={customer.name?.charAt(0) || "?"}
                        className="u-me-3"
                      />
                      <div>
                        <div className="u-font-normal">
                          {sanitizeText(customer.name)}
                        </div>
                        {customer.company_name && (
                          <div className="u-text-secondary-emphasis u-fs-sm">
                            {sanitizeText(customer.company_name)}
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "contact",
                  title: "Contact Info",
                  render: (_, customer: any) => (
                    <div>
                      <div className="u-fs-sm u-mb-1">
                        <Icon
                          name="Envelope"
                          size={14}
                          className="u-me-2 u-text-secondary-emphasis"
                        />
                        {sanitizeEmail(customer.email)}
                      </div>
                      <div className="u-fs-sm">
                        <Icon
                          name="Phone"
                          size={14}
                          className="u-me-2 u-text-secondary-emphasis"
                        />
                        {sanitizePhone(customer.phone)}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "location",
                  title: "Location",
                  render: (_, customer: any) => (
                    <div>
                      <div className="u-fs-sm">
                        {sanitizeText(customer.city)},{" "}
                        {sanitizeText(customer.state)}
                      </div>
                      <div className="u-text-secondary-emphasis u-fs-sm">
                        {sanitizeText(customer.country)}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "status",
                  title: "Status",
                  render: (status: any) => getStatusBadge(status),
                },
                {
                  key: "created_at",
                  title: "Joined",
                  render: (val: any) => new Date(val).toLocaleDateString(),
                },
                {
                  key: "actions",
                  title: "Actions",
                  render: (_, customer: any) => (
                    <div className="u-flex u-gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCustomer(customer)}
                        iconName="Eye"
                        iconSize={14}
                        iconOnly
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCustomer(customer)}
                        iconName="Pencil"
                        iconSize={14}
                        iconOnly
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCustomer(customer)}
                        disabled={deleteMutation.isPending}
                        iconName="Trash"
                        iconSize={14}
                        iconOnly
                      />
                    </div>
                  ),
                },
              ]}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="u-p-4 u-border u-flex u-justify-end">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}

            {customersData?.results?.length === 0 && (
              <div className="u-text-center u-p-6">
                <Icon
                  name="Users"
                  size={48}
                  className="u-text-secondary-emphasis u-mb-3"
                />
                <h3 className="u-fs-lg u-font-bold u-mb-2">
                  No customers found
                </h3>
                <p className="u-text-secondary-emphasis u-mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Get started by creating your first customer"}
                </p>
                <Button
                  variant="primary"
                  onClick={handleCreateCustomer}
                  iconName="Plus"
                  iconSize={"sm"}
                >
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
          <div className="u-flex u-flex-column u-gap-4">
            <Card>
              <div className="u-flex u-items-center u-gap-4">
                <Avatar
                  initials={selectedCustomer.name?.charAt(0) || "?"}
                  size="xl"
                />
                <div>
                  <h2 className="u-fs-2xl u-font-bold u-mb-1">
                    {selectedCustomer.name}
                  </h2>
                  {selectedCustomer.company_name && (
                    <div className="u-text-secondary-emphasis u-fs-base u-mb-2 u-flex u-items-center">
                      <Icon name="Buildings" size={16} className="u-me-2" />
                      {selectedCustomer.company_name}
                    </div>
                  )}
                  <div className="u-mt-1">
                    {getStatusBadge(selectedCustomer.status)}
                  </div>
                </div>
              </div>
            </Card>

            <Grid>
              <GridCol xs={12} xl={6}>
                <Card className="u-h-100">
                  <h3 className="u-fs-lg u-font-bold u-mb-4 u-flex u-items-center">
                    <Icon
                      name="AddressBook"
                      size={20}
                      className="u-me-2 u-text-primary"
                    />
                    Contact Information
                  </h3>
                  <div className="u-flex u-flex-column u-gap-3">
                    <div>
                      <label className="u-fs-sm u-text-secondary-emphasis u-mb-1 u-block">
                        Email
                      </label>
                      <div className="u-flex u-items-center">
                        <Icon
                          name="Envelope"
                          size={16}
                          className="u-me-2 u-text-secondary-emphasis"
                        />
                        <span className="u-font-medium">
                          {selectedCustomer.email}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="u-fs-sm u-text-secondary-emphasis u-mb-1 u-block">
                        Phone
                      </label>
                      <div className="u-flex u-items-center">
                        <Icon
                          name="Phone"
                          size={16}
                          className="u-me-2 u-text-secondary-emphasis"
                        />
                        <span className="u-font-medium">
                          {selectedCustomer.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </GridCol>

              <GridCol xs={12} xl={6}>
                <Card className="u-h-100">
                  <h3 className="u-fs-lg u-font-bold u-mb-4 u-flex u-items-center">
                    <Icon
                      name="IdentificationCard"
                      size={20}
                      className="u-me-2 u-text-primary"
                    />
                    Account Details
                  </h3>
                  <div className="u-flex u-flex-column u-gap-3">
                    <div>
                      <label className="u-fs-sm u-text-secondary-emphasis u-mb-1 u-block">
                        Tax ID
                      </label>
                      <div className="u-flex u-items-center">
                        <Icon
                          name="Receipt"
                          size={16}
                          className="u-me-2 u-text-secondary-emphasis"
                        />
                        <span className="u-font-medium">
                          {selectedCustomer.tax_id || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="u-fs-sm u-text-secondary-emphasis u-mb-1 u-block">
                        Customer Since
                      </label>
                      <div className="u-flex u-items-center">
                        <Icon
                          name="CalendarBlank"
                          size={16}
                          className="u-me-2 u-text-secondary-emphasis"
                        />
                        <span className="u-font-medium">
                          {new Date(
                            selectedCustomer.created_at,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </GridCol>
            </Grid>

            {/* Location Card */}
            <Card>
              <h3 className="u-fs-lg u-font-bold u-mb-4 u-flex u-items-center">
                <Icon
                  name="MapPin"
                  size={20}
                  className="u-me-2 u-text-primary"
                />
                Location
              </h3>
              <div className="u-mb-4">
                <label className="u-fs-sm u-text-secondary-emphasis u-mb-1 u-block">
                  Address
                </label>
                <div className="u-font-medium u-leading-normal">
                  {selectedCustomer.address}
                </div>
              </div>
              <Grid>
                <GridCol xs={12} md={4}>
                  <div className="u-mb-3 u-mb-md-0">
                    <label className="u-fs-sm u-text-secondary-emphasis u-mb-1 u-block">
                      City
                    </label>
                    <span className="u-font-medium">
                      {selectedCustomer.city}
                    </span>
                  </div>
                </GridCol>
                <GridCol xs={12} md={4}>
                  <div className="u-mb-3 u-mb-md-0">
                    <label className="u-fs-sm u-text-secondary-emphasis u-mb-1 u-block">
                      State
                    </label>
                    <span className="u-font-medium">
                      {selectedCustomer.state}
                    </span>
                  </div>
                </GridCol>
                <GridCol xs={12} md={4}>
                  <div>
                    <label className="u-fs-sm u-text-secondary-emphasis u-mb-1 u-block">
                      Postal Code
                    </label>
                    <span className="u-font-medium">
                      {selectedCustomer.postal_code}
                    </span>
                  </div>
                </GridCol>
              </Grid>
              <div className="u-mt-4 u-pt-4 u-border">
                <label className="u-fs-sm u-text-secondary-emphasis u-mb-1 u-block">
                  Country
                </label>
                <div className="u-flex u-items-center">
                  <Icon
                    name="GlobeHemisphereWest"
                    size={16}
                    className="u-me-2 u-text-secondary-emphasis"
                  />
                  <span className="u-font-medium">
                    {selectedCustomer.country}
                  </span>
                </div>
              </div>
            </Card>

            {selectedCustomer.notes && (
              <Card>
                <h3 className="u-fs-lg u-font-bold u-mb-3 u-flex u-items-center">
                  <Icon
                    name="Notepad"
                    size={20}
                    className="u-me-2 u-text-primary"
                  />
                  Notes
                </h3>
                <p className="u-text-secondary-emphasis u-leading-normal u-p-3 u-bg-secondary-subtle u-rounded">
                  {selectedCustomer.notes}
                </p>
              </Card>
            )}

            <div className="u-flex u-justify-end u-gap-2 u-mt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditCustomer(selectedCustomer);
                }}
                iconName="Pencil"
                iconSize={"sm"}
              >
                Edit Customer
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Done
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
          {(createMutation.isError || updateMutation.isError) && (
            <Callout variant="error" className="u-mb-4">
              {selectedCustomer
                ? "Failed to update customer. Please check your inputs and try again."
                : "Failed to create customer. Please check your inputs and try again."}
            </Callout>
          )}

          <Grid>
            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label
                  htmlFor="name"
                  className="u-block u-fs-sm u-font-normal u-mb-1"
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
                  className="u-w-100"
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label
                  htmlFor="email"
                  className="u-block u-fs-sm u-font-normal u-mb-1"
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
                  className="u-w-100"
                />
              </div>
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label
                  htmlFor="phone"
                  className="u-block u-fs-sm u-font-normal u-mb-1"
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
                  className="u-w-100"
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label
                  htmlFor="company_name"
                  className="u-block u-fs-sm u-font-normal u-mb-1"
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
                  className="u-w-100"
                />
              </div>
            </GridCol>
          </Grid>

          <div className="u-mb-3">
            <label
              htmlFor="address"
              className="u-block u-fs-sm u-font-normal u-mb-1"
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
              className="u-w-100"
            />
          </div>

          <Grid>
            <GridCol xs={12} md={4}>
              <div className="u-mb-3">
                <label
                  htmlFor="city"
                  className="u-block u-fs-sm u-font-normal u-mb-1"
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
                  className="u-w-100"
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={4}>
              <div className="u-mb-3">
                <label
                  htmlFor="state"
                  className="u-block u-fs-sm u-font-normal u-mb-1"
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
                  className="u-w-100"
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={4}>
              <div className="u-mb-3">
                <label
                  htmlFor="postal_code"
                  className="u-block u-fs-sm u-font-normal u-mb-1"
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
                  className="u-w-100"
                />
              </div>
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label
                  htmlFor="country"
                  className="u-block u-fs-sm u-font-normal u-mb-1"
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
                  className="u-w-100"
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label
                  htmlFor="tax_id"
                  className="u-block u-fs-sm u-font-normal u-mb-1"
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
                  className="u-w-100"
                />
              </div>
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label
                  htmlFor="status"
                  className="u-block u-fs-sm u-font-normal u-mb-1"
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
              </div>
            </GridCol>
          </Grid>

          <div className="u-mb-4">
            <label
              htmlFor="notes"
              className="u-block u-fs-sm u-font-normal u-mb-1"
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
              className="u-w-100"
            />
          </div>

          <div className="u-flex u-justify-end u-gap-3 u-mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={createMutation.isPending || updateMutation.isPending}
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
