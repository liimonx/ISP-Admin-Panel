import React from "react";
import { Grid, GridCol } from "@shohojdhara/atomix";
import { StatCard } from "../molecules/StatCard";
import { formatCurrency } from "../../utils/formatters";

interface BillingStatsProps {
  invoiceStats: {
    total_revenue?: number;
    total_invoices?: number;
    pending_invoices?: number;
    overdue_invoices?: number;
    paid_invoices?: number;
    collection_rate?: number;
    monthly_recurring_revenue?: number;
    avg_payment_days?: number;
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
  isLoading?: boolean;
  error?: string;
}

const BillingStats: React.FC<BillingStatsProps> = ({
  invoiceStats,
  paymentStats,
  calculatedStats,
  isLoading = false,
  error,
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

  if (error) {
    return (
      <div className="u-p-4 u-text-center">
        <p className="u-text-error">Failed to load billing statistics</p>
        <p className="u-fs-sm u-text-secondary">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Grid className="u-mb-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <GridCol key={index} xs={12} md={6} lg={3} className="u-mb-4">
            <div className="u-p-4 u-border u-rounded">
              <div className="u-d-flex u-align-items-center u-mb-3">
                <div className="u-bg-secondary-subtle u-w-8 u-h-8 u-rounded u-me-3"></div>
                <div className="u-flex-fill">
                  <div className="u-bg-secondary-subtle u-h-4 u-rounded u-mb-2"></div>
                  <div className="u-bg-secondary-subtle u-h-3 u-rounded u-w-75"></div>
                </div>
              </div>
              <div className="u-bg-secondary-subtle u-h-6 u-rounded"></div>
            </div>
          </GridCol>
        ))}
      </Grid>
    );
  }

  return (
    <Grid className="u-mb-6">
      <GridCol xs={12} md={6} lg={3} className="u-mb-4">
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
          className="u-h-100"
        />
      </GridCol>

      <GridCol xs={12} md={6} lg={3} className="u-mb-4">
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
          className="u-h-100"
        />
      </GridCol>

      <GridCol xs={12} md={6} lg={3} className="u-mb-4">
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
          className="u-h-100"
        />
      </GridCol>

      <GridCol xs={12} md={6} lg={3} className="u-mb-4">
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
          className="u-h-100"
        />
      </GridCol>

      {/* Additional Stats Row */}
      <GridCol xs={12} md={6} lg={3} className="u-mb-4">
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
          className="u-h-100"
        />
      </GridCol>

      <GridCol xs={12} md={6} lg={3} className="u-mb-4">
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
          className="u-h-100"
        />
      </GridCol>

      <GridCol xs={12} md={6} lg={3} className="u-mb-4">
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
          className="u-h-100"
        />
      </GridCol>

      <GridCol xs={12} md={6} lg={3} className="u-mb-4">
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
          className="u-h-100"
        />
      </GridCol>

      {/* Payment Stats Row */}
      <GridCol xs={12} md={6} lg={3} className="u-mb-4">
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
          className="u-h-100"
        />
      </GridCol>

      <GridCol xs={12} md={6} lg={3} className="u-mb-4">
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
          className="u-h-100"
        />
      </GridCol>

      <GridCol xs={12} md={6} lg={3} className="u-mb-4">
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
          className="u-h-100"
        />
      </GridCol>

      <GridCol xs={12} md={6} lg={3} className="u-mb-4">
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
          className="u-h-100"
        />
      </GridCol>
    </Grid>
  );
};

export default BillingStats;
