import React from 'react';
import { Card, Icon } from '@shohojdhara/atomix';

export interface UsageWidgetProps {
  title: string;
  value: string | number;
  icon?: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
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
  color = 'primary',
  isLoading = false,
  className = '',
}) => {
  if (isLoading) {
    return (
      <Card className={`u-height-100 ${className}`}>
        <div className="u-d-flex u-justify-content-between u-align-items-start u-mb-4">
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

  const getColorClasses = (color: string) => {
    const colorMap = {
      primary: 'u-text-primary',
      secondary: 'u-text-secondary',
      success: 'u-text-success',
      warning: 'u-text-warning',
      error: 'u-text-error',
      info: 'u-text-info',
    };
    return colorMap[color as keyof typeof colorMap] || 'u-text-primary';
  };

  const getIconBgColor = (color: string) => {
    const bgColorMap = {
      primary: 'u-bg-primary-light',
      secondary: 'u-bg-secondary-light',
      success: 'u-bg-success-light',
      warning: 'u-bg-warning-light',
      error: 'u-bg-error-light',
      info: 'u-bg-info-light',
    };
    return bgColorMap[color as keyof typeof bgColorMap] || 'u-bg-primary-light';
  };

  return (
    <Card className={`u-height-100 ${className}`}>
      <div className="u-d-flex u-justify-content-between u-align-items-start">
        <div className="u-flex-1">
          <div className="u-text-sm u-mb-2 u-text-muted">{title}</div>
          <div className={`u-text-2xl u-font-weight-bold u-mb-2 ${getColorClasses(color)}`}>
            {value}
          </div>
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
          {subtitle && (
            <div className="u-text-xs u-text-muted">{subtitle}</div>
          )}
        </div>

        {icon && (
          <div
            className={`u-p-3 u-border-radius-2 u-d-flex u-align-items-center u-justify-content-center ${getIconBgColor(color)}`}
          >
            <Icon name={icon as any} size={24} className={getColorClasses(color)} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default UsageWidget;