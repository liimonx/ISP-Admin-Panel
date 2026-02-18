import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Card,
  Button,
  Icon,
  Grid,
  GridCol,
  Badge,
  Input,
  Select,
  Modal,
  Callout,
  Spinner,
  Progress,
  DataTable,
  Pagination,
  LineChart,
  DonutChart,
  Toggle,
} from "@shohojdhara/atomix";
import { apiService } from "@/services/apiService";
import { sanitizeText } from "@/utils/sanitizer";

const TIME_RANGES = [
  { value: "1h", label: "Last Hour" },
  { value: "6h", label: "Last 6 Hours" },
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
];

const ROUTER_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "maintenance", label: "Maintenance" },
  { value: "error", label: "Error" },
];

const Monitoring: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedRouter, setSelectedRouter] = useState<any>(null);
  const [routerStatusFilter, setRouterStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRouterModalOpen, setIsRouterModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Auto-refresh data with staggered intervals
  useEffect(() => {
    if (!autoRefresh) return;

    const intervals = [
      setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["monitoring-stats"] });
      }, 30000), // 30 seconds for stats
      setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["routers-monitoring"] });
      }, 60000), // 1 minute for router data
    ];

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [queryClient, autoRefresh]);

  // Build query parameters for routers
  const buildRouterQueryParams = () => {
    const params: any = {
      page: currentPage,
      limit: itemsPerPage,
    };

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    if (routerStatusFilter !== "all") {
      params.status = routerStatusFilter;
    }

    return params;
  };

  // Fetch monitoring statistics
  const {
    data: monitoringStats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["monitoring-stats"],
    queryFn: () => apiService.monitoring.getMonitoringStats(),
    staleTime: 30000, // 30 seconds
    refetchInterval: autoRefresh ? 30000 : false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Fetch routers for monitoring
  const {
    data: routersData,
    isLoading: routersLoading,
    error: routersError,
    refetch: refetchRouters,
  } = useQuery({
    queryKey: [
      "routers-monitoring",
      currentPage,
      searchQuery,
      routerStatusFilter,
    ],
    queryFn: () => apiService.routers.getRouters(buildRouterQueryParams()),
    keepPreviousData: true,
    staleTime: 60000, // 1 minute
    refetchInterval: autoRefresh ? 60000 : false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Fetch router statistics
  const { data: routerStats } = useQuery({
    queryKey: ["router-stats"],
    queryFn: () => apiService.routers.getRouterStats(),
    staleTime: 60000, // 1 minute
    refetchInterval: autoRefresh ? 60000 : false,
    retry: 1,
  });

  // Handle router details modal
  const handleRouterDetails = (router: any) => {
    setSelectedRouter(router);
    setIsRouterModalOpen(true);
  };

  // Generate chart data
  const generateChartData = () => {
    // Mock data for charts - replace with real API data
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date();
      hour.setHours(hour.getHours() - (23 - i));
      return hour.toLocaleTimeString([], { hour: "2-digit" });
    });

    return {
      bandwidth: [
        {
          label: "Download (Mbps)",
          data: hours.map((hour) => ({
            label: hour,
            value: Math.floor(Math.random() * 100) + 50,
          })),
          color: "#3b82f6",
        },
        {
          label: "Upload (Mbps)",
          data: hours.map((hour) => ({
            label: hour,
            value: Math.floor(Math.random() * 50) + 25,
          })),
          color: "#10b981",
        },
      ],
      connections: [
        {
          label: "Active Connections",
          data: hours.slice(-12).map((hour) => ({
            label: hour,
            value: Math.floor(Math.random() * 500) + 1000,
          })),
          color: "#8b5cf6",
        },
      ],
      routerStatus: [
        {
          label: "Online",
          value: routerStats?.online_routers || 0,
        },
        {
          label: "Offline",
          value: routerStats?.offline_routers || 0,
        },
        {
          label: "Maintenance",
          value: routerStats?.maintenance_routers || 0,
        },
        {
          label: "Error",
          value:
            (routerStats?.total_routers || 0) -
            (routerStats?.online_routers || 0) -
            (routerStats?.offline_routers || 0) -
            (routerStats?.maintenance_routers || 0),
        },
      ],
    };
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "success" | "error" | "warning" | "secondary"
    > = {
      online: "success",
      offline: "error",
      maintenance: "warning",
      error: "error",
    };
    return (
      <Badge
        variant={variants[status] || "secondary"}
        label={status.charAt(0).toUpperCase() + status.slice(1)}
      />
    );
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBandwidth = (bytes: number) => {
    const mbps = (bytes * 8) / (1024 * 1024);
    return `${mbps.toFixed(2)} Mbps`;
  };

  if (statsError || routersError) {
    return (
      <div className="u-p-4">
        <Callout variant="error">
          <strong>Error loading monitoring data:</strong>{" "}
          {statsError?.message || routersError?.message}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["monitoring-stats"] });
              refetchRouters();
            }}
            className="u-ml-2"
          >
            Try Again
          </Button>
        </Callout>
      </div>
    );
  }

  const chartData = generateChartData();

  return (
    <div className="u-p-6">
      {/* Header */}
      <div className="u-flex u-justify-between u-items-center u-mb-6">
        <div>
          <h1 className="u-text-2xl u-mb-2">Network Monitoring</h1>
          <p className="u-text-secondary">
            Real-time monitoring of network infrastructure and performance
          </p>
        </div>
        <div className="u-flex u-gap-3 u-items-center">
          <div className="u-flex u-items-center">
            <Toggle
              initialOn={autoRefresh}
              onToggleOn={() => setAutoRefresh(!autoRefresh)}
              className="u-mr-2"
            />
            <label className="u-text-sm">Auto Refresh</label>
          </div>
          <Select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            options={TIME_RANGES}
            className="u-min-w-150"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      {monitoringStats && (
        <Grid className="u-mb-6">
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-flex u-items-center">
                <div className="u-bg-primary-subtle u-p-3 u-rounded u-mr-3">
                  <Icon name="Desktop" size={20} className="u-text-primary" />
                </div>
                <div>
                  <h3 className="u-text-lg u-mb-1">
                    {monitoringStats.total_routers || 0}
                  </h3>
                  <p className="u-text-secondary u-mb-0">Total Routers</p>
                </div>
              </div>
            </Card>
          </GridCol>
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-flex u-items-center">
                <div className="u-bg-success-subtle u-p-3 u-rounded u-mr-3">
                  <Icon
                    name="CheckCircle"
                    size={24}
                    className="u-text-success"
                  />
                </div>
                <div>
                  <h3 className="u-text-lg u-mb-1">
                    {monitoringStats.online_routers || 0}
                  </h3>
                  <p className="u-text-secondary u-mb-0">Online</p>
                  <div className="u-text-sm u-text-success">
                    {monitoringStats.total_routers > 0
                      ? `${((monitoringStats.online_routers / monitoringStats.total_routers) * 100).toFixed(1)}%`
                      : "0%"}{" "}
                    uptime
                  </div>
                </div>
              </div>
            </Card>
          </GridCol>
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-flex u-items-center">
                <div className="u-bg-warning-subtle u-p-3 u-rounded u-mr-3">
                  <Icon name="Warning" size={24} className="u-text-warning" />
                </div>
                <div>
                  <h3 className="u-text-lg u-mb-1">
                    {monitoringStats.alerts_count || 0}
                  </h3>
                  <p className="u-text-secondary u-mb-0">Active Alerts</p>
                  <div className="u-text-sm u-text-warning">
                    {monitoringStats.critical_alerts || 0} critical
                  </div>
                </div>
              </div>
            </Card>
          </GridCol>
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-flex u-items-center">
                <div className="u-bg-info-subtle u-p-3 u-rounded u-mr-3">
                  <Icon name="Cpu" size={20} className="u-text-success" />
                </div>
                <div>
                  <h3 className="u-text-lg u-mb-1">
                    {monitoringStats.total_bandwidth_usage || 0} GB
                  </h3>
                  <p className="u-text-secondary u-mb-0">Bandwidth Usage</p>
                  <div className="u-text-sm u-text-info">
                    Peak: {monitoringStats.peak_bandwidth_usage || 0} Mbps
                  </div>
                </div>
              </div>
            </Card>
          </GridCol>
        </Grid>
      )}

      {/* Charts */}
      <Grid className="u-mb-6">
        <GridCol xs={12} lg={8}>
          <Card className="u-p-4">
            <div className="u-flex u-justify-between u-items-center u-mb-4">
              <h3 className="u-text-lg u-mb-0">Bandwidth Usage</h3>
              <Badge variant="info" label={`Last ${selectedTimeRange}`} />
            </div>
            {statsLoading ? (
              <div className="u-text-center u-p-6">
                <Spinner />
                <p className="u-mt-2 u-text-secondary">
                  Loading bandwidth data...
                </p>
              </div>
            ) : (
              <LineChart datasets={chartData.bandwidth} size="lg" />
            )}
          </Card>
        </GridCol>
        <GridCol xs={12} lg={4}>
          <Card className="u-p-4">
            <h3 className="u-text-lg u-mb-4">Router Status Distribution</h3>
            {statsLoading ? (
              <div className="u-text-center u-p-6">
                <Spinner />
                <p className="u-mt-2 u-text-secondary">
                  Loading status data...
                </p>
              </div>
            ) : (
              <DonutChart data={chartData.routerStatus} size="md" />
            )}
          </Card>
        </GridCol>
      </Grid>

      {/* Router Management */}
      <Card>
        <div className="u-p-4 u-border-bottom">
          <div className="u-flex u-justify-between u-items-center">
            <h3 className="u-text-lg u-mb-0">Router Status</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchRouters()}
              disabled={routersLoading}
            >
              <Icon name="ArrowClockwise" size={16} className="u-mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="u-p-4 u-border-bottom">
          <Grid>
            <GridCol xs={12} md={6}>
              <Input
                placeholder="Search routers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="u-w-100"
              />
            </GridCol>
            <GridCol xs={12} md={6}>
              <Select
                value={routerStatusFilter}
                onChange={(e) => setRouterStatusFilter(e.target.value)}
                options={ROUTER_STATUSES}
                className="u-w-100"
              />
            </GridCol>
          </Grid>
        </div>

        {/* Router Table */}
        {routersLoading ? (
          <div className="u-text-center u-p-6">
            <Spinner size="lg" />
            <p className="u-mt-3 u-text-secondary">Loading routers...</p>
          </div>
        ) : (
          <>
            <DataTable
              data={
                routersData?.results?.map((router: any) => ({
                  id: router.id,
                  router: (
                    <div className="u-flex u-items-center">
                      <div
                        className={`u-w-3 u-h-3 u-rounded-circle u-mr-3 ${
                          router.status === "online"
                            ? "u-bg-success"
                            : router.status === "offline"
                              ? "u-bg-error"
                              : router.status === "maintenance"
                                ? "u-bg-warning"
                                : "u-bg-secondary"
                        }`}
                      ></div>
                      <div>
                        <div className="u-fw-medium">
                          {sanitizeText(router.name)}
                        </div>
                        {router.description && (
                          <div className="u-text-secondary u-text-sm">
                            {sanitizeText(router.description)}
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                  connection: (
                    <div>
                      <div className="u-text-sm u-mb-1">
                        <Icon
                          name="Globe"
                          size={14}
                          className="u-mr-2 u-text-secondary"
                        />
                        {router.host}
                      </div>
                      <div className="u-text-sm u-text-secondary">
                        API: {router.api_port} | SSH: {router.ssh_port}
                      </div>
                    </div>
                  ),
                  status: getStatusBadge(router.status),
                  uptime: (
                    <div>
                      <Progress
                        value={router.uptime_percentage || 0}
                        size="sm"
                        className="u-mb-1"
                      />
                      <div className="u-text-sm u-text-secondary">
                        {router.uptime ? formatUptime(router.uptime) : "N/A"}
                      </div>
                    </div>
                  ),
                  traffic: (
                    <div>
                      <div className="u-text-sm">
                        <Icon
                          name="ArrowDown"
                          size={12}
                          className="u-mr-1 u-text-success"
                        />
                        {router.rx_bytes
                          ? formatBandwidth(router.rx_bytes)
                          : "0 Mbps"}
                      </div>
                      <div className="u-text-sm">
                        <Icon
                          name="ArrowUp"
                          size={12}
                          className="u-mr-1 u-text-info"
                        />
                        {router.tx_bytes
                          ? formatBandwidth(router.tx_bytes)
                          : "0 Mbps"}
                      </div>
                    </div>
                  ),
                  actions: (
                    <div className="u-flex u-gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRouterDetails(router)}
                      >
                        <Icon name="Gear" size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navigate to router management
                          window.location.href = `/router-management?id=${router.id}`;
                        }}
                      >
                        <Icon name="Eye" size={14} />
                      </Button>
                    </div>
                  ),
                })) || []
              }
              columns={[
                { key: "router", title: "Router" },
                { key: "connection", title: "Connection" },
                { key: "status", title: "Status" },
                { key: "uptime", title: "Uptime" },
                { key: "traffic", title: "Traffic" },
                { key: "actions", title: "Actions" },
              ]}
            />

            {/* Pagination */}
            {routersData &&
              Math.ceil((routersData.count || 0) / itemsPerPage) > 1 && (
                <div className="u-p-4 u-border-top">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(
                      (routersData.count || 0) / itemsPerPage,
                    )}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}

            {routersData?.results?.length === 0 && (
              <div className="u-text-center u-p-6">
                <Icon
                  name="Desktop"
                  size={48}
                  className="u-text-secondary u-mb-3"
                />
                <h3 className="u-text-lg u-mb-2">No routers found</h3>
                <p className="u-text-secondary u-mb-4">
                  {searchQuery || routerStatusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No routers are currently configured for monitoring"}
                </p>
                <Button
                  variant="primary"
                  onClick={() => (window.location.href = "/network")}
                >
                  <Icon name="Plus" size={16} className="u-mr-2" />
                  Add Router
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Router Details Modal */}
      <Modal
        isOpen={isRouterModalOpen}
        onClose={() => {
          setIsRouterModalOpen(false);
          setSelectedRouter(null);
        }}
        title={`Router Details: ${selectedRouter?.name || "N/A"}`}
        size="lg"
      >
        {selectedRouter && (
          <div className="u-space-y-4">
            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-p-4 u-bg-gray-subtle u-rounded">
                  <h4 className="u-text-lg u-mb-3">Connection Info</h4>
                  <div className="u-space-y-2">
                    <div className="u-flex u-justify-between">
                      <span>Host:</span>
                      <span className="u-fw-medium">{selectedRouter.host}</span>
                    </div>
                    <div className="u-flex u-justify-between">
                      <span>API Port:</span>
                      <span className="u-fw-medium">
                        {selectedRouter.api_port}
                      </span>
                    </div>
                    <div className="u-flex u-justify-between">
                      <span>SSH Port:</span>
                      <span className="u-fw-medium">
                        {selectedRouter.ssh_port}
                      </span>
                    </div>
                    <div className="u-flex u-justify-between">
                      <span>Status:</span>
                      {getStatusBadge(selectedRouter.status)}
                    </div>
                  </div>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-p-4 u-bg-gray-subtle u-rounded">
                  <h4 className="u-text-lg u-mb-3">Performance</h4>
                  <div className="u-space-y-2">
                    <div className="u-flex u-justify-between">
                      <span>Uptime:</span>
                      <span className="u-fw-medium">
                        {selectedRouter.uptime
                          ? formatUptime(selectedRouter.uptime)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="u-flex u-justify-between">
                      <span>CPU Usage:</span>
                      <span className="u-fw-medium">
                        {selectedRouter.cpu_usage || 0}%
                      </span>
                    </div>
                    <div className="u-flex u-justify-between">
                      <span>Memory Usage:</span>
                      <span className="u-fw-medium">
                        {selectedRouter.memory_usage || 0}%
                      </span>
                    </div>
                    <div className="u-flex u-justify-between">
                      <span>Active Connections:</span>
                      <span className="u-fw-medium">
                        {selectedRouter.active_connections || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </GridCol>
            </Grid>

            {selectedRouter.description && (
              <div>
                <h4 className="u-text-lg u-mb-2">Description</h4>
                <p className="u-text-secondary">
                  {sanitizeText(selectedRouter.description)}
                </p>
              </div>
            )}

            <div className="u-flex u-justify-end u-gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRouterModalOpen(false);
                  setSelectedRouter(null);
                }}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  window.location.href = `/router-management?id=${selectedRouter.id}`;
                }}
              >
                Manage Router
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Monitoring;
