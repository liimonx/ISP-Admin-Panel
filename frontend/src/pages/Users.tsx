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
} from "@shohojdhara/atomix";
import { User } from "@/types";
import { apiService } from "@/services/apiService";

const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "support" as "support" | "admin" | "accountant",
    phone: "",
    is_active: true,
  });

  const itemsPerPage = 12;

  // Fetch users
  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users", currentPage, searchQuery, roleFilter],
    queryFn: () =>
      apiService.getUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        role: roleFilter !== "all" ? roleFilter : undefined,
      }),
  });

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<User, "id" | "date_joined" | "created_at">) =>
      apiService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsCreateModalOpen(false);
      resetForm();
    },
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      apiService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      role: "support",
      phone: "",
      is_active: true,
    });
  };

  const handleCreateUser = () => {
    setIsCreateModalOpen(true);
    resetForm();
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone: user.phone || "",
      is_active: user.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.username}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getRoleBadge = (role: User["role"]) => {
    const variants = {
      admin: "error",
      support: "primary",
      accountant: "warning",
    } as const;

    return (
      <Badge
        variant={variants[role]}
        size="sm"
        label={role.charAt(0).toUpperCase() + role.slice(1)}
      />
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge
        variant={isActive ? "success" : "secondary"}
        size="sm"
        label={isActive ? "Active" : "Inactive"}
      />
    );
  };

  const totalPages = usersData?.count 
    ? Math.ceil(usersData.count / itemsPerPage) 
    : 0;

  if (error) {
    console.error('Users loading error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Please try again.';
    return (
      <Callout variant="error" className="u-mb-4">
        Error loading users: {errorMessage}
      </Callout>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-6">
        <div>
          <h1 className="u-mb-2">User Management</h1>
          <p className="u-text-secondary-emphasis">
            Manage system users and their permissions
          </p>
        </div>
        <div className="u-d-flex u-gap-2">
          <Button variant="outline" size="md">
            <Icon name="Download" size={16} />
            Export
          </Button>
          <Button variant="primary" size="md" onClick={handleCreateUser}>
            <Icon name="Plus" size={16} />
            Add User
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="u-mb-6">
        <div className="u-d-flex u-gap-4 u-align-items-center">
          <div className="u-flex-1">
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="u-min-w-150"
            options={[
              { value: "all", label: "All Roles" },
              { value: "admin", label: "Admin" },
              { value: "support", label: "Support" },
              { value: "accountant", label: "Accountant" }
            ]}
          />
          <Button variant="outline" size="md">
            <Icon name="Funnel" size={16} />
            Filter
          </Button>
        </div>
      </Card>

      {/* Users Grid */}
      {isLoading ? (
        <div className="u-d-flex u-justify-content-center u-align-items-center u-py-8">
          <div className="u-text-center">
            <Icon name="Spinner" size={32} className="u-text-primary u-mb-2" />
            <p>Loading users...</p>
          </div>
        </div>
      ) : (
        <Grid>
          {usersData?.results?.map((user) => (
            <GridCol key={user.id} xs={12} md={6} lg={4}>
              <Card className="u-h-100">
                <div className="u-d-flex u-align-items-center u-gap-3 u-mb-4">
                  <Avatar initials={(user.first_name?.charAt(0) || '') + (user.last_name?.charAt(0) || '') || '?'} size="md" />
                  <div className="u-flex-1">
                    <h3 className="u-mb-1">{user.first_name} {user.last_name}</h3>
                    <p className="u-text-sm u-text-secondary-emphasis u-mb-1">@{user.username}</p>
                    <div className="u-d-flex u-align-items-center u-gap-2">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.is_active)}
                    </div>
                  </div>
                </div>

                <div className="u-space-y-2 u-mb-4">
                  <div className="u-d-flex u-align-items-center u-gap-2">
                    <Icon name="Envelope" size={16} className="u-text-secondary-emphasis" />
                    <span className="u-text-sm">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="u-d-flex u-align-items-center u-gap-2">
                      <Icon name="Phone" size={16} className="u-text-secondary-emphasis" />
                      <span className="u-text-sm">{user.phone}</span>
                    </div>
                  )}
                  <div className="u-d-flex u-align-items-center u-gap-2">
                    <Icon name="Calendar" size={16} className="u-text-secondary-emphasis" />
                    <span className="u-text-sm">
                      Joined {new Date(user.date_joined).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="u-d-flex u-gap-2 u-mt-auto">
                  <Button variant="outline" size="sm" className="u-flex-1">
                    <Icon name="Eye" size={16} />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="u-flex-1"
                    onClick={() => handleEditUser(user)}
                  >
                    <Icon name="Pencil" size={16} />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user)}
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

      {/* Show message if no users */}
      {!isLoading && (!usersData?.results || usersData.results.length === 0) && (
        <Card>
          <div className="u-text-center u-py-8">
            <Icon name="Users" size={48} className="u-text-secondary-emphasis u-mb-4" />
            <h3 className="u-mb-2">No users found</h3>
            <p className="u-text-secondary-emphasis u-mb-4">
              {searchQuery
                ? "No users match your search criteria."
                : "You haven't created any users yet."}
            </p>
            <Button variant="primary" onClick={handleCreateUser}>
              <Icon name="Plus" size={16} />
              Add First User
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

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedUser(null);
          resetForm();
        }}
        title={selectedUser ? "Edit User" : "Add New User"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Grid>
            <GridCol xs={12} md={6}>
              <label htmlFor="first_name" className="u-d-block u-fs-sm u-fw-medium u-mb-1">First Name *</label>
              <Input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                required
              />
            </GridCol>
            <GridCol xs={12} md={6}>
              <label htmlFor="last_name" className="u-d-block u-fs-sm u-fw-medium u-mb-1">Last Name *</label>
              <Input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                required
              />
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <label htmlFor="username" className="u-d-block u-fs-sm u-fw-medium u-mb-1">Username *</label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
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
              <label htmlFor="role" className="u-d-block u-fs-sm u-fw-medium u-mb-1">Role *</label>
              <Select
                id="role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as any,
                  })
                }
                required
                className="u-w-100"
                options={[
                  { value: "support", label: "Support" },
                  { value: "accountant", label: "Accountant" },
                  { value: "admin", label: "Admin" }
                ]}
              />
            </GridCol>
            <GridCol xs={12} md={6}>
              <label htmlFor="phone" className="u-d-block u-fs-sm u-fw-medium u-mb-1">Phone</label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12}>
              <label className="u-d-block u-fs-sm u-fw-medium u-mb-1">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="u-me-2"
                />
                Active Account
              </label>
            </GridCol>
          </Grid>

          <div className="u-d-flex u-justify-content-end u-gap-2 u-mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedUser(null);
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
              {selectedUser ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
