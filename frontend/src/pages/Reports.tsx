import React, { useState } from "react";
import {
  Card,
  Button,
  Badge,
  Icon,
} from "@shohojdhara/atomix";

interface ReportData {
  period: string;
  totalRevenue: number;
  totalCustomers: number;
  newSubscriptions: number;
  churnedSubscriptions: number;
  averageUsage: number;
  peakUsage: number;
  bandwidthUtilization: number;
}

const mockUsageData: ReportData[] = [
  {
    period: "2024-01",
    totalRevenue: 125000,
    totalCustomers: 245,
    newSubscriptions: 12,
    churnedSubscriptions: 3,
    averageUsage: 45.2,
    peakUsage: 78.5,
    bandwidthUtilization: 65,
  },
  {
    period: "2024-02",
    totalRevenue: 132000,
    totalCustomers: 251,
    newSubscriptions: 15,
    churnedSubscriptions: 2,
    averageUsage: 48.7,
    peakUsage: 82.1,
    bandwidthUtilization: 68,
  },
  {
    period: "2024-03",
    totalRevenue: 128500,
    totalCustomers: 248,
    newSubscriptions: 8,
    churnedSubscriptions: 5,
    averageUsage: 43.9,
    peakUsage: 75.3,
    bandwidthUtilization: 62,
  },
];

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState("usage");
  const [timeRange, setTimeRange] = useState("monthly");
  const [selectedPeriod, setSelectedPeriod] = useState("2024-03");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getCurrentData = () => {
    return mockUsageData.find((data) => data.period === selectedPeriod) || mockUsageData[2];
  };

  const currentData = getCurrentData();

  const tabs = [
    { id: "usage", label: "Usage Reports" },
    { id: "revenue", label: "Revenue Reports" },
    { id: "customers", label: "Customer Reports" },
    { id: "network", label: "Network Reports" },
  ];

  return (
    <div className="u-p-6 u-max-width-7xl u-mx-auto">
      <div className="u-mb-6">
        <h1 className="u-text-2xl u-font-bold u-mb-2">Reports & Analytics</h1>
        <p className="u-text-muted">
          View detailed reports and analytics for your ISP operations.
        </p>
      </div>

      {/* Report Controls */}
      <Card className="u-mb-6">
        <div className="u-p-4">
          <div className="u-d-flex u-gap-4 u-align-items-center u-flex-wrap">
            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="u-width-40 u-p-2 u-border u-rounded u-bg-white"
              >
                <option value="usage">Usage Reports</option>
                <option value="revenue">Revenue Reports</option>
                <option value="customers">Customer Reports</option>
                <option value="network">Network Reports</option>
              </select>
            </div>

            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="u-width-40 u-p-2 u-border u-rounded u-bg-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="u-block u-text-sm u-font-medium u-mb-1">
                Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="u-width-40 u-p-2 u-border u-rounded u-bg-white"
              >
                {mockUsageData.map((data) => (
                  <option key={data.period} value={data.period}>
                    {data.period}
                  </option>
                ))}
              </select>
            </div>

            <Button variant="primary" className="u-mt-6">
              <Icon name="Download" size={16} className="u-mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div className="u-mb-6">
        <div className="u-d-flex u-gap-1 u-border-bottom">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={reportType === tab.id ? "primary" : "outline"}
              size="sm"
              onClick={() => setReportType(tab.id)}
              className="u-border-radius-0 u-border-bottom-0"
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
          <div className="u-grid u-grid-cols-1 u-gap-6 lg:u-grid-cols-3">
            {/* Usage Overview */}
            <Card>
              <div className="u-p-4 u-border-bottom">
                <div className="u-d-flex u-align-items-center u-gap-2">
                  <Icon name="ChartLine" size={20} />
                  <h2 className="u-text-lg u-font-semibold">Usage Overview</h2>
                </div>
              </div>
              <div className="u-p-4 u-space-y-4">
                <div className="u-d-flex u-justify-content-between u-align-items-center">
                  <span className="u-text-sm u-text-muted">Average Usage</span>
                  <span className="u-font-semibold">
                    {currentData.averageUsage} GB
                  </span>
                </div>
                <div className="u-d-flex u-justify-content-between u-align-items-center">
                  <span className="u-text-sm u-text-muted">Peak Usage</span>
                  <span className="u-font-semibold">
                    {currentData.peakUsage} GB
                  </span>
                </div>
                <div className="u-d-flex u-justify-content-between u-align-items-center">
                  <span className="u-text-sm u-text-muted">Bandwidth Utilization</span>
                  <Badge
                    variant={currentData.bandwidthUtilization > 80 ? "warning" : "success"}
                    label={formatPercentage(currentData.bandwidthUtilization)}
                  />
                </div>
              </div>
            </Card>

            {/* Usage Trends */}
            <Card>
              <div className="u-p-4 u-border-bottom">
                <div className="u-d-flex u-align-items-center u-gap-2">
                  <Icon name="TrendUp" size={20} />
                  <h2 className="u-text-lg u-font-semibold">Usage Trends</h2>
                </div>
              </div>
              <div className="u-p-4">
                <div className="u-text-center u-py-8">
                  <Icon name="ChartBar" size={48} className="u-text-muted u-mb-4" />
                  <p className="u-text-muted">Usage trend chart will be displayed here</p>
                </div>
              </div>
            </Card>

            {/* Top Users */}
            <Card>
              <div className="u-p-4 u-border-bottom">
                <div className="u-d-flex u-align-items-center u-gap-2">
                  <Icon name="Users" size={20} />
                  <h2 className="u-text-lg u-font-semibold">Top Users</h2>
                </div>
              </div>
              <div className="u-p-4">
                <div className="u-space-y-3">
                  <div className="u-d-flex u-justify-content-between u-align-items-center">
                    <span className="u-text-sm">John Doe</span>
                    <span className="u-text-sm u-font-medium">125 GB</span>
                  </div>
                  <div className="u-d-flex u-justify-content-between u-align-items-center">
                    <span className="u-text-sm">Jane Smith</span>
                    <span className="u-text-sm u-font-medium">98 GB</span>
                  </div>
                  <div className="u-d-flex u-justify-content-between u-align-items-center">
                    <span className="u-text-sm">Bob Johnson</span>
                    <span className="u-text-sm u-font-medium">87 GB</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Revenue Reports */}
        {reportType === "revenue" && (
          <div className="u-grid u-grid-cols-1 u-gap-6 lg:u-grid-cols-3">
            {/* Revenue Overview */}
            <Card>
              <div className="u-p-4 u-border-bottom">
                <div className="u-d-flex u-align-items-center u-gap-2">
                  <Icon name="CurrencyDollar" size={20} />
                  <h2 className="u-text-lg u-font-semibold">Revenue Overview</h2>
                </div>
              </div>
              <div className="u-p-4 u-space-y-4">
                <div className="u-d-flex u-justify-content-between u-align-items-center">
                  <span className="u-text-sm u-text-muted">Total Revenue</span>
                  <span className="u-font-semibold u-text-lg">
                    {formatCurrency(currentData.totalRevenue)}
                  </span>
                </div>
                <div className="u-d-flex u-justify-content-between u-align-items-center">
                  <span className="u-text-sm u-text-muted">Active Customers</span>
                  <span className="u-font-semibold">{currentData.totalCustomers}</span>
                </div>
                <div className="u-d-flex u-justify-content-between u-align-items-center">
                  <span className="u-text-sm u-text-muted">Average Revenue per Customer</span>
                  <span className="u-font-semibold">
                    {formatCurrency(currentData.totalRevenue / currentData.totalCustomers)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Revenue Chart */}
            <Card>
              <div className="u-p-4 u-border-bottom">
                <div className="u-d-flex u-align-items-center u-gap-2">
                  <Icon name="ChartPie" size={20} />
                  <h2 className="u-text-lg u-font-semibold">Revenue Trends</h2>
                </div>
              </div>
              <div className="u-p-4">
                <div className="u-text-center u-py-8">
                  <Icon name="ChartPie" size={48} className="u-text-muted u-mb-4" />
                  <p className="u-text-muted">Revenue trend chart will be displayed here</p>
                </div>
              </div>
            </Card>

            {/* Subscription Changes */}
            <Card>
              <div className="u-p-4 u-border-bottom">
                <div className="u-d-flex u-align-items-center u-gap-2">
                  <Icon name="UserPlus" size={20} />
                  <h2 className="u-text-lg u-font-semibold">Subscription Changes</h2>
                </div>
              </div>
              <div className="u-p-4 u-space-y-4">
                <div className="u-d-flex u-justify-content-between u-align-items-center">
                  <span className="u-text-sm u-text-muted">New Subscriptions</span>
                  <Badge variant="success" label={`+${currentData.newSubscriptions}`} />
                </div>
                <div className="u-d-flex u-justify-content-between u-align-items-center">
                  <span className="u-text-sm u-text-muted">Churned Subscriptions</span>
                  <Badge variant="error" label={`-${currentData.churnedSubscriptions}`} />
                </div>
                <div className="u-d-flex u-justify-content-between u-align-items-center">
                  <span className="u-text-sm u-text-muted">Net Growth</span>
                  <Badge
                    variant={currentData.newSubscriptions > currentData.churnedSubscriptions ? "success" : "error"}
                    label={`+${currentData.newSubscriptions - currentData.churnedSubscriptions}`}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Customer Reports */}
        {reportType === "customers" && (
          <Card>
            <div className="u-p-6">
              <div className="u-text-center u-py-8">
                <Icon name="Users" size={48} className="u-text-muted u-mb-4" />
                <h3 className="u-text-lg u-font-semibold u-mb-2">Customer Reports</h3>
                <p className="u-text-muted">Detailed customer analytics and reports will be displayed here</p>
              </div>
            </div>
          </Card>
        )}

        {/* Network Reports */}
        {reportType === "network" && (
          <Card>
            <div className="u-p-6">
              <div className="u-text-center u-py-8">
                <Icon name="Share" size={48} className="u-text-muted u-mb-4" />
                <h3 className="u-text-lg u-font-semibold u-mb-2">Network Reports</h3>
                <p className="u-text-muted">Network performance and infrastructure reports will be displayed here</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Reports;
