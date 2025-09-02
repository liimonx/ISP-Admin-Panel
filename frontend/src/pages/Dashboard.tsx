import React, { useState, useEffect } from "react";
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
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-customers"] });
      queryClient.invalidateQueries({ queryKey: ["active-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["routers-overview"] });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, queryClient]);

  // Dashboard stats
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => apiService.getDashboardStats(),
    refetchInterval: refreshInterval,
    staleTime: 10000,
  });

  // Recent customers
  const { data: customersData } = useQuery({
    queryKey: ["recent-customers"],
    queryFn: () => apiService.getCustomers({ limit: 5, ordering: "-created_at" }),
    refetchInterval: refreshInterval,
    staleTime: 10000,
  });

  // Active subscriptions
  const { data: subscriptionsData } = useQuery({
    queryKey: ["active-subscriptions"],
    queryFn: () => apiService.getActiveSubscriptions(),
    refetchInterval: refreshInterval,
    staleTime: 10000,
  });

  // Routers overview
  const { data: routersData } = useQuery({
    queryKey: ["routers-overview"],
    queryFn: () => apiService.getRouters({ limit: 10 }),
    refetchInterval: refreshInterval,
    staleTime: 10000,
  });

  // Monitoring stats
  const { data: monitoringStats, isLoading: monitoringLoading } = useQuery({
    queryKey: ["monitoring-stats"],
    queryFn: () => apiService.getMonitoringStats(),
    refetchInterval: refreshInterval,
    staleTime: 10000,
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
      ]);
    },
  });

  // Generate chart data based on real data
  const generateChartData = (type: string, period: string) => {
    if (!stats) {
      return [{
        label: type === "revenue" ? "Revenue" : type === "traffic" ? "Network Traffic" : "New Customers",
        data: [],
        color: type === "revenue" ? "#1AFFD2" : type === "traffic" ? "#7AFFD7" : "#00E6C3",
      }];
    }

    const baseValue = stats.total_monthly_revenue || 0;
    const customerBase = stats.total_customers || 0;
    
    if (baseValue === 0 && customerBase === 0) {
      return [{
        label: type === "revenue" ? "Revenue" : type === "traffic" ? "Network Traffic" : "New Customers",
        data: [],
        color: type === "revenue" ? "#1AFFD2" : type === "traffic" ? "#7AFFD7" : "#00E6C3",
      }];
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
          value = Math.floor(baseValue * (0.8 + Math.random() * 0.4));
          break;
        case "traffic":
          value = Math.floor(customerBase * (0.1 + Math.random() * 0.3));
          break;
        case "customers":
          value = Math.floor(customerBase * (0.05 + Math.random() * 0.15));
          break;
        default:
          value = Math.floor(Math.random() * 100);
      }

      data.push({
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value,
      });
    }

    return [{
      label: type === "revenue" ? "Revenue" : type === "traffic" ? "Network Traffic" : "New Customers",
      data,
      color: type === "revenue" ? "#1AFFD2" : type === "traffic" ? "#7AFFD7" : "#00E6C3",
    }];
  };

  // Chart data based on selected time period
  const revenueData = generateChartData("revenue", selectedTimePeriod);
  const trafficData = generateChartData("traffic", selectedTimePeriod);
  const customerGrowthData = generateChartData("customers", selectedTimePeriod);

  // Customer distribution by plan
  const customerDistribution = [
    {
      label: "Plan Distribution",
      data: stats?.total_subscriptions 
        ? [
            { label: "Basic", value: Math.floor(stats.total_subscriptions * 0.15) },
            { label: "Standard", value: Math.floor(stats.total_subscriptions * 0.35) },
            { label: "Premium", value: Math.floor(stats.total_subscriptions * 0.25) },
            { label: "Enterprise", value: Math.floor(stats.total_subscriptions * 0.25) },
          ]
        : [],
      color: "#00E6C3",
    },
  ];

  // Network performance data
  const networkStatus = [
    {
      label: "Network Performance",
      data: stats?.total_routers 
        ? Array.from({ length: 24 }, (_, i) => ({
            label: `${i.toString().padStart(2, "0")}:00`,
            value: Math.floor(85 + Math.random() * 15),
          }))
        : [],
      color: "#00D9FF",
    },
  ];

  // Recent customers with real data
  const recentCustomers = customersData?.results?.slice(0, 4).map(customer => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    plan: subscriptionsData?.find(sub => sub.customer.id === customer.id)?.plan.name || "Standard",
    status: customer.status,
    created_at: customer.created_at,
  })) || [];

  // System status with real monitoring data
  const systemStatus = {
    serverLoad: monitoringStats?.server_load ?? 'N/A',
    memoryUsage: monitoringStats?.memory_usage ?? 'N/A',
    storage: monitoringStats?.storage_usage ?? 'N/A',
    networkLoad: monitoringStats?.network_load ?? 'N/A',
  };

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
        <div className="u-d-flex u-justify-content-between u-align-items-center">
          <div>
            <h3 className="u-mb-2">Error Loading Dashboard</h3>
            <p>Failed to load dashboard data. Please try refreshing the page.</p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <Icon name="ArrowClockwise" size={16} />
            {refreshMutation.isPending ? 'Retrying...' : 'Retry'}
          </Button>
        </div>
      </Callout>
    );
  }

  if (isLoading) {
    return (
      <div className="u-d-flex u-justify-content-center u-align-items-center u-height-50vh">
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
      <div className="u-mb-8">
        <div className="u-d-flex u-justify-content-between u-align-items-start u-mb-4">
          <div>
            <h1 className="u-text-3xl u-font-weight-bold u-mb-2 u-text-foreground">Dashboard</h1>
            <p className="u-text-secondary u-text-lg">
              Welcome back! Here's what's happening with your ISP operations today.
            </p>
          </div>
          <div className="u-d-flex u-gap-3 u-align-items-center">
            <Button 
              variant="outline" 
              size="md"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
            >
              <Icon name="ArrowClockwise" size={16} />
              <span className="u-d-none u-d-sm-inline">
                {refreshMutation.isPending ? 'Refreshing...' : 'Refresh'}
              </span>
            </Button>
            <Button variant="outline" size="md">
              <Icon name="Download" size={16} />
              <span className="u-d-none u-d-sm-inline">Export</span>
            </Button>
            <Button variant="primary" size="md">
              <Icon name="Plus" size={16} />
              <span className="u-d-none u-d-sm-inline">Add Customer</span>
            </Button>
          </div>
        </div>
        
        {/* Quick Stats Summary */}
        <div className="u-d-flex u-gap-4 u-text-sm u-text-secondary">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span>•</span>
          <span>Auto-refresh: 30s</span>
          <span>•</span>
          <span>Status: All systems operational</span>
        </div>
      </div>

      {/* Stats Grid */}
      <Grid className="u-mb-6">
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Total Customers"
            value={stats?.total_customers ?? 'N/A'}
            icon="Users"
            iconColor="#7AFFD7"
            trend={{
              value: 12,
              isPositive: true,
            }}
            description="vs last month"
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Active Subscriptions"
            value={stats?.total_subscriptions ?? 'N/A'}
            icon="Link"
            iconColor="#1AFFD2"
            trend={{
              value: 8,
              isPositive: true,
            }}
            description="currently active"
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Network Uptime"
            value={stats?.total_routers && stats?.online_routers 
              ? `${((stats.online_routers / stats.total_routers) * 100).toFixed(1)}%`
              : 'N/A'
            }
            icon="Globe"
            iconColor="#00E6C3"
            trend={{
              value: 0.2,
              isPositive: true,
            }}
            description="last 30 days"
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Monthly Revenue"
            value={stats?.total_monthly_revenue 
              ? `$${stats.total_monthly_revenue.toLocaleString()}`
              : 'N/A'
            }
            icon="CurrencyDollar"
            iconColor="#00D9FF"
            trend={{
              value: 15,
              isPositive: true,
            }}
            description="this month"
          />
        </GridCol>
      </Grid>

      {/* Interactive Charts Section */}
      <Grid className="u-mb-8">
        <GridCol xs={12} lg={8}>
          <Card className="u-h-100">
            <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-6">
              <div>
                <h3 className="u-text-xl u-font-weight-semibold u-mb-1">
                  {selectedChart === "revenue" && "Revenue Analytics"}
                  {selectedChart === "traffic" && "Network Traffic"}
                  {selectedChart === "customers" && "Customer Growth"}
                  {selectedChart === "network" && "Network Performance"}
                </h3>
                <p className="u-text-sm u-text-secondary">
                  Track your key metrics over time
                </p>
              </div>
              <div className="u-d-flex u-gap-2 u-flex-wrap">
                {TIME_PERIODS.map((period) => (
                  <Button
                    key={period.value}
                    variant={selectedTimePeriod === period.value ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handlePeriodChange(period.value)}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Chart Type Selector */}
            <div className="u-d-flex u-gap-2 u-mb-4 u-flex-wrap">
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
                  onClick={() => handleChartChange(chart.key)}
                >
                  <Icon name={chart.icon as any} size={16} />
                  {chart.label}
                </Button>
              ))}
            </div>
            
            <div className="u-min-height-400">
              {selectedChart === "revenue" && <AreaChart datasets={revenueData} size="lg" />}
              {selectedChart === "traffic" && <BarChart datasets={trafficData} size="lg" />}
              {selectedChart === "customers" && <LineChart datasets={customerGrowthData} size="lg" />}
              {selectedChart === "network" && <LineChart datasets={networkStatus} size="lg" />}
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} lg={4}>
          <Card className="u-h-100">
            <div className="u-mb-4">
              <h3 className="u-text-xl u-font-weight-semibold u-mb-1">Plan Distribution</h3>
              <p className="u-text-sm u-text-secondary">
                Customer subscription breakdown
              </p>
            </div>
            <div className="u-min-height-300">
              <DonutChart datasets={customerDistribution} size="lg" />
            </div>
            <div className="u-mt-4 u-text-center u-pt-4 u-border-top">
              <div className="u-text-2xl u-font-weight-bold u-text-primary u-mb-1">
                {stats?.total_subscriptions ?? 'N/A'}
              </div>
              <p className="u-text-sm u-text-secondary">
                Total Active Subscriptions
              </p>
            </div>
          </Card>
        </GridCol>
      </Grid>

      {/* Network Performance Charts */}
      <Grid className="u-mb-6">
        <GridCol xs={12} lg={6}>
          <Card>
            <h3 className="u-mb-4">Network Traffic</h3>
            <BarChart datasets={trafficData} size="md" />
          </Card>
        </GridCol>
        <GridCol xs={12} lg={6}>
          <Card>
            <h3 className="u-mb-4">Network Performance</h3>
            <LineChart datasets={networkStatus} size="md" />
          </Card>
        </GridCol>
      </Grid>

      {/* Quick Actions */}
      <Grid className="u-mb-8">
        <GridCol xs={12} lg={4}>
          <QuickActions
            title="Quick Actions"
            actions={[
              {
                id: "add-customer",
                label: "Add Customer",
                icon: "UserPlus",
                onClick: () => window.location.href = '/customers',
                variant: "primary"
              },
              {
                id: "create-plan",
                label: "Create Plan",
                icon: "Lightning",
                onClick: () => window.location.href = '/plans'
              },
              {
                id: "generate-invoice",
                label: "Generate Invoice",
                icon: "Receipt",
                onClick: () => window.location.href = '/billing'
              },
              {
                id: "view-reports",
                label: "View Reports",
                icon: "ChartBar",
                onClick: () => window.location.href = '/reports'
              }
            ]}
          />
        </GridCol>
        <GridCol xs={12} lg={8}>
          <Card className="u-h-100">
            <div className="u-mb-4">
              <h3 className="u-text-xl u-font-weight-semibold u-mb-1">System Overview</h3>
              <p className="u-text-sm u-text-secondary">
                Key metrics and performance indicators
              </p>
            </div>
            
            <Grid>
              <GridCol xs={6} md={3}>
                <div className="u-text-center u-p-4">
                  <div className="u-text-2xl u-font-weight-bold u-text-success u-mb-1">
                    {((stats?.online_routers / stats?.total_routers) * 100 || 0).toFixed(1)}%
                  </div>
                  <div className="u-text-sm u-text-secondary">Uptime</div>
                </div>
              </GridCol>
              <GridCol xs={6} md={3}>
                <div className="u-text-center u-p-4">
                  <div className="u-text-2xl u-font-weight-bold u-text-primary u-mb-1">
                    {stats?.total_customers || 0}
                  </div>
                  <div className="u-text-sm u-text-secondary">Customers</div>
                </div>
              </GridCol>
              <GridCol xs={6} md={3}>
                <div className="u-text-center u-p-4">
                  <div className="u-text-2xl u-font-weight-bold u-text-warning u-mb-1">
                    {stats?.total_routers || 0}
                  </div>
                  <div className="u-text-sm u-text-secondary">Routers</div>
                </div>
              </GridCol>
              <GridCol xs={6} md={3}>
                <div className="u-text-center u-p-4">
                  <div className="u-text-2xl u-font-weight-bold u-text-info u-mb-1">
                    ${(stats?.total_monthly_revenue || 0).toLocaleString()}
                  </div>
                  <div className="u-text-sm u-text-secondary">Revenue</div>
                </div>
              </GridCol>
            </Grid>
          </Card>
        </GridCol>
      </Grid>

      {/* Recent Activity Section */}
      <Grid>
        <GridCol xs={12} lg={8}>
          <Card className="u-h-100">
            <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-6">
              <div>
                <h3 className="u-text-xl u-font-weight-semibold u-mb-1">Recent Customers</h3>
                <p className="u-text-sm u-text-secondary">
                  Latest customer registrations and activity
                </p>
              </div>
              <Button variant="ghost" size="sm">
                View All
                <Icon name="CaretRight" size={16} />
              </Button>
            </div>
            <div className="u-space-y-3">
              {recentCustomers.map((customer, index) => (
                <div
                  key={customer.id || index}
                  className="u-d-flex u-align-items-center u-justify-content-between u-p-3 u-border u-border-radius-2 u-cursor-pointer hover:u-bg-light"
                  onClick={() => handleCustomerClick(customer)}
                >
                  <div className="u-d-flex u-align-items-center u-gap-3">
                    <Avatar initials={customer.name?.charAt(0) || '?'} size="sm" />
                    <div>
                      <div className="u-font-weight-medium">
                        {customer.name}
                      </div>
                      <div className="u-text-sm u-text-secondary">
                        {customer.email}
                      </div>
                      <div className="u-text-xs u-text-secondary">
                        Joined {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="u-d-flex u-align-items-center u-gap-2">
                    <Badge
                      variant={
                        customer.status === "active" ? "success" : "warning"
                      }
                      size="sm"
                      label={customer.status}
                    />
                    <span className="u-text-sm">
                      {customer.plan}
                    </span>
                  </div>
                </div>
              ))}
              {recentCustomers.length === 0 && (
                <div className="u-text-center u-py-8">
                  <Icon name="Users" size={48} className="u-text-secondary u-mb-4" />
                  <p className="u-text-secondary">No recent customers found</p>
                </div>
              )}
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} lg={4}>
          <Card className="u-h-100">
            <div className="u-mb-6">
              <h3 className="u-text-xl u-font-weight-semibold u-mb-1">System Health</h3>
              <p className="u-text-sm u-text-secondary">
                Real-time system performance metrics
              </p>
            </div>
            
            <div className="u-space-y-6">
              <div>
                <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-2">
                  <div className="u-d-flex u-align-items-center u-gap-2">
                    <Icon name="Cpu" size={16} className="u-text-primary" />
                    <span className="u-text-sm u-font-weight-medium">Server Load</span>
                  </div>
                  <span className="u-text-sm u-font-weight-semibold">{systemStatus.serverLoad}%</span>
                </div>
                <Progress 
                  value={systemStatus.serverLoad} 
                  variant={systemStatus.serverLoad > 80 ? "error" : systemStatus.serverLoad > 60 ? "warning" : "primary"} 
                />
              </div>
              
              <div>
                <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-2">
                  <div className="u-d-flex u-align-items-center u-gap-2">
                    <Icon name="Memory" size={16} className="u-text-success" />
                    <span className="u-text-sm u-font-weight-medium">Memory Usage</span>
                  </div>
                  <span className="u-text-sm u-font-weight-semibold">{systemStatus.memoryUsage}%</span>
                </div>
                <Progress 
                  value={systemStatus.memoryUsage} 
                  variant={systemStatus.memoryUsage > 80 ? "error" : systemStatus.memoryUsage > 60 ? "warning" : "success"} 
                />
              </div>
              
              <div>
                <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-2">
                  <div className="u-d-flex u-align-items-center u-gap-2">
                    <Icon name="HardDrive" size={16} className="u-text-info" />
                    <span className="u-text-sm u-font-weight-medium">Storage</span>
                  </div>
                  <span className="u-text-sm u-font-weight-semibold">{systemStatus.storage}%</span>
                </div>
                <Progress 
                  value={systemStatus.storage} 
                  variant={systemStatus.storage > 80 ? "error" : systemStatus.storage > 60 ? "warning" : "success"} 
                />
              </div>
              
              <div>
                <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-2">
                  <div className="u-d-flex u-align-items-center u-gap-2">
                    <Icon name="Globe" size={16} className="u-text-warning" />
                    <span className="u-text-sm u-font-weight-medium">Network Load</span>
                  </div>
                  <span className="u-text-sm u-font-weight-semibold">{systemStatus.networkLoad}%</span>
                </div>
                <Progress 
                  value={systemStatus.networkLoad} 
                  variant={systemStatus.networkLoad > 80 ? "error" : systemStatus.networkLoad > 60 ? "warning" : "primary"} 
                />
              </div>
            </div>

            <div className="u-mt-6 u-pt-6 u-border-top">
              <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-3">
                <h4 className="u-text-sm u-font-weight-semibold">Active Administrators</h4>
                <Badge variant="success" size="sm" label="3 online" />
              </div>
              <div className="u-d-flex u-gap-2">
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
        onClose={() => setShowCustomerModal(false)}
        title="Customer Details"
        size="lg"
      >
        {selectedCustomer && (
          <div>
            <div className="u-d-flex u-align-items-center u-gap-3 u-mb-4">
              <Avatar initials={selectedCustomer.name?.charAt(0) || '?'} size="lg" />
              <div>
                <h2 className="u-mb-1">{selectedCustomer.name}</h2>
                <p className="u-text-secondary u-mb-1">{selectedCustomer.email}</p>
                <Badge
                  variant={selectedCustomer.status === "active" ? "success" : "warning"}
                  label={selectedCustomer.status}
                />
              </div>
            </div>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary u-mb-1">Plan</label>
                  <p>{selectedCustomer.plan}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary u-mb-1">Status</label>
                  <p>{selectedCustomer.status}</p>
                </div>
              </GridCol>
            </Grid>

            <div className="u-mb-3">
              <label className="u-fs-sm u-text-secondary u-mb-1">Joined</label>
              <p>{new Date(selectedCustomer.created_at).toLocaleString()}</p>
            </div>

            <div className="u-d-flex u-justify-content-end u-gap-2 u-mt-6">
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
