import React from "react";
import {
  Modal,
  Button,
  Icon,
  Grid,
  GridCol,
  Badge,
  Select,
  Input,
  Textarea,
} from "@shohojdhara/atomix";
import { Subscription, Customer, Plan, Router } from "../../types";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  mode: "create" | "edit";
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  customers: Customer[];
  plans: Plan[];
  routers: Router[];
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  mode,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  customers,
  plans,
  routers,
}) => {
  const selectedPlan = plans.find((p) => p.id === formData.plan_id);

  const handlePlanChange = (planId: number) => {
    const plan = plans.find((p) => p.id === planId);
    setFormData({
      ...formData,
      plan_id: planId,
      monthly_fee: plan?.price || 0,
      setup_fee: plan?.setup_fee || 0,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="u-flex u-items-center">
          <Icon
            name={mode === "create" ? "Plus" : "Pencil"}
            size={20}
            className="u-me-2"
          />
          {mode === "create" ? "Add New Subscription" : "Edit Subscription"}
        </span>
      }
      size="lg"
    >
      <form onSubmit={onSubmit} className="u-flex u-flex-column u-gap-4">
        {/* Customer and Plan Selection */}
        <div className="u-bg-secondary-subtle u-p-4 u-rounded">
          <h4 className="u-text-base u-font-bold u-mb-3 u-text-primary">
            <Icon name="User" size={16} className="u-me-2" />
            Customer & Plan Details
          </h4>

          <Grid>
            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label className="u-block u-font-normal u-mb-1">
                  Customer *
                </label>
                <Select
                  className="u-w-100"
                  value={formData.customer_id.toString()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_id: parseInt(e.target.value),
                    })
                  }
                  options={[
                    { value: "0", label: "Select Customer" },
                    ...customers.map((c) => ({
                      value: c.id.toString(),
                      label: `${c.name} (${c.email}) - ${c.phone}`,
                    })),
                  ]}
                  required
                />
              </div>
            </GridCol>

            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label className="u-block u-font-normal u-mb-1">Plan *</label>
                <Select
                  className="u-w-100"
                  value={formData.plan_id.toString()}
                  onChange={(e) => handlePlanChange(parseInt(e.target.value))}
                  options={[
                    { value: "0", label: "Select Plan" },
                    ...plans.map((p) => ({
                      value: p.id.toString(),
                      label: `${p.name} - ${p.download_speed}/${p.upload_speed} ${p.speed_unit} - $${p.price}/month`,
                    })),
                  ]}
                  required
                />
              </div>
            </GridCol>
          </Grid>

          {/* Plan Details Preview */}
          {selectedPlan && (
            <div className="u-mt-3 u-p-3 u-bg-primary-subtle u-rounded u-border u-border-primary-subtle">
              <div className="u-flex u-flex-wrap u-gap-3 u-items-center">
                <Badge
                  variant="primary"
                  size="sm"
                  label={`${selectedPlan.download_speed}/${selectedPlan.upload_speed} ${selectedPlan.speed_unit?.toUpperCase()}`}
                />
                {selectedPlan.data_quota && (
                  <Badge
                    variant="info"
                    size="sm"
                    label={`${selectedPlan.data_quota} ${selectedPlan.quota_unit?.toUpperCase()} quota`}
                  />
                )}
                <Badge
                  variant="success"
                  size="sm"
                  label={`$${selectedPlan.price}/month`}
                />
                {selectedPlan.setup_fee > 0 && (
                  <Badge
                    variant="warning"
                    size="sm"
                    label={`$${selectedPlan.setup_fee} setup`}
                  />
                )}
              </div>
              {selectedPlan.description && (
                <p className="u-fs-sm u-text-secondary-emphasis u-mt-2 u-mb-0">
                  {selectedPlan.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Network Configuration */}
        <div className="u-bg-info-subtle u-p-4 u-rounded">
          <h4 className="u-text-base u-font-bold u-mb-3 u-text-primary">
            <Icon name="Globe" size={16} className="u-me-2" />
            Network Configuration
          </h4>

          <Grid>
            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label className="u-block u-font-normal u-mb-1">Router *</label>
                <Select
                  className="u-w-100"
                  value={formData.router_id.toString()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      router_id: parseInt(e.target.value),
                    })
                  }
                  options={[
                    { value: "0", label: "Select Router" },
                    ...routers.map((r) => ({
                      value: r.id.toString(),
                      label: `${r.name} (${r.location}) - ${r.host} - ${r.status}`,
                    })),
                  ]}
                  required
                />
              </div>
            </GridCol>

            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label className="u-block u-font-normal u-mb-1">
                  Username *
                </label>
                <Input
                  className="u-w-100"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Enter unique username"
                  required
                />
              </div>
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label className="u-block u-font-normal u-mb-1">
                  Password *
                </label>
                <Input
                  className="u-w-100"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter password"
                  required={mode === "create"}
                />
                {mode === "edit" && (
                  <small className="u-fs-sm u-text-secondary-emphasis">
                    Leave empty to keep existing password
                  </small>
                )}
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label className="u-block u-font-normal u-mb-1">
                  Access Method *
                </label>
                <Select
                  className="u-w-100"
                  value={formData.access_method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      access_method: e.target.value,
                    })
                  }
                  options={[
                    { value: "pppoe", label: "PPPoE" },
                    { value: "static_ip", label: "Static IP" },
                    { value: "dhcp", label: "DHCP" },
                  ]}
                  required
                />
              </div>
            </GridCol>
          </Grid>

          <Grid>
            {formData.access_method === "static_ip" && (
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-block u-font-normal u-mb-1">
                    Static IP Address
                  </label>
                  <Input
                    className="u-w-100"
                    value={formData.static_ip}
                    onChange={(e) =>
                      setFormData({ ...formData, static_ip: e.target.value })
                    }
                    placeholder="192.168.1.100"
                  />
                </div>
              </GridCol>
            )}

            {formData.access_method === "dhcp" && (
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-block u-font-normal u-mb-1">
                    MAC Address
                  </label>
                  <Input
                    className="u-w-100"
                    value={formData.mac_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mac_address: e.target.value,
                      })
                    }
                    placeholder="00:11:22:33:44:55"
                  />
                </div>
              </GridCol>
            )}
          </Grid>
        </div>

        {/* Subscription Details */}
        <div className="u-bg-success-subtle u-p-4 u-rounded">
          <h4 className="u-text-base u-font-bold u-mb-3 u-text-primary">
            <Icon name="Calendar" size={16} className="u-me-2" />
            Subscription Details
          </h4>

          <Grid>
            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label className="u-block u-font-normal u-mb-1">Status *</label>
                <Select
                  className="u-w-100"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value,
                    })
                  }
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "suspended", label: "Suspended" },
                    { value: "cancelled", label: "Cancelled" },
                  ]}
                  required
                />
              </div>
            </GridCol>

            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label className="u-block u-font-normal u-mb-1">
                  Start Date *
                </label>
                <Input
                  className="u-w-100"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  required
                />
              </div>
            </GridCol>
          </Grid>

          <Grid>
            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label className="u-block u-font-normal u-mb-1">End Date</label>
                <Input
                  className="u-w-100"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
                <small className="u-fs-sm u-text-secondary-emphasis">
                  Leave empty for ongoing subscription
                </small>
              </div>
            </GridCol>
          </Grid>
        </div>

        {/* Billing Information */}
        <div className="u-bg-warning-subtle u-p-4 u-rounded">
          <h4 className="u-text-base u-font-bold u-mb-3 u-text-primary">
            <Icon name="CurrencyDollar" size={16} className="u-me-2" />
            Billing Information
          </h4>

          <Grid>
            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label className="u-block u-font-normal u-mb-1">
                  Monthly Fee *
                </label>
                <Input
                  className="u-w-100"
                  type="number"
                  step="0.01"
                  value={formData.monthly_fee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthly_fee: parseFloat(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </GridCol>

            <GridCol xs={12} md={6}>
              <div className="u-mb-3">
                <label className="u-block u-font-normal u-mb-1">
                  Setup Fee
                </label>
                <Input
                  className="u-w-100"
                  type="number"
                  step="0.01"
                  value={formData.setup_fee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      setup_fee: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </GridCol>
          </Grid>
        </div>

        {/* Notes */}
        <div className="u-mb-3">
          <label className="u-block u-font-normal u-mb-1">Notes</label>
          <Textarea
            className="u-w-100"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows={3}
            placeholder="Any additional notes or special instructions..."
          />
        </div>

        {/* Modal Actions */}
        <div className="u-flex u-justify-end u-gap-3 u-pt-4 u-border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            iconName={
              isSubmitting ? "Spinner" : mode === "create" ? "Plus" : "Check"
            }
            iconSize={16}
            className={isSubmitting ? "u-spin" : ""}
          >
            {isSubmitting
              ? mode === "create"
                ? "Creating..."
                : "Updating..."
              : mode === "create"
                ? "Create Subscription"
                : "Update Subscription"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SubscriptionModal;
