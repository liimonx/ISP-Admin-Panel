import React from "react";
import { Card, Icon } from "@shohojdhara/atomix";

export interface UsageWidgetProps {
  title: string;
  value: string | number;
  icon?: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  isLoading?: boolean;
  className?: string;
}

/**
 * UsageWidget Component
 *
 * A widget component for displaying usage statistics with optional trends and icons.
 * Built using Atomix Card and Icon components.
 */
export const UsageWidget: React.FC<UsageWidgetProps> = ({
  title,
  value,
  icon,
  subtitle,
  trend,
  color = "primary",
  isLoading = false,
  className = "",
}) => {
  if (isLoading) {
    return (
      <Card className={`u-h-100 ${className}`}>
        <div className="u-flex u-justify-between u-align-items-start u-mb-4">
          <div className="u-flex-1">
            <div className="u-bg-light u-h-4 u-w-75 u-rounded-sm u-mb-3"></div>
            <div className="u-bg-light u-h-6 u-w-50 u-rounded-sm u-mb-2"></div>
            <div className="u-bg-light u-h-3 u-w-25 u-rounded-sm"></div>
          </div>
          {icon && <div className="u-bg-light u-p-2 u-rounded"></div>}
        </div>
      </Card>
    );
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      primary: "u-text-primary",
      secondary: "u-text-secondary-emphasis",
      success: "u-text-success",
      warning: "u-text-warning",
      error: "u-text-error",
      info: "u-text-info",
    };
    return colorMap[color as keyof typeof colorMap] || "u-text-primary";
  };

  const getIconBgColor = (color: string) => {
    const bgColorMap = {
      primary: "u-bg-primary-light",
      secondary: "u-bg-secondary-light",
      success: "u-bg-success-light",
      warning: "u-bg-warning-light",
      error: "u-bg-error-light",
      info: "u-bg-info-light",
    };
    return bgColorMap[color as keyof typeof bgColorMap] || "u-bg-primary-light";
  };

  return (
    <Card className={`u-h-100 ${className}`}>
      <div className="u-flex u-justify-between u-align-items-start">
        <div className="u-flex-1">
          <div className="u-text-sm u-mb-2 u-text-muted">{title}</div>
          <div
            className={`u-text-2xl u-fw-bold u-mb-2 ${getColorClasses(color)}`}
          >
            {value}
          </div>
          {trend && (
            <div className="u-flex u-items-center u-mb-2">
              <Icon
                name={trend.isPositive ? "TrendUp" : "TrendDown"}
                size={16}
                className={trend.isPositive ? "u-text-success" : "u-text-error"}
              />
              <span
                className={`u-text-sm u-ms-1 ${
                  trend.isPositive ? "u-text-success" : "u-text-error"
                }`}
              >
                {Math.abs(trend.value)}%
              </span>
            </div>
          )}
          {subtitle && <div className="u-text-xs u-text-muted">{subtitle}</div>}
        </div>

        {icon && (
          <div
            className={`u-p-3 u-rounded u-flex u-items-center u-justify-center ${getIconBgColor(color)}`}
          >
            <Icon
              name={icon as any}
              size={24}
              className={getColorClasses(color)}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default UsageWidget;
