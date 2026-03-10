import React, { useState, useMemo, useCallback } from "react";
import {
  Card,
  DataTable,
  Avatar,
  Badge,
  Button,
  Icon,
  Dropdown,
  Checkbox,
  Grid,
  GridCol,
  Select,
  Spinner,
} from "@shohojdhara/atomix";
import { Subscription } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { calculateSubscriptionStats } from "../../utils/subscriptionStats";

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

  const stats = useMemo(() => {
    return calculateSubscriptionStats(subscriptions);
  }, [subscriptions]);

  const getDataUsageProgress = useCallback(
    (subscription: Subscription) => {
      const used = Number(subscription.data_used) || 0;
      const quota = subscription.plan?.data_quota;

      if (!quota || quota === 0) {
        return (
          <div className="u-text-center u-min-w-36">
            <div className="u-font-normal u-text-primary u-mb-1">
              {used.toFixed(1)} GB
            </div>
            <Badge variant="info" size="sm" label="Unlimited" />
            {onUpdateDataUsage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdateDataUsage(subscription, used)}
                className="u-mt-1"
                iconName="Pencil"
                iconSize={12}
                title="Update data usage"
              />
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
              className={`u-fs-xs u-font-normal ${
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
            className="u-bg-secondary-subtle u-rounded u-overflow-hidden u-mb-2"
            style={{ height: "6px" }}
          >
            <div
              className={`u-h-100 u-rounded ${
                isHigh
                  ? "u-bg-error"
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResetDataUsage(subscription)}
                iconName="ArrowCounterClockwise"
                iconSize={10}
                title="Reset data usage"
              />
            )}
            {onUpdateDataUsage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateDataUsage(subscription, used)}
                iconName="Pencil"
                iconSize={10}
                title="Update data usage"
              />
            )}
          </div>
        </div>
      );
    },
    [onUpdateDataUsage, onResetDataUsage],
  );

  const handleSelectOne = useCallback(
    (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      if (checked) {
        setSelectedIds((prev) => [...prev, id]);
      } else {
        setSelectedIds((prev) =>
          prev.filter((selectedId) => selectedId !== id),
        );
      }
    },
    [],
  );

  const handleBulkAction = useCallback(() => {
    if (selectedIds.length === 0 || !bulkActionStatus || !onBulkUpdateStatus) {
      return;
    }

    onBulkUpdateStatus(selectedIds, bulkActionStatus);
    setSelectedIds([]);
    setBulkActionStatus("");
  }, [selectedIds, bulkActionStatus, onBulkUpdateStatus]);

  const getStatusActions = useCallback(
    (subscription: Subscription) => {
      const actions = [];

      if (subscription.status === "pending") {
        actions.push(
          <Button
            key="activate"
            variant="ghost"
            fullWidth
            onClick={() => onUpdateStatus(subscription, "active")}
            iconName="Play"
            iconSize="sm"
            iconPosition="start"
            className="u-justify-start u-text-success"
          >
            Activate
          </Button>,
        );
      }

      if (subscription.status === "active") {
        actions.push(
          <Button
            key="suspend"
            variant="ghost"
            fullWidth
            onClick={() => onUpdateStatus(subscription, "suspended")}
            iconName="Pause"
            iconSize="sm"
            iconPosition="start"
            className="u-justify-start u-text-warning"
          >
            Suspend
          </Button>,
        );
      }

      if (subscription.status === "suspended") {
        actions.push(
          <Button
            key="reactivate"
            variant="ghost"
            fullWidth
            onClick={() => onUpdateStatus(subscription, "active")}
            iconName="Play"
            iconSize="sm"
            iconPosition="start"
            className="u-justify-start u-text-success"
          >
            Reactivate
          </Button>,
        );
      }

      if (!["cancelled", "inactive"].includes(subscription.status)) {
        actions.push(
          <Button
            key="cancel"
            variant="ghost"
            fullWidth
            onClick={() => onUpdateStatus(subscription, "cancelled")}
            iconName="X"
            iconSize="sm"
            iconPosition="start"
            className="u-justify-start u-text-error"
          >
            Cancel
          </Button>,
        );
      }

      return actions;
    },
    [onUpdateStatus],
  );

  const baseTableData = useMemo(() => {
    return subscriptions.map((subscription) => ({
      id: subscription.id,
      customer: (
        <div className="u-flex u-items-center u-gap-3">
          <Avatar
            initials={subscription.customer?.name?.charAt(0) || "?"}
            size="sm"
          />
          <div>
            <div className="u-font-normal u-text-primary">
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
          <div className="u-font-normal u-text-primary u-mb-1">
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
          <div className="u-font-normal u-text-primary">
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
          <div className="u-font-normal u-text-primary u-mb-1">
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
            <div className="u-p-1">
              <Button
                variant="ghost"
                fullWidth
                onClick={() => onView(subscription)}
                iconName="Eye"
                iconSize="sm"
                iconPosition="start"
                className="u-justify-start"
              >
                View Details
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => onEdit(subscription)}
                iconName="Pencil"
                iconSize="sm"
                iconPosition="start"
                className="u-justify-start"
              >
                Edit
              </Button>
              <div className="u-border u-border-secondary-subtle u-my-1" />
              {getStatusActions(subscription)}

              <div className="u-border u-border-secondary-subtle u-my-1" />
              <Button
                variant="ghost"
                fullWidth
                onClick={() => onView(subscription)}
                iconName="Receipt"
                iconSize="sm"
                iconPosition="start"
                className="u-justify-start"
              >
                Billing History
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => onView(subscription)}
                iconName="ChartBar"
                iconSize="sm"
                iconPosition="start"
                className="u-justify-start"
              >
                Usage Analytics
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => onView(subscription)}
                iconName="Wrench"
                iconSize="sm"
                iconPosition="start"
                className="u-justify-start"
              >
                Router Settings
              </Button>

              <div className="u-border u-border-secondary-subtle u-my-1" />
              <Button
                variant="ghost"
                fullWidth
                onClick={() => onDelete(subscription)}
                iconName="Trash"
                iconSize="sm"
                iconPosition="start"
                className="u-justify-start u-text-error"
              >
                Delete
              </Button>
            </div>
          }
        >
          <Button
            variant="ghost"
            size="sm"
            iconName="DotsThreeVertical"
            iconSize={"sm"}
          />
        </Dropdown>
      ),
    }));
  }, [
    subscriptions,
    onView,
    onEdit,
    onDelete,
    getDataUsageProgress,
    getStatusActions,
  ]);

  const tableData = useMemo(() => {
    return baseTableData.map((row) => ({
      ...row,
      select: (
        <Checkbox
          checked={selectedIds.includes(row.id)}
          onChange={(event) => handleSelectOne(row.id, event)}
        />
      ),
    }));
  }, [baseTableData, selectedIds, handleSelectOne]);

  if (isLoading) {
    return (
      <Card className="u-p-6">
        <div className="u-flex u-justify-center u-items-center u-py-8">
          <div className="u-text-center">
            <div className="u-flex u-justify-center u-mb-3">
              <Spinner size="lg" />
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
          <Icon
            name="Users"
            size={48}
            className="u-text-secondary-emphasis u-mb-3"
          />
          <h3 className="u-text-primary-emphasis u-mb-2">
            No subscriptions found
          </h3>
          <p className="u-text-secondary-emphasis u-mb-4">
            No subscriptions match your current filters. Try adjusting your
            search criteria.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={onCreate}
            iconName="Plus"
            iconSize={"sm"}
          >
            Add First Subscription
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="u-overflow-hidden u-border-0 u-shadow-sm">
        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="u-bg-primary-subtle u-p-3 u-border-bottom">
            <div className="u-flex u-justify-between u-items-center">
              <div className="u-flex u-items-center u-gap-3">
                <span className="u-font-normal u-text-primary">
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
                <Select
                  value={bulkActionStatus}
                  onChange={(e) => setBulkActionStatus(e.target.value)}
                  options={[
                    { value: "", label: "Select Action" },
                    { value: "active", label: "Activate" },
                    { value: "suspended", label: "Suspend" },
                    { value: "cancelled", label: "Cancel" },
                  ]}
                />
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
            <Grid>
              <GridCol md={3}>
                <div className="u-text-center">
                  <div className="u-fs-2xl u-font-bold u-text-primary">
                    {stats.active}
                  </div>
                  <div className="u-fs-sm u-text-primary">Active</div>
                </div>
              </GridCol>
              <GridCol md={3}>
                <div className="u-text-center">
                  <div className="u-fs-2xl u-font-bold u-text-warning">
                    {stats.pending}
                  </div>
                  <div className="u-fs-sm u-text-primary">Pending</div>
                </div>
              </GridCol>
              <GridCol md={3}>
                <div className="u-text-center">
                  <div className="u-fs-2xl u-font-bold u-text-error">
                    {stats.suspended}
                  </div>
                  <div className="u-fs-sm u-text-primary">Suspended</div>
                </div>
              </GridCol>
              <GridCol md={3}>
                <div className="u-text-center">
                  <div className="u-fs-2xl u-font-bold u-text-primary">
                    ${stats.revenue.toLocaleString()}
                  </div>
                  <div className="u-fs-sm u-text-primary">Monthly Revenue</div>
                </div>
              </GridCol>
            </Grid>
          </div>
        </Card>
      )}
    </>
  );
};

export default SubscriptionTable;
