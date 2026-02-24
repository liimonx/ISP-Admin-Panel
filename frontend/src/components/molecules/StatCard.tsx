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
      <Card className={`u-h-full ${className}`} data-testid={testId}>
        <div className="u-flex u-justify-between u-items-start u-mb-4">
          <div className="u-flex-1">
            <div className="u-bg-light u-h-4 u-w-75 u-rounded u-mb-3"></div>
            <div className="u-bg-light u-h-6 u-w-50 u-rounded u-mb-2"></div>
            <div className="u-bg-light u-h-3 u-w-25 u-rounded"></div>
          </div>
          {icon && (
            <div className="u-bg-light u-p-2 u-rounded"></div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`u-h-full ${className}`} data-testid={testId}>
      <div className="u-flex u-justify-between u-items-start">
        <div className="u-flex-1">
          <div className="u-text-sm u-mb-2 u-text-secondary">{title}</div>
          <div className="u-text-2xl u-fw-bold u-mb-2">{value}</div>
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
          {description && (
            <div className="u-text-xs u-text-secondary">{description}</div>
          )}
        </div>

        {icon && (
          <div
            className="u-p-3 u-rounded u-flex u-items-center u-justify-center"
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