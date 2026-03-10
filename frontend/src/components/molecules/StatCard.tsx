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
      <Card className={`u-h-100 ${className}`} data-testid={testId}>
        <div className="u-flex u-justify-between u-items-start u-mb-4">
          <div className="u-w-100">
            <div className="u-bg-primary-subtle u-h-50 u-w-100 u-rounded u-mb-3"></div>
            <div className="u-bg-primary-subtle u-h-50 u-w-50 u-rounded u-mb-2"></div>
            <div className="u-bg-primary-subtle u-h-50 u-w-25 u-rounded"></div>
          </div>
          {icon && <div className="u-bg-primary-subtle u-p-2 u-rounded"></div>}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`u-h-100 ${className}`} data-testid={testId}>
      <div className="u-flex u-justify-between u-items-start">
        <div className="u-w-100">
          <div className="u-fs-sm u-mb-2 u-text-secondary-emphasis">
            {title}
          </div>
          <div className="u-fs-2xl u-font-bold u-mb-2">{value}</div>
          {trend && (
            <div className="u-flex u-items-center u-mb-2">
              <Icon
                name={trend.isPositive ? "TrendUp" : "TrendDown"}
                size={"sm"}
                className={trend.isPositive ? "u-text-success" : "u-text-error"}
              />
              <span
                className={`u-fs-sm u-ms-1 ${
                  trend.isPositive ? "u-text-success" : "u-text-error"
                }`}
              >
                {Math.abs(trend.value)}%
              </span>
            </div>
          )}
          {description && (
            <div className="u-fs-xs u-text-secondary-emphasis">
              {description}
            </div>
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
            <Icon name={icon as any} size={"lg"} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
