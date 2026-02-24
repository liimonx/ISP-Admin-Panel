import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Button,
  Icon,
  Grid,
  GridCol,
  Select,
  Input,
  Badge,
  LineChart,
  DonutChart,
  Callout,
  Spinner,
} from "@shohojdhara/atomix";
import { apiService } from "../../../services/apiService";
import { formatCurrency } from "../../../utils/formatters";

interface BillingReportsProps {
  className?: string;
}

interface RevenueData {
  month: string;
  revenue: number;
  invoices: number;
  payments: number;
}

interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

interface CustomerPaymentData {
  customer_name: string;
  total_paid: number;
  invoice_count: number;
  avg_payment_time: number;
}

const BillingReports: React.FC<BillingReportsProps> = ({ className = "" }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("12m");
  const [reportType, setReportType] = useState("revenue");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Fetch revenue trends
  const {
    data: revenueData,
    isLoading: revenueLoading,
    error: revenueError,
  } = useQuery({
    queryKey: ["billing-revenue-trends", selectedPeriod, dateRange],
    queryFn: async () => {
      try {
        const response = await apiService.reports.getRevenueReports({
          period: selectedPeriod,
          start_date: dateRange.start,
          end_date: dateRange.end,
        });
        return response;
      } catch (error) {
        // Mock data for demonstration
        return generateMockRevenueData();
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch payment method statistics
  const { data: paymentMethodData, isLoading: paymentMethodLoading } = useQuery(
    {
      queryKey: ["billing-payment-methods", dateRange],
      queryFn: async () => {
        try {
          // Mock data for demonstration since endpoint doesn't exist yet
          return generateMockPaymentMethodData();
        } catch (error) {
          // Mock data for demonstration
          return generateMockPaymentMethodData();
        }
      },
      staleTime: 5 * 60 * 1000,
    },
  );

  // Fetch top customers by payment
  const { data: topCustomersData, isLoading: topCustomersLoading } = useQuery({
    queryKey: ["billing-top-customers", dateRange],
    queryFn: async () => {
      try {
        // Mock data for demonstration since endpoint doesn't exist yet
        return generateMockTopCustomersData();
      } catch (error) {
        // Mock data for demonstration
        return generateMockTopCustomersData();
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const generateMockRevenueData = (): RevenueData[] => {
    const months = [];
    const currentDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      months.push({
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        revenue: Math.floor(Math.random() * 50000) + 20000,
        invoices: Math.floor(Math.random() * 100) + 50,
        payments: Math.floor(Math.random() * 120) + 60,
      });
    }
    return months;
  };

  const generateMockPaymentMethodData = (): PaymentMethodData[] => {
    const methods = [
      { method: "bKash", count: 45, amount: 125000 },
      { method: "Nagad", count: 32, amount: 89000 },
      { method: "Bank Transfer", count: 28, amount: 156000 },
      { method: "Cash", count: 15, amount: 45000 },
      { method: "Rocket", count: 12, amount: 34000 },
    ];

    const total = methods.reduce((sum, m) => sum + m.amount, 0);
    return methods.map((method) => ({
      ...method,
      percentage: (method.amount / total) * 100,
    }));
  };

  const generateMockTopCustomersData = (): CustomerPaymentData[] => {
    const customers = [
      {
        customer_name: "Rahman Telecom",
        total_paid: 45000,
        invoice_count: 12,
        avg_payment_time: 3,
      },
      {
        customer_name: "City Internet Cafe",
        total_paid: 38000,
        invoice_count: 10,
        avg_payment_time: 5,
      },
      {
        customer_name: "Green Valley Resort",
        total_paid: 32000,
        invoice_count: 8,
        avg_payment_time: 2,
      },
      {
        customer_name: "Tech Solutions Ltd",
        total_paid: 28000,
        invoice_count: 7,
        avg_payment_time: 4,
      },
      {
        customer_name: "Metro Shopping Mall",
        total_paid: 25000,
        invoice_count: 6,
        avg_payment_time: 6,
      },
    ];
    return customers;
  };

  const prepareRevenueChartData = () => {
    if (!revenueData) return [];

    return [
      {
        label: "Revenue",
        data: revenueData.map((item: RevenueData) => ({
          label: item.month,
          value: item.revenue,
        })),
        color: "#3B82F6",
      },
    ];
  };

  const preparePaymentMethodChartData = () => {
    if (!paymentMethodData) return [];

    return paymentMethodData.map((item: PaymentMethodData) => ({
      label: item.method,
      value: item.percentage,
    }));
  };

  const calculateTotalRevenue = () => {
    if (!revenueData) return 0;
    return revenueData.reduce(
      (sum: number, item: RevenueData) => sum + item.revenue,
      0,
    );
  };

  const calculateGrowthRate = () => {
    if (!revenueData || revenueData.length < 2) return 0;
    const current = revenueData[revenueData.length - 1].revenue;
    const previous = revenueData[revenueData.length - 2].revenue;
    return ((current - previous) / previous) * 100;
  };

  const periodOptions = [
    { value: "3m", label: "Last 3 Months" },
    { value: "6m", label: "Last 6 Months" },
    { value: "12m", label: "Last 12 Months" },
    { value: "custom", label: "Custom Range" },
  ];

  const reportTypes = [
    { value: "revenue", label: "Revenue Analysis" },
    { value: "payment_methods", label: "Payment Methods" },
    { value: "customers", label: "Top Customers" },
    { value: "overdue", label: "Overdue Analysis" },
  ];

  if (revenueError) {
    return (
      <Card className={className}>
        <Callout variant="error">
          Failed to load billing reports. Please try again later.
        </Callout>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Report Controls */}
      <Card className="u-mb-6">
        <div className="u-flex u-justify-between u-items-center u-mb-4">
          <h3>Billing Reports & Analytics</h3>
          <div className="u-flex u-gap-2">
            <Button variant="outline" size="sm">
              <Icon name="Download" size={14} />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Icon name="Share" size={14} />
              Share
            </Button>
          </div>
        </div>

        <div className="u-flex u-gap-4 u-align-items-end u-flex-wrap">
          <div>
            <label className="u-fs-sm u-fw-medium u-mb-1 u-block">
              Report Type
            </label>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={reportTypes}
            />
          </div>
          <div>
            <label className="u-fs-sm u-fw-medium u-mb-1 u-block">Period</label>
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              options={periodOptions}
            />
          </div>
          {selectedPeriod === "custom" && (
            <>
              <div>
                <label className="u-fs-sm u-fw-medium u-mb-1 u-block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="u-fs-sm u-fw-medium u-mb-1 u-block">
                  End Date
                </label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Revenue Analysis */}
      {reportType === "revenue" && (
        <div>
          {/* Revenue Summary */}
          <Grid className="u-mb-6">
            <GridCol xs={12} md={4}>
              <Card className="u-text-center u-p-4">
                <Icon
                  name="TrendUp"
                  size={32}
                  className="u-text-success u-mb-2"
                />
                <h4 className="u-mb-1">Total Revenue</h4>
                <p className="u-fs-xl u-fw-bold u-text-primary">
                  {formatCurrency(calculateTotalRevenue())}
                </p>
                <div className="u-flex u-items-center u-justify-center u-gap-1 u-mt-2">
                  <Icon
                    name={calculateGrowthRate() >= 0 ? "ArrowUp" : "ArrowDown"}
                    size={14}
                    className={
                      calculateGrowthRate() >= 0
                        ? "u-text-success"
                        : "u-text-error"
                    }
                  />
                  <span
                    className={`u-fs-sm ${calculateGrowthRate() >= 0 ? "u-text-success" : "u-text-error"}`}
                  >
                    {Math.abs(calculateGrowthRate()).toFixed(1)}%
                  </span>
                  <span className="u-fs-sm u-text-secondary-emphasis">
                    vs last month
                  </span>
                </div>
              </Card>
            </GridCol>
            <GridCol xs={12} md={4}>
              <Card className="u-text-center u-p-4">
                <Icon
                  name="Receipt"
                  size={32}
                  className="u-text-primary u-mb-2"
                />
                <h4 className="u-mb-1">Avg Monthly Revenue</h4>
                <p className="u-fs-xl u-fw-bold u-text-primary">
                  {formatCurrency(
                    calculateTotalRevenue() / (revenueData?.length || 1),
                  )}
                </p>
                <p className="u-fs-sm u-text-secondary-emphasis u-mt-2">
                  Based on {revenueData?.length || 0} months
                </p>
              </Card>
            </GridCol>
            <GridCol xs={12} md={4}>
              <Card className="u-text-center u-p-4">
                <Icon
                  name="ChartBar"
                  size={32}
                  className="u-text-warning u-mb-2"
                />
                <h4 className="u-mb-1">Peak Month</h4>
                <p className="u-fs-xl u-fw-bold u-text-primary">
                  {revenueData
                    ? formatCurrency(
                        Math.max(
                          ...revenueData.map((r: RevenueData) => r.revenue),
                        ),
                      )
                    : formatCurrency(0)}
                </p>
                <p className="u-fs-sm u-text-secondary-emphasis u-mt-2">
                  Highest monthly revenue
                </p>
              </Card>
            </GridCol>
          </Grid>

          {/* Revenue Chart */}
          <Card className="u-mb-6">
            <h4 className="u-mb-4">Revenue Trends</h4>
            {revenueLoading ? (
              <div className="u-flex u-justify-center u-py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="u-h-100">
                <LineChart datasets={prepareRevenueChartData()} size="lg" />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Payment Methods Analysis */}
      {reportType === "payment_methods" && (
        <div>
          <Grid>
            <GridCol xs={12} md={6}>
              <Card>
                <h4 className="u-mb-4">Payment Method Distribution</h4>
                {paymentMethodLoading ? (
                  <div className="u-flex u-justify-center u-py-8">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <div className="u-h-75">
                    <DonutChart
                      data={preparePaymentMethodChartData()}
                      size="md"
                    />
                  </div>
                )}
              </Card>
            </GridCol>
            <GridCol xs={12} md={6}>
              <Card>
                <h4 className="u-mb-4">Payment Method Details</h4>
                {paymentMethodLoading ? (
                  <div className="u-flex u-justify-center u-py-8">
                    <Spinner />
                  </div>
                ) : (
                  <div className="u-space-y-3">
                    {paymentMethodData?.map(
                      (method: PaymentMethodData, index: number) => (
                        <div
                          key={index}
                          className="u-flex u-justify-between u-items-center u-p-3 u-border u-rounded"
                        >
                          <div>
                            <div className="u-fw-medium">{method.method}</div>
                            <div className="u-fs-sm u-text-secondary-emphasis">
                              {method.count} transactions
                            </div>
                          </div>
                          <div className="u-text-right">
                            <div className="u-fw-medium">
                              {formatCurrency(method.amount)}
                            </div>
                            <div className="u-fs-sm u-text-secondary-emphasis">
                              {method.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </Card>
            </GridCol>
          </Grid>
        </div>
      )}

      {/* Top Customers Analysis */}
      {reportType === "customers" && (
        <div>
          <Card>
            <h4 className="u-mb-4">Top Paying Customers</h4>
            {topCustomersLoading ? (
              <div className="u-flex u-justify-center u-py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="u-space-y-4">
                {topCustomersData?.map(
                  (customer: CustomerPaymentData, index: number) => (
                    <div
                      key={index}
                      className="u-flex u-items-center u-p-4 u-border u-rounded u-bg-subtle"
                    >
                      <div className="u-flex u-items-center u-justify-center u-bg-primary u-text-white u-rounded-circle u-me-3 u-w-10 u-h-10">
                        {index + 1}
                      </div>
                      <div className="u-flex-fill">
                        <div className="u-fw-medium u-mb-1">
                          {customer.customer_name}
                        </div>
                        <div className="u-fs-sm u-text-secondary-emphasis">
                          {customer.invoice_count} invoices • Avg payment time:{" "}
                          {customer.avg_payment_time} days
                        </div>
                      </div>
                      <div className="u-text-right">
                        <div className="u-fs-lg u-fw-bold u-text-success">
                          {formatCurrency(customer.total_paid)}
                        </div>
                        <Badge
                          variant={
                            customer.avg_payment_time <= 3
                              ? "success"
                              : customer.avg_payment_time <= 7
                                ? "warning"
                                : "error"
                          }
                          size="sm"
                          label={
                            customer.avg_payment_time <= 3
                              ? "Fast Payer"
                              : customer.avg_payment_time <= 7
                                ? "Regular"
                                : "Slow Payer"
                          }
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default BillingReports;
