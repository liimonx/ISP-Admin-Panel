import React from "react";
import { Card, Icon, Badge } from "@shohojdhara/atomix";

interface UsageWidgetProps {
  title: string;
  icon: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "success" | "warning" | "error" | "info";
  isLoading?: boolean;
}

const UsageWidget: React.FC<UsageWidgetProps> = ({
  title,
  icon,
  value,
  subtitle,
  trend,
  color = "primary",
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="u-p-4 u-border-0 u-shadow-sm">
        <div className="u-d-flex u-align-items-center u-gap-3">
          <div className={`u-bg-${color}-subtle u-rounded-circle u-p-3`}>
            <div className="u-w-6 u-h-6 u-bg-secondary u-rounded"></div>
          </div>
          <div className="u-flex-grow-1">
            <div className="u-bg-secondary u-rounded u-h-4 u-mb-2" style={{ width: "60%" }}></div>
            <div className="u-bg-secondary u-rounded u-h-6" style={{ width: "40%" }}></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="u-p-4 u-border-0 u-shadow-sm">
      <div className="u-d-flex u-align-items-center u-gap-3">
        <div className={`u-bg-${color}-subtle u-rounded-circle u-p-3 u-d-flex u-align-items-center u-justify-content-center`}>
          <Icon name={icon as any} size={24} className={`u-text-${color}-emphasis`} />
        </div>
        <div className="u-flex-grow-1">
          <p className="u-text-secondary-emphasis u-fs-sm u-mb-1">{title}</p>
          <div className="u-d-flex u-align-items-center u-gap-2">
            <h3 className="u-fs-2 u-fw-bold u-mb-0 u-text-primary-emphasis">{value}</h3>
            {trend && (
              <Badge
                variant={trend.isPositive ? "success" : "error"}
                size="sm"
                label={`${trend.isPositive ? "+" : ""}${trend.value}%`}
              />
            )}
          </div>
          {subtitle && (
            <p className="u-text-secondary-emphasis u-fs-xs u-mb-0 u-mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default UsageWidget;