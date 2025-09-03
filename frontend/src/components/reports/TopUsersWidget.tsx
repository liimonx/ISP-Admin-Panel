import React from "react";
import { Card, Icon, Avatar, Badge } from "@shohojdhara/atomix";

interface TopUser {
  id: number;
  name: string;
  email: string;
  usage: number;
  plan: string;
  status: "active" | "suspended" | "inactive";
}

interface TopUsersWidgetProps {
  users: TopUser[];
  isLoading?: boolean;
}

const TopUsersWidget: React.FC<TopUsersWidgetProps> = ({
  users,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="u-border-0 u-shadow-sm">
        <div className="u-p-4 u-border-b u-border-secondary-subtle">
          <h3 className="u-fs-4 u-fw-semibold u-mb-0">Top Users</h3>
        </div>
        <div className="u-p-4">
          <div className="u-d-flex u-flex-column u-gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="u-d-flex u-align-items-center u-gap-3">
                <div className="u-bg-secondary u-rounded-circle" style={{ width: "32px", height: "32px" }}></div>
                <div className="u-flex-grow-1">
                  <div className="u-bg-secondary u-rounded u-h-4 u-mb-1" style={{ width: "60%" }}></div>
                  <div className="u-bg-secondary u-rounded u-h-3" style={{ width: "40%" }}></div>
                </div>
                <div className="u-bg-secondary u-rounded u-h-4" style={{ width: "60px" }}></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const getStatusBadge = (status: TopUser["status"]) => {
    const variants = {
      active: "success",
      suspended: "warning",
      inactive: "secondary",
    } as const;

    return (
      <Badge
        variant={variants[status]}
        size="sm"
        label={status.charAt(0).toUpperCase() + status.slice(1)}
      />
    );
  };

  return (
    <Card className="u-border-0 u-shadow-sm">
      <div className="u-p-4 u-border-b u-border-secondary-subtle">
        <div className="u-d-flex u-align-items-center u-gap-2">
          <Icon name="Users" size={20} className="u-text-primary-emphasis" />
          <h3 className="u-fs-4 u-fw-semibold u-mb-0">Top Users</h3>
        </div>
      </div>
      <div className="u-p-4">
        {users.length === 0 ? (
          <div className="u-text-center u-py-6">
            <Icon name="Users" size={32} className="u-text-secondary u-mb-2" />
            <p className="u-text-secondary-emphasis u-fs-sm">No usage data available</p>
          </div>
        ) : (
          <div className="u-d-flex u-flex-column u-gap-3">
            {users.map((user, index) => (
              <div key={user.id} className="u-d-flex u-align-items-center u-gap-3 u-p-2 u-rounded u-bg-secondary-subtle">
                <div className="u-d-flex u-align-items-center u-gap-2">
                  <span className="u-fs-sm u-fw-bold u-text-primary-emphasis u-w-6 u-text-center">
                    #{index + 1}
                  </span>
                  <Avatar
                    initials={user.name.charAt(0)}
                    size="sm"
                  />
                </div>
                <div className="u-flex-grow-1">
                  <div className="u-fw-medium u-text-primary-emphasis u-fs-sm">
                    {user.name}
                  </div>
                  <div className="u-text-secondary-emphasis u-fs-xs">
                    {user.email} • {user.plan}
                  </div>
                </div>
                <div className="u-text-end">
                  <div className="u-fw-bold u-text-primary-emphasis u-fs-sm">
                    {user.usage.toFixed(1)} GB
                  </div>
                  <div className="u-mt-1">
                    {getStatusBadge(user.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TopUsersWidget;