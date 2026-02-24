import React from 'react';
import {
  Modal,
  Button,
  Badge,
  Icon,
} from '@shohojdhara/atomix';
import { Plan } from '@/types';

interface PlanDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onEdit?: () => void;
}

const PlanDetails: React.FC<PlanDetailsProps> = ({
  isOpen,
  onClose,
  plan,
  onEdit,
}) => {
  if (!plan) return null;

  const formatSpeed = (speed: number | string | null | undefined, unit: string | null | undefined) => {
    if (speed === null || speed === undefined) return "0 Mbps";
    const numSpeed = typeof speed === 'string' ? parseFloat(speed) : speed;
    if (isNaN(numSpeed)) return "0 Mbps";
    const defaultUnit = unit || "Mbps";
    return `${numSpeed} ${defaultUnit.toUpperCase()}`;
  };

  const formatDataQuota = (quota: number | null, unit: string | null | undefined) => {
    if (!quota || !unit || unit === "unlimited") return "Unlimited";
    return `${quota} ${unit.toUpperCase()}`;
  };

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) return "$0.00";
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "$0.00";
    return `$${numPrice.toFixed(2)}`;
  };

  const getBillingCycleLabel = (cycle: string | null | undefined) => {
    if (!cycle) return "Monthly";
    const labels = {
      monthly: "Monthly",
      quarterly: "Quarterly",
      yearly: "Yearly",
    };
    return labels[cycle as keyof typeof labels] || cycle;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Plan Details"
      size="lg"
    >
      <div className="u-space-y-6">
        {/* Plan Header */}
        <div className="u-flex u-justify-between u-items-start">
          <div className="u-flex-1">
            <h2 className="u-text-xl u-fw-bold u-mb-2">{plan.name}</h2>
            {plan.description && (
              <p className="u-text-secondary u-mb-3">{plan.description}</p>
            )}
            <div className="u-flex u-gap-2 u-flex-wrap">
              {plan.is_popular && (
                <Badge variant="primary" size="sm" label="Popular" />
              )}
              {plan.is_featured && (
                <Badge variant="success" size="sm" label="Featured" />
              )}
              {!plan.is_active && (
                <Badge variant="secondary" size="sm" label="Inactive" />
              )}
            </div>
          </div>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Icon name="Pencil" size={16} />
              Edit
            </Button>
          )}
        </div>

        <div className="u-border-t u-my-4"></div>

        {/* Pricing Information */}
        <div className="u-space-y-4">
          <h3 className="u-text-lg u-fw-semibold">Pricing</h3>
          
          <div className="u-grid u-grid-cols-2 u-gap-4">
            <div className="u-bg-light u-p-4 u-rounded-md">
              <div className="u-text-sm u-text-secondary u-mb-1">Monthly Price</div>
              <div className="u-text-2xl u-fw-bold u-text-primary">
                {formatPrice(plan.price)}
              </div>
              <div className="u-text-sm u-text-secondary">
                per {getBillingCycleLabel(plan.billing_cycle).toLowerCase()}
              </div>
            </div>
            
            {plan.setup_fee && plan.setup_fee > 0 && (
              <div className="u-bg-light u-p-4 u-rounded-md">
                <div className="u-text-sm u-text-secondary u-mb-1">Setup Fee</div>
                <div className="u-text-xl u-fw-bold">
                  {formatPrice(plan.setup_fee)}
                </div>
                <div className="u-text-sm u-text-secondary">one-time</div>
              </div>
            )}
          </div>
        </div>

        <div className="u-border-t u-my-4"></div>

        {/* Speed & Data Specifications */}
        <div className="u-space-y-4">
          <h3 className="u-text-lg u-fw-semibold">Specifications</h3>
          
          <div className="u-grid u-grid-cols-2 u-gap-4">
            <div className="u-space-y-3">
              <div className="u-flex u-justify-between u-items-center">
                <span className="u-text-secondary">Download Speed:</span>
                <span className="u-fw-medium">
                  {formatSpeed(plan.download_speed, plan.speed_unit)}
                </span>
              </div>
              <div className="u-flex u-justify-between u-items-center">
                <span className="u-text-secondary">Upload Speed:</span>
                <span className="u-fw-medium">
                  {formatSpeed(plan.upload_speed, plan.speed_unit)}
                </span>
              </div>
            </div>
            
            <div className="u-space-y-3">
              <div className="u-flex u-justify-between u-items-center">
                <span className="u-text-secondary">Data Quota:</span>
                <span className="u-fw-medium">
                  {formatDataQuota(plan.data_quota || 0, plan.quota_unit)}
                </span>
              </div>
              <div className="u-flex u-justify-between u-items-center">
                <span className="u-text-secondary">Billing Cycle:</span>
                <span className="u-fw-medium">
                  {getBillingCycleLabel(plan.billing_cycle)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        {plan.features && plan.features.length > 0 && (
          <>
            <div className="u-border-t u-my-4"></div>
            <div className="u-space-y-4">
              <h3 className="u-text-lg u-fw-semibold">Features</h3>
              
              <div className="u-space-y-2">
                {plan.features.map((feature, index) => (
                  <div
                    key={index}
                    className="u-flex u-items-center u-gap-3"
                  >
                    <Icon
                      name="Check"
                      size={16}
                      className="u-text-success"
                    />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="u-border-t u-my-4"></div>

        {/* Plan Metadata */}
        <div className="u-space-y-4">
          <h3 className="u-text-lg u-fw-semibold">Plan Information</h3>
          
          <div className="u-grid u-grid-cols-2 u-gap-4">
            <div className="u-space-y-3">
              <div className="u-flex u-justify-between u-items-center">
                <span className="u-text-secondary">Status:</span>
                <Badge
                  variant={plan.is_active ? "success" : "secondary"}
                  size="sm"
                  label={plan.is_active ? "Active" : "Inactive"}
                />
              </div>
              <div className="u-flex u-justify-between u-items-center">
                <span className="u-text-secondary">Featured:</span>
                <Badge
                  variant={plan.is_featured ? "primary" : "secondary"}
                  size="sm"
                  label={plan.is_featured ? "Yes" : "No"}
                />
              </div>
              <div className="u-flex u-justify-between u-items-center">
                <span className="u-text-secondary">Popular:</span>
                <Badge
                  variant={plan.is_popular ? "success" : "secondary"}
                  size="sm"
                  label={plan.is_popular ? "Yes" : "No"}
                />
              </div>
            </div>
            
            <div className="u-space-y-3">
              <div className="u-flex u-justify-between u-items-center">
                <span className="u-text-secondary">Created:</span>
                <span className="u-fw-medium">
                  {formatDate(plan.created_at)}
                </span>
              </div>
              <div className="u-flex u-justify-between u-items-center">
                <span className="u-text-secondary">Last Updated:</span>
                <span className="u-fw-medium">
                  {formatDate(plan.updated_at)}
                </span>
              </div>
              <div className="u-flex u-justify-between u-items-center">
                <span className="u-text-secondary">Plan ID:</span>
                <span className="u-fw-medium u-font-mono">
                  #{plan.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="u-flex u-justify-end u-gap-3 u-pt-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          {onEdit && (
            <Button
              variant="primary"
              onClick={onEdit}
            >
              <Icon name="Pencil" size={16} />
              Edit Plan
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PlanDetails;