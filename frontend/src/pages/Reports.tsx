import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "../services/apiService";
import {
  Card,
  Button,
  Icon,
  Callout,
  Select,
  Grid,
  GridCol,
} from "@shohojdhara/atomix";
import { UsageWidget, UsageChart, TopUsersWidget } from "../components/reports";

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState("usage");
  const [timeRange, setTimeRange] = useState("monthly");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Fetch usage reports
  const {
    data: usageData,
    isLoading: usageLoading,
    error: usageError,
  } = useQuery({
    queryKey: ["usage-reports", timeRange, dateRange],
    queryFn: () =>
      reportService.getUsageReports({
        time_range: timeRange,
        start_date: dateRange.start,
        end_date: dateRange.end,
      }),
    staleTime: 60000,
  });

  // Fetch top users
  const { data: topUsersData, isLoading: topUsersLoading } = useQuery({
    queryKey: ["top-users", timeRange, dateRange],
    queryFn: () =>
      reportService.getTopUsers({
        time_range: timeRange,
        start_date: dateRange.start,
        end_date: dateRange.end,
        limit: 10,
      }),
    staleTime: 60000,
  });

  // Fetch usage trends
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ["usage-trends", timeRange, dateRange],
    queryFn: () =>
      reportService.getUsageTrends({
        time_range: timeRange,
        start_date: dateRange.start,
        end_date: dateRange.end,
      }),
    staleTime: 60000,
  });

  // Fetch revenue reports
  const {
    data: revenueData,
    isLoading: revenueLoading,
    error: revenueError,
  } = useQuery({
    queryKey: ["revenue-reports", timeRange, dateRange],
    queryFn: () =>
      reportService.getRevenueReports({
        time_range: timeRange,
        start_date: dateRange.start,
        end_date: dateRange.end,
      }),
    staleTime: 60000,
  });

  // Fetch customer reports
  const {
    data: customerReportsData,
    isLoading: customerReportsLoading,
    error: customerReportsError,
  } = useQuery({
    queryKey: ["customer-reports", timeRange, dateRange],
    queryFn: () =>
      reportService.getCustomerReports({
        time_range: timeRange,
        start_date: dateRange.start,
        end_date: dateRange.end,
      }),
    staleTime: 60000,
    enabled: reportType === "customers",
  });

  // Fetch network reports
  const {
    data: networkReportsData,
    isLoading: networkReportsLoading,
    error: networkReportsError,
  } = useQuery({
    queryKey: ["network-reports", timeRange, dateRange],
    queryFn: () =>
      reportService.getNetworkReports({
        time_range: timeRange,
        start_date: dateRange.start,
        end_date: dateRange.end,
      }),
    staleTime: 60000,
    enabled: reportType === "network",
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const hasError =
    usageError || revenueError || customerReportsError || networkReportsError;
  const error =
    usageError || revenueError || customerReportsError || networkReportsError;

  if (hasError) {
    return (
      <div className="u-p-6">
        <Callout variant="error" className="u-mb-4">
          <div className="u-flex u-items-center u-gap-2">
            <Icon name="Warning" size={20} />
            <div>
              <strong>Error loading reports</strong>
              <p className="u-mb-0 u-mt-1">
                {(error as any)?.message ||
                  "Please try refreshing the page or contact support."}
              </p>
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
          <div className="u-flex u-gap-4 u-align-items-end u-flex-wrap">
            <div>
              <label className="u-fs-sm u-fw-medium u-text-secondary-emphasis-emphasis u-mb-2 u-block">
                Report Type
              </label>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="u-min-w-40"
                options={[
                  { value: "usage", label: "Usage Reports" },
                  { value: "revenue", label: "Revenue Reports" },
                  { value: "customers", label: "Customer Reports" },
                  { value: "network", label: "Network Reports" },
                ]}
              />
            </div>

            <div>
              <label className="u-fs-sm u-fw-medium u-text-secondary-emphasis-emphasis u-mb-2 u-block">
                Time Range
              </label>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="u-min-w-36"
                options={[
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                  { value: "quarterly", label: "Quarterly" },
                  { value: "yearly", label: "Yearly" },
                ]}
              />
            </div>

            <div>
              <label className="u-fs-sm u-fw-medium u-text-secondary-emphasis-emphasis u-mb-2 u-block">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="u-w-100 u-py-2 u-px-3 u-border u-rounded u-bg-surface u-text-foreground"
              />
            </div>

            <div>
              <label className="u-fs-sm u-fw-medium u-text-secondary-emphasis-emphasis u-mb-2 u-block">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="u-w-100 u-py-2 u-px-3 u-border u-rounded u-bg-surface u-text-foreground"
              />
            </div>

            <div className="u-flex u-gap-2">
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
        <div className="u-flex u-gap-1 u-border-b u-border-secondary-subtle">
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
            <div
              className="u-grid u-gap-4 u-mb-6"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              }}
            >
              <UsageWidget
                title="Total Data Usage"
                icon="Database"
                value={`${usageData?.total_usage?.toFixed(1) || "0"} GB`}
                subtitle="Current period"
                trend={
                  usageData?.usage_trend
                    ? {
                        value: usageData.usage_trend,
                        isPositive: usageData.usage_trend > 0,
                      }
                    : undefined
                }
                color="primary"
                isLoading={usageLoading}
              />
              <UsageWidget
                title="Average Usage"
                icon="ChartLine"
                value={`${usageData?.average_usage?.toFixed(1) || "0"} GB`}
                subtitle="Per customer"
                color="info"
                isLoading={usageLoading}
              />
              <UsageWidget
                title="Peak Usage"
                icon="TrendUp"
                value={`${usageData?.peak_usage?.toFixed(1) || "0"} GB`}
                subtitle="Highest recorded"
                color="warning"
                isLoading={usageLoading}
              />
              <UsageWidget
                title="Bandwidth Utilization"
                icon="Gauge"
                value={`${usageData?.bandwidth_utilization?.toFixed(1) || "0"}%`}
                subtitle="Network capacity"
                color={
                  usageData?.bandwidth_utilization > 80 ? "error" : "success"
                }
                isLoading={usageLoading}
              />
            </div>

            {/* Charts and Top Users */}
            <div
              className="u-grid u-gap-6"
              style={{ gridTemplateColumns: "2fr 1fr" }}
            >
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
            <div
              className="u-grid u-gap-4 u-mb-6"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              }}
            >
              <UsageWidget
                title="Total Revenue"
                icon="CurrencyDollar"
                value={formatCurrency(revenueData?.total_revenue || 0)}
                subtitle="Current period"
                trend={
                  revenueData?.revenue_trend
                    ? {
                        value: revenueData.revenue_trend,
                        isPositive: revenueData.revenue_trend > 0,
                      }
                    : undefined
                }
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
                value={`${revenueData?.mrr_growth?.toFixed(1) || "0"}%`}
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
          <div>
            <div
              className="u-grid u-gap-4 u-mb-6"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              }}
            >
              <UsageWidget
                title="Total Customers"
                icon="Users"
                value={customerReportsData?.total_customers || 0}
                subtitle="Total registered"
                color="primary"
                isLoading={customerReportsLoading}
              />
              <UsageWidget
                title="Active Now"
                icon="UserCheck"
                value={customerReportsData?.active_customers || 0}
                subtitle="Active status"
                color="success"
                isLoading={customerReportsLoading}
              />
              <UsageWidget
                title="Churn Rate"
                icon="UserMinus"
                value={`${customerReportsData?.churn_rate || 0}%`}
                subtitle="This period"
                color="error"
                isLoading={customerReportsLoading}
              />
              <UsageWidget
                title="Growth Rate"
                icon="TrendUp"
                value={`${customerReportsData?.growth_rate || 0}%`}
                subtitle="New vs Total"
                color="info"
                isLoading={customerReportsLoading}
              />
            </div>

            <Grid>
              <GridCol sm={8}>
                <UsageChart
                  title="Customer Signup Trends"
                  data={customerReportsData?.trends || []}
                  isLoading={customerReportsLoading}
                />
              </GridCol>
              <GridCol sm={4}>
                <Card className="u-h-100 u-border-0 u-shadow-sm">
                  <div className="u-p-4">
                    <h3 className="u-fs-5 u-fw-semibold u-mb-3">Top Cities</h3>
                    <div className="u-flex u-flex-column u-gap-2">
                      {customerReportsData?.top_cities?.map(
                        (city: any, idx: number) => (
                          <div
                            key={idx}
                            className="u-flex u-justify-between u-items-center u-p-2 u-bg-surface-subtle u-rounded"
                          >
                            <span className="u-fs-sm">
                              {city.city || "Unknown"}
                            </span>
                            <span className="u-fs-sm u-fw-bold">
                              {city.count}
                            </span>
                          </div>
                        ),
                      )}
                      {customerReportsLoading && (
                        <p className="u-text-center u-py-4">Loading...</p>
                      )}
                    </div>
                  </div>
                </Card>
              </GridCol>
            </Grid>
          </div>
        )}

        {/* Network Reports */}
        {reportType === "network" && (
          <div>
            <div
              className="u-grid u-gap-4 u-mb-6"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              }}
            >
              <UsageWidget
                title="Total Routers"
                icon="Globe"
                value={networkReportsData?.total_routers || 0}
                subtitle="Infrastructure"
                color="primary"
                isLoading={networkReportsLoading}
              />
              <UsageWidget
                title="Online"
                icon="CheckCircle"
                value={networkReportsData?.online_routers || 0}
                subtitle="Healthy nodes"
                color="success"
                isLoading={networkReportsLoading}
              />
              <UsageWidget
                title="Bandwidth Util"
                icon="Gauge"
                value={`${networkReportsData?.bandwidth_utilization || 0}%`}
                subtitle="Total capacity"
                color={
                  networkReportsData?.bandwidth_utilization > 80
                    ? "error"
                    : "info"
                }
                isLoading={networkReportsLoading}
              />
              <UsageWidget
                title="Data Transferred"
                icon="ArrowsLeftRight"
                value={`${networkReportsData?.total_data_transferred_gb || 0} GB`}
                subtitle="In + Out"
                color="warning"
                isLoading={networkReportsLoading}
              />
            </div>

            <div
              className="u-grid u-gap-6"
              style={{ gridTemplateColumns: "2fr 1fr" }}
            >
              <UsageChart
                title="Bandwidth Trends (Mbps)"
                data={
                  networkReportsData?.trends?.map((t: any) => ({
                    date: t.date,
                    usage: t.avg_download_mbps, // Using download as primary usage metric
                  })) || []
                }
                isLoading={networkReportsLoading}
              />
              <Card className="u-h-100 u-border-0 u-shadow-sm">
                <div className="u-p-4">
                  <h3 className="u-fs-5 u-fw-semibold u-mb-3">
                    Resource Usage
                  </h3>
                  <div className="u-flex u-flex-column u-gap-4">
                    <div>
                      <div className="u-flex u-justify-between u-mb-1">
                        <span className="u-fs-xs u-fw-medium">CPU Usage</span>
                        <span className="u-fs-xs">
                          {networkReportsData?.resource_usage
                            ?.avg_cpu_percent || 0}
                          %
                        </span>
                      </div>
                      <div className="u-w-100 u-h-2 u-bg-gray-200 u-rounded-full overflow-hidden">
                        <div
                          className="u-h-100 u-bg-primary"
                          style={{
                            width: `${networkReportsData?.resource_usage?.avg_cpu_percent || 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="u-flex u-justify-between u-mb-1">
                        <span className="u-fs-xs u-fw-medium">
                          Memory Usage
                        </span>
                        <span className="u-fs-xs">
                          {networkReportsData?.resource_usage
                            ?.avg_memory_percent || 0}
                          %
                        </span>
                      </div>
                      <div className="u-w-100 u-h-2 u-bg-gray-200 u-rounded-full overflow-hidden">
                        <div
                          className="u-h-100 u-bg-success"
                          style={{
                            width: `${networkReportsData?.resource_usage?.avg_memory_percent || 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
