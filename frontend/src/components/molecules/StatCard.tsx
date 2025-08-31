import React from "react";
import { Card, Icon } from "@shohojdhara/atomix";

export interface StatCardProps {
  title: string;
  value: number | string;
  icon?: string;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  loading?: boolean;
  className?: string;
  "data-testid"?: string;
}

/**
 * StatCard Molecule
 *
 * A card component for displaying statistics with optional trends and icons.
 * Built using Atomix Card and Icon atoms.
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconColor = "var(--atomix-primary)",
  trend,
  description,
  loading = false,
  className = "",
  "data-testid": testId,
}) => {
  if (loading) {
    return (
      <Card className={`u-height-100 ${className}`} data-testid={testId}>
        <div className="u-d-flex u-justify-content-between u-align-items-flex-start u-mb-4">
          <div className="u-flex-1">
            <div className="u-bg-light u-height-4 u-width-75 u-border-radius-1 u-mb-3"></div>
            <div className="u-bg-light u-height-6 u-width-50 u-border-radius-1 u-mb-2"></div>
            <div className="u-bg-light u-height-3 u-width-25 u-border-radius-1"></div>
          </div>
          {icon && (
            <div className="u-bg-light u-p-2 u-border-radius-2"></div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`u-height-100 ${className}`} data-testid={testId}>
      <div className="u-d-flex u-justify-content-between u-align-items-start">
        <div className="u-flex-1">
          <div className="u-text-sm u-mb-2 u-text-muted">{title}</div>
          <div className="u-text-2xl u-font-weight-bold u-mb-2">{value}</div>
          {trend && (
            <div className="u-d-flex u-align-items-center u-mb-2">
              <Icon
                name={trend.isPositive ? "TrendUp" : "TrendDown"}
                size={16}
                className={trend.isPositive ? "u-text-success" : "u-text-error"}
              />
              <span
                className={`u-text-sm u-ml-1 ${
                  trend.isPositive ? "u-text-success" : "u-text-error"
                }`}
              >
                {Math.abs(trend.value)}%
              </span>
            </div>
          )}
          {description && (
            <div className="u-text-xs u-text-muted">{description}</div>
          )}
        </div>

        {icon && (
          <div
            className="u-p-3 u-border-radius-2 u-d-flex u-align-items-center u-justify-content-center"
            style={{
              backgroundColor: `color-mix(in srgb, ${iconColor} 20%, transparent)`,
              color: iconColor,
            }}
          >
            <Icon name={icon as any} size={24} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;