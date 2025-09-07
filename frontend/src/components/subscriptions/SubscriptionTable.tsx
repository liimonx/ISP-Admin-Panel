import React from "react";
import { Card, DataTable, Avatar, Badge, Button, Icon, Dropdown } from "@shohojdhara/atomix";
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
}

const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  subscriptions,
  isLoading,
  onEdit,
  onView,
  onUpdateStatus,
  onDelete,
  onCreate,
}) => {
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

    return (
      <Badge 
        variant={colors[method]} 
        size="sm" 
        label={labels[method]} 
      />
    );
  };

  const getDataUsageProgress = (used: number, quota?: number) => {
    if (!quota || quota === 0) return null;
    
    const percentage = Math.min((used / quota) * 100, 100);
    const isHigh = percentage > 80;
    const isMedium = percentage > 60;
    
    return (
      <div className="u-w-100">
        <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-1">
          <span className="u-fs-xs u-text-secondary-emphasis-emphasis">
            {(Number(used) || 0).toFixed(1)} GB / {quota} GB
          </span>
          <span className={`u-fs-xs u-fw-medium ${isHigh ? 'u-text-error-emphasis' : isMedium ? 'u-text-warning-emphasis' : 'u-text-success-emphasis'}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
        <div className="u-bg-secondary-subtle u-rounded-pill u-overflow-hidden" style={{ height: "4px" }}>
          <div 
            className={`u-h-100 u-rounded-pill ${isHigh ? 'u-bg-error' : isMedium ? 'u-bg-warning' : 'u-bg-success'}`}
            style={{ width: `${percentage}%`, transition: "width 0.3s ease" }}
          />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="u-p-6">
        <div className="u-d-flex u-justify-content-center u-align-items-center u-py-8">
          <div className="u-text-center">
            <Icon
              name="Spinner"
              size={32}
              className="u-text-primary u-mb-3"
            />
            <p className="u-text-secondary-emphasis-emphasis">Loading subscriptions...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!subscriptions.length) {
    return (
      <Card className="u-p-6">
        <div className="u-text-center u-py-8">
          <Icon name="Users" size={48} className="u-text-secondary-emphasis u-mb-3" />
          <h3 className="u-text-primary-emphasis u-mb-2">No subscriptions found</h3>
          <p className="u-text-secondary-emphasis-emphasis u-mb-4">
            No subscriptions match your current filters. Try adjusting your search criteria.
          </p>
          <Button variant="primary" size="md" onClick={onCreate}>
            <Icon name="Plus" size={16} />
            Add First Subscription
          </Button>
        </div>
      </Card>
    );
  }

  const tableData = subscriptions.map((subscription) => ({
    id: subscription.id,
    customer: (
      <div className="u-d-flex u-align-items-center u-gap-3">
        <Avatar
          initials={subscription.customer?.name?.charAt(0) || '?'}
          size="sm"
        />
        <div>
          <div className="u-fw-medium u-text-primary-emphasis">
            {subscription.customer?.name || 'Unknown Customer'}
          </div>
          <div className="u-fs-sm u-text-secondary-emphasis-emphasis">
            {subscription.customer?.email || 'No email'}
          </div>
        </div>
      </div>
    ),
    plan: (
      <div>
        <div className="u-fw-medium u-text-primary-emphasis u-mb-1">
          {subscription.plan?.name || 'Unknown Plan'}
        </div>
        <div className="u-fs-sm u-text-secondary-emphasis-emphasis u-d-flex u-align-items-center u-gap-1">
          <Icon name="ArrowDown" size={12} />
          {subscription.plan?.download_speed || 0}
          <Icon name="ArrowUp" size={12} />
          {subscription.plan?.upload_speed || 0}{" "}
          {subscription.plan?.speed_unit?.toUpperCase() || 'MBPS'}
        </div>
      </div>
    ),
    connection: (
      <div>
        <div className="u-mb-2">
          {getAccessMethodBadge(subscription.access_method)}
        </div>
        <div className="u-fs-sm u-text-secondary-emphasis-emphasis u-mb-1">
          <strong>User:</strong> {subscription.username || 'No username'}
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
    dataUsage: (
      <div style={{ minWidth: "120px" }}>
        {subscription.plan?.data_quota ? (
          getDataUsageProgress(Number(subscription.data_used) || 0, subscription.plan.data_quota)
        ) : (
          <div className="u-text-center">
            <div className="u-fw-medium u-text-primary-emphasis">
              {(Number(subscription.data_used) || 0).toFixed(1)} GB
            </div>
            <div className="u-fs-xs u-text-secondary-emphasis-emphasis">Unlimited</div>
          </div>
        )}
      </div>
    ),
    status: getStatusBadge(subscription.status),
    billing: (
      <div>
        <div className="u-fw-medium u-text-primary-emphasis">
          ${formatCurrency(subscription.monthly_fee)}
        </div>
        <div className="u-fs-sm u-text-secondary-emphasis-emphasis">per month</div>
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
          {subscription.router?.name || 'Unknown Router'}
        </div>
        <div className="u-fs-sm u-text-secondary-emphasis-emphasis u-mb-1">
          {subscription.router?.location || 'No location'}
        </div>
        <Badge 
          variant={subscription.router?.status === 'online' ? 'success' : 'error'}
          size="xs"
          label={subscription.router?.status || 'unknown'}
        />
      </div>
    ),
    dates: (
      <div>
        <div className="u-fs-sm u-text-primary-emphasis u-mb-1">
          <strong>Started:</strong> {subscription.start_date ? new Date(subscription.start_date).toLocaleDateString() : 'No date'}
        </div>
        {subscription.end_date && (
          <div className="u-fs-sm u-text-secondary-emphasis-emphasis">
            <strong>Ends:</strong> {new Date(subscription.end_date).toLocaleDateString()}
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
              className="dropdown-item u-d-flex u-align-items-center u-gap-2"
            >
              <Icon name="Eye" size={16} />
              View Details
            </button>
            <button
              onClick={() => onEdit(subscription)}
              className="dropdown-item u-d-flex u-align-items-center u-gap-2"
            >
              <Icon name="Pencil" size={16} />
              Edit
            </button>
            <div className="dropdown-divider"></div>
            
            {subscription.status === "active" && (
              <button
                onClick={() => onUpdateStatus(subscription, "suspended")}
                className="dropdown-item u-d-flex u-align-items-center u-gap-2"
              >
                <Icon name="Pause" size={16} />
                Suspend
              </button>
            )}
            
            {subscription.status === "suspended" && (
              <button
                onClick={() => onUpdateStatus(subscription, "active")}
                className="dropdown-item u-d-flex u-align-items-center u-gap-2"
              >
                <Icon name="Play" size={16} />
                Activate
              </button>
            )}
            
            {subscription.status !== "cancelled" && (
              <button
                onClick={() => onUpdateStatus(subscription, "cancelled")}
                className="dropdown-item u-d-flex u-align-items-center u-gap-2 u-text-error"
              >
                <Icon name="X" size={16} />
                Cancel
              </button>
            )}
            
            <div className="dropdown-divider"></div>
            <button 
              className="dropdown-item u-d-flex u-align-items-center u-gap-2"
              onClick={() => onView(subscription)}
            >
              <Icon name="Receipt" size={16} />
              Billing History
            </button>
            <button 
              className="dropdown-item u-d-flex u-align-items-center u-gap-2"
              onClick={() => onView(subscription)}
            >
              <Icon name="ChartBar" size={16} />
              Usage Analytics
            </button>
            <button 
              className="dropdown-item u-d-flex u-align-items-center u-gap-2"
              onClick={() => onView(subscription)}
            >
              <Icon name="Wrench" size={16} />
              Router Settings
            </button>
            
            <div className="dropdown-divider"></div>
            <button
              onClick={() => onDelete(subscription)}
              className="dropdown-item u-d-flex u-align-items-center u-gap-2 u-text-error"
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
    <Card className="u-overflow-hidden u-border-0 u-shadow-sm">
      <DataTable
        data={tableData}
        columns={[
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
  );
};

export default SubscriptionTable;