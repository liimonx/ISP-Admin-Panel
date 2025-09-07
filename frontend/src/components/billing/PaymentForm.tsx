import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Input,
  Textarea,
  Callout,
  Spinner,
  Select,
} from '@shohojdhara/atomix';
import { Invoice, Payment } from '../../types';
import { formatCurrency, toNumber } from '../../utils/formatters';

interface PaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSubmit: (data: {
    invoice_id: number;
    amount: number;
    payment_method: Payment['payment_method'];
    transaction_id?: string;
    notes?: string;
  }) => void;
  isLoading?: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  isOpen,
  onClose,
  invoice,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    amount: 0,
    payment_method: 'cash' as Payment['payment_method'],
    transaction_id: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (invoice) {
      const remainingAmount = toNumber(invoice.total_amount) - toNumber(invoice.paid_amount);
      setFormData(prev => ({
        ...prev,
        amount: remainingAmount,
      }));
    }
  }, [invoice]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (invoice && formData.amount > toNumber(invoice.total_amount) - toNumber(invoice.paid_amount)) {
      newErrors.amount = 'Amount cannot exceed remaining balance';
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method is required';
    }

    // Validate transaction ID for certain payment methods
    if (['bank_transfer', 'bkash', 'nagad', 'rocket', 'sslcommerz', 'stripe'].includes(formData.payment_method)) {
      if (!formData.transaction_id.trim()) {
        newErrors.transaction_id = 'Transaction ID is required for this payment method';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !invoice) return;

    const paymentData = {
      invoice_id: invoice.id,
      amount: formData.amount,
      payment_method: formData.payment_method,
      transaction_id: formData.transaction_id.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    onSubmit(paymentData);
  };

  const handleClose = () => {
    setFormData({
      amount: 0,
      payment_method: 'cash',
      transaction_id: '',
      notes: '',
    });
    setErrors({});
    onClose();
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash', requiresTransactionId: false },
    { value: 'bank_transfer', label: 'Bank Transfer', requiresTransactionId: true },
    { value: 'bkash', label: 'bKash', requiresTransactionId: true },
    { value: 'nagad', label: 'Nagad', requiresTransactionId: true },
    { value: 'rocket', label: 'Rocket', requiresTransactionId: true },
    { value: 'sslcommerz', label: 'SSLCommerz', requiresTransactionId: true },
    { value: 'stripe', label: 'Stripe', requiresTransactionId: true },
    { value: 'other', label: 'Other', requiresTransactionId: false },
  ];

  const selectedMethod = paymentMethods.find(m => m.value === formData.payment_method);

  if (!invoice) return null;

      const remainingAmount = toNumber(invoice.total_amount) - toNumber(invoice.paid_amount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Payment"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className="u-mb-4">
          <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">Invoice</label>
          <p className="u-fw-medium">{invoice.invoice_number}</p>
          <p className="u-fs-sm u-text-secondary-emphasis">
            Customer: {invoice.customer?.name}
          </p>
          <p className="u-fs-sm u-text-secondary-emphasis">
            Total: {formatCurrency(invoice.total_amount)} | 
            Paid: {formatCurrency(invoice.paid_amount)} | 
            Remaining: {formatCurrency(remainingAmount)}
          </p>
        </div>

        <div className="u-mb-4">
          <label htmlFor="amount" className="u-d-block u-fs-sm u-fw-medium u-mb-1">
            Amount *
          </label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            max={remainingAmount}
            value={formData.amount}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              setFormData(prev => ({ ...prev, amount: value }));
              if (errors.amount) {
                setErrors(prev => ({ ...prev, amount: '' }));
              }
            }}

            required
          />
          {errors.amount && (
            <p className="u-fs-xs u-text-error u-mt-1">{errors.amount}</p>
          )}
        </div>

        <div className="u-mb-4">
          <label htmlFor="payment_method" className="u-d-block u-fs-sm u-fw-medium u-mb-1">
            Payment Method *
          </label>
          <Select
            id="payment_method"
            value={formData.payment_method}
            onChange={(e) => {
              const method = e.target.value as Payment['payment_method'];
              setFormData(prev => ({ 
                ...prev, 
                payment_method: method,
                transaction_id: method === 'cash' ? '' : prev.transaction_id,
              }));
              if (errors.payment_method) {
                setErrors(prev => ({ ...prev, payment_method: '' }));
              }
            }}
            className="u-w-100"
            required
            options={paymentMethods}
          />
          {errors.payment_method && (
            <p className="u-fs-xs u-text-error u-mt-1">{errors.payment_method}</p>
          )}
        </div>

        {selectedMethod?.requiresTransactionId && (
          <div className="u-mb-4">
            <label htmlFor="transaction_id" className="u-d-block u-fs-sm u-fw-medium u-mb-1">
              Transaction ID *
            </label>
            <Input
              id="transaction_id"
              type="text"
              value={formData.transaction_id}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, transaction_id: e.target.value }));
                if (errors.transaction_id) {
                  setErrors(prev => ({ ...prev, transaction_id: '' }));
                }
              }}
              placeholder="Enter transaction ID"

              required
            />
            {errors.transaction_id && (
              <p className="u-fs-xs u-text-error u-mt-1">{errors.transaction_id}</p>
            )}
          </div>
        )}

        <div className="u-mb-4">
          <label htmlFor="notes" className="u-d-block u-fs-sm u-fw-medium u-mb-1">
            Notes
          </label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            placeholder="Optional payment notes..."
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
          <Button
            type="submit"
            variant="primary"
                          disabled={isLoading}
          >
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentForm;
