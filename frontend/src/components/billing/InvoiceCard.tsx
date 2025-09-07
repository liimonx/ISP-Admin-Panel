import React from 'react';
import {
  Card,
  Button,
  Badge,
  Avatar,
  Progress,
  Icon,
} from '@shohojdhara/atomix';
import { Invoice } from '../../types';
import { formatCurrency, toNumber } from '../../utils/formatters';

interface InvoiceCardProps {
  invoice: Invoice;
  onView: (invoice: Invoice) => void;
  onPay: (invoice: Invoice) => void;
  onDownload: (invoice: Invoice) => void;
  onSend: (invoice: Invoice) => void;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  onView,
  onPay,
  onDownload,
  onSend,
}) => {
  const getStatusBadge = (status: Invoice['status']) => {
    const variants = {
      draft: 'secondary',
      pending: 'warning',
      paid: 'success',
      overdue: 'error',
      cancelled: 'secondary',
    } as const;

    const labels = {
      draft: 'Draft',
      pending: 'Pending',
      paid: 'Paid',
      overdue: 'Overdue',
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

  const getPaymentProgress = () => {
    const total = toNumber(invoice.total_amount);
    const paid = toNumber(invoice.paid_amount);
    const percentage = total > 0 ? (paid / total) * 100 : 0;
    
    return {
      percentage: Math.round(percentage),
      remaining: total - paid,
      isFullyPaid: paid >= total,
    };
  };

  const progress = getPaymentProgress();
  const isOverdue = invoice.status === 'overdue';
  const isPending = invoice.status === 'pending';
  const canPay = isPending || isOverdue;

  return (
    <Card className="u-h-100">
      <div className="u-d-flex u-justify-content-between u-align-items-start u-mb-4">
        <div className="u-flex-fill">
          <h4 className="u-mb-1 u-fs-lg u-fw-semibold">{invoice.invoice_number}</h4>
          <p className="u-fs-sm u-text-secondary-emphasis u-mb-2">
            {invoice.invoice_type} • Due: {new Date(invoice.due_date).toLocaleDateString()}
          </p>
          {getStatusBadge(invoice.status)}
        </div>
        <div className="u-text-right">
          <div className="u-fs-xl u-fw-bold u-text-primary">
            {formatCurrency(invoice.total_amount)}
          </div>
          {toNumber(invoice.paid_amount) > 0 && (
            <div className="u-fs-sm u-text-success">
              {formatCurrency(invoice.paid_amount)} paid
            </div>
          )}
        </div>
      </div>

      <div className="u-d-flex u-align-items-center u-gap-3 u-mb-4">
        <Avatar
          initials={invoice.customer?.name?.charAt(0) || '?'}
          size="md"
        />
        <div className="u-flex-fill">
          <div className="u-fw-medium u-fs-sm">
            {invoice.customer?.name || 'Unknown Customer'}
          </div>
          <div className="u-fs-xs u-text-secondary-emphasis">
            {invoice.customer?.email || 'No email'}
          </div>
          <div className="u-fs-xs u-text-secondary-emphasis">
            {invoice.customer?.phone || 'No phone'}
          </div>
        </div>
      </div>

      {!progress.isFullyPaid && (
        <div className="u-mb-4">
          <div className="u-d-flex u-justify-content-between u-mb-2">
            <span className="u-fs-sm u-fw-medium">Payment Progress</span>
            <span className="u-fs-sm u-fw-medium">
              {progress.percentage}%
            </span>
          </div>
          <Progress
            value={progress.percentage}
            variant={isOverdue ? 'error' : 'primary'}
            className="u-mb-2"
          />
          <div className="u-fs-xs u-text-secondary-emphasis">
            {formatCurrency(progress.remaining)} remaining
          </div>
        </div>
      )}

      <div className="u-d-flex u-gap-2 u-mt-auto">
        <Button 
          variant="outline" 
          size="sm" 
          className="u-flex-fill"
          onClick={() => onView(invoice)}
        >
          <Icon name="Eye" size={16} />
          View
        </Button>
        
        {canPay && (
          <Button
            variant="primary"
            size="sm"
            className="u-flex-fill"
            onClick={() => onPay(invoice)}
          >
            <Icon name="CurrencyDollar" size={16} />
            Pay
          </Button>
        )}

        {invoice.status === 'pending' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSend(invoice)}
          >
            <Icon name="Send" size={16} />
          </Button>
        )}

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onDownload(invoice)}
        >
          <Icon name="Download" size={16} />
        </Button>
      </div>
    </Card>
  );
};

export default InvoiceCard;
