import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Input,
  Textarea,
  Spinner,
  Select,
} from "@shohojdhara/atomix";
import { Customer, Subscription } from "../../types";
import { apiService } from "../../services/apiService";
import { formatCurrency } from "../../utils/formatters";

interface GenerateInvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    customer_id: number;
    subscription_id?: number;
    invoice_type: "monthly" | "setup" | "adjustment" | "other";
    billing_period_start: string;
    billing_period_end: string;
    subtotal: number;
    tax_amount?: number;
    discount_amount?: number;
    notes?: string;
  }) => void;
  isLoading?: boolean;
}

const GenerateInvoiceForm: React.FC<GenerateInvoiceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    customer_id: 0,
    subscription_id: 0,
    invoice_type: "monthly" as const,
    billing_period_start: "",
    billing_period_end: "",
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

  // Load customers and subscriptions
  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.customer_id) {
      loadSubscriptions(formData.customer_id);
    }
  }, [formData.customer_id]);

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await apiService.getCustomers({ limit: 100 });
      setCustomers(response.results || []);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadSubscriptions = async (customerId: number) => {
    setLoadingSubscriptions(true);
    try {
      const response = await apiService.getSubscriptions({
        customer_id: customerId,
        status: "active",
        limit: 50,
      });
      setSubscriptions(response.results || []);
    } catch (error) {
      console.error("Failed to load subscriptions:", error);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer_id = "Customer is required";
    }

    if (!formData.invoice_type) {
      newErrors.invoice_type = "Invoice type is required";
    }

    if (!formData.billing_period_start) {
      newErrors.billing_period_start = "Billing period start is required";
    }

    if (!formData.billing_period_end) {
      newErrors.billing_period_end = "Billing period end is required";
    }

    if (formData.subtotal <= 0) {
      newErrors.subtotal = "Subtotal must be greater than 0";
    }

    if (formData.billing_period_start && formData.billing_period_end) {
      const startDate = new Date(formData.billing_period_start);
      const endDate = new Date(formData.billing_period_end);
      if (startDate >= endDate) {
        newErrors.billing_period_end = "End date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const invoiceData = {
      customer_id: formData.customer_id,
      subscription_id: formData.subscription_id || undefined,
      invoice_type: formData.invoice_type,
      billing_period_start: formData.billing_period_start,
      billing_period_end: formData.billing_period_end,
      subtotal: formData.subtotal,
      tax_amount: formData.tax_amount || 0,
      discount_amount: formData.discount_amount || 0,
      notes: formData.notes.trim() || undefined,
    };

    onSubmit(invoiceData);
  };

  const handleClose = () => {
    setFormData({
      customer_id: 0,
      subscription_id: 0,
      invoice_type: "monthly",
      billing_period_start: "",
      billing_period_end: "",
      subtotal: 0,
      tax_amount: 0,
      discount_amount: 0,
      notes: "",
    });
    setErrors({});
    setSubscriptions([]);
    onClose();
  };

  const calculateTotal = () => {
    const subtotal = formData.subtotal || 0;
    const tax = formData.tax_amount || 0;
    const discount = formData.discount_amount || 0;
    return subtotal + tax - discount;
  };

  const invoiceTypes = [
    { value: "monthly", label: "Monthly Subscription" },
    { value: "setup", label: "Setup Fee" },
    { value: "adjustment", label: "Adjustment" },
    { value: "other", label: "Other" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Generate Invoice"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="u-mb-4">
          <label
            htmlFor="customer_id"
            className="u-d-block u-fs-sm u-fw-medium u-mb-1"
          >
            Customer *
          </label>
          <Select
            id="customer_id"
            value={formData.customer_id.toString()}
            onChange={(e) => {
              const customerId = parseInt(e.target.value);
              setFormData((prev) => ({
                ...prev,
                customer_id: customerId,
                subscription_id: 0, // Reset subscription when customer changes
              }));
              if (errors.customer_id) {
                setErrors((prev) => ({ ...prev, customer_id: "" }));
              }
            }}
            className="u-w-100"
            required
            disabled={loadingCustomers}
            options={[
              { value: "0", label: "Select Customer" },
              ...customers.map((customer) => ({
                value: customer.id.toString(),
                label: `${customer.name} - ${customer.email}`,
              })),
            ]}
          />
          {loadingCustomers && <Spinner size="sm" className="u-mt-2" />}
          {errors.customer_id && (
            <p className="u-fs-xs u-text-error u-mt-1">{errors.customer_id}</p>
          )}
        </div>

        <div className="u-mb-4">
          <label
            htmlFor="subscription_id"
            className="u-d-block u-fs-sm u-fw-medium u-mb-1"
          >
            Subscription (Optional)
          </label>
          <Select
            id="subscription_id"
            value={formData.subscription_id.toString()}
            onChange={(e) => {
              const subscriptionId = parseInt(e.target.value);
              setFormData((prev) => ({
                ...prev,
                subscription_id: subscriptionId,
              }));
            }}
            className="u-w-100"
            disabled={!formData.customer_id || loadingSubscriptions}
            options={[
              { value: "0", label: "No Subscription" },
              ...subscriptions.map((subscription) => ({
                value: subscription.id.toString(),
                label: `${subscription.plan.name} - ${formatCurrency(subscription.monthly_fee)}`,
              })),
            ]}
          />
          {loadingSubscriptions && <Spinner size="sm" className="u-mt-2" />}
        </div>

        <div className="u-mb-4">
          <label
            htmlFor="invoice_type"
            className="u-d-block u-fs-sm u-fw-medium u-mb-1"
          >
            Invoice Type *
          </label>
          <Select
            id="invoice_type"
            value={formData.invoice_type}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                invoice_type: e.target.value as any,
              }));
              if (errors.invoice_type) {
                setErrors((prev) => ({ ...prev, invoice_type: "" }));
              }
            }}
            className="u-w-100"
            required
            options={invoiceTypes}
          />
          {errors.invoice_type && (
            <p className="u-fs-xs u-text-error u-mt-1">{errors.invoice_type}</p>
          )}
        </div>

        <div className="u-d-flex u-gap-4 u-mb-4">
          <div className="u-flex-fill">
            <label
              htmlFor="billing_period_start"
              className="u-d-block u-fs-sm u-fw-medium u-mb-1"
            >
              Billing Period Start *
            </label>
            <Input
              id="billing_period_start"
              type="date"
              value={formData.billing_period_start}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  billing_period_start: e.target.value,
                }));
                if (errors.billing_period_start) {
                  setErrors((prev) => ({ ...prev, billing_period_start: "" }));
                }
              }}
              required
            />
            {errors.billing_period_start && (
              <p className="u-fs-xs u-text-error u-mt-1">
                {errors.billing_period_start}
              </p>
            )}
          </div>
          <div className="u-flex-fill">
            <label
              htmlFor="billing_period_end"
              className="u-d-block u-fs-sm u-fw-medium u-mb-1"
            >
              Billing Period End *
            </label>
            <Input
              id="billing_period_end"
              type="date"
              value={formData.billing_period_end}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  billing_period_end: e.target.value,
                }));
                if (errors.billing_period_end) {
                  setErrors((prev) => ({ ...prev, billing_period_end: "" }));
                }
              }}
              required
            />
            {errors.billing_period_end && (
              <p className="u-fs-xs u-text-error u-mt-1">
                {errors.billing_period_end}
              </p>
            )}
          </div>
        </div>

        <div className="u-mb-4">
          <h4 className="u-mb-3">Invoice Amounts</h4>
          <div className="u-space-y-3">
            <div>
              <label
                htmlFor="subtotal"
                className="u-d-block u-fs-sm u-fw-medium u-mb-1"
              >
                Subtotal *
              </label>
              <Input
                id="subtotal"
                type="number"
                step="0.01"
                min="0"
                value={formData.subtotal}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setFormData((prev) => ({ ...prev, subtotal: value }));
                  if (errors.subtotal) {
                    setErrors((prev) => ({ ...prev, subtotal: "" }));
                  }
                }}
                required
              />
              {errors.subtotal && (
                <p className="u-fs-xs u-text-error u-mt-1">{errors.subtotal}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="tax_amount"
                className="u-d-block u-fs-sm u-fw-medium u-mb-1"
              >
                Tax Amount
              </label>
              <Input
                id="tax_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.tax_amount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setFormData((prev) => ({ ...prev, tax_amount: value }));
                }}
              />
            </div>

            <div>
              <label
                htmlFor="discount_amount"
                className="u-d-block u-fs-sm u-fw-medium u-mb-1"
              >
                Discount Amount
              </label>
              <Input
                id="discount_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.discount_amount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setFormData((prev) => ({ ...prev, discount_amount: value }));
                }}
              />
            </div>

            <div className="u-d-flex u-justify-content-between u-fw-bold u-border-top u-pt-2">
              <span>Total:</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </div>

        <div className="u-mb-4">
          <label
            htmlFor="notes"
            className="u-d-block u-fs-sm u-fw-medium u-mb-1"
          >
            Notes
          </label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows={3}
            placeholder="Optional invoice notes..."
          />
        </div>

        <div className="u-d-flex u-justify-content-end u-gap-2 u-mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            Generate Invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GenerateInvoiceForm;
