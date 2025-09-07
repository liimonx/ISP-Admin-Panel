import React from "react";
import { Card, Icon, Button } from "@shohojdhara/atomix";

export interface DashboardWidgetProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  icon?: string;
  loading?: boolean;
  error?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  description,
  children,
  actions,
  icon,
  loading = false,
  error,
  className = "",
  headerClassName = "",
  contentClassName = "",
}) => {
  return (
    <Card className={`u-h-100 ${className}`}>
      {/* Widget Header */}
      <div className={`u-d-flex u-justify-content-between u-align-items-start u-mb-4 ${headerClassName}`}>
        <div className="u-flex-1 u-min-w-0">
          <div className="u-d-flex u-align-items-center u-gap-2 u-mb-1">
            {icon && (
              <Icon 
                name={icon as any} 
                size={20} 
                className="u-text-primary u-flex-shrink-0" 
              />
            )}
            <h3 className="u-text-lg u-fw-semibold u-truncate">
              {title}
            </h3>
          </div>
          {description && (
            <p className="u-text-sm u-text-secondary-emphasis u-line-clamp-2">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="u-flex-shrink-0 u-ms-3">
            {actions}
          </div>
        )}
      </div>

      {/* Widget Content */}
      <div className={`u-flex-1 ${contentClassName}`}>
        {error ? (
          <div className="u-d-flex u-flex-column u-align-items-center u-justify-content-center u-py-8 u-text-center">
            <Icon name="Warning" size={32} className="u-text-error u-mb-3" />
            <p className="u-text-error u-mb-2">Error loading data</p>
            <p className="u-text-sm u-text-secondary-emphasis">{error}</p>
          </div>
        ) : loading ? (
          <div className="u-d-flex u-align-items-center u-justify-content-center u-py-8">
            <Icon name="Spinner" size={24} className="u-spin u-text-primary" />
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
};

export default DashboardWidget;