import React from "react";
import { Modal, Button, Icon, Grid, GridCol, Badge } from "@shohojdhara/atomix";
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
  subscription,
  mode,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  customers,
  plans,
  routers,
}) => {
  const selectedPlan = plans.find(p => p.id === formData.plan_id);
  
  const handlePlanChange = (planId: number) => {
    const plan = plans.find(p => p.id === planId);
    setFormData({
      ...formData,
      plan_id: planId,
      monthly_fee: plan?.price || 0,
      setup_fee: plan?.setup_fee || 0,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      zIndex: 1050,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div className="modal-header u-d-flex u-justify-content-between u-align-items-center u-mb-4">
          <h2 className="u-fs-3 u-fw-semibold u-mb-0">
            <Icon name={mode === "create" ? "Plus" : "Pencil"} size={20} className="u-me-2" />
            {mode === "create" ? "Add New Subscription" : "Edit Subscription"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>
      <form onSubmit={onSubmit} className="u-d-flex u-flex-column u-gap-4">
        {/* Customer and Plan Selection */}
        <div className="u-bg-secondary-subtle u-p-4 u-rounded">
          <h4 className="u-fs-5 u-fw-semibold u-mb-3 u-text-primary-emphasis">
            <Icon name="User" size={16} className="u-me-2" />
            Customer & Plan Details
          </h4>
          
          <Grid>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label u-fw-medium">Customer *</label>
                <select
                  className="form-select"
                  value={formData.customer_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_id: parseInt(e.target.value),
                    })
                  }
                  required
                >
                  <option value={0}>Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email}) - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>
            </GridCol>
            
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label u-fw-medium">Plan *</label>
                <select
                  className="form-select"
                  value={formData.plan_id}
                  onChange={(e) => handlePlanChange(parseInt(e.target.value))}
                  required
                >
                  <option value={0}>Select Plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {plan.download_speed}/{plan.upload_speed} {plan.speed_unit} - ${plan.price}/month
                    </option>
                  ))}
                </select>
              </div>
            </GridCol>
          </Grid>

          {/* Plan Details Preview */}
          {selectedPlan && (
            <div className="u-mt-3 u-p-3 u-bg-primary-subtle u-rounded u-border u-border-primary-subtle">
              <div className="u-d-flex u-flex-wrap u-gap-3 u-align-items-center">
                <Badge variant="primary" size="sm" label={`${selectedPlan.download_speed}/${selectedPlan.upload_speed} ${selectedPlan.speed_unit?.toUpperCase()}`} />
                {selectedPlan.data_quota && (
                  <Badge variant="info" size="sm" label={`${selectedPlan.data_quota} ${selectedPlan.quota_unit?.toUpperCase()} quota`} />
                )}
                <Badge variant="success" size="sm" label={`$${selectedPlan.price}/month`} />
                {selectedPlan.setup_fee > 0 && (
                  <Badge variant="warning" size="sm" label={`$${selectedPlan.setup_fee} setup`} />
                )}
              </div>
              {selectedPlan.description && (
                <p className="u-fs-sm u-text-secondary-emphasis-emphasis u-mt-2 u-mb-0">
                  {selectedPlan.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Network Configuration */}
        <div className="u-bg-info-subtle u-p-4 u-rounded">
          <h4 className="u-fs-5 u-fw-semibold u-mb-3 u-text-primary-emphasis">
            <Icon name="Globe" size={16} className="u-me-2" />
            Network Configuration
          </h4>
          
          <Grid>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label u-fw-medium">Router *</label>
                <select
                  className="form-select"
                  value={formData.router_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      router_id: parseInt(e.target.value),
                    })
                  }
                  required
                >
                  <option value={0}>Select Router</option>
                  {routers.map((router) => (
                    <option key={router.id} value={router.id}>
                      {router.name} ({router.location}) - {router.host} - {router.status}
                    </option>
                  ))}
                </select>
              </div>
            </GridCol>
            
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label u-fw-medium">Username *</label>
                <input
                  className="form-input"
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
              <div className="form-field">
                <label className="form-label u-fw-medium">Password *</label>
                <input
                  className="form-input"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter password"
                  required={mode === "create"}
                />
                {mode === "edit" && (
                  <small className="form-text u-text-secondary-emphasis-emphasis">
                    Leave empty to keep existing password
                  </small>
                )}
              </div>
            </GridCol>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label u-fw-medium">Access Method *</label>
                <select
                  className="form-select"
                  value={formData.access_method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      access_method: e.target.value,
                    })
                  }
                  required
                >
                  <option value="pppoe">PPPoE</option>
                  <option value="static_ip">Static IP</option>
                  <option value="dhcp">DHCP</option>
                </select>
              </div>
            </GridCol>
          </Grid>

          <Grid>
            
            {formData.access_method === "static_ip" && (
              <GridCol xs={12} md={6}>
                <div className="form-field">
                  <label className="form-label u-fw-medium">Static IP Address</label>
                  <input
                    className="form-input"
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
                <div className="form-field">
                  <label className="form-label u-fw-medium">MAC Address</label>
                  <input
                    className="form-input"
                    value={formData.mac_address}
                    onChange={(e) =>
                      setFormData({ ...formData, mac_address: e.target.value })
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
          <h4 className="u-fs-5 u-fw-semibold u-mb-3 u-text-primary-emphasis">
            <Icon name="Calendar" size={16} className="u-me-2" />
            Subscription Details
          </h4>
          
          <Grid>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label u-fw-medium">Status *</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value,
                    })
                  }
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </GridCol>
            
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label u-fw-medium">Start Date *</label>
                <input
                  className="form-input"
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
              <div className="form-field">
                <label className="form-label u-fw-medium">End Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
                <small className="form-text u-text-secondary-emphasis-emphasis">
                  Leave empty for ongoing subscription
                </small>
              </div>
            </GridCol>
          </Grid>
        </div>

        {/* Billing Information */}
        <div className="u-bg-warning-subtle u-p-4 u-rounded">
          <h4 className="u-fs-5 u-fw-semibold u-mb-3 u-text-primary-emphasis">
            <Icon name="CurrencyDollar" size={16} className="u-me-2" />
            Billing Information
          </h4>
          
          <Grid>
            <GridCol xs={12} md={6}>
              <div className="form-field">
                <label className="form-label u-fw-medium">Monthly Fee *</label>
                <input
                  className="form-input"
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
              <div className="form-field">
                <label className="form-label u-fw-medium">Setup Fee</label>
                <input
                  className="form-input"
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
        <div className="form-field">
          <label className="form-label u-fw-medium">Notes</label>
          <textarea
            className="form-textarea"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows={3}
            placeholder="Any additional notes or special instructions..."
          />
        </div>

        {/* Modal Actions */}
        <div className="u-d-flex u-justify-content-end u-gap-3 u-pt-4 u-border-t">
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
          >
            {isSubmitting ? (
              <>
                <Icon name="Spinner" size={16} className="u-me-2" />
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>
                <Icon name={mode === "create" ? "Plus" : "Check"} size={16} className="u-me-2" />
                {mode === "create" ? "Create Subscription" : "Update Subscription"}
              </>
            )}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default SubscriptionModal;