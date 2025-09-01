import React from 'react';
import { Grid, GridCol } from '@shohojdhara/atomix';
import { StatCard } from '../molecules/StatCard';
import { formatCurrency } from '../../utils/formatters';

interface BillingStatsProps {
  invoiceStats: {
    total_revenue?: number;
    total_invoices?: number;
    pending_invoices?: number;
    overdue_invoices?: number;
    paid_invoices?: number;
    collection_rate?: number;
  };
  paymentStats: {
    total_payments?: number;
    successful_payments?: number;
    failed_payments?: number;
    average_payment_amount?: number;
  };
  calculatedStats: {
    outstandingAmount: number;
    overdueAmount: number;
    pendingAmount: number;
  };
}

const BillingStats: React.FC<BillingStatsProps> = ({
  invoiceStats,
  paymentStats,
  calculatedStats,
}) => {
  const collectionRate = invoiceStats.collection_rate || 0;
  const totalRevenue = invoiceStats.total_revenue || 0;
  const totalInvoices = invoiceStats.total_invoices || 0;
  const pendingInvoices = invoiceStats.pending_invoices || 0;
  const overdueInvoices = invoiceStats.overdue_invoices || 0;
  const paidInvoices = invoiceStats.paid_invoices || 0;

  const totalPayments = paymentStats.total_payments || 0;
  const successfulPayments = paymentStats.successful_payments || 0;
  const failedPayments = paymentStats.failed_payments || 0;
  const averagePaymentAmount = paymentStats.average_payment_amount || 0;

  return (
    <Grid className="u-mb-6">
      <GridCol xs={12} md={6} lg={3} className='u-mb-4'>
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon="CurrencyDollar"
          iconColor="#7AFFD7"
          trend={{
            value: 12.5,
            isPositive: true,
          }}
          description="this month"
        />
      </GridCol>
      
      <GridCol xs={12} md={6} lg={3} className='u-mb-4'>
        <StatCard
          title="Outstanding Amount"
          value={formatCurrency(calculatedStats.outstandingAmount)}
          icon="Clock"
          iconColor="#1AFFD2"
          trend={{
            value: 5.2,
            isPositive: false,
          }}
          description="pending invoices"
        />
      </GridCol>
      
      <GridCol xs={12} md={6} lg={3} className='u-mb-4'>
        <StatCard
          title="Overdue Amount"
          value={formatCurrency(calculatedStats.overdueAmount)}
          icon="Warning"
          iconColor="#FF6B6B"
          trend={{
            value: 8.1,
            isPositive: false,
          }}
          description="needs attention"
        />
      </GridCol>
      
      <GridCol xs={12} md={6} lg={3} className='u-mb-4'>
        <StatCard
          title="Collection Rate"
          value={`${collectionRate.toFixed(1)}%`}
          icon="TrendUp"
          iconColor="#00D9FF"
          trend={{
            value: 2.1,
            isPositive: true,
          }}
          description="payment success"
        />
      </GridCol>

      {/* Additional Stats Row */}
      <GridCol xs={12} md={6} lg={3} className='u-mb-4'>
        <StatCard
          title="Total Invoices"
          value={totalInvoices.toString()}
          icon="Receipt"
          iconColor="#FFD93D"
          trend={{
            value: 15,
            isPositive: true,
          }}
          description="this month"
        />
      </GridCol>
      
      <GridCol xs={12} md={6} lg={3} className='u-mb-4'>
        <StatCard
          title="Pending Invoices"
          value={pendingInvoices.toString()}
          icon="Clock"
          iconColor="#FFA500"
          trend={{
            value: 3,
            isPositive: false,
          }}
          description="awaiting payment"
        />
      </GridCol>
      
      <GridCol xs={12} md={6} lg={3} className='u-mb-4'>
        <StatCard
          title="Overdue Invoices"
          value={overdueInvoices.toString()}
          icon="AlertTriangle"
          iconColor="#FF4757"
          trend={{
            value: 7,
            isPositive: false,
          }}
          description="past due"
        />
      </GridCol>
      
      <GridCol xs={12} md={6} lg={3} className='u-mb-4'>
        <StatCard
          title="Paid Invoices"
          value={paidInvoices.toString()}
          icon="CheckCircle"
          iconColor="#2ED573"
          trend={{
            value: 18,
            isPositive: true,
          }}
          description="completed"
        />
      </GridCol>

      {/* Payment Stats Row */}
      <GridCol xs={12} md={6} lg={3} className='u-mb-4'>
        <StatCard
          title="Total Payments"
          value={totalPayments.toString()}
          icon="CreditCard"
          iconColor="#3742FA"
          trend={{
            value: 22,
            isPositive: true,
          }}
          description="this month"
        />
      </GridCol>
      
      <GridCol xs={12} md={6} lg={3} className='u-mb-4'>
        <StatCard
          title="Successful Payments"
          value={successfulPayments.toString()}
          icon="Check"
          iconColor="#2ED573"
          trend={{
            value: 20,
            isPositive: true,
          }}
          description="completed"
        />
      </GridCol>
      
      <GridCol xs={12} md={6} lg={3} className='u-mb-4'>
        <StatCard
          title="Failed Payments"
          value={failedPayments.toString()}
          icon="X"
          iconColor="#FF4757"
          trend={{
            value: 2,
            isPositive: false,
          }}
          description="failed"
        />
      </GridCol>
      
      <GridCol xs={12} md={6} lg={3} className='u-mb-4'>
        <StatCard
          title="Average Payment"
          value={formatCurrency(averagePaymentAmount)}
          icon="BarChart"
          iconColor="#FFA502"
          trend={{
            value: 5.5,
            isPositive: true,
          }}
          description="per transaction"
        />
      </GridCol>
    </Grid>
  );
};

export default BillingStats;
