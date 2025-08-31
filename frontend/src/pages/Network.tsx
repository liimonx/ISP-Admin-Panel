import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Button,
  Icon,
  Input,
  DataTable,
  Badge,
  Pagination,
  Modal,
  Form,
  Grid,
  GridCol,
  Callout,
  Dropdown,
  Progress,
} from "@shohojdhara/atomix";
import { Router } from "../types";
import { apiService } from "../services/apiService";

const Network: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState<number | null>(
    null,
  );
  const [selectedRouter, setSelectedRouter] = useState<Router | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    router_type: "mikrotik" as const,
    host: "",
    api_port: 8728,
    ssh_port: 22,
    username: "",
    password: "",
    use_tls: false,
    location: "",
    coordinates: "",
    snmp_community: "public",
    snmp_port: 161,
    notes: "",
  });

  const itemsPerPage = 10;

  // Fetch routers
  const {
    data: routersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["routers", currentPage, searchQuery, statusFilter],
    queryFn: () =>
      apiService.getRouters({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  // Create router mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<Router, "id" | "created_at" | "updated_at">) =>
      apiService.createRouter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routers"] });
      setIsCreateModalOpen(false);
      resetForm();
    },
  });

  // Update router mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Router> }) =>
      apiService.updateRouter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routers"] });
      setIsEditModalOpen(false);
      setSelectedRouter(null);
      resetForm();
    },
  });

  // Delete router mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteRouter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routers"] });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: (id: number) => {
      setIsTestingConnection(id);
      return apiService.testRouterConnection(id);
    },
    onSuccess: (data, id) => {
      setIsTestingConnection(null);
      if (data.success) {
        alert("Connection successful!");
      } else {
        alert(`Connection failed: ${data.error}`);
      }
    },
    onError: (error, id) => {
      setIsTestingConnection(null);
      alert("Connection test failed");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      router_type: "mikrotik" as any,
      host: "",
      api_port: 8728,
      ssh_port: 22,
      username: "",
      password: "",
      use_tls: false,
      location: "",
      coordinates: "",
      snmp_community: "public",
      snmp_port: 161,
      notes: "",
    });
  };

  const handleCreateRouter = () => {
    setIsCreateModalOpen(true);
    resetForm();
  };

  const handleEditRouter = (router: Router) => {
    setSelectedRouter(router);
    setFormData({
      name: router.name,
      description: router.description || "",
      router_type: router.router_type as any,
      host: router.host,
      api_port: router.api_port,
      ssh_port: router.ssh_port,
      username: router.username,
      password: "", // Don't populate password for security
      use_tls: router.use_tls,
      location: router.location || "",
      coordinates: router.coordinates || "",
      snmp_community: router.snmp_community,
      snmp_port: router.snmp_port,
      notes: router.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteRouter = (router: Router) => {
    if (window.confirm(`Are you sure you want to delete ${router.name}?`)) {
      deleteMutation.mutate(router.id);
    }
  };

  const handleTestConnection = (router: Router) => {
    testConnectionMutation.mutate(router.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRouter) {
      updateMutation.mutate({ id: selectedRouter.id, data: formData });
    } else {
      createMutation.mutate({ ...formData, status: "offline" });
    }
  };

  const getStatusBadge = (status: Router["status"]) => {
    const variants = {
      online: "success",
      offline: "error",
      maintenance: "warning",
    } as const;

    return (
      <Badge
        variant={variants[status]}
        size="sm"
        label={status.charAt(0).toUpperCase() + status.slice(1)}
      />
    );
  };

  const getRouterTypeBadge = (type: Router["router_type"]) => {
    const colors = {
      mikrotik: "primary",
      cisco: "secondary",
      other: "secondary",
    } as const;

    return (
      <Badge variant={colors[type]} size="sm" label={type.toUpperCase()} />
    );
  };

  const getUptimePercentage = (lastSeen?: string) => {
    if (!lastSeen) return 0;
    const now = new Date().getTime();
    const lastSeenTime = new Date(lastSeen).getTime();
    const diffHours = (now - lastSeenTime) / (1000 * 60 * 60);
    return Math.max(0, Math.min(100, 100 - diffHours));
  };

  const totalPages = Math.ceil((routersData?.count || 0) / itemsPerPage);

  if (error) {
    return (
      <Callout variant="error" className="u-mb-4">
        Error loading network devices. Please try again.
      </Callout>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-6">
        <div>
          <h1 className="u-mb-2">Network Management</h1>
          <p className="u-text-secondery">
            Manage routers and network devices for your ISP infrastructure
          </p>
        </div>
        <div className="u-d-flex u-gap-2">
          <Button variant="outline" size="md">
            <Icon name="ChartLine" size={16} />
            Network Stats
          </Button>
          <Button variant="outline" size="md">
            <Icon name="Download" size={16} />
            Export
          </Button>
          <Button variant="primary" size="md" onClick={handleCreateRouter}>
            <Icon name="Plus" size={16} />
            Add Router
          </Button>
        </div>
      </div>

      {/* Network Overview Cards */}
      <Grid className="u-mb-6">
        <GridCol xs={12} md={3}>
          <Card>
            <div className="u-d-flex u-align-items-center u-justify-content-between">
              <div>
                <div className="u-text-sm u-text-secondery u-mb-1">
                  Total Routers
                </div>
                <div className="u-font-size-xl u-font-weight-bold">
                  {routersData?.count || 0}
                </div>
              </div>
              <div className="u-bg-primary-light u-p-3 u-border-radius-2">
                <Icon name="Globe" size={24} className="u-text-primary" />
              </div>
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} md={3}>
          <Card>
            <div className="u-d-flex u-align-items-center u-justify-content-between">
              <div>
                <div className="u-text-sm u-text-secondery u-mb-1">
                  Online Routers
                </div>
                <div className="u-font-size-xl u-font-weight-bold">
                  {routersData?.results?.filter((r) => r.status === "online")
                    .length || 0}
                </div>
              </div>
              <div className="u-bg-success-light u-p-3 u-border-radius-2">
                <Icon name="CheckCircle" size={24} className="u-text-success" />
              </div>
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} md={3}>
          <Card>
            <div className="u-d-flex u-align-items-center u-justify-content-between">
              <div>
                <div className="u-text-sm u-text-secondery u-mb-1">
                  Offline Routers
                </div>
                <div className="u-font-size-xl u-font-weight-bold">
                  {routersData?.results?.filter((r) => r.status === "offline")
                    .length || 0}
                </div>
              </div>
              <div className="u-bg-error-light u-p-3 u-border-radius-2">
                <Icon name="XCircle" size={24} className="u-text-error" />
              </div>
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} md={3}>
          <Card>
            <div className="u-d-flex u-align-items-center u-justify-content-between">
              <div>
                <div className="u-text-sm u-text-secondery u-mb-1">
                  Maintenance
                </div>
                <div className="u-font-size-xl u-font-weight-bold">
                  {routersData?.results?.filter(
                    (r) => r.status === "maintenance",
                  ).length || 0}
                </div>
              </div>
              <div className="u-bg-warning-light u-p-3 u-border-radius-2">
                <Icon name="Wrench" size={24} className="u-text-warning" />
              </div>
            </div>
          </Card>
        </GridCol>
      </Grid>

      {/* Filters and Search */}
      <Card className="u-mb-6">
        <Grid>
          <GridCol xs={12} md={6} lg={4}>
            <Input
              placeholder="Search routers..."
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
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
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

      {/* Routers Table */}
      <Card>
        {isLoading ? (
          <div className="u-d-flex u-justify-content-center u-align-items-center u-py-8">
            <div className="u-text-center">
              <Icon
                name="Spinner"
                size={32}
                className="u-text-primary u-mb-2"
              />
              <p>Loading network devices...</p>
            </div>
          </div>
        ) : (
          <>
            <DataTable
              data={
                routersData?.results?.map((router) => ({
                  id: router.id,
                  router: (
                    <div>
                      <div className="u-font-weight-medium">{router.name}</div>
                      {router.description && (
                        <div className="u-text-sm u-text-secondery">
                          {router.description}
                        </div>
                      )}
                    </div>
                  ),
                  type: getRouterTypeBadge(router.router_type),
                  host: (
                    <div>
                      <div className="u-text-sm">{router.host}</div>
                      <div className="u-text-xs u-text-secondery">
                        API: {router.api_port} | SSH: {router.ssh_port}
                      </div>
                    </div>
                  ),
                  status: getStatusBadge(router.status),
                  uptime: (
                    <div>
                      <Progress
                        value={Math.random() * 100}
                        size="sm"
                        className="u-mb-1"
                      />
                      <div className="u-text-xs u-text-secondery">
                        {Math.floor(Math.random() * 30)} days
                      </div>
                    </div>
                  ),
                  location: (
                    <div className="u-text-sm">
                      {router.location || "Not specified"}
                    </div>
                  ),
                  actions: (
                    <div className="u-d-flex u-gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestConnection(router)}
                        disabled={isTestingConnection === router.id}
                      >
                        {isTestingConnection === router.id ? (
                          <Icon name="Spinner" size={14} />
                        ) : (
                          <Icon name="XCircle" size={14} />
                        )}
                        Test
                      </Button>
                      <Dropdown
                        menu={
                          <div>
                            <button
                              onClick={() => handleEditRouter(router)}
                              className="dropdown-item"
                            >
                              <Icon name="Pencil" size={16} />
                              Edit
                            </button>
                            <button className="dropdown-item">
                              <Icon name="Eye" size={16} />
                              View Details
                            </button>
                            <button className="dropdown-item">
                              <Icon name="GearSix" size={16} />
                              Configure
                            </button>
                            <button
                              onClick={() => handleDeleteRouter(router)}
                              className="dropdown-item u-text-error"
                            >
                              <Icon name="Trash" size={16} />
                              Delete
                            </button>
                          </div>
                        }
                      >
                        <Button variant="ghost" size="sm">
                          <Icon name="DotsThreeVertical" size={16} />
                        </Button>
                      </Dropdown>
                    </div>
                  ),
                })) || []
              }
              columns={[
                { key: "router", title: "Router" },
                { key: "type", title: "Type" },
                { key: "host", title: "Host/IP" },
                { key: "status", title: "Status" },
                { key: "uptime", title: "Uptime" },
                { key: "location", title: "Location" },
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

      {/* Create/Edit Router Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedRouter(null);
          resetForm();
        }}
        title={selectedRouter ? "Edit Router" : "Add New Router"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Grid>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">Router Name *</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">Router Type</label>
                <select
                  className="form-select"
                  value={formData.router_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      router_type: e.target.value as any,
                    })
                  }
                >
                  <option value="mikrotik">MikroTik</option>
                  <option value="cisco">Cisco</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </GridCol>
            <GridCol xs={12}>
              <div className="form-field">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={8}>
              <div className="form-field">
                <label className="form-label">Host/IP Address *</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.host}
                  onChange={(e) =>
                    setFormData({ ...formData, host: e.target.value })
                  }
                  required
                  placeholder="192.168.1.1"
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={4}>
              <div className="form-field">
                <label className="form-label">API Port</label>
                <input
                  className="form-input"
                  type="number"
                  value={formData.api_port}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      api_port: parseInt(e.target.value) || 8728,
                    })
                  }
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">SSH Port</label>
                <input
                  className="form-input"
                  type="number"
                  value={formData.ssh_port}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ssh_port: parseInt(e.target.value) || 22,
                    })
                  }
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">Username *</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">Password *</label>
                <input
                  className="form-input"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!selectedRouter}
                  placeholder={
                    selectedRouter ? "Leave empty to keep current" : ""
                  }
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={formData.use_tls}
                    onChange={(e) =>
                      setFormData({ ...formData, use_tls: e.target.checked })
                    }
                  />
                  Use TLS
                </label>
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">Location</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Server Room A, Building 1"
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">GPS Coordinates</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.coordinates}
                  onChange={(e) =>
                    setFormData({ ...formData, coordinates: e.target.value })
                  }
                  placeholder="23.7749, 90.3997"
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">SNMP Community</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.snmp_community}
                  onChange={(e) =>
                    setFormData({ ...formData, snmp_community: e.target.value })
                  }
                />
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label">SNMP Port</label>
                <input
                  className="form-input"
                  type="number"
                  value={formData.snmp_port}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      snmp_port: parseInt(e.target.value) || 161,
                    })
                  }
                />
              </div>
            </GridCol>
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
                setSelectedRouter(null);
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
              {selectedRouter ? "Update Router" : "Create Router"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Network;
