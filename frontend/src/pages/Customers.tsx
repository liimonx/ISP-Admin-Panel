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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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

  // Real-time customers connection


  // Fetch customers
  const {
    data: customersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customers", currentPage, searchQuery, statusFilter],
    queryFn: () =>
      apiService.getCustomers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<Customer, "id" | "created_at" | "updated_at">) =>
      apiService.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsCreateModalOpen(false);
      resetForm();
    },
  });

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
      apiService.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
      resetForm();
    },
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
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

  const totalPages = customersData?.count 
    ? Math.ceil(customersData.count / itemsPerPage) 
    : 0;

  if (error) {
    console.error('Customers loading error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Please try again.';
    return (
      <Callout variant="error">
        Error loading customers: {errorMessage}
      </Callout>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="u-mb-8">
        <div className="u-d-flex u-justify-content-between u-align-items-start u-mb-4">
          <div>
            <h1 className="u-text-3xl u-font-weight-bold u-mb-2 u-text-foreground">Customer Management</h1>
            <p className="u-text-secondary u-text-lg">
              Manage your customer accounts, subscriptions, and billing information
            </p>
          </div>
          <div className="u-d-flex u-gap-3">
            <Button variant="outline" size="md">
              <Icon name="Download" size={16} />
              <span className="u-d-none u-d-sm-inline">Export</span>
            </Button>
            <Button variant="primary" size="md" onClick={handleCreateCustomer}>
              <Icon name="Plus" size={16} />
              <span className="u-d-none u-d-sm-inline">Add Customer</span>
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="u-d-flex u-gap-6 u-text-sm">
          <div className="u-d-flex u-align-items-center u-gap-2">
            <div className="u-w-3 u-h-3 u-bg-success u-rounded-circle"></div>
            <span className="u-text-secondary">Total: {customersData?.count || 0} customers</span>
          </div>
          <div className="u-d-flex u-align-items-center u-gap-2">
            <div className="u-w-3 u-h-3 u-bg-primary u-rounded-circle"></div>
            <span className="u-text-secondary">Active: {customersData?.results?.filter(c => c.status === 'active').length || 0}</span>
          </div>
          <div className="u-d-flex u-align-items-center u-gap-2">
            <div className="u-w-3 u-h-3 u-bg-warning u-rounded-circle"></div>
            <span className="u-text-secondary">Suspended: {customersData?.results?.filter(c => c.status === 'suspended').length || 0}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="u-mb-8">
        <div className="u-d-flex u-gap-4 u-align-items-center u-flex-wrap">
          <div className="u-flex-1 u-min-width-300">
            <div className="u-position-relative">
              <Icon 
                name="MagnifyingGlass" 
                size={16} 
                className="u-position-absolute u-left-3 u-top-50 u-transform-translate-y-neg-50 u-text-secondary" 
              />
              <Input
                type="text"
                placeholder="Search by name, email, phone, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="u-pl-10"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="u-p-3 u-border u-rounded u-min-width-150 u-bg-surface"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button variant="outline" size="md">
            <Icon name="Funnel" size={16} />
            <span className="u-d-none u-d-md-inline">Advanced Filters</span>
          </Button>
        </div>
      </Card>

      {/* Customers Grid */}
      {isLoading ? (
        <div className="u-d-flex u-justify-content-center u-align-items-center u-py-8">
          <div className="u-text-center">
            <Spinner size="lg" />
            <p>Loading customers...</p>
          </div>
        </div>
      ) : (
        <Grid>
          {customersData?.results?.map((customer) => (
            <GridCol key={customer.id} xs={12} md={6} lg={4} className="u-mb-4">
              <Card className="u-h-100">
                <div className="u-d-flex u-align-items-center u-gap-3 u-mb-4">
                  <Avatar initials={customer.name?.charAt(0) || '?'} size="md" />
                  <div className="u-flex-fill">
                    <h3 className="u-mb-1">{sanitizeText(customer.name)}</h3>
                    {customer.company_name && (
                      <p className="u-fs-sm u-text-secondary u-mb-1">
                        {sanitizeText(customer.company_name)}
                      </p>
                    )}
                    <div className="u-d-flex u-align-items-center u-gap-2">
                      {getStatusBadge(customer.status)}
                    </div>
                  </div>
                </div>

                <div className="u-mb-4">
                  <div className="u-d-flex u-align-items-center u-gap-2 u-mb-2">
                    <Icon
                      name="Envelope"
                      size={16}
                      className="u-text-brand-emphasis"
                    />
                    <span className="u-fs-sm">{sanitizeEmail(customer.email)}</span>
                  </div>
                  <div className="u-d-flex u-align-items-center u-gap-2 u-mb-2">
                    <Icon name="Phone" size={16} className="u-text-brand-emphasis" />
                    <span className="u-fs-sm">{sanitizePhone(customer.phone)}</span>
                  </div>
                  <div className="u-d-flex u-align-items-center u-gap-2 u-mb-2">
                    <Icon
                      name="MapPin"
                      size={16}
                      className="u-text-brand-emphasis"
                    />
                    <span className="u-fs-sm">
                      {sanitizeText(customer.city)}, {sanitizeText(customer.state)}
                    </span>
                  </div>
                  <div className="u-d-flex u-align-items-center u-gap-2">
                    <Icon
                      name="Calendar"
                      size={16}
                      className="u-text-brand-emphasis"
                    />
                    <span className="u-fs-sm">
                      Joined{" "}
                      {new Date(customer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="u-d-flex u-gap-2 u-mt-auto">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="u-flex-fill"
                    onClick={() => handleViewCustomer(customer)}
                  >
                    <Icon name="Eye" size={16} />
                    View
                  </Button>
                  <Button 
                    variant="info" 
                    size="sm" 
                    className="u-flex-fill"
                    onClick={() => handleEditCustomer(customer)}
                  >
                    <Icon name="Pencil" size={16} />
                    Edit
                  </Button>
                  <Button
                    variant="error"
                    size="sm"
                    onClick={() => handleDeleteCustomer(customer)}
                    className="u-text-error"
                  >
                    <Icon name="Trash" size={16} />
                  </Button>
                </div>
              </Card>
            </GridCol>
          ))}
        </Grid>
      )}

      {/* Show message if no customers */}
      {!isLoading && (!customersData?.results || customersData.results.length === 0) && (
        <Card>
          <div className="u-text-center u-py-8">
            <Icon name="Users" size={48} className="u-text-secondary u-mb-4" />
            <h3 className="u-mb-2">No customers found</h3>
            <p className="u-text-secondary u-mb-4">
              {searchQuery
                ? "No customers match your search criteria."
                : "You haven't created any customers yet."}
            </p>
            <Button variant="primary" onClick={handleCreateCustomer}>
              <Icon name="Plus" size={16} />
              Add First Customer
            </Button>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="u-d-flex u-justify-content-center u-mt-6">
          <div className="u-d-flex u-gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <Icon name="CaretLeft" size={16} />
              Previous
            </Button>
            <span className="u-d-flex u-align-items-center u-px-3">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
              <Icon name="CaretRight" size={16} />
            </Button>
          </div>
        </div>
      )}

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Avatar initials={selectedCustomer.name?.charAt(0) || '?'} size="lg" />
              <div>
                <h2 className="u-mb-1">{selectedCustomer.name}</h2>
                {selectedCustomer.company_name && (
                  <p className="u-text-secondary u-mb-1">{selectedCustomer.company_name}</p>
                )}
                {getStatusBadge(selectedCustomer.status)}
              </div>
            </div>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary u-mb-1">Email</label>
                  <p>{selectedCustomer.email}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary u-mb-1">Phone</label>
                  <p>{selectedCustomer.phone}</p>
                </div>
              </GridCol>
            </Grid>

            <div className="u-mb-3">
              <label className="u-fs-sm u-text-secondary u-mb-1">Address</label>
              <p>{selectedCustomer.address}</p>
            </div>

            <Grid>
              <GridCol xs={12} md={4}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary u-mb-1">City</label>
                  <p>{selectedCustomer.city}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={4}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary u-mb-1">State</label>
                  <p>{selectedCustomer.state}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={4}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary u-mb-1">Postal Code</label>
                  <p>{selectedCustomer.postal_code}</p>
                </div>
              </GridCol>
            </Grid>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary u-mb-1">Country</label>
                  <p>{selectedCustomer.country}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary u-mb-1">Tax ID</label>
                  <p>{selectedCustomer.tax_id || "N/A"}</p>
                </div>
              </GridCol>
            </Grid>

            {selectedCustomer.notes && (
              <div className="u-mb-3">
                <label className="u-fs-sm u-text-secondary u-mb-1">Notes</label>
                <p>{selectedCustomer.notes}</p>
              </div>
            )}

            <div className="u-mb-3">
              <label className="u-fs-sm u-text-secondary u-mb-1">Created</label>
              <p>{new Date(selectedCustomer.created_at).toLocaleString()}</p>
            </div>

            <div className="u-d-flex u-justify-content-end u-gap-2 u-mt-6">
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
              <label htmlFor="name" className="u-d-block u-fs-sm u-fw-medium u-mb-1">Full Name *</label>
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
              <label htmlFor="email" className="u-d-block u-fs-sm u-fw-medium u-mb-1">Email *</label>
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
              <label htmlFor="phone" className="u-d-block u-fs-sm u-fw-medium u-mb-1">Phone *</label>
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
              <label htmlFor="company_name" className="u-d-block u-fs-sm u-fw-medium u-mb-1">Company Name</label>
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
            <label htmlFor="address" className="u-d-block u-fs-sm u-fw-medium u-mb-1">Address *</label>
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
              <label htmlFor="city" className="u-d-block u-fs-sm u-fw-medium u-mb-1">City *</label>
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
              <label htmlFor="state" className="u-d-block u-fs-sm u-fw-medium u-mb-1">State *</label>
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
              <label htmlFor="postal_code" className="u-d-block u-fs-sm u-fw-medium u-mb-1">Postal Code *</label>
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
              <label htmlFor="country" className="u-d-block u-fs-sm u-fw-medium u-mb-1">Country *</label>
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
              <label htmlFor="tax_id" className="u-d-block u-fs-sm u-fw-medium u-mb-1">Tax ID</label>
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
              <label htmlFor="status" className="u-d-block u-fs-sm u-fw-medium u-mb-1">Status *</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Customer["status"],
                  })
                }
                required
                className="u-w-100 u-p-3 u-border u-rounded"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </GridCol>
          </Grid>

          <div className="u-mb-4">
            <label htmlFor="notes" className="u-d-block u-fs-sm u-fw-medium u-mb-1">Notes</label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="u-d-flex u-justify-content-end u-gap-2 u-mt-6">
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
              {selectedCustomer ? "Update Customer" : "Create Customer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
