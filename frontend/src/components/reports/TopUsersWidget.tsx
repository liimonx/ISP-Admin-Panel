import React from 'react';
import { Card, Badge, Avatar } from '@shohojdhara/atomix';

export interface TopUser {
  id: number;
  name: string;
  email: string;
  usage: number;
  usage_unit: string;
  plan_name?: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface TopUsersWidgetProps {
  users: TopUser[];
  isLoading?: boolean;
  className?: string;
  title?: string;
  limit?: number;
}

/**
 * TopUsersWidget Component
 * 
 * A widget component for displaying top users by usage.
 * Built using Atomix Card, Badge, and Avatar components.
 */
export const TopUsersWidget: React.FC<TopUsersWidgetProps> = ({
  users,
  isLoading = false,
  className = '',
  title = 'Top Users',
  limit = 10,
}) => {
  const formatUsage = (usage: number, unit: string) => {
    if (usage >= 1024 && unit === 'MB') {
      return `${(usage / 1024).toFixed(1)} GB`;
    }
    return `${usage.toFixed(1)} ${unit}`;
  };

  const getStatusBadge = (status: TopUser['status']) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      suspended: 'warning',
    } as const;

    return (
      <Badge
        variant={variants[status]}
        size="sm"
        label={status.charAt(0).toUpperCase() + status.slice(1)}
      />
    );
  };

  if (isLoading) {
    return (
      <Card className={`u-h-100 ${className}`}>
        <div className="u-p-4">
          <h3 className="u-text-lg u-fw-semibold u-mb-4">{title}</h3>
          <div className="u-space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="u-d-flex u-align-items-center u-gap-3">
                <div className="u-bg-light u-w-8 u-h-8 u-rounded-full"></div>
                <div className="u-flex-1">
                  <div className="u-bg-light u-h-4 u-w-75 u-rounded-sm u-mb-1"></div>
                  <div className="u-bg-light u-h-3 u-w-50 u-rounded-sm"></div>
                </div>
                <div className="u-bg-light u-h-4 u-w-20 u-rounded-sm"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const displayUsers = users.slice(0, limit);

  return (
    <Card className={`u-h-100 ${className}`}>
      <div className="u-p-4">
        <h3 className="u-text-lg u-fw-semibold u-mb-4">{title}</h3>
        
        {displayUsers.length === 0 ? (
          <div className="u-text-center u-py-8">
            <p className="u-text-muted">No usage data available</p>
          </div>
        ) : (
          <div className="u-space-y-3">
            {displayUsers.map((user, index) => (
              <div key={user.id} className="u-d-flex u-align-items-center u-gap-3">
                <div className="u-d-flex u-align-items-center u-gap-2">
                  <span className="u-text-sm u-fw-bold u-text-muted u-min-w-6">
                    {index + 1}
                  </span>
                  <Avatar 
                    initials={user.name.split(' ').map(n => n[0]).join('').toUpperCase()} 
                    size="sm" 
                  />
                </div>
                
                <div className="u-flex-1 u-min-w-0">
                  <div className="u-text-sm u-fw-medium u-truncate">
                    {user.name}
                  </div>
                  <div className="u-text-xs u-text-muted u-truncate">
                    {user.email}
                  </div>
                  {user.plan_name && (
                    <div className="u-text-xs u-text-muted">
                      {user.plan_name}
                    </div>
                  )}
                </div>
                
                <div className="u-d-flex u-align-items-center u-gap-2">
                  <div className="u-text-right">
                    <div className="u-text-sm u-fw-medium">
                      {formatUsage(user.usage, user.usage_unit)}
                    </div>
                    <div className="u-text-xs u-text-muted">usage</div>
                  </div>
                  {getStatusBadge(user.status)}
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