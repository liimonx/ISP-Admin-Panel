import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Button,
  Icon,
  Grid,
  GridCol,
  Badge,
  Progress,
  LineChart,
  BarChart,
  DonutChart,
  Modal,
  Callout,
  Spinner,
} from "@shohojdhara/atomix";
import { Router } from "@/types";
import { apiService } from "@/services/apiService";
import { StatCard } from "../components/molecules/StatCard";



const Monitoring: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedRouter, setSelectedRouter] = useState<Router | null>(null);
  const [isRouterModalOpen, setIsRouterModalOpen] = useState(false);

  // Real-time monitoring connection


  // Fetch monitoring stats
  const {
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["monitoring-stats", selectedTimeRange],
    queryFn: () => apiService.getMonitoringStats(),
    refetchInterval: autoRefresh ? 30000 : false,
    staleTime: 10000,
  });

  // Fetch routers for monitoring
  const { 
    data: routersData,
    error: routersError,
    refetch: refetchRouters,
  } = useQuery({
    queryKey: ["routers-monitoring"],
    queryFn: () => apiService.getRouters({ limit: 1000 }),
    refetchInterval: autoRefresh ? 30000 : false,
    staleTime: 10000,
  });

  // Fetch router stats
  const { 
    data: routerStats,
    error: routerStatsError,
  } = useQuery({
    queryKey: ["router-stats"],
    queryFn: () => apiService.getRouterStats(),
    refetchInterval: autoRefresh ? 30000 : false,
    staleTime: 10000,
  });

  // Mock network performance data
  const networkPerformanceData = [
    {
      label: "Network Latency",
      data: [
        { label: "00:00", value: 12 },
        { label: "04:00", value: 15 },
        { label: "08:00", value: 18 },
        { label: "12:00", value: 22 },
        { label: "16:00", value: 19 },
        { label: "20:00", value: 16 },
      ],
      color: "#7AFFD7",
    },
  ];

  const bandwidthUsageData = [
    {
      label: "Bandwidth Usage",
      data: [
        { label: "00:00", value: 450 },
        { label: "04:00", value: 320 },
        { label: "08:00", value: 680 },
        { label: "12:00", value: 890 },
        { label: "16:00", value: 750 },
        { label: "20:00", value: 920 },
      ],
      color: "#1AFFD2",
    },
  ];

  const protocolDistribution = [
    {
      label: "Protocol Distribution",
      data: [
        { label: "HTTP/HTTPS", value: 45 },
        { label: "Video Streaming", value: 30 },
        { label: "Gaming", value: 15 },
        { label: "File Transfer", value: 10 },
      ],
      color: "#00E6C3",
    },
  ];

  const getRouterStatusBadge = (status: Router["status"]) => {
    const variants = {
      online: "success",
      offline: "error",
      maintenance: "warning",
    } as const;

    return (
      <Badge
        variant={variants[status]}
        size="sm"
        label={status.charAt(0).toUpperCase() + status.slice(1)}
      />
    );
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (24 * 60 * 60));
    const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleViewRouterDetails = (router: Router) => {
    setSelectedRouter(router);
    setIsRouterModalOpen(true);
  };

  const handleRefreshAll = () => {
    refetchStats();
    refetchRouters();
  };

  if (statsError || routersError || routerStatsError) {
    const errorMessage = 
      (statsError as Error)?.message || 
      (routersError as Error)?.message || 
      (routerStatsError as Error)?.message || 
      'Please try again.';
    return (
      <Callout variant="error" className="u-mb-4">
        Error loading monitoring data: {errorMessage}
      </Callout>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-6">
        <div>
          <h1 className="u-mb-2">Network Monitoring</h1>
          <p className="u-text-secondary-emphasis">
            Real-time monitoring of network performance and router status
          </p>
        </div>
        <div className="u-d-flex u-gap-2 u-align-items-center">
          <div className="u-d-flex u-align-items-center u-gap-2">
            <Icon
              name={autoRefresh ? "Play" : "Pause"}
              size={16}
              className={autoRefresh ? "u-text-success" : "u-text-secondary-emphasis"}
            />
            <span className="u-fs-sm u-text-secondary-emphasis">
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Pause" : "Resume"}
            </Button>
          </div>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="u-p-2 u-border u-rounded"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button
            variant="outline"
            size="md"
            onClick={handleRefreshAll}
                          disabled={statsLoading}
          >
            <Icon name="ArrowClockwise" size={16} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Network Overview Stats */}
      <Grid className="u-mb-6">
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Network Uptime"
            value="99.8%"
            icon="CheckCircle"
            iconColor="#10B981"
            trend={{
              value: 0.1,
              isPositive: true,
            }}
            description="last 30 days"
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Total Bandwidth"
            value={`${routerStats?.total_bandwidth ? (routerStats.total_bandwidth / 1000).toFixed(1) : '2.4'} Gbps`}
            icon="Lightning"
            iconColor="#7AFFD7"
            trend={{
              value: 5,
              isPositive: true,
            }}
            description="current usage"
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Active Connections"
            value={routerStats?.active_connections?.toLocaleString() || "1,247"}
            icon="Link"
            iconColor="#1AFFD2"
            trend={{
              value: 12,
              isPositive: true,
            }}
            description="concurrent users"
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Average Latency"
            value="18ms"
            icon="Timer"
            iconColor="#00D9FF"
            trend={{
              value: 2,
              isPositive: false,
            }}
            description="response time"
          />
        </GridCol>
      </Grid>

      {/* Charts Section */}
      <Grid className="u-mb-6">
        <GridCol xs={12} lg={8}>
          <Card>
            <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-4">
              <h3>Network Performance</h3>
              <div className="u-d-flex u-gap-2">
                <Button variant="outline" size="sm">
                  Latency
                </Button>
                <Button variant="primary" size="sm">
                  Bandwidth
                </Button>
                <Button variant="outline" size="sm">
                  Packet Loss
                </Button>
              </div>
            </div>
            <LineChart datasets={networkPerformanceData} size="lg" />
          </Card>
        </GridCol>
        <GridCol xs={12} lg={4}>
          <Card>
            <h3 className="u-mb-4">Traffic Distribution</h3>
            <DonutChart datasets={protocolDistribution} size="lg" />
            <div className="u-mt-4 u-space-y-2">
              <div className="u-d-flex u-justify-content-between u-align-items-center">
                <div className="u-d-flex u-align-items-center u-gap-2">
                  <div className="u-w-3 u-h-3 u-bg-primary u-rounded-full"></div>
                  <span className="u-fs-sm">HTTP/HTTPS</span>
                </div>
                <span className="u-fs-sm u-fw-medium">45%</span>
              </div>
              <div className="u-d-flex u-justify-content-between u-align-items-center">
                <div className="u-d-flex u-align-items-center u-gap-2">
                  <div className="u-w-3 u-h-3 u-bg-success u-rounded-full"></div>
                  <span className="u-fs-sm">Video Streaming</span>
                </div>
                <span className="u-fs-sm u-fw-medium">30%</span>
              </div>
              <div className="u-d-flex u-justify-content-between u-align-items-center">
                <div className="u-d-flex u-align-items-center u-gap-2">
                  <div className="u-w-3 u-h-3 u-bg-warning u-rounded-full"></div>
                  <span className="u-fs-sm">Gaming</span>
                </div>
                <span className="u-fs-sm u-fw-medium">15%</span>
              </div>
              <div className="u-d-flex u-justify-content-between u-align-items-center">
                <div className="u-d-flex u-align-items-center u-gap-2">
                  <div className="u-w-3 u-h-3 u-bg-error u-rounded-full"></div>
                  <span className="u-fs-sm">File Transfer</span>
                </div>
                <span className="u-fs-sm u-fw-medium">10%</span>
              </div>
            </div>
          </Card>
        </GridCol>
      </Grid>

      <Grid className="u-mb-6">
        <GridCol xs={12}>
          <Card>
            <h3 className="u-mb-4">Bandwidth Usage Over Time</h3>
            <BarChart datasets={bandwidthUsageData} size="md" />
          </Card>
        </GridCol>
      </Grid>

      {/* Router Status Cards */}
      <div className="u-mb-4">
        <div className="u-d-flex u-justify-content-between u-align-items-center">
          <h3>Router Status</h3>
          <div className="u-d-flex u-gap-2">
            <Button variant="outline" size="sm">
              <Icon name="Download" size={16} />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Icon name="Plus" size={16} />
              Add Router
            </Button>
          </div>
        </div>
      </div>

      {statsLoading ? (
        <div className="u-d-flex u-justify-content-center u-align-items-center u-py-8">
          <div className="u-text-center">
            <Spinner size="lg" />
            <p>Loading monitoring data...</p>
          </div>
        </div>
      ) : (
        <Grid>
          {routersData?.results?.map((router) => (
            <GridCol key={router.id} xs={12} md={6} lg={4}>
              <Card className="u-h-100">
                <div className="u-d-flex u-justify-content-between u-align-items-start u-mb-4">
                  <div>
                    <h4 className="u-mb-1">{router.name}</h4>
                    <p className="u-fs-sm u-text-secondary-emphasis">{router.host}</p>
                  </div>
                  {getRouterStatusBadge(router.status)}
                </div>

                <div className="u-space-y-3 u-mb-4">
                  <div>
                    <div className="u-d-flex u-justify-content-between u-mb-1">
                      <span className="u-fs-sm">CPU Usage</span>
                      <span className="u-fs-sm u-text-secondary-emphasis">
                        {Math.floor(Math.random() * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.floor(Math.random() * 100)}
                      variant={
                        Math.random() > 0.8
                          ? "error"
                          : Math.random() > 0.6
                            ? "warning"
                            : "success"
                      }
                    />
                  </div>

                  <div>
                    <div className="u-d-flex u-justify-content-between u-mb-1">
                      <span className="u-fs-sm">Memory Usage</span>
                      <span className="u-fs-sm u-text-secondary-emphasis">
                        {formatBytes(
                          Math.floor(Math.random() * 1024 * 1024 * 1024),
                        )}
                      </span>
                    </div>
                    <Progress
                      value={Math.floor(Math.random() * 100)}
                      variant="primary"
                    />
                  </div>

                  <div>
                    <div className="u-d-flex u-justify-content-between u-mb-1">
                      <span className="u-fs-sm">Network Load</span>
                      <span className="u-fs-sm u-text-secondary-emphasis">
                        {Math.floor(Math.random() * 1000)} Mbps
                      </span>
                    </div>
                    <Progress
                      value={Math.floor(Math.random() * 100)}
                      variant="primary"
                    />
                  </div>
                </div>

                <div className="u-d-flex u-justify-content-between u-align-items-center u-pt-3 u-border-top">
                  <div>
                    <div className="u-fs-sm u-fw-medium">
                      {Math.floor(Math.random() * 200)} users
                    </div>
                    <div className="u-fs-xs u-text-secondary-emphasis">connected</div>
                  </div>
                  <div>
                    <div className="u-fs-sm u-fw-medium">
                      {formatUptime(Math.floor(Math.random() * 86400 * 30))}
                    </div>
                    <div className="u-fs-xs u-text-secondary-emphasis">uptime</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewRouterDetails(router)}
                  >
                    <Icon name="ChartLine" size={16} />
                    Details
                  </Button>
                </div>
              </Card>
            </GridCol>
          ))}
        </Grid>
      )}

      {/* Show message if no routers */}
      {!statsLoading &&
        (!routersData?.results || routersData.results.length === 0) && (
          <Card>
            <div className="u-text-center u-py-8">
              <Icon
                name="Globe"
                size={48}
                className="u-text-secondary-emphasis u-mb-4"
              />
              <h3 className="u-mb-2">No routers found</h3>
              <p className="u-text-secondary-emphasis u-mb-4">
                You need to add routers to monitor network performance.
              </p>
              <Button variant="primary">
                <Icon name="Plus" size={16} />
                Add Router
              </Button>
            </div>
          </Card>
        )}

      {/* Router Details Modal */}
      <Modal
        isOpen={isRouterModalOpen}
        onClose={() => {
          setIsRouterModalOpen(false);
          setSelectedRouter(null);
        }}
        title="Router Details"
        size="lg"
      >
        {selectedRouter && (
          <div>
            <div className="u-mb-4">
              <div className="u-d-flex u-justify-content-between u-align-items-start u-mb-3">
                <div>
                  <h2 className="u-mb-1">{selectedRouter.name}</h2>
                  <p className="u-text-secondary-emphasis u-mb-2">{selectedRouter.description}</p>
                  <p className="u-fs-sm u-text-secondary-emphasis">{selectedRouter.host}:{selectedRouter.api_port}</p>
                </div>
                {getRouterStatusBadge(selectedRouter.status)}
              </div>
            </div>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">Router Type</label>
                  <p className="u-fw-medium">{selectedRouter.router_type}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">Location</label>
                  <p className="u-fw-medium">{selectedRouter.location || "Not specified"}</p>
                </div>
              </GridCol>
            </Grid>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">API Port</label>
                  <p>{selectedRouter.api_port}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">SSH Port</label>
                  <p>{selectedRouter.ssh_port}</p>
                </div>
              </GridCol>
            </Grid>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">SNMP Community</label>
                  <p>{selectedRouter.snmp_community}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">SNMP Port</label>
                  <p>{selectedRouter.snmp_port}</p>
                </div>
              </GridCol>
            </Grid>

            <div className="u-mb-4">
              <h4 className="u-mb-3">Real-time Performance</h4>
              <div className="u-space-y-3">
                <div>
                  <div className="u-d-flex u-justify-content-between u-mb-1">
                    <span className="u-fs-sm">CPU Usage</span>
                    <span className="u-fs-sm u-text-secondary-emphasis">67%</span>
                  </div>
                  <Progress value={67} variant="warning" />
                </div>
                <div>
                  <div className="u-d-flex u-justify-content-between u-mb-1">
                    <span className="u-fs-sm">Memory Usage</span>
                    <span className="u-fs-sm u-text-secondary-emphasis">1.2 GB / 4 GB</span>
                  </div>
                  <Progress value={30} variant="success" />
                </div>
                <div>
                  <div className="u-d-flex u-justify-content-between u-mb-1">
                    <span className="u-fs-sm">Network Load</span>
                    <span className="u-fs-sm u-text-secondary-emphasis">450 Mbps</span>
                  </div>
                  <Progress value={45} variant="primary" />
                </div>
                <div>
                  <div className="u-d-flex u-justify-content-between u-mb-1">
                    <span className="u-fs-sm">Active Connections</span>
                    <span className="u-fs-sm u-text-secondary-emphasis">156 users</span>
                  </div>
                  <Progress value={78} variant="success" />
                </div>
              </div>
            </div>

            {selectedRouter.notes && (
              <div className="u-mb-4">
                <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">Notes</label>
                <p>{selectedRouter.notes}</p>
              </div>
            )}

            <div className="u-mb-3">
              <label className="u-fs-sm u-text-secondary-emphasis u-mb-1">Last Seen</label>
              <p>{selectedRouter.last_seen ? new Date(selectedRouter.last_seen).toLocaleString() : "Never"}</p>
            </div>

            <div className="u-d-flex u-justify-content-end u-gap-2 u-mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  // Handle router restart
                  console.log("Restarting router:", selectedRouter.id);
                }}
              >
                <Icon name="ArrowClockwise" size={16} />
                Restart Router
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Handle router configuration
                  console.log("Configuring router:", selectedRouter.id);
                }}
              >
                <Icon name="Gear" size={16} />
                Configure
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsRouterModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Monitoring;
