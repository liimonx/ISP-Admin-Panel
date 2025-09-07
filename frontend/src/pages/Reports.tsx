import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Button, Icon, Callout } from "@shohojdhara/atomix";
import { apiService } from "../services/apiService";
import { UsageWidget, UsageChart, TopUsersWidget } from "../components/reports";

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState("usage");
  const [timeRange, setTimeRange] = useState("monthly");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // Fetch usage reports
  const { data: usageData, isLoading: usageLoading, error: usageError } = useQuery({
    queryKey: ["usage-reports", timeRange, dateRange],
    queryFn: () => apiService.getUsageReports({ 
      time_range: timeRange,
      start_date: dateRange.start,
      end_date: dateRange.end 
    }),
    staleTime: 60000,
  });

  // Fetch top users
  const { data: topUsersData, isLoading: topUsersLoading } = useQuery({
    queryKey: ["top-users", timeRange, dateRange],
    queryFn: () => apiService.getTopUsers({ 
      time_range: timeRange,
      start_date: dateRange.start,
      end_date: dateRange.end,
      limit: 10
    }),
    staleTime: 60000,
  });

  // Fetch usage trends
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ["usage-trends", timeRange, dateRange],
    queryFn: () => apiService.getUsageTrends({ 
      time_range: timeRange,
      start_date: dateRange.start,
      end_date: dateRange.end 
    }),
    staleTime: 60000,
  });

  // Fetch revenue reports
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["revenue-reports", timeRange, dateRange],
    queryFn: () => apiService.getRevenueReports({ 
      time_range: timeRange,
      start_date: dateRange.start,
      end_date: dateRange.end 
    }),
    staleTime: 60000,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (usageError) {
    return (
      <div className="u-p-6">
        <Callout variant="error" className="u-mb-4">
          <div className="u-d-flex u-align-items-center u-gap-2">
            <Icon name="Warning" size={20} />
            <div>
              <strong>Error loading reports</strong>
              <p className="u-mb-0 u-mt-1">Please try refreshing the page or contact support.</p>
            </div>
          </div>
        </Callout>
      </div>
    );
  }

  return (
    <div className="u-p-6">
      <div className="u-mb-6">
        <h1 className="u-fs-1 u-fw-bold u-text-primary-emphasis u-mb-2">
          <Icon name="ChartBar" size={32} className="u-me-3" />
          Reports & Analytics
        </h1>
        <p className="u-text-secondary-emphasis-emphasis u-fs-5">
          View detailed reports and analytics for your ISP operations.
        </p>
      </div>

      {/* Report Controls */}
      <Card className="u-mb-6 u-border-0 u-shadow-sm">
        <div className="u-p-4">
          <div className="u-d-flex u-gap-4 u-align-items-end u-flex-wrap">
            <div>
              <label className="u-fs-sm u-fw-medium u-text-secondary-emphasis-emphasis u-mb-2 u-d-block">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="form-select"
                style={{ minWidth: "160px" }}
              >
                <option value="usage">Usage Reports</option>
                <option value="revenue">Revenue Reports</option>
                <option value="customers">Customer Reports</option>
                <option value="network">Network Reports</option>
              </select>
            </div>

            <div>
              <label className="u-fs-sm u-fw-medium u-text-secondary-emphasis-emphasis u-mb-2 u-d-block">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="form-select"
                style={{ minWidth: "140px" }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="u-fs-sm u-fw-medium u-text-secondary-emphasis-emphasis u-mb-2 u-d-block">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="u-fs-sm u-fw-medium u-text-secondary-emphasis-emphasis u-mb-2 u-d-block">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="u-d-flex u-gap-2">
              <Button variant="outline" size="md">
                <Icon name="Download" size={16} />
                Export
              </Button>
              <Button variant="primary" size="md">
                <Icon name="ArrowClockwise" size={16} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div className="u-mb-6">
        <div className="u-d-flex u-gap-1 u-border-b u-border-secondary-subtle">
          {[
            { id: "usage", label: "Usage Reports" },
            { id: "revenue", label: "Revenue Reports" },
            { id: "customers", label: "Customer Reports" },
            { id: "network", label: "Network Reports" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={reportType === tab.id ? "primary" : "outline"}
              size="sm"
              onClick={() => setReportType(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Report Content */}
      <div>
        {/* Usage Reports */}
        {reportType === "usage" && (
          <div>
            {/* Usage Overview Widgets */}
            <div className="u-d-grid u-gap-4 u-mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
              <UsageWidget
                title="Total Data Usage"
                icon="Database"
                value={`${usageData?.total_usage?.toFixed(1) || '0'} GB`}
                subtitle="Current period"
                trend={usageData?.usage_trend ? {
                  value: usageData.usage_trend,
                  isPositive: usageData.usage_trend > 0
                } : undefined}
                color="primary"
                isLoading={usageLoading}
              />
              <UsageWidget
                title="Average Usage"
                icon="ChartLine"
                value={`${usageData?.average_usage?.toFixed(1) || '0'} GB`}
                subtitle="Per customer"
                color="info"
                isLoading={usageLoading}
              />
              <UsageWidget
                title="Peak Usage"
                icon="TrendUp"
                value={`${usageData?.peak_usage?.toFixed(1) || '0'} GB`}
                subtitle="Highest recorded"
                color="warning"
                isLoading={usageLoading}
              />
              <UsageWidget
                title="Bandwidth Utilization"
                icon="Gauge"
                value={`${usageData?.bandwidth_utilization?.toFixed(1) || '0'}%`}
                subtitle="Network capacity"
                color={usageData?.bandwidth_utilization > 80 ? "error" : "success"}
                isLoading={usageLoading}
              />
            </div>

            {/* Charts and Top Users */}
            <div className="u-d-grid u-gap-6" style={{ gridTemplateColumns: "2fr 1fr" }}>
              <UsageChart
                title="Usage Trends"
                data={trendsData?.trends || []}
                isLoading={trendsLoading}
              />
              <TopUsersWidget
                users={topUsersData?.users || []}
                isLoading={topUsersLoading}
              />
            </div>
          </div>
        )}

        {/* Revenue Reports */}
        {reportType === "revenue" && (
          <div>
            <div className="u-d-grid u-gap-4 u-mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
              <UsageWidget
                title="Total Revenue"
                icon="CurrencyDollar"
                value={formatCurrency(revenueData?.total_revenue || 0)}
                subtitle="Current period"
                trend={revenueData?.revenue_trend ? {
                  value: revenueData.revenue_trend,
                  isPositive: revenueData.revenue_trend > 0
                } : undefined}
                color="success"
                isLoading={revenueLoading}
              />
              <UsageWidget
                title="Active Customers"
                icon="Users"
                value={revenueData?.active_customers || 0}
                subtitle="Paying customers"
                color="primary"
                isLoading={revenueLoading}
              />
              <UsageWidget
                title="ARPU"
                icon="Calculator"
                value={formatCurrency(revenueData?.arpu || 0)}
                subtitle="Average revenue per user"
                color="info"
                isLoading={revenueLoading}
              />
              <UsageWidget
                title="MRR Growth"
                icon="TrendUp"
                value={`${revenueData?.mrr_growth?.toFixed(1) || '0'}%`}
                subtitle="Monthly recurring revenue"
                color={revenueData?.mrr_growth > 0 ? "success" : "error"}
                isLoading={revenueLoading}
              />
            </div>
            <UsageChart
              title="Revenue Trends"
              data={revenueData?.trends || []}
              isLoading={revenueLoading}
            />
          </div>
        )}

        {/* Customer Reports */}
        {reportType === "customers" && (
          <Card className="u-border-0 u-shadow-sm">
            <div className="u-p-6">
              <div className="u-text-center u-py-8">
                <Icon name="Users" size={48} className="u-text-secondary-emphasis u-mb-4" />
                <h3 className="u-fs-3 u-fw-semibold u-mb-2 u-text-primary-emphasis">Customer Reports</h3>
                <p className="u-text-secondary-emphasis-emphasis">Detailed customer analytics and reports will be available soon</p>
              </div>
            </div>
          </Card>
        )}

        {/* Network Reports */}
        {reportType === "network" && (
          <Card className="u-border-0 u-shadow-sm">
            <div className="u-p-6">
              <div className="u-text-center u-py-8">
                <Icon name="Globe" size={48} className="u-text-secondary-emphasis u-mb-4" />
                <h3 className="u-fs-3 u-fw-semibold u-mb-2 u-text-primary-emphasis">Network Reports</h3>
                <p className="u-text-secondary-emphasis-emphasis">Network performance and infrastructure reports will be available soon</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Reports;