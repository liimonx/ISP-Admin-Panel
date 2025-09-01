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
  GaugeChart,
  Modal,
  Callout,
  Spinner,
  Tab,
} from "@shohojdhara/atomix";
import { Router } from "@/types";
import { apiService } from "@/services/apiService";
import { routerService } from "@/services/routerService";
import { StatCard } from "../components/molecules/StatCard";

const Monitoring: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedRouter, setSelectedRouter] = useState<Router | null>(null);
  const [isRouterModalOpen, setIsRouterModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch monitoring stats
  const {
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["monitoring-stats", selectedTimeRange],
    queryFn: () => {
      setLastUpdated(new Date());
      return apiService.getMonitoringStats();
    },
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 0,
  });

  // Fetch routers for monitoring
  const { 
    data: routersData,
    error: routersError,
    refetch: refetchRouters,
  } = useQuery({
    queryKey: ["routers-monitoring"],
    queryFn: () => {
      setLastUpdated(new Date());
      return apiService.getRouters({ limit: 1000 });
    },
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 0,
  });

  // Fetch router stats
  const { 
    data: routerStats,
    error: routerStatsError,
  } = useQuery({
    queryKey: ["router-stats"],
    queryFn: () => {
      setLastUpdated(new Date());
      return apiService.getRouterStats();
    },
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 0,
  });

  // Fetch main router detailed data
  const {
    data: mainRouterStatus,
    error: mainRouterStatusError,
  } = useQuery({
    queryKey: ["main-router-status"],
    queryFn: () => {
      setLastUpdated(new Date());
      return routerService.getMainRouterStatus();
    },
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 0,
  });

  const {
    data: mainRouterResources,
    error: mainRouterResourcesError,
  } = useQuery({
    queryKey: ["main-router-resources"],
    queryFn: () => {
      setLastUpdated(new Date());
      return routerService.getMainRouterResources();
    },
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 0,
  });

  const {
    data: mainRouterBandwidth,
    error: mainRouterBandwidthError,
  } = useQuery({
    queryKey: ["main-router-bandwidth"],
    queryFn: () => {
      setLastUpdated(new Date());
      return routerService.getMainRouterBandwidth();
    },
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 0,
  });

  const {
    data: mainRouterInterfaces,
    error: mainRouterInterfacesError,
  } = useQuery({
    queryKey: ["main-router-interfaces"],
    queryFn: () => {
      setLastUpdated(new Date());
      return routerService.getMainRouterInterfaces();
    },
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 0,
  });

  const {
    data: mainRouterConnections,
    error: mainRouterConnectionsError,
  } = useQuery({
    queryKey: ["main-router-connections"],
    queryFn: () => {
      setLastUpdated(new Date());
      return routerService.getMainRouterConnections();
    },
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 0,
  });

  const {
    data: mainRouterDHCPLeases,
    error: mainRouterDHCPLeasesError,
  } = useQuery({
    queryKey: ["main-router-dhcp-leases"],
    queryFn: () => {
      setLastUpdated(new Date());
      return routerService.getMainRouterDHCPLeases();
    },
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 0,
  });

  const {
    data: mainRouterAlerts,
    error: mainRouterAlertsError,
  } = useQuery({
    queryKey: ["main-router-alerts"],
    queryFn: () => {
      setLastUpdated(new Date());
      return routerService.getMainRouterAlerts();
    },
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 0,
  });

  // Real-time network performance data
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

  const formatBandwidth = (bytesPerSecond: number) => {
    if (bytesPerSecond === 0) return "0 B/s";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleViewRouterDetails = (router: Router) => {
    setSelectedRouter(router);
    setIsRouterModalOpen(true);
  };

  const handleRefreshAll = () => {
    setLastUpdated(new Date());
    refetchStats();
    refetchRouters();
  };

  // Check for any errors
  const hasErrors = statsError || routersError || routerStatsError || 
                   mainRouterStatusError || mainRouterResourcesError || 
                   mainRouterBandwidthError || mainRouterInterfacesError ||
                   mainRouterConnectionsError || mainRouterDHCPLeasesError ||
                   mainRouterAlertsError;

  if (hasErrors) {
    const errorMessage = 
      (statsError as Error)?.message || 
      (routersError as Error)?.message || 
      (routerStatsError as Error)?.message ||
      (mainRouterStatusError as Error)?.message ||
      (mainRouterResourcesError as Error)?.message ||
      (mainRouterBandwidthError as Error)?.message ||
      (mainRouterInterfacesError as Error)?.message ||
      (mainRouterConnectionsError as Error)?.message ||
      (mainRouterDHCPLeasesError as Error)?.message ||
      (mainRouterAlertsError as Error)?.message ||
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
          <p className="u-text-secondary">
            Comprehensive real-time monitoring of network performance and router status
          </p>
        </div>
        <div className="u-d-flex u-gap-2 u-align-items-center">
          <div className="u-d-flex u-align-items-center u-gap-2">
            <Icon
              name={autoRefresh ? "Play" : "Pause"}
              size={16}
              className={autoRefresh ? "u-text-success" : "u-text-secondary"}
            />
            <span className="u-fs-sm u-text-secondary">
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </span>
            <span className="u-fs-sm u-text-secondary">
              • Last updated: {lastUpdated.toLocaleTimeString()}
              {autoRefresh && (
                <span className="u-ml-1">
                  <Icon name="ArrowClockwise" size={12} className="u-animate-spin" />
                </span>
              )}
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

      {/* Main Router Overview Stats */}
      <Grid className="u-mb-6">
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Main Router Status"
            value={mainRouterStatus?.data?.status || "Unknown"}
            icon="Router"
            iconColor={mainRouterStatus?.data?.status === "online" ? "#10B981" : "#EF4444"}
            trend={{
              value: mainRouterStatus?.data?.cpu_usage || 0,
              isPositive: (mainRouterStatus?.data?.cpu_usage || 0) < 80,
            }}
            description="CPU: {mainRouterStatus?.data?.cpu_usage || 0}%"
          />
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <StatCard
            title="Total Bandwidth"
            value={mainRouterBandwidth?.data ? 
              formatBandwidth(mainRouterBandwidth.data.download_speed + mainRouterBandwidth.data.upload_speed) : 
              "0 B/s"}
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
            value={mainRouterConnections?.data?.total_connections?.toLocaleString() || "0"}
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
            title="DHCP Leases"
            value={mainRouterDHCPLeases?.data?.total_leases?.toLocaleString() || "0"}
            icon="Users"
            iconColor="#00D9FF"
            trend={{
              value: 2,
              isPositive: true,
            }}
            description="active leases"
          />
        </GridCol>
      </Grid>

      {/* Performance Gauges Section */}
      <Grid className="u-mb-6">
        <GridCol xs={12} md={6} lg={3}>
          <Card>
            <div className="u-text-center">
              <GaugeChart
                value={mainRouterResources?.data?.cpu_usage || 0}
                min={0}
                max={100}
                title="CPU Usage"
                size="md"
              />
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <Card>
            <div className="u-text-center">
              <GaugeChart
                value={mainRouterResources?.data?.memory_usage || 0}
                min={0}
                max={100}
                title="Memory Usage"
                size="md"
              />
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <Card>
            <div className="u-text-center">
              <GaugeChart
                value={mainRouterResources?.data?.disk_usage || 0}
                min={0}
                max={100}
                title="Disk Usage"
                size="md"
              />
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} md={6} lg={3}>
          <Card>
            <div className="u-text-center">
              <GaugeChart
                value={mainRouterResources?.data?.temperature || 0}
                min={0}
                max={100}
                title="Temperature (°C)"
                size="md"
              />
            </div>
          </Card>
        </GridCol>
      </Grid>

      {/* Speed Meters - Download/Upload Gauges */}
      <Grid className="u-mb-6">
        <GridCol xs={12} md={6}>
          <Card>
            <div className="u-text-center">
              <GaugeChart
                value={mainRouterBandwidth?.data ? 
                  Math.min((mainRouterBandwidth.data.download_speed / (100 * 1024 * 1024)) * 100, 100) : 0}
                min={0}
                max={100}
                title="Download Speed"
                size="lg"
              />
              <div className="u-mt-2">
                <span className="u-fs-lg u-fw-bold">
                  {mainRouterBandwidth?.data ? 
                    formatBandwidth(mainRouterBandwidth.data.download_speed) : "0 B/s"}
                </span>
              </div>
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} md={6}>
          <Card>
            <div className="u-text-center">
              <GaugeChart
                value={mainRouterBandwidth?.data ? 
                  Math.min((mainRouterBandwidth.data.upload_speed / (100 * 1024 * 1024)) * 100, 100) : 0}
                min={0}
                max={100}
                title="Upload Speed"
                size="lg"
              />
              <div className="u-mt-2">
                <span className="u-fs-lg u-fw-bold">
                  {mainRouterBandwidth?.data ? 
                    formatBandwidth(mainRouterBandwidth.data.upload_speed) : "0 B/s"}
                </span>
              </div>
            </div>
          </Card>
        </GridCol>
      </Grid>

             {/* Comprehensive Monitoring Tabs */}
       <div className="u-mb-6">
         <div className="u-d-flex u-gap-2 u-mb-4">
           <Button
             variant={activeTab === "overview" ? "primary" : "outline"}
             size="sm"
             onClick={() => setActiveTab("overview")}
           >
             Overview
           </Button>
           <Button
             variant={activeTab === "interfaces" ? "primary" : "outline"}
             size="sm"
             onClick={() => setActiveTab("interfaces")}
           >
             Interfaces
           </Button>
           <Button
             variant={activeTab === "connections" ? "primary" : "outline"}
             size="sm"
             onClick={() => setActiveTab("connections")}
           >
             Connections
           </Button>
           <Button
             variant={activeTab === "dhcp" ? "primary" : "outline"}
             size="sm"
             onClick={() => setActiveTab("dhcp")}
           >
             DHCP Leases
           </Button>
           <Button
             variant={activeTab === "alerts" ? "primary" : "outline"}
             size="sm"
             onClick={() => setActiveTab("alerts")}
           >
             Alerts
           </Button>
         </div>

         {/* Overview Tab */}
         {activeTab === "overview" && (
           <div>
             <Grid>
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
                         <div className="u-width-3 u-height-3 u-bg-primary u-border-radius-circle"></div>
                         <span className="u-fs-sm">HTTP/HTTPS</span>
                       </div>
                       <span className="u-fs-sm u-fw-medium">45%</span>
                     </div>
                     <div className="u-d-flex u-justify-content-between u-align-items-center">
                       <div className="u-d-flex u-align-items-center u-gap-2">
                         <div className="u-width-3 u-height-3 u-bg-success u-border-radius-circle"></div>
                         <span className="u-fs-sm">Video Streaming</span>
                       </div>
                       <span className="u-fs-sm u-fw-medium">30%</span>
                     </div>
                     <div className="u-d-flex u-justify-content-between u-align-items-center">
                       <div className="u-d-flex u-align-items-center u-gap-2">
                         <div className="u-width-3 u-height-3 u-bg-warning u-border-radius-circle"></div>
                         <span className="u-fs-sm">Gaming</span>
                       </div>
                       <span className="u-fs-sm u-fw-medium">15%</span>
                     </div>
                     <div className="u-d-flex u-justify-content-between u-align-items-center">
                       <div className="u-d-flex u-align-items-center u-gap-2">
                         <div className="u-width-3 u-height-3 u-bg-error u-border-radius-circle"></div>
                         <span className="u-fs-sm">File Transfer</span>
                       </div>
                       <span className="u-fs-sm u-fw-medium">10%</span>
                     </div>
                   </div>
                 </Card>
               </GridCol>
             </Grid>

             <Grid className="u-mt-6">
               <GridCol xs={12}>
                 <Card>
                   <h3 className="u-mb-4">Bandwidth Usage Over Time</h3>
                   <BarChart datasets={bandwidthUsageData} size="md" />
                 </Card>
               </GridCol>
             </Grid>
           </div>
         )}

         {/* Interfaces Tab */}
         {activeTab === "interfaces" && (
           <Card>
             <h3 className="u-mb-4">Network Interfaces</h3>
             {mainRouterInterfaces?.data ? (
               <div className="u-space-y-4">
                 {mainRouterInterfaces.data.map((iface: any, index: number) => (
                   <div key={index} className="u-p-4 u-border u-rounded">
                     <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-2">
                       <div>
                         <h4 className="u-mb-1">{iface.name}</h4>
                         <p className="u-fs-sm u-text-secondary">{iface.type}</p>
                       </div>
                       <Badge
                         variant={iface.status === "up" ? "success" : "error"}
                         size="sm"
                         label={iface.status.toUpperCase()}
                       />
                     </div>
                     <div className="u-grid u-grid-cols-3 u-gap-4">
                       <div>
                         <span className="u-fs-sm u-text-secondary">IP Address</span>
                         <p className="u-fw-medium">{iface.ip_address}</p>
                       </div>
                       <div>
                         <span className="u-fs-sm u-text-secondary">MAC Address</span>
                         <p className="u-fw-medium">{iface.mac_address}</p>
                       </div>
                       <div>
                         <span className="u-fs-sm u-text-secondary">Speed</span>
                         <p className="u-fw-medium">{iface.speed}</p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="u-text-center u-py-8">
                 <Icon name="WifiHigh" size={48} className="u-text-secondary u-mb-4" />
                 <p className="u-text-secondary">No interface data available</p>
               </div>
             )}
           </Card>
         )}

         {/* Connections Tab */}
         {activeTab === "connections" && (
           <Card>
             <h3 className="u-mb-4">Active Connections ({mainRouterConnections?.data?.total_connections || 0})</h3>
             {mainRouterConnections?.data?.connections ? (
               <div className="u-space-y-2">
                 {mainRouterConnections.data.connections.map((connection: any, index: number) => (
                   <div key={index} className="u-p-3 u-border u-rounded">
                     <div className="u-d-flex u-justify-content-between u-align-items-center">
                       <div>
                         <span className="u-fw-medium">{connection.protocol}</span>
                         <p className="u-fs-sm u-text-secondary">
                           {connection.source} → {connection.destination}
                         </p>
                       </div>
                       <div className="u-text-right">
                         <Badge
                           variant={connection.state === "established" ? "success" : "warning"}
                           size="sm"
                           label={connection.state}
                         />
                         <p className="u-fs-sm u-text-secondary u-mt-1">{connection.duration}</p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="u-text-center u-py-8">
                 <Icon name="Link" size={48} className="u-text-secondary u-mb-4" />
                 <p className="u-text-secondary">No connection data available</p>
               </div>
             )}
           </Card>
         )}

         {/* DHCP Tab */}
         {activeTab === "dhcp" && (
           <Card>
             <h3 className="u-mb-4">DHCP Leases ({mainRouterDHCPLeases?.data?.total_leases || 0})</h3>
             {mainRouterDHCPLeases?.data?.leases ? (
               <div className="u-space-y-2">
                 {mainRouterDHCPLeases.data.leases.map((lease: any, index: number) => (
                   <div key={index} className="u-p-3 u-border u-rounded">
                     <div className="u-d-flex u-justify-content-between u-align-items-center">
                       <div>
                         <span className="u-fw-medium">{lease.ip_address}</span>
                         <p className="u-fs-sm u-text-secondary">
                           {lease.mac_address} • {lease.hostname}
                         </p>
                       </div>
                       <div className="u-text-right">
                         <Badge
                           variant={lease.status === "active" ? "success" : "warning"}
                           size="sm"
                           label={lease.status}
                         />
                         <p className="u-fs-sm u-text-secondary u-mt-1">
                           Expires: {new Date(lease.expires).toLocaleString()}
                         </p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="u-text-center u-py-8">
                 <Icon name="Users" size={48} className="u-text-secondary u-mb-4" />
                 <p className="u-text-secondary">No DHCP lease data available</p>
               </div>
             )}
           </Card>
         )}

         {/* Alerts Tab */}
         {activeTab === "alerts" && (
           <Card>
             <h3 className="u-mb-4">System Alerts</h3>
             {mainRouterAlerts?.data?.alerts ? (
               <div className="u-space-y-3">
                 {mainRouterAlerts.data.alerts.map((alert: any) => (
                   <div key={alert.id} className="u-p-4 u-border u-rounded">
                     <div className="u-d-flex u-justify-content-between u-align-items-start u-mb-2">
                       <div>
                         <h4 className="u-mb-1">{alert.title}</h4>
                         <p className="u-text-secondary">{alert.message}</p>
                       </div>
                       <Badge
                         variant={alert.severity === "high" ? "error" : "warning"}
                         size="sm"
                         label={alert.severity.toUpperCase()}
                       />
                     </div>
                     <div className="u-d-flex u-justify-content-between u-align-items-center">
                       <span className="u-fs-sm u-text-secondary">
                         {new Date(alert.timestamp).toLocaleString()}
                       </span>
                       {!alert.acknowledged && (
                         <Button variant="outline" size="sm">
                           Acknowledge
                         </Button>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="u-text-center u-py-8">
                 <Icon name="Bell" size={48} className="u-text-secondary u-mb-4" />
                 <p className="u-text-secondary">No alerts at this time</p>
               </div>
             )}
           </Card>
         )}
       </div>

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
              <Card className="u-height-100">
                <div className="u-d-flex u-justify-content-between u-align-items-start u-mb-4">
                  <div>
                    <h4 className="u-mb-1">{router.name}</h4>
                    <p className="u-fs-sm u-text-secondary">{router.host}</p>
                  </div>
                  {getRouterStatusBadge(router.status)}
                </div>

                <div className="u-space-y-3 u-mb-4">
                  <div>
                    <div className="u-d-flex u-justify-content-between u-mb-1">
                      <span className="u-fs-sm">CPU Usage</span>
                      <span className="u-fs-sm u-text-secondary">
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
                      <span className="u-fs-sm u-text-secondary">
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
                      <span className="u-fs-sm u-text-secondary">
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
                    <div className="u-fs-xs u-text-secondary">connected</div>
                  </div>
                  <div>
                    <div className="u-fs-sm u-fw-medium">
                      {formatUptime(Math.floor(Math.random() * 86400 * 30))}
                    </div>
                    <div className="u-fs-xs u-text-secondary">uptime</div>
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
                className="u-text-secondary u-mb-4"
              />
              <h3 className="u-mb-2">No routers found</h3>
              <p className="u-text-secondary u-mb-4">
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
                  <p className="u-text-secondary u-mb-2">{selectedRouter.description}</p>
                  <p className="u-fs-sm u-text-secondary">{selectedRouter.host}:{selectedRouter.api_port}</p>
                </div>
                {getRouterStatusBadge(selectedRouter.status)}
              </div>
            </div>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary u-mb-1">Router Type</label>
                  <p className="u-fw-medium">{selectedRouter.router_type}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary u-mb-1">Location</label>
                  <p className="u-fw-medium">{selectedRouter.location || "Not specified"}</p>
                </div>
              </GridCol>
            </Grid>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary u-mb-1">API Port</label>
                  <p>{selectedRouter.api_port}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary u-mb-1">SSH Port</label>
                  <p>{selectedRouter.ssh_port}</p>
                </div>
              </GridCol>
            </Grid>

            <Grid>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary u-mb-1">SNMP Community</label>
                  <p>{selectedRouter.snmp_community}</p>
                </div>
              </GridCol>
              <GridCol xs={12} md={6}>
                <div className="u-mb-3">
                  <label className="u-fs-sm u-text-secondary u-mb-1">SNMP Port</label>
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
                    <span className="u-fs-sm u-text-secondary">67%</span>
                  </div>
                  <Progress value={67} variant="warning" />
                </div>
                <div>
                  <div className="u-d-flex u-justify-content-between u-mb-1">
                    <span className="u-fs-sm">Memory Usage</span>
                    <span className="u-fs-sm u-text-secondary">1.2 GB / 4 GB</span>
                  </div>
                  <Progress value={30} variant="success" />
                </div>
                <div>
                  <div className="u-d-flex u-justify-content-between u-mb-1">
                    <span className="u-fs-sm">Network Load</span>
                    <span className="u-fs-sm u-text-secondary">450 Mbps</span>
                  </div>
                  <Progress value={45} variant="primary" />
                </div>
                <div>
                  <div className="u-d-flex u-justify-content-between u-mb-1">
                    <span className="u-fs-sm">Active Connections</span>
                    <span className="u-fs-sm u-text-secondary">156 users</span>
                  </div>
                  <Progress value={78} variant="success" />
                </div>
              </div>
            </div>

            {selectedRouter.notes && (
              <div className="u-mb-4">
                <label className="u-fs-sm u-text-secondary u-mb-1">Notes</label>
                <p>{selectedRouter.notes}</p>
              </div>
            )}

            <div className="u-mb-3">
              <label className="u-fs-sm u-text-secondary u-mb-1">Last Seen</label>
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
