import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Button,
  Input,
  Badge,
  Icon,
  Modal,
  Grid,
  Select,
  GridCol,
} from "@shohojdhara/atomix";
import { Router } from "@/types";
import { apiService } from "@/services/apiService";

interface RouterCardProps {
  router: Router;
  onEdit: (router: Router) => void;
  onView: (router: Router) => void;
  onDelete: (id: number) => void;
}

const RouterCard: React.FC<RouterCardProps> = ({
  router,
  onEdit,
  onView,
  onDelete,
}) => {
  const getStatusColor = (status: Router["status"]) => {
    switch (status) {
      case "online":
        return "success";
      case "offline":
        return "error";
      case "maintenance":
        return "warning";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: Router["status"]) => {
    switch (status) {
      case "online":
        return "CheckCircle";
      case "offline":
        return "XCircle";
      case "maintenance":
        return "Warning";
      default:
        return "XCircle";
    }
  };

  return (
    <Card className="u-p-4 u-border u-rounded u-shadow-sm u-flex u-flex-col u-justify-between">
      <div>
        <h3 className="u-text-lg u-fw-semibold u-mb-2">{router.name}</h3>
        <p className="u-text-sm u-text-secondary-emphasis u-mb-2">
          {router.host}
        </p>
        <div className="u-flex u-items-center u-gap-2 u-mb-2">
          <Icon name={getStatusIcon(router.status)} size={16} />
          <Badge
            variant={getStatusColor(router.status)}
            size="sm"
            label={router.status}
          />
        </div>
      </div>
      <div className="u-flex u-justify-between u-items-center u-mt-auto">
        <div className="u-flex u-items-center u-gap-1">
          <Icon name="Globe" size={16} />
          <span>Online</span>
        </div>
      </div>
      <div className="u-flex u-gap-2 u-mt-3">
        <Button variant="outline" size="sm" onClick={() => onEdit(router)}>
          <Icon name="Gear" size={16} />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onView(router)}>
          <Icon name="Eye" size={16} />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDelete(router.id)}>
          <Icon name="Trash" size={16} />
        </Button>
      </div>
    </Card>
  );
};

const RouterManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRouter, setSelectedRouter] = useState<Router | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    host: "",
    router_type: "mikrotik" as Router["router_type"],
    api_port: 8728,
    ssh_port: 22,
    username: "",
    password: "",
    use_tls: false,
    status: "offline" as Router["status"],
    location: "",
    description: "",
    coordinates: "",
    snmp_community: "public",
    snmp_port: 161,
    notes: "",
  });

  const itemsPerPage = 12;

  // Fetch routers
  const {
    data: routersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["routers", searchQuery, statusFilter],
    queryFn: () =>
      apiService.getRouters({
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

  const resetForm = () => {
    setFormData({
      name: "",
      host: "",
      router_type: "mikrotik",
      api_port: 8728,
      ssh_port: 22,
      username: "",
      password: "",
      use_tls: false,
      status: "offline",
      location: "",
      description: "",
      coordinates: "",
      snmp_community: "public",
      snmp_port: 161,
      notes: "",
    });
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
    resetForm();
  };

  const handleEdit = (router: Router) => {
    setSelectedRouter(router);
    setFormData({
      name: router.name,
      host: router.host,
      router_type: router.router_type,
      api_port: router.api_port,
      ssh_port: router.ssh_port,
      username: router.username,
      password: "",
      use_tls: router.use_tls,
      status: router.status,
      location: router.location || "",
      description: router.description || "",
      coordinates: router.coordinates || "",
      snmp_community: router.snmp_community,
      snmp_port: router.snmp_port,
      notes: router.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleView = (router: Router) => {
    setSelectedRouter(router);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this router?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (isEdit: boolean) => {
    const submitData = {
      ...formData,
      api_port: parseInt(formData.api_port.toString()),
      ssh_port: parseInt(formData.ssh_port.toString()),
      snmp_port: parseInt(formData.snmp_port.toString()),
    };

    if (isEdit && selectedRouter) {
      updateMutation.mutate({ id: selectedRouter.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const getStatusColor = (status: Router["status"]) => {
    switch (status) {
      case "online":
        return "success";
      case "offline":
        return "error";
      case "maintenance":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <div className="u-p-6 u-max-w-7xl u-mx-auto">
      <div className="u-mb-6">
        <h1 className="u-text-2xl u-fw-bold u-mb-2">Router Management</h1>
        <p className="u-text-muted">
          Manage your network routers and their configurations.
        </p>
      </div>

      {/* Filters and Actions */}
      <Card className="u-mb-6">
        <div className="u-p-4">
          <div className="u-flex u-gap-4 u-items-center u-flex-wrap">
            <div className="u-flex-1">
              <Input
                placeholder="Search routers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="u-p-2"
                options={[
                  { value: "all", label: "All Status" },
                  { value: "online", label: "Online" },
                  { value: "offline", label: "Offline" },
                  { value: "maintenance", label: "Maintenance" },
                ]}
              />
            </div>
            <Button variant="primary" onClick={handleCreate}>
              <Icon name="Plus" size={16} className="u-me-2" />
              Add Router
            </Button>
          </div>
        </div>
      </Card>

      {/* Routers List */}
      {isLoading ? (
        <div className="u-text-center u-py-8">
          <div className="u-spinner u-mx-auto"></div>
          <p className="u-text-muted u-mt-4">Loading routers...</p>
        </div>
      ) : error ? (
        <Card>
          <div className="u-p-6 u-text-center">
            <Icon name="Warning" size={48} className="u-text-error u-mb-4" />
            <h3 className="u-text-lg u-fw-semibold u-mb-2">
              Error Loading Routers
            </h3>
            <p className="u-text-muted">
              Failed to load router data. Please try again.
            </p>
          </div>
        </Card>
      ) : (
        <div className="u-grid u-grid-cols-1 u-gap-4 md:u-grid-cols-2 lg:u-grid-cols-3">
          {routersData?.results?.map((router) => (
            <RouterCard
              key={router.id}
              router={router}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Router Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Router"
      >
        <div className="u-space-y-4">
          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Router Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter router name"
              required
            />
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Host/IP Address *
            </label>
            <Input
              value={formData.host}
              onChange={(e) =>
                setFormData({ ...formData, host: e.target.value })
              }
              placeholder="192.168.1.1"
              required
            />
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Router Type
            </label>
            <Select
              value={formData.router_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  router_type: e.target.value as Router["router_type"],
                })
              }
              className="u-w-100"
              options={[
                { value: "mikrotik", label: "MikroTik" },
                { value: "cisco", label: "Cisco" },
                { value: "other", label: "Other" },
              ]}
            />
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              SSH Port
            </label>
            <Input
              type="number"
              value={formData.ssh_port}
              onChange={(e) =>
                setFormData({ ...formData, ssh_port: parseInt(e.target.value) })
              }
              placeholder="22"
              min="1"
              max="65535"
            />
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Username *
            </label>
            <Input
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Password
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Enter password"
            />
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Use TLS/SSL
            </label>
            <div className="u-flex u-items-center u-gap-2">
              <input
                type="checkbox"
                checked={formData.use_tls}
                onChange={(e) =>
                  setFormData({ ...formData, use_tls: e.target.checked })
                }
                className="u-me-2"
              />
              <span className="u-text-sm">
                Enable TLS/SSL for secure connections
              </span>
            </div>
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Location
            </label>
            <Input
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Data Center A, Rack 1"
            />
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Router description"
              className="u-w-100 u-p-2 u-border u-rounded u-bg-white"
              rows={3}
            />
          </div>
        </div>

        <div className="u-flex u-gap-3 u-mt-6 u-justify-end">
          <Button
            variant="secondary"
            onClick={() => setIsCreateModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSubmit(false)}
            disabled={createMutation.isLoading}
          >
            Add Router
          </Button>
        </div>
      </Modal>

      {/* Edit Router Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Router"
      >
        <div className="u-space-y-4">
          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Router Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter router name"
              required
            />
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Host/IP Address *
            </label>
            <Input
              value={formData.host}
              onChange={(e) =>
                setFormData({ ...formData, host: e.target.value })
              }
              placeholder="192.168.1.1"
              required
            />
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Router Type
            </label>
            <Select
              value={formData.router_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  router_type: e.target.value as Router["router_type"],
                })
              }
              className="u-w-100"
              options={[
                { value: "mikrotik", label: "MikroTik" },
                { value: "cisco", label: "Cisco" },
                { value: "other", label: "Other" },
              ]}
            />
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              SSH Port
            </label>
            <Input
              type="number"
              value={formData.ssh_port}
              onChange={(e) =>
                setFormData({ ...formData, ssh_port: parseInt(e.target.value) })
              }
              placeholder="22"
              min="1"
              max="65535"
            />
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Username *
            </label>
            <Input
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Password (leave blank to keep current)
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Use TLS/SSL
            </label>
            <div className="u-flex u-items-center u-gap-2">
              <input
                type="checkbox"
                checked={formData.use_tls}
                onChange={(e) =>
                  setFormData({ ...formData, use_tls: e.target.checked })
                }
                className="u-me-2"
              />
              <span className="u-text-sm">
                Enable TLS/SSL for secure connections
              </span>
            </div>
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Location
            </label>
            <Input
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Data Center A, Rack 1"
            />
          </div>

          <div>
            <label className="u-block u-text-sm u-fw-medium u-mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Router description"
              className="u-w-100 u-p-2 u-border u-rounded u-bg-white"
              rows={3}
            />
          </div>
        </div>

        <div className="u-flex u-gap-3 u-mt-6 u-justify-end">
          <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSubmit(true)}
            disabled={updateMutation.isLoading}
          >
            Update Router
          </Button>
        </div>
      </Modal>

      {/* View Router Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Router Details"
      >
        {selectedRouter && (
          <div className="u-space-y-4">
            <div>
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Name
              </label>
              <p className="u-text-lg u-fw-semibold">{selectedRouter.name}</p>
            </div>

            <div>
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Host
              </label>
              <p className="u-text-lg">{selectedRouter.host}</p>
            </div>

            <div>
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Status
              </label>
              <Badge
                variant={getStatusColor(selectedRouter.status)}
                label={selectedRouter.status}
              />
            </div>

            <div>
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Username
              </label>
              <p>{selectedRouter.username}</p>
            </div>

            {selectedRouter.location && (
              <div>
                <label className="u-block u-text-sm u-fw-medium u-mb-1">
                  Location
                </label>
                <p>{selectedRouter.location}</p>
              </div>
            )}

            {selectedRouter.description && (
              <div>
                <label className="u-block u-text-sm u-fw-medium u-mb-1">
                  Description
                </label>
                <p>{selectedRouter.description}</p>
              </div>
            )}

            <div>
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Created
              </label>
              <p>{new Date(selectedRouter.created_at).toLocaleDateString()}</p>
            </div>

            <div>
              <label className="u-block u-text-sm u-fw-medium u-mb-1">
                Last Updated
              </label>
              <p>{new Date(selectedRouter.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        <div className="u-flex u-gap-3 u-mt-6 u-justify-end">
          <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default RouterManagement;
