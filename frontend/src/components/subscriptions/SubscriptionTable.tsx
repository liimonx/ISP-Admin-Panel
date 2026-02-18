import React, { useState } from "react";
import {
  Card,
  DataTable,
  Avatar,
  Badge,
  Button,
  Icon,
  Dropdown,
  Checkbox,
} from "@shohojdhara/atomix";
import { Subscription } from "../../types";
import { formatCurrency } from "../../utils/formatters";

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  isLoading: boolean;
  onEdit: (subscription: Subscription) => void;
  onView: (subscription: Subscription) => void;
  onUpdateStatus: (subscription: Subscription, status: string) => void;
  onDelete: (subscription: Subscription) => void;
  onCreate: () => void;
  onBulkUpdateStatus?: (subscriptionIds: number[], status: string) => void;
  onResetDataUsage?: (subscription: Subscription) => void;
  onUpdateDataUsage?: (subscription: Subscription, dataUsage: number) => void;
}

const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  subscriptions,
  isLoading,
  onEdit,
  onView,
  onUpdateStatus,
  onDelete,
  onCreate,
  onBulkUpdateStatus,
  onResetDataUsage,
  onUpdateDataUsage,
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkActionStatus, setBulkActionStatus] = useState<string>("");
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

    const colors = {
      pppoe: "primary",
      static_ip: "info",
      dhcp: "secondary",
    } as const;

    return <Badge variant={colors[method]} size="sm" label={labels[method]} />;
  };

  const getDataUsageProgress = (subscription: Subscription) => {
    const used = Number(subscription.data_used) || 0;
    const quota = subscription.plan?.data_quota;

    if (!quota || quota === 0) {
      return (
        <div className="u-text-center u-min-w-36">
          <div className="u-fw-medium u-text-primary-emphasis u-mb-1">
            {used.toFixed(1)} GB
          </div>
          <Badge variant="info" size="sm" label="Unlimited" />
          {onUpdateDataUsage && (
            <button
              onClick={() => onUpdateDataUsage(subscription, used)}
              className="u-btn u-btn-sm u-btn-ghost u-mt-1"
              title="Update data usage"
            >
              <Icon name="Pencil" size={12} />
            </button>
          )}
        </div>
      );
    }

    const percentage = Math.min((used / quota) * 100, 100);
    const isHigh = percentage > 90;
    const isMedium = percentage > 75;
    const isNearLimit = percentage > 80;

    return (
      <div className="u-min-w-36">
        <div className="u-flex u-justify-between u-items-center u-mb-2">
          <span className="u-fs-xs u-text-secondary-emphasis">
            {used.toFixed(1)} / {quota} GB
          </span>
          <span
            className={`u-fs-xs u-fw-medium ${
              isHigh
                ? "u-text-error"
                : isMedium
                  ? "u-text-warning"
                  : "u-text-success"
            }`}
          >
            {percentage.toFixed(0)}%
          </span>
        </div>

        <div
          className="u-bg-secondary-subtle u-rounded-pill u-overflow-hidden u-mb-2"
          style={{ height: "6px" }}
        >
          <div
            className={`u-h-100 u-rounded-pill ${
              isHigh
                ? "u-bg-danger"
                : isMedium
                  ? "u-bg-warning"
                  : "u-bg-success"
            }`}
            style={{
              width: `${percentage}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {isNearLimit && (
          <div className="u-fs-xs u-text-warning u-mb-1">
            <Icon name="Warning" size={12} className="u-me-1" />
            Near limit
          </div>
        )}

        <div className="u-flex u-gap-1">
          {onResetDataUsage && (
            <button
              onClick={() => onResetDataUsage(subscription)}
              className="u-btn u-btn-xs u-btn-outline-secondary"
              title="Reset data usage"
            >
              <Icon name="ArrowCounterClockwise" size={10} />
            </button>
          )}
          {onUpdateDataUsage && (
            <button
              onClick={() => onUpdateDataUsage(subscription, used)}
              className="u-btn u-btn-xs u-btn-outline-secondary"
              title="Update data usage"
            >
              <Icon name="Pencil" size={10} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(subscriptions.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (
    id: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const checked = event.target.checked;
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    }
  };

  const handleBulkAction = () => {
    if (selectedIds.length === 0 || !bulkActionStatus || !onBulkUpdateStatus) {
      return;
    }

    onBulkUpdateStatus(selectedIds, bulkActionStatus);
    setSelectedIds([]);
    setBulkActionStatus("");
  };

  const getStatusActions = (subscription: Subscription) => {
    const actions = [];

    if (subscription.status === "pending") {
      actions.push(
        <button
          key="activate"
          onClick={() => onUpdateStatus(subscription, "active")}
          className="u-flex u-items-center u-gap-2 u-p-2 u-w-100 u-text-start u-bg-transparent u-border-0 u-text-success u-cursor-pointer hover:u-bg-success-subtle"
        >
          <Icon name="Play" size={16} />
          Activate
        </button>,
      );
    }

    if (subscription.status === "active") {
      actions.push(
        <button
          key="suspend"
          onClick={() => onUpdateStatus(subscription, "suspended")}
          className="u-flex u-items-center u-gap-2 u-p-2 u-w-100 u-text-start u-bg-transparent u-border-0 u-text-warning u-cursor-pointer hover:u-bg-warning-subtle"
        >
          <Icon name="Pause" size={16} />
          Suspend
        </button>,
      );
    }

    if (subscription.status === "suspended") {
      actions.push(
        <button
          key="reactivate"
          onClick={() => onUpdateStatus(subscription, "active")}
          className="u-flex u-items-center u-gap-2 u-p-2 u-w-100 u-text-start u-bg-transparent u-border-0 u-text-success u-cursor-pointer hover:u-bg-success-subtle"
        >
          <Icon name="Play" size={16} />
          Reactivate
        </button>,
      );
    }

    if (!["cancelled", "inactive"].includes(subscription.status)) {
      actions.push(
        <button
          key="cancel"
          onClick={() => onUpdateStatus(subscription, "cancelled")}
          className="u-flex u-items-center u-gap-2 u-p-2 u-w-100 u-text-start u-bg-transparent u-border-0 u-text-error u-cursor-pointer hover:u-bg-error-subtle"
        >
          <Icon name="X" size={16} />
          Cancel
        </button>,
      );
    }

    return actions;
  };

  if (isLoading) {
    return (
      <Card className="u-p-6">
        <div className="u-flex u-justify-center u-items-center u-py-8">
          <div className="u-text-center">
            <div className="u-flex u-justify-center u-mb-3">
              <div
                className="u-spinner-border u-text-primary"
                role="status"
                style={{ width: "32px", height: "32px" }}
              >
                <span className="u-visually-hidden">Loading...</span>
              </div>
            </div>
            <p className="u-text-secondary-emphasis">
              Loading subscriptions...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!subscriptions.length) {
    return (
      <Card className="u-p-6">
        <div className="u-text-center u-py-8">
          <Icon name="Users" size={48} className="u-text-secondary u-mb-3" />
          <h3 className="u-text-primary-emphasis u-mb-2">
            No subscriptions found
          </h3>
          <p className="u-text-secondary-emphasis u-mb-4">
            No subscriptions match your current filters. Try adjusting your
            search criteria.
          </p>
          <Button variant="primary" size="md" onClick={onCreate}>
            <Icon name="Plus" size={16} />
            Add First Subscription
          </Button>
        </div>
      </Card>
    );
  }

  const allSelected =
    selectedIds.length === subscriptions.length && subscriptions.length > 0;

  const tableData = subscriptions.map((subscription) => ({
    id: subscription.id,
    select: (
      <Checkbox
        checked={selectedIds.includes(subscription.id)}
        onChange={(event) => handleSelectOne(subscription.id, event)}
      />
    ),
    customer: (
      <div className="u-flex u-items-center u-gap-3">
        <Avatar
          initials={subscription.customer?.name?.charAt(0) || "?"}
          className="u-w-6 u-h-6"
        />
        <div>
          <div className="u-fw-medium u-text-primary-emphasis">
            {subscription.customer?.name || "Unknown Customer"}
          </div>
          <div className="u-fs-sm u-text-secondary-emphasis-emphasis">
            {subscription.customer?.email || "No email"}
          </div>
        </div>
      </div>
    ),
    plan: (
      <div>
        <div className="u-fw-medium u-text-primary-emphasis u-mb-1">
          {subscription.plan?.name || "Unknown Plan"}
        </div>
        <div className="u-fs-sm u-text-secondary-emphasis-emphasis u-flex u-items-center u-gap-1">
          <Icon name="ArrowDown" size={12} />
          {subscription.plan?.download_speed || 0}
          <Icon name="ArrowUp" size={12} />
          {subscription.plan?.upload_speed || 0}{" "}
          {subscription.plan?.speed_unit?.toUpperCase() || "MBPS"}
        </div>
      </div>
    ),
    connection: (
      <div>
        <div className="u-mb-2">
          {getAccessMethodBadge(subscription.access_method)}
        </div>
        <div className="u-fs-sm u-text-secondary-emphasis-emphasis u-mb-1">
          <strong>User:</strong> {subscription.username || "No username"}
        </div>
        {subscription.static_ip && (
          <div className="u-fs-sm u-text-secondary-emphasis-emphasis">
            <strong>IP:</strong> {subscription.static_ip}
          </div>
        )}
        {subscription.mac_address && (
          <div className="u-fs-sm u-text-secondary-emphasis-emphasis">
            <strong>MAC:</strong> {subscription.mac_address}
          </div>
        )}
      </div>
    ),
    dataUsage: getDataUsageProgress(subscription),
    status: getStatusBadge(subscription.status),
    billing: (
      <div>
        <div className="u-fw-medium u-text-primary-emphasis">
          ${formatCurrency(subscription.monthly_fee)}
        </div>
        <div className="u-fs-sm u-text-secondary-emphasis-emphasis">
          per month
        </div>
        {subscription.setup_fee > 0 && (
          <div className="u-fs-xs u-text-warning-emphasis">
            +${formatCurrency(subscription.setup_fee)} setup
          </div>
        )}
      </div>
    ),
    router: (
      <div>
        <div className="u-fw-medium u-text-primary-emphasis u-mb-1">
          {subscription.router?.name || "Unknown Router"}
        </div>
        <div className="u-fs-sm u-text-secondary-emphasis-emphasis u-mb-1">
          {subscription.router?.location || "No location"}
        </div>
        <Badge
          variant={
            subscription.router?.status === "online" ? "success" : "error"
          }
          size="sm"
          label={subscription.router?.status || "unknown"}
        />
      </div>
    ),
    dates: (
      <div>
        <div className="u-fs-sm u-text-primary-emphasis u-mb-1">
          <strong>Started:</strong>{" "}
          {subscription.start_date
            ? new Date(subscription.start_date).toLocaleDateString()
            : "No date"}
        </div>
        {subscription.end_date && (
          <div className="u-fs-sm u-text-secondary-emphasis-emphasis">
            <strong>Ends:</strong>{" "}
            {new Date(subscription.end_date).toLocaleDateString()}
          </div>
        )}
      </div>
    ),
    actions: (
      <Dropdown
        menu={
          <div>
            <button
              onClick={() => onView(subscription)}
              className="u-flex u-items-center u-gap-2 u-p-2 u-w-100 u-text-start u-bg-transparent u-border-0 u-cursor-pointer hover:u-bg-secondary-subtle"
            >
              <Icon name="Eye" size={16} />
              View Details
            </button>
            <button
              onClick={() => onEdit(subscription)}
              className="u-flex u-items-center u-gap-2 u-p-2 u-w-100 u-text-start u-bg-transparent u-border-0 u-cursor-pointer hover:u-bg-secondary-subtle"
            >
              <Icon name="Pencil" size={16} />
              Edit
            </button>
            <div className="u-border-top u-border-light u-my-1"></div>
            {getStatusActions(subscription)}

            <div className="u-border-top u-border-light u-my-1"></div>
            <button
              className="u-flex u-items-center u-gap-2 u-p-2 u-w-100 u-text-start u-bg-transparent u-border-0 u-cursor-pointer hover:u-bg-secondary-subtle"
              onClick={() => onView(subscription)}
            >
              <Icon name="Receipt" size={16} />
              Billing History
            </button>
            <button
              className="u-flex u-items-center u-gap-2 u-p-2 u-w-100 u-text-start u-bg-transparent u-border-0 u-cursor-pointer hover:u-bg-secondary-subtle"
              onClick={() => onView(subscription)}
            >
              <Icon name="ChartBar" size={16} />
              Usage Analytics
            </button>
            <button
              className="u-flex u-items-center u-gap-2 u-p-2 u-w-100 u-text-start u-bg-transparent u-border-0 u-cursor-pointer hover:u-bg-secondary-subtle"
              onClick={() => onView(subscription)}
            >
              <Icon name="Wrench" size={16} />
              Router Settings
            </button>

            <div className="u-border-top u-border-light u-my-1"></div>
            <button
              onClick={() => onDelete(subscription)}
              className="u-flex u-items-center u-gap-2 u-p-2 u-w-100 u-text-start u-bg-transparent u-border-0 u-text-error u-cursor-pointer hover:u-bg-error-subtle"
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
    ),
  }));

  return (
    <>
      <Card className="u-overflow-hidden u-border-0 u-shadow-sm">
        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="u-bg-primary-subtle u-p-3 u-border-bottom">
            <div className="u-flex u-justify-between u-items-center">
              <div className="u-flex u-items-center u-gap-3">
                <span className="u-fw-medium u-text-primary">
                  {selectedIds.length} subscription
                  {selectedIds.length > 1 ? "s" : ""} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                >
                  Clear Selection
                </Button>
              </div>
              <div className="u-flex u-items-center u-gap-2">
                <select
                  value={bulkActionStatus}
                  onChange={(e) => setBulkActionStatus(e.target.value)}
                  className="u-w-100 u-py-1 u-px-2 u-border u-rounded u-bg-surface u-text-foreground u-text-sm"
                >
                  <option value="">Select Action</option>
                  <option value="active">Activate</option>
                  <option value="suspended">Suspend</option>
                  <option value="cancelled">Cancel</option>
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleBulkAction}
                  disabled={!bulkActionStatus || !onBulkUpdateStatus}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}

        <DataTable
          data={tableData}
          columns={[
            {
              key: "select",
              title: "",
            },
            { key: "customer", title: "Customer" },
            { key: "plan", title: "Plan" },
            { key: "connection", title: "Connection" },
            { key: "dataUsage", title: "Data Usage" },
            { key: "status", title: "Status" },
            { key: "billing", title: "Billing" },
            { key: "router", title: "Router" },
            { key: "dates", title: "Dates" },
            { key: "actions", title: "Actions" },
          ]}
        />
      </Card>

      {/* Summary Stats */}
      {subscriptions.length > 0 && (
        <Card className="u-mt-4">
          <div className="u-p-4">
            <div className="u-row">
              <div className="u-col-md-3">
                <div className="u-text-center">
                  <div className="u-fs-3 u-fw-bold u-text-primary">
                    {subscriptions.filter((s) => s.status === "active").length}
                  </div>
                  <div className="u-fs-sm u-text-secondary">Active</div>
                </div>
              </div>
              <div className="u-col-md-3">
                <div className="u-text-center">
                  <div className="u-fs-3 u-fw-bold u-text-warning">
                    {subscriptions.filter((s) => s.status === "pending").length}
                  </div>
                  <div className="u-fs-sm u-text-secondary">Pending</div>
                </div>
              </div>
              <div className="u-col-md-3">
                <div className="u-text-center">
                  <div className="u-fs-3 u-fw-bold u-text-error">
                    {
                      subscriptions.filter((s) => s.status === "suspended")
                        .length
                    }
                  </div>
                  <div className="u-fs-sm u-text-secondary">Suspended</div>
                </div>
              </div>
              <div className="u-col-md-3">
                <div className="u-text-center">
                  <div className="u-fs-3 u-fw-bold u-text-success">
                    $
                    {subscriptions
                      .filter((s) => s.status === "active")
                      .reduce((sum, s) => sum + (s.monthly_fee || 0), 0)
                      .toLocaleString()}
                  </div>
                  <div className="u-fs-sm u-text-secondary">
                    Monthly Revenue
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default SubscriptionTable;
