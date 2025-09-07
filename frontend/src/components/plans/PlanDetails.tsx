import React from 'react';
import { Card, Badge, Icon, Button } from '@shohojdhara/atomix';
import { Plan } from '@/types';

export interface PlanDetailsProps {
  plan: Plan;
  onEdit?: (plan: Plan) => void;
  onDelete?: (plan: Plan) => void;
  onViewSubscriptions?: (plan: Plan) => void;
  className?: string;
}

/**
 * PlanDetails Component
 * 
 * A detailed view component for displaying plan information.
 * Built using Atomix Card, Badge, Icon, and Button components.
 */
export const PlanDetails: React.FC<PlanDetailsProps> = ({
  plan,
  onEdit,
  onDelete,
  onViewSubscriptions,
  className = '',
}) => {
  const formatSpeed = (speed: number, unit: string) => {
    if (speed >= 1000 && unit === 'mbps') {
      return `${(speed / 1000).toFixed(1)} Gbps`;
    }
    return `${speed} ${unit}`;
  };

  const formatQuota = (quota: number, unit: string) => {
    if (quota === 0 || unit === 'unlimited') {
      return 'Unlimited';
    }
    if (quota >= 1024 && unit === 'gb') {
      return `${(quota / 1024).toFixed(1)} TB`;
    }
    return `${quota} ${unit.toUpperCase()}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge
        variant={isActive ? 'success' : 'secondary'}
        size="sm"
        label={isActive ? 'Active' : 'Inactive'}
      />
    );
  };

  const getBillingCycleBadge = (cycle: string) => {
    const variants = {
      monthly: 'primary',
      quarterly: 'info',
      yearly: 'success',
    } as const;

    return (
      <Badge
        variant={variants[cycle as keyof typeof variants] || 'secondary'}
        size="sm"
        label={cycle.charAt(0).toUpperCase() + cycle.slice(1)}
      />
    );
  };

  return (
    <Card className={`u-height-100 ${className}`}>
      <div className="u-p-6">
        {/* Header */}
        <div className="u-d-flex u-justify-content-between u-align-items-start u-mb-4">
          <div>
            <h2 className="u-text-xl u-font-bold u-mb-2">{plan.name}</h2>
            <div className="u-d-flex u-align-items-center u-gap-2 u-mb-2">
              {getStatusBadge(plan.is_active)}
              {plan.is_featured && (
                <Badge variant="warning" size="sm" label="Featured" />
              )}
              {plan.is_popular && (
                <Badge variant="primary" size="sm" label="Popular" />
              )}
            </div>
          </div>
          <div className="u-text-right">
            <div className="u-text-2xl u-font-bold u-text-primary">
              {formatPrice(plan.price)}
            </div>
            <div className="u-text-sm u-text-muted">
              per {plan.billing_cycle}
            </div>
          </div>
        </div>

        {/* Description */}
        {plan.description && (
          <div className="u-mb-4">
            <p className="u-text-muted">{plan.description}</p>
          </div>
        )}

        {/* Speed Information */}
        <div className="u-mb-4">
          <h3 className="u-text-sm u-font-semibold u-mb-2">Speed</h3>
          <div className="u-d-flex u-gap-4">
            <div className="u-d-flex u-align-items-center u-gap-2">
              <Icon name="TrendDown" size={16} className="u-text-primary" />
              <span className="u-text-sm">
                Download: {formatSpeed(plan.download_speed, plan.speed_unit)}
              </span>
            </div>
            <div className="u-d-flex u-align-items-center u-gap-2">
              <Icon name="TrendUp" size={16} className="u-text-success" />
              <span className="u-text-sm">
                Upload: {formatSpeed(plan.upload_speed, plan.speed_unit)}
              </span>
            </div>
          </div>
        </div>

        {/* Data Quota */}
        <div className="u-mb-4">
          <h3 className="u-text-sm u-font-semibold u-mb-2">Data Quota</h3>
          <div className="u-d-flex u-align-items-center u-gap-2">
            <Icon name="Database" size={16} className="u-text-info" />
            <span className="u-text-sm">
              {formatQuota(plan.data_quota, plan.quota_unit)}
            </span>
          </div>
        </div>

        {/* Billing Information */}
        <div className="u-mb-4">
          <h3 className="u-text-sm u-font-semibold u-mb-2">Billing</h3>
          <div className="u-d-flex u-align-items-center u-gap-2 u-mb-1">
            <Icon name="Calendar" size={16} className="u-text-secondary" />
            <span className="u-text-sm">
              Cycle: {getBillingCycleBadge(plan.billing_cycle)}
            </span>
          </div>
          {plan.setup_fee > 0 && (
            <div className="u-d-flex u-align-items-center u-gap-2">
              <Icon name="CreditCard" size={16} className="u-text-warning" />
              <span className="u-text-sm">
                Setup Fee: {formatPrice(plan.setup_fee)}
              </span>
            </div>
          )}
        </div>

        {/* Features */}
        {plan.features && plan.features.length > 0 && (
          <div className="u-mb-4">
            <h3 className="u-text-sm u-font-semibold u-mb-2">Features</h3>
            <ul className="u-list-unstyled u-space-y-1">
              {plan.features.map((feature, index) => (
                <li key={index} className="u-d-flex u-align-items-center u-gap-2">
                  <Icon name="Check" size={14} className="u-text-success" />
                  <span className="u-text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="u-d-flex u-gap-2 u-mt-auto">
          {onViewSubscriptions && (
            <Button
              variant="outline"
              size="sm"
              className="u-flex-1"
              onClick={() => onViewSubscriptions(plan)}
            >
              <Icon name="Users" size={16} />
              Subscriptions
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(plan)}
            >
              <Icon name="Pencil" size={16} />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(plan)}
              className="u-text-error"
            >
              <Icon name="Trash" size={16} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PlanDetails;