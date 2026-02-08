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
  Avatar,
  Input,
  Select,
  Modal,
  Callout,
  Spinner,
  DataTable,
  Pagination,
  Toggle,
} from "@shohojdhara/atomix";
import { User } from "@/types";
import { apiService } from "@/services/apiService";
import { sanitizeText, sanitizeEmail, sanitizePhone } from "@/utils/sanitizer";

const USER_ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "support", label: "Support Staff" },
  { value: "accountant", label: "Accountant" },
];

const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "support" as "support" | "admin" | "accountant",
    phone: "",
    is_active: true,
    password: "",
    confirm_password: "",
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

    if (roleFilter !== "all") {
      params.role = roleFilter;
    }

    if (statusFilter !== "all") {
      params.is_active = statusFilter === "active";
    }

    return params;
  };

  // Fetch users
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["users", currentPage, searchQuery, roleFilter, statusFilter],
    queryFn: () => apiService.users.getUsers(buildQueryParams()),
    keepPreviousData: true,
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Fetch user statistics
  const { data: userStats } = useQuery({
    queryKey: ["user-stats"],
    queryFn: () => apiService.users.getUserStats(),
    staleTime: 60000, // 1 minute
    retry: 1,
  });

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<User, "id" | "date_joined" | "created_at">) =>
      apiService.users.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      setIsCreateModalOpen(false);
      resetForm();
      toast.success("User created successfully");
    },
    onError: (error: any) => {
      console.error("Failed to create user:", error);
      toast.error("Failed to create user");
    },
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      apiService.users.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
      toast.success("User updated successfully");
    },
    onError: (error: any) => {
      console.error("Failed to update user:", error);
      toast.error("Failed to update user");
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.users.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
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
      password: "",
      confirm_password: "",
    });
    setFormErrors({});
  };

  const validateForm = (isEdit = false) => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.first_name.trim()) {
      errors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      errors.last_name = "Last name is required";
    }

    if (!isEdit) {
      if (!formData.password) {
        errors.password = "Password is required";
      } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      }

      if (formData.password !== formData.confirm_password) {
        errors.confirm_password = "Passwords do not match";
      }
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
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
      username: sanitizeText(formData.username),
      email: sanitizeEmail(formData.email),
      first_name: sanitizeText(formData.first_name),
      last_name: sanitizeText(formData.last_name),
      phone: sanitizePhone(formData.phone),
    };

    createMutation.mutate(sanitizedData);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone: user.phone || "",
      is_active: user.is_active,
      password: "",
      confirm_password: "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!validateForm(true) || !selectedUser) return;

    const sanitizedData = {
      username: sanitizeText(formData.username),
      email: sanitizeEmail(formData.email),
      first_name: sanitizeText(formData.first_name),
      last_name: sanitizeText(formData.last_name),
      role: formData.role,
      phone: sanitizePhone(formData.phone),
      is_active: formData.is_active,
      ...(formData.password && { password: formData.password }),
    };

    updateMutation.mutate({ id: selectedUser.id, data: sanitizedData });
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  const getRoleVariant = (
    role: string,
  ): "primary" | "success" | "warning" | "error" => {
    switch (role) {
      case "admin":
        return "error";
      case "accountant":
        return "success";
      default:
        return "primary";
    }
  };

  const getStatusVariant = (isActive: boolean): "success" | "secondary" => {
    return isActive ? "success" : "secondary";
  };

  if (error) {
    return (
      <div className="u-p-4">
        <Callout variant="error">
          <strong>Error loading users:</strong> {error.message}
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
          <h1 className="u-h2 u-mb-2">User Management</h1>
          <p className="u-text-secondary">
            Manage system users and their permissions
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          disabled={isLoading}
        >
          <Icon name="Plus" size={16} className="u-me-2" />
          Add User
        </Button>
      </div>

      {/* Statistics Cards */}
      {userStats && (
        <Grid className="u-mb-6">
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-d-flex u-align-items-center">
                <div className="u-bg-primary-subtle u-p-3 u-rounded u-me-3">
                  <Icon name="Users" size={24} className="u-text-primary" />
                </div>
                <div>
                  <h3 className="u-h4 u-mb-1">{userStats.total_users || 0}</h3>
                  <p className="u-text-secondary u-mb-0">Total Users</p>
                </div>
              </div>
            </Card>
          </GridCol>
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-d-flex u-align-items-center">
                <div className="u-bg-success-subtle u-p-3 u-rounded u-me-3">
                  <Icon name="UserCheck" size={24} className="u-text-success" />
                </div>
                <div>
                  <h3 className="u-h4 u-mb-1">{userStats.active_users || 0}</h3>
                  <p className="u-text-secondary u-mb-0">Active Users</p>
                </div>
              </div>
            </Card>
          </GridCol>
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-d-flex u-align-items-center">
                <div className="u-bg-danger-subtle u-p-3 u-rounded u-me-3">
                  <Icon name="Shield" size={24} className="u-text-danger" />
                </div>
                <div>
                  <h3 className="u-h4 u-mb-1">{userStats.admin_users || 0}</h3>
                  <p className="u-text-secondary u-mb-0">Administrators</p>
                </div>
              </div>
            </Card>
          </GridCol>
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-d-flex u-align-items-center">
                <div className="u-bg-warning-subtle u-p-3 u-rounded u-me-3">
                  <Icon name="Clock" size={24} className="u-text-warning" />
                </div>
                <div>
                  <h3 className="u-h4 u-mb-1">
                    {userStats.recently_active || 0}
                  </h3>
                  <p className="u-text-secondary u-mb-0">Recently Active</p>
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
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="u-w-100"
            />
          </GridCol>
          <GridCol xs={6} md={4}>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="u-w-100"
              options={[{ value: "all", label: "All Roles" }, ...USER_ROLES]}
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
        </Grid>
      </Card>

      {/* Users Table */}
      <Card>
        {isLoading ? (
          <div className="u-text-center u-p-6">
            <Spinner size="lg" />
            <p className="u-mt-3 u-text-secondary">Loading users...</p>
          </div>
        ) : (
          <>
            <DataTable
              data={
                usersData?.results?.map((user: User) => ({
                  id: user.id,
                  user: (
                    <div className="u-d-flex u-align-items-center">
                      <Avatar
                        size="sm"
                        initials={`${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`}
                        className="u-me-3"
                      />
                      <div>
                        <div className="u-fw-medium">{user.username}</div>
                        <div className="u-text-secondary u-text-sm">
                          {user.first_name} {user.last_name}
                        </div>
                      </div>
                    </div>
                  ),
                  email: user.email,
                  role: (
                    <Badge
                      variant={getRoleVariant(user.role)}
                      label={
                        USER_ROLES.find((r) => r.value === user.role)?.label ||
                        user.role
                      }
                    />
                  ),
                  status: (
                    <Badge
                      variant={getStatusVariant(user.is_active)}
                      label={user.is_active ? "Active" : "Inactive"}
                    />
                  ),
                  joined: user.date_joined
                    ? new Date(user.date_joined).toLocaleDateString()
                    : "N/A",
                  actions: (
                    <div className="u-d-flex u-gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Icon name="Pencil" size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user)}
                        disabled={user.role === "admin"} // Prevent deleting admin users
                      >
                        <Icon name="Trash" size={14} />
                      </Button>
                    </div>
                  ),
                })) || []
              }
              columns={[
                { key: "user", title: "User" },
                { key: "email", title: "Email" },
                { key: "role", title: "Role" },
                { key: "status", title: "Status" },
                { key: "joined", title: "Joined" },
                { key: "actions", title: "Actions" },
              ]}
            />

            {/* Pagination */}
            {usersData &&
              Math.ceil((usersData.count || 0) / itemsPerPage) > 1 && (
                <div className="u-p-4 u-border-top">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(
                      (usersData.count || 0) / itemsPerPage,
                    )}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}

            {usersData?.results?.length === 0 && (
              <div className="u-text-center u-p-6">
                <Icon
                  name="Users"
                  size={48}
                  className="u-text-secondary u-mb-3"
                />
                <h3 className="u-h5 u-mb-2">No users found</h3>
                <p className="u-text-secondary u-mb-4">
                  {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Get started by creating your first user"}
                </p>
                <Button
                  variant="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Icon name="Plus" size={16} className="u-me-2" />
                  Add User
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create New User"
        size="lg"
      >
        <div className="u-space-y-4">
          <Grid>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">Username *</label>
              <Input
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="Enter username"
                className={formErrors.username ? "u-border-danger" : ""}
              />
              {formErrors.username && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.username}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email"
                className={formErrors.email ? "u-border-danger" : ""}
              />
              {formErrors.email && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.email}
                </div>
              )}
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                First Name *
              </label>
              <Input
                value={formData.first_name}
                onChange={(e) =>
                  handleInputChange("first_name", e.target.value)
                }
                placeholder="Enter first name"
                className={formErrors.first_name ? "u-border-danger" : ""}
              />
              {formErrors.first_name && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.first_name}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Last Name *
              </label>
              <Input
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder="Enter last name"
                className={formErrors.last_name ? "u-border-danger" : ""}
              />
              {formErrors.last_name && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.last_name}
                </div>
              )}
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">Role *</label>
              <Select
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                className="u-w-100"
                options={USER_ROLES}
              />
            </GridCol>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">Phone</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
                className={formErrors.phone ? "u-border-danger" : ""}
              />
              {formErrors.phone && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.phone}
                </div>
              )}
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">Password *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Enter password"
                className={formErrors.password ? "u-border-danger" : ""}
              />
              {formErrors.password && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.password}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Confirm Password *
              </label>
              <Input
                type="password"
                value={formData.confirm_password}
                onChange={(e) =>
                  handleInputChange("confirm_password", e.target.value)
                }
                placeholder="Confirm password"
                className={formErrors.confirm_password ? "u-border-danger" : ""}
              />
              {formErrors.confirm_password && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.confirm_password}
                </div>
              )}
            </GridCol>
          </Grid>

          <div className="u-d-flex u-align-items-center">
            <Toggle
              initialOn={formData.is_active}
              onToggleOn={() =>
                handleInputChange("is_active", !formData.is_active)
              }
              className="u-me-3"
            />
            <label>Active User</label>
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
              "Create User"
            )}
          </Button>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
          resetForm();
        }}
        title="Edit User"
        size="lg"
      >
        <div className="u-space-y-4">
          <Grid>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">Username *</label>
              <Input
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="Enter username"
                className={formErrors.username ? "u-border-danger" : ""}
              />
              {formErrors.username && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.username}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email"
                className={formErrors.email ? "u-border-danger" : ""}
              />
              {formErrors.email && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.email}
                </div>
              )}
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                First Name *
              </label>
              <Input
                value={formData.first_name}
                onChange={(e) =>
                  handleInputChange("first_name", e.target.value)
                }
                placeholder="Enter first name"
                className={formErrors.first_name ? "u-border-danger" : ""}
              />
              {formErrors.first_name && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.first_name}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Last Name *
              </label>
              <Input
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder="Enter last name"
                className={formErrors.last_name ? "u-border-danger" : ""}
              />
              {formErrors.last_name && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.last_name}
                </div>
              )}
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">Role *</label>
              <Select
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                className="u-w-100"
                options={USER_ROLES}
              />
            </GridCol>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">Phone</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
                className={formErrors.phone ? "u-border-danger" : ""}
              />
              {formErrors.phone && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.phone}
                </div>
              )}
            </GridCol>
          </Grid>

          <div className="u-d-flex u-align-items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => handleInputChange("is_active", e.target.checked)}
              className="u-me-3"
            />
            <label>Active User</label>
          </div>

          <Callout variant="info">
            <strong>Password Update:</strong> Leave password fields empty to
            keep the current password.
          </Callout>

          <Grid>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                New Password (Optional)
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Enter new password"
                className={formErrors.password ? "u-border-danger" : ""}
              />
              {formErrors.password && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.password}
                </div>
              )}
            </GridCol>
            <GridCol xs={12} md={6}>
              <label className="u-d-block u-mb-2 u-fw-medium">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={formData.confirm_password}
                onChange={(e) =>
                  handleInputChange("confirm_password", e.target.value)
                }
                placeholder="Confirm new password"
                className={formErrors.confirm_password ? "u-border-danger" : ""}
              />
              {formErrors.confirm_password && (
                <div className="u-text-danger u-text-sm u-mt-1">
                  {formErrors.confirm_password}
                </div>
              )}
            </GridCol>
          </Grid>
        </div>

        <div className="u-d-flex u-justify-content-end u-gap-3 u-mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditModalOpen(false);
              setSelectedUser(null);
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
              "Update User"
            )}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="u-text-center">
          <div className="u-bg-danger-subtle u-p-4 u-rounded-circle u-d-inline-flex u-mb-4">
            <Icon name="Trash" size={24} className="u-text-danger" />
          </div>
          <h3 className="u-h5 u-mb-3">Delete User</h3>
          <p className="u-text-secondary u-mb-4">
            Are you sure you want to delete{" "}
            <strong>{selectedUser?.username}</strong>? This action cannot be
            undone.
          </p>
          <div className="u-d-flex u-justify-content-center u-gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedUser(null);
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
                "Delete User"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
