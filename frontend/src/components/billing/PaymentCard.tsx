import React from 'react';
import {
  Card,
  Button,
  Badge,
  Avatar,
  Icon,
} from '@shohojdhara/atomix';
import { Payment } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface PaymentCardProps {
  payment: Payment;
  onView: (payment: Payment) => void;
  onDownload: (payment: Payment) => void;
  onRefund?: (payment: Payment) => void;
}

const PaymentCard: React.FC<PaymentCardProps> = ({
  payment,
  onView,
  onDownload,
  onRefund,
}) => {
  const getStatusBadge = (status: Payment['status']) => {
    const variants = {
      pending: 'warning',
      completed: 'success',
      failed: 'error',
      refunded: 'secondary',
      cancelled: 'secondary',
    } as const;

    const labels = {
      pending: 'Pending',
      completed: 'Completed',
      failed: 'Failed',
      refunded: 'Refunded',
      cancelled: 'Cancelled',
    };

    return (
      <Badge
        variant={variants[status]}
        size="sm"
        label={labels[status]}
      />
    );
  };

  const getPaymentMethodBadge = (method: Payment['payment_method']) => {
    const labels = {
      cash: 'Cash',
      bank_transfer: 'Bank Transfer',
      bkash: 'bKash',
      nagad: 'Nagad',
      rocket: 'Rocket',
      sslcommerz: 'SSLCommerz',
      stripe: 'Stripe',
      other: 'Other',
    };

    const colors = {
      cash: 'secondary',
      bank_transfer: 'primary',
      bkash: 'success',
      nagad: 'success',
      rocket: 'success',
      sslcommerz: 'primary',
      stripe: 'primary',
      other: 'secondary',
    };

    return (
      <Badge 
        variant={colors[method] as any} 
        size="sm" 
        label={labels[method]} 
      />
    );
  };

  const canRefund = payment.status === 'completed' && onRefund;

  return (
    <Card className="u-h-100">
      <div className="u-flex u-justify-between u-align-items-start u-mb-4">
        <div className="u-flex-fill">
          <h4 className="u-mb-1 u-fs-lg u-fw-semibold">{payment.payment_number}</h4>
          <p className="u-fs-sm u-text-secondary-emphasis">
            {payment.payment_date
              ? new Date(payment.payment_date).toLocaleDateString()
              : 'Pending'}
          </p>
        </div>
        {getStatusBadge(payment.status)}
      </div>

      <div className="u-flex u-items-center u-gap-3 u-mb-4">
        <Avatar
          initials={payment.customer?.name?.charAt(0) || '?'}
          size="md"
        />
        <div className="u-flex-fill">
          <div className="u-fw-medium u-fs-sm">
            {payment.customer?.name || 'Unknown Customer'}
          </div>
          <div className="u-fs-xs u-text-secondary-emphasis">
            Invoice: {payment.invoice?.invoice_number || 'Unknown Invoice'}
          </div>
          <div className="u-fs-xs u-text-secondary-emphasis">
            {payment.customer?.email || 'No email'}
          </div>
        </div>
      </div>

      <div className="u-mb-4">
        <div className="u-flex u-justify-between u-items-center u-mb-2">
          <span className="u-fs-sm u-text-secondary-emphasis">Amount</span>
          <span className="u-fs-xl u-fw-bold u-text-primary">
            {formatCurrency(payment.amount)}
          </span>
        </div>
        <div className="u-flex u-justify-between u-items-center u-mb-2">
          <span className="u-fs-sm u-text-secondary-emphasis">Method</span>
          {getPaymentMethodBadge(payment.payment_method)}
        </div>
        {payment.transaction_id && (
          <div className="u-flex u-justify-between u-items-center">
            <span className="u-fs-sm u-text-secondary-emphasis">Transaction ID</span>
            <span className="u-fs-xs u-text-secondary-emphasis u-font-mono">
              {payment.transaction_id.slice(0, 8)}...
            </span>
          </div>
        )}
      </div>

      <div className="u-flex u-gap-2 u-mt-auto">
        <Button 
          variant="outline" 
          size="sm" 
          className="u-flex-fill"
          onClick={() => onView(payment)}
        >
          <Icon name="Eye" size={16} />
          View
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="u-flex-fill"
          onClick={() => onDownload(payment)}
        >
          <Icon name="Download" size={16} />
          Receipt
        </Button>

        {canRefund && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefund(payment)}
          >
            <Icon name="Refresh" size={16} />
          </Button>
        )}
      </div>
    </Card>
  );
};

export default PaymentCard;
