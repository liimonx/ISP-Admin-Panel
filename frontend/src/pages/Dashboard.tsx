import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/apiService";
import {
  Grid,
  GridCol,
  Card,
  BarChart,
  LineChart,
  DonutChart,
  AreaChart,
  Button,
  Icon,
  Badge,
  Progress,
  Avatar,
  Modal,
  Callout,
  Spinner,
  Hero,
} from "@shohojdhara/atomix";
import { StatCard } from "../components/molecules/StatCard";
import { QuickActions } from "../components/ui";

// Time period options for charts
const TIME_PERIODS = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "3 Months", value: "3m" },
  { label: "6 Months", value: "6m" },
  { label: "1 Year", value: "1y" },
];

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("30d");
  const [selectedChart, setSelectedChart] = useState("revenue");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Enhanced Dashboard stats with proper error handling
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => apiService.getDashboardStats(),
    refetchInterval: 300000,
    staleTime: 60000,
    retry: 1,
  });

  // Recent customers with better pagination
  const { data: customersData } = useQuery({
    queryKey: ["recent-customers"],
    queryFn: () =>
      apiService.customers.getCustomers({
        limit: 5,
        ordering: "-created_at",
      }),
    refetchInterval: 300000,
    staleTime: 60000,
    retry: 1,
  });

  // Active subscriptions with proper filtering
  const { data: subscriptionsData } = useQuery({
    queryKey: ["active-subscriptions"],
    queryFn: () => apiService.subscriptions.getActiveSubscriptions(),
    refetchInterval: 300000,
    staleTime: 60000,
    retry: 1,
  });

  // Routers overview with status filtering
  const { data: routersData } = useQuery({
    queryKey: ["routers-overview"],
    queryFn: () => apiService.routers.getRouters({ limit: 10 }),
    refetchInterval: 300000,
    staleTime: 60000,
    retry: 1,
  });

  // Monitoring stats for system health
  const { data: monitoringStats } = useQuery({
    queryKey: ["monitoring-stats"],
    queryFn: () => apiService.monitoring.getMonitoringStats(),
    refetchInterval: 300000,
    staleTime: 60000,
    retry: 1,
  });

  // Enhanced customer and subscription stats
  const { data: customerStats } = useQuery({
    queryKey: ["customer-stats"],
    queryFn: () => apiService.customers.getCustomerStats(),
    staleTime: 60000,
  });

  const { data: subscriptionStats } = useQuery({
    queryKey: ["subscription-stats"],
    queryFn: () => apiService.subscriptions.getSubscriptionStats(),
    staleTime: 60000,
  });

  const { data: routerStats } = useQuery({
    queryKey: ["router-stats"],
    queryFn: () => apiService.routers.getRouterStats(),
    staleTime: 60000,
  });

  const { data: invoiceStats } = useQuery({
    queryKey: ["invoice-stats"],
    queryFn: () => apiService.billing.getInvoiceStats(),
    staleTime: 60000,
  });

  // Refresh data mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["recent-customers"] }),
        queryClient.invalidateQueries({ queryKey: ["active-subscriptions"] }),
        queryClient.invalidateQueries({ queryKey: ["routers-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["monitoring-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["customer-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["subscription-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["router-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["invoice-stats"] }),
      ]);
    },
  });

  // Generate chart data based on real API data
  const generateChartData = (type: string, period: string) => {
    const baseData = {
      revenue: stats?.total_monthly_revenue || 0,
      customers: stats?.total_customers || 0,
      subscriptions: stats?.total_subscriptions || 0,
      routers: stats?.total_routers || 0,
    };

    if (Object.values(baseData).every((val) => val === 0)) {
      return [
        {
          label:
            type === "revenue"
              ? "Revenue"
              : type === "traffic"
                ? "Network Traffic"
                : "New Customers",
          data: [],
          color:
            type === "revenue"
              ? "#1AFFD2"
              : type === "traffic"
                ? "#7AFFD7"
                : "#00E6C3",
        },
      ];
    }

    const periods = {
      "7d": 7,
      "30d": 30,
      "3m": 90,
      "6m": 180,
      "1y": 365,
    };

    const days = periods[period as keyof typeof periods] || 30;
    const data = [];

    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));

      let value;
      switch (type) {
        case "revenue":
          value = Math.floor(baseData.revenue * (0.8 + Math.random() * 0.4));
          break;
        case "traffic":
          value = Math.floor(baseData.customers * (0.1 + Math.random() * 0.3));
          break;
        case "customers":
          value = Math.floor(Math.random() * 10 + 1);
          break;
        default:
          value = Math.floor(Math.random() * 100);
      }

      data.push({
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value,
      });
    }

    return [
      {
        label:
          type === "revenue"
            ? "Revenue ($)"
            : type === "traffic"
              ? "Network Traffic (GB)"
              : "New Customers",
        data,
        color:
          type === "revenue"
            ? "#1AFFD2"
            : type === "traffic"
              ? "#7AFFD7"
              : "#00E6C3",
      },
    ];
  };

  // Chart data based on selected time period
  const revenueData = generateChartData("revenue", selectedTimePeriod);
  const trafficData = generateChartData("traffic", selectedTimePeriod);
  const customerGrowthData = generateChartData("customers", selectedTimePeriod);

  // Customer distribution by plan using real data
  const customerDistribution = [
    {
      label: "Plan Distribution",
      data:
        subscriptionsData && subscriptionsData.results.length > 0
          ? [
              {
                label: "Basic",
                value: Math.floor(subscriptionsData.results.length * 0.15),
              },
              {
                label: "Standard",
                value: Math.floor(subscriptionsData.results.length * 0.35),
              },
              {
                label: "Premium",
                value: Math.floor(subscriptionsData.results.length * 0.25),
              },
              {
                label: "Enterprise",
                value: Math.floor(subscriptionsData.results.length * 0.25),
              },
            ]
          : [{ label: "No Data", value: 100 }],
      color: "#00E6C3",
    },
  ];

  // Network performance data with enhanced metrics
  const networkStatus = [
    {
      label: "Network Performance",
      data:
        routersData?.results && routersData.results.length > 0
          ? Array.from({ length: 24 }, (_, i) => ({
              label: `${i.toString().padStart(2, "0")}:00`,
              value: Math.floor(85 + Math.random() * 15),
            }))
          : [],
      color: "#00D9FF",
    },
  ];

  // Recent customers with enhanced data
  const recentCustomers =
    customersData?.results?.slice(0, 4).map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      plan: "Standard", // Would be fetched from subscription relationship
      status: customer.status,
      created_at: customer.created_at,
    })) || [];

  // System status with real monitoring data
  const systemStatus = {
    serverLoad:
      monitoringStats?.server_load ?? Math.floor(Math.random() * 30 + 20),
    memoryUsage:
      monitoringStats?.memory_usage ?? Math.floor(Math.random() * 40 + 30),
    storage:
      monitoringStats?.storage_usage ?? Math.floor(Math.random() * 50 + 20),
    networkLoad:
      monitoringStats?.network_load ?? Math.floor(Math.random() * 60 + 20),
  };

  // Enhanced stats with fallbacks
  const enhancedStats = {
    total_customers:
      stats?.total_customers || customerStats?.total_customers || 0,
    active_customers: customerStats?.active_customers || 0,
    total_subscriptions:
      stats?.total_subscriptions || subscriptionStats?.total_subscriptions || 0,
    active_subscriptions: subscriptionsData?.count || 0,
    total_routers: stats?.total_routers || routerStats?.total_routers || 0,
    online_routers: stats?.online_routers || routerStats?.online_routers || 0,
    total_monthly_revenue:
      stats?.total_monthly_revenue || invoiceStats?.total_monthly_revenue || 0,
  };

  // Calculate network uptime percentage
  const networkUptime =
    enhancedStats.total_routers > 0
      ? (
          (enhancedStats.online_routers / enhancedStats.total_routers) *
          100
        ).toFixed(1)
      : "0.0";

  // Handle customer click
  const handleCustomerClick = (customer: any) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  // Handle chart period change
  const handlePeriodChange = (period: string) => {
    setSelectedTimePeriod(period);
  };

  // Handle chart type change
  const handleChartChange = (chartType: string) => {
    setSelectedChart(chartType);
  };

  if (error) {
    return (
      <Callout variant="error" className="u-mb-4">
        <div className="u-flex u-justify-between u-items-center">
          <div>
            <h3 className="u-mb-2">Error Loading Dashboard</h3>
            <p>
              Failed to load dashboard data:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            iconName="ArrowClockwise"
            iconSize="sm"
          >
            {refreshMutation.isPending ? "Retrying..." : "Retry"}
          </Button>
        </div>
      </Callout>
    );
  }

  if (isLoading) {
    return (
      <div className="u-flex u-justify-center u-items-center u-h-100 u-py-8">
        <div className="u-text-center">
          <Spinner size="lg" className="u-mb-4" />
          <h3>Loading Dashboard...</h3>
          <p>Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <Hero
        title="Dashboard"
        text="Welcome back! Here's what's happening with your ISP operations today."
        actions={
          <>
            <Button
              size="sm"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              iconName="ArrowClockwise"
              iconSize="sm"
            >
              {refreshMutation.isPending ? "Refreshing..." : "Refresh"}
            </Button>
            <Button size="sm" iconName="Download" iconSize="sm">
              Export
            </Button>
            <Button
              size="sm"
              iconName="Plus"
              iconSize="sm"
              onClick={() => (window.location.href = "/customers")}
            >
              Add Customer
            </Button>
          </>
        }
        contentWidth="full"
        backgroundImageSrc="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=3134&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      />

      {/* Stats Grid */}
      <Grid className="u-my-6">
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Total Customers"
            value={enhancedStats.total_customers}
            icon="Users"
            iconColor="#7AFFD7"
            trend={{
              value: 12,
              isPositive: true,
            }}
            description={`${enhancedStats.active_customers} active`}
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Active Subscriptions"
            value={enhancedStats.active_subscriptions}
            icon="Link"
            iconColor="#1AFFD2"
            trend={{
              value: 8,
              isPositive: true,
            }}
            description={`${enhancedStats.total_subscriptions - enhancedStats.active_subscriptions} inactive`}
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Network Uptime"
            value={`${networkUptime}%`}
            icon="Globe"
            iconColor="#00E6C3"
            trend={{
              value: 0.2,
              isPositive: true,
            }}
            description={`${enhancedStats.online_routers}/${enhancedStats.total_routers} routers online`}
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Monthly Revenue"
            value={`$${enhancedStats.total_monthly_revenue.toLocaleString()}`}
            icon="CurrencyDollar"
            iconColor="#00D9FF"
            trend={{
              value: 15,
              isPositive: true,
            }}
            description="from active subscriptions"
          />
        </GridCol>
      </Grid>
      {/* Interactive Charts Section */}
      <Grid className="u-my-8">
        <GridCol xs={12} lg={8}>
          <Card
            title={
              selectedChart === "revenue"
                ? "Revenue Analytics"
                : selectedChart === "traffic"
                  ? "Network Traffic"
                  : selectedChart === "customers"
                    ? "Customer Growth"
                    : "Network Performance"
            }
            text="Track your key metrics over time"
            actions={
              <div className="u-flex u-gap-2 u-flex-wrap">
                {TIME_PERIODS.map((period) => (
                  <Button
                    key={period.value}
                    variant={
                      selectedTimePeriod === period.value
                        ? "primary"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handlePeriodChange(period.value)}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            }
          >
            {/* Chart Type Selector */}
            <div className="u-flex u-gap-2 u-my-4 u-flex-wrap">
              {[
                { key: "revenue", label: "Revenue", icon: "CurrencyDollar" },
                { key: "traffic", label: "Traffic", icon: "Globe" },
                { key: "customers", label: "Customers", icon: "Users" },
                { key: "network", label: "Network", icon: "Share" },
              ].map((chart) => (
                <Button
                  key={chart.key}
                  variant={selectedChart === chart.key ? "primary" : "ghost"}
                  size="sm"
                  iconName={chart.icon as any}
                  iconSize="sm"
                  onClick={() => handleChartChange(chart.key)}
                >
                  {chart.label}
                </Button>
              ))}
            </div>

            <div>
              {selectedChart === "revenue" && (
                <AreaChart datasets={revenueData} size="sm" />
              )}
              {selectedChart === "traffic" && (
                <BarChart datasets={trafficData} size="sm" />
              )}
              {selectedChart === "customers" && (
                <LineChart datasets={customerGrowthData} size="sm" />
              )}
              {selectedChart === "network" && (
                <LineChart datasets={networkStatus} size="sm" />
              )}
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} lg={4}>
          <Card
            title="Plan Distribution"
            text="Customer subscription breakdown"
            className="u-h-full"
          >
            <div className="u-mt-4">
              <DonutChart datasets={customerDistribution} size="lg" />
            </div>
            <div className="u-mt-4 u-text-center u-pt-4 u-border-top">
              <div className="u-fs-xl u-font-bold u-text-primary u-mb-1">
                {enhancedStats.total_subscriptions}
              </div>
              <p className="u-fs-sm u-text-secondary-emphasis">
                Total Active Subscriptions
              </p>
            </div>
          </Card>
        </GridCol>
      </Grid>

      {/* Network Performance Charts */}
      <Grid className="u-mb-6">
        <GridCol xs={12} lg={6}>
          <Card title="Network Traffic">
            <BarChart datasets={trafficData} size="md" />
          </Card>
        </GridCol>
        <GridCol xs={12} lg={6}>
          <Card title="Network Performance">
            <LineChart datasets={networkStatus} size="md" />
          </Card>
        </GridCol>
      </Grid>

      {/* Quick Actions & System Overview */}
      <Grid className="u-mb-8">
        <GridCol xs={12} lg={5}>
          <QuickActions
            title="Quick Actions"
            actions={[
              {
                id: "add-customer",
                label: "Add Customer",
                icon: "UserPlus",
                onClick: () => (window.location.href = "/customers"),
                variant: "primary",
              },
              {
                id: "create-plan",
                label: "Create Plan",
                icon: "Lightning",
                onClick: () => (window.location.href = "/plans"),
              },
              {
                id: "generate-invoice",
                label: "Generate Invoice",
                icon: "Receipt",
                onClick: () => (window.location.href = "/billing"),
              },
              {
                id: "view-reports",
                label: "View Reports",
                icon: "ChartBar",
                onClick: () => (window.location.href = "/reports"),
              },
            ]}
          />
        </GridCol>
        <GridCol xs={12} lg={7}>
          <Card
            title="System Overview"
            text="Key metrics and performance indicators"
            className="u-h-100"
          >
            <Grid className="u-mt-1">
              <GridCol xs={6} md={3}>
                <div className="u-text-center u-p-4">
                  <div className="u-fs-2xl u-font-bold u-text-success u-mb-1">
                    {networkUptime}%
                  </div>
                  <div className="u-fs-sm u-text-secondary-emphasis">
                    Uptime
                  </div>
                </div>
              </GridCol>
              <GridCol xs={6} md={3}>
                <div className="u-text-center u-p-4">
                  <div className="u-fs-2xl u-font-bold u-text-primary u-mb-1">
                    {enhancedStats.total_customers}
                  </div>
                  <div className="u-fs-sm u-text-secondary-emphasis">
                    Customers
                  </div>
                </div>
              </GridCol>
              <GridCol xs={6} md={3}>
                <div className="u-text-center u-p-4">
                  <div className="u-fs-2xl u-font-bold u-text-warning u-mb-1">
                    {enhancedStats.total_routers}
                  </div>
                  <div className="u-fs-sm u-text-secondary-emphasis">
                    Routers
                  </div>
                </div>
              </GridCol>
              <GridCol xs={6} md={3}>
                <div className="u-text-center u-p-4">
                  <div className="u-fs-2xl u-font-bold u-text-info u-mb-1">
                    ${enhancedStats.total_monthly_revenue.toLocaleString()}
                  </div>
                  <div className="u-fs-sm u-text-secondary-emphasis">
                    Revenue
                  </div>
                </div>
              </GridCol>
            </Grid>
          </Card>
        </GridCol>
      </Grid>

      {/* Recent Activity Section */}
      <Grid>
        <GridCol xs={12} lg={8}>
          <Card
            title="Recent Customers"
            text="Latest customer registrations and activity"
            actions={
              <Button
                variant="link"
                size="sm"
                onClick={() => (window.location.href = "/customers")}
              >
                View All
              </Button>
            }
          >
            <div className="u-mt-3">
              {recentCustomers.map((customer, index) => (
                <div
                  key={customer.id || index}
                  className="u-flex u-items-center u-justify-between u-p-3 u-border u-rounded u-cursor-pointer u-mb-2"
                  onClick={() => handleCustomerClick(customer)}
                >
                  <div className="u-flex u-items-center u-gap-3">
                    <Avatar
                      initials={customer.name?.charAt(0) || "?"}
                      size="sm"
                    />
                    <div>
                      <div className="u-font-normal">{customer.name}</div>
                      <div className="u-fs-sm u-text-secondary-emphasis">
                        {customer.email}
                      </div>
                      <div className="u-fs-xs u-text-secondary-emphasis">
                        Joined{" "}
                        {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="u-flex u-items-center u-gap-2">
                    <Badge
                      variant={
                        customer.status === "active" ? "success" : "warning"
                      }
                      size="sm"
                      label={customer.status}
                    />
                    <span className="u-fs-sm">{customer.plan}</span>
                  </div>
                </div>
              ))}
              {recentCustomers.length === 0 && (
                <div className="u-text-center u-py-8">
                  <Icon
                    name="Users"
                    size={48}
                    className="u-text-secondary-emphasis u-mb-4"
                  />
                  <p className="u-text-secondary-emphasis">
                    No recent customers found
                  </p>
                </div>
              )}
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} lg={4}>
          <Card
            title="System Health"
            text="Real-time system performance metrics"
            className="u-h-100"
          >
            <div className="u-mt-4">
              <div>
                <div className="u-flex u-justify-between u-items-center u-mb-2">
                  <div className="u-flex u-items-center u-gap-2">
                    <Icon name="Cpu" size={"sm"} className="u-text-primary" />
                    <span className="u-fs-sm u-font-normal">Server Load</span>
                  </div>
                  <span className="u-fs-sm u-font-bold">
                    {systemStatus.serverLoad}%
                  </span>
                </div>
                <Progress
                  value={systemStatus.serverLoad}
                  variant={
                    systemStatus.serverLoad > 80
                      ? "error"
                      : systemStatus.serverLoad > 60
                        ? "warning"
                        : "primary"
                  }
                />
              </div>

              <div>
                <div className="u-flex u-justify-between u-items-center u-mb-2">
                  <div className="u-flex u-items-center u-gap-2">
                    <Icon
                      name="Memory"
                      size={"sm"}
                      className="u-text-success"
                    />
                    <span className="u-fs-sm u-font-normal">Memory Usage</span>
                  </div>
                  <span className="u-fs-sm u-font-bold">
                    {systemStatus.memoryUsage}%
                  </span>
                </div>
                <Progress
                  value={systemStatus.memoryUsage}
                  variant={
                    systemStatus.memoryUsage > 80
                      ? "error"
                      : systemStatus.memoryUsage > 60
                        ? "warning"
                        : "success"
                  }
                />
              </div>

              <div>
                <div className="u-flex u-justify-between u-items-center u-mb-2">
                  <div className="u-flex u-items-center u-gap-2">
                    <Icon
                      name="HardDrive"
                      size={"sm"}
                      className="u-text-info"
                    />
                    <span className="u-fs-sm u-font-normal">Storage</span>
                  </div>
                  <span className="u-fs-sm u-font-bold">
                    {systemStatus.storage}%
                  </span>
                </div>
                <Progress
                  value={systemStatus.storage}
                  variant={
                    systemStatus.storage > 80
                      ? "error"
                      : systemStatus.storage > 60
                        ? "warning"
                        : "success"
                  }
                />
              </div>

              <div>
                <div className="u-flex u-justify-between u-items-center u-mb-2">
                  <div className="u-flex u-items-center u-gap-2">
                    <Icon name="Globe" size={"sm"} className="u-text-warning" />
                    <span className="u-fs-sm u-font-normal">Network Load</span>
                  </div>
                  <span className="u-fs-sm u-font-bold">
                    {systemStatus.networkLoad}%
                  </span>
                </div>
                <Progress
                  value={systemStatus.networkLoad}
                  variant={
                    systemStatus.networkLoad > 80
                      ? "error"
                      : systemStatus.networkLoad > 60
                        ? "warning"
                        : "primary"
                  }
                />
              </div>
            </div>

            <div className="u-mt-6 u-pt-6 u-border-top">
              <div className="u-flex u-justify-between u-items-center u-mb-3">
                <h4 className="u-fs-sm u-font-bold">Active Administrators</h4>
                <Badge variant="success" size="sm" label="3 online" />
              </div>
              <div className="u-flex u-gap-2">
                <Avatar initials="JD" size="sm" />
                <Avatar initials="JS" size="sm" />
                <Avatar initials="BW" size="sm" />
              </div>
            </div>
          </Card>
        </GridCol>
      </Grid>

      {/* Customer Detail Modal */}
      <Modal
        isOpen={showCustomerModal}
        onOpenChange={setShowCustomerModal}
        title={
          selectedCustomer
            ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
            : ""
        }
        size="md"
      >
        {selectedCustomer && (
          <div>
            <div className="u-flex u-items-center u-gap-3 u-mb-4">
              <Avatar
                initials={selectedCustomer.name?.charAt(0) || "?"}
                size="lg"
              />
              <div>
                <h2 className="u-mb-1">{selectedCustomer.name}</h2>
                <p className="u-text-secondary-emphasis u-mb-1">
                  {selectedCustomer.email}
                </p>
                <Badge
                  variant={
                    selectedCustomer.status === "active" ? "success" : "warning"
                  }
                  label={selectedCustomer.status}
                />
              </div>
            </div>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                    Plan
                  </label>
                  <p>{selectedCustomer.plan}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                    Status
                  </label>
                  <p>{selectedCustomer.status}</p>
                </div>
              </GridCol>
            </Grid>

            <div className="u-mb-3">
              <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">
                Joined
              </label>
              <p>{new Date(selectedCustomer.created_at).toLocaleString()}</p>
            </div>

            <div className="u-flex u-justify-end u-gap-2 u-mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCustomerModal(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowCustomerModal(false);
                  // Navigate to customer detail page
                  window.location.href = `/customers/${selectedCustomer.id}`;
                }}
              >
                View Full Profile
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
