import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
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
  Progress,
  Spinner,
  DataTable,
  Pagination,
  LineChart,
  DonutChart,
  Toggle,
  Textarea,
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

const MainRouterDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);

  const [command, setCommand] = useState("");
  const [commandResult, setCommandResult] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh) return;

    const intervals = [
      setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["main-router-status"] });
      }, 10000), // 10 seconds
      setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["main-router-bandwidth"] });
      }, 15000), // 15 seconds
      setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["main-router-interfaces"] });
      }, 30000), // 30 seconds
    ];

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [queryClient, autoRefresh]);

  // Main router status
  const { data: routerStatus, error: statusError } = useQuery({
    queryKey: ["main-router-status"],
    queryFn: () => apiService.routers.getMainRouterStatus(),
    staleTime: 10000, // 10 seconds
    refetchInterval: autoRefresh ? 10000 : false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Main router bandwidth
  const { data: bandwidth, isLoading: bandwidthLoading } = useQuery({
    queryKey: ["main-router-bandwidth", selectedTimeRange],
    queryFn: () =>
      apiService.routers.getMainRouterBandwidth({
        time_range: selectedTimeRange,
      }),
    staleTime: 15000, // 15 seconds
    refetchInterval: autoRefresh ? 15000 : false,
    retry: 1,
  });

  // Main router interfaces
  const { data: interfaces, isLoading: interfacesLoading } = useQuery({
    queryKey: ["main-router-interfaces"],
    queryFn: () => apiService.routers.getMainRouterInterfaces(),
    staleTime: 30000, // 30 seconds
    refetchInterval: autoRefresh ? 30000 : false,
    retry: 1,
  });

  // Main router connections
  const { data: connectionsData, isLoading: connectionsLoading } = useQuery({
    queryKey: ["main-router-connections", currentPage],
    queryFn: () =>
      apiService.routers.getMainRouterConnections({
        page: currentPage,
        limit: itemsPerPage,
      }),
    keepPreviousData: true,
    staleTime: 15000, // 15 seconds
    refetchInterval: autoRefresh ? 15000 : false,
    retry: 1,
  });

  // Main router DHCP leases
  const { data: dhcpLeases, isLoading: dhcpLoading } = useQuery({
    queryKey: ["main-router-dhcp"],
    queryFn: () => apiService.routers.getMainRouterDhcpLeases(),
    staleTime: 30000, // 30 seconds
    refetchInterval: autoRefresh ? 30000 : false,
    retry: 1,
  });

  // Main router resources
  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ["main-router-resources"],
    queryFn: () => apiService.routers.getMainRouterResources(),
    staleTime: 20000, // 20 seconds
    refetchInterval: autoRefresh ? 20000 : false,
    retry: 1,
  });

  // Main router logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["main-router-logs"],
    queryFn: () => apiService.routers.getMainRouterLogs({ limit: 50 }),
    staleTime: 10000, // 10 seconds
    refetchInterval: autoRefresh ? 10000 : false,
    retry: 1,
  });

  // Execute command mutation
  const executeCommandMutation = useMutation({
    mutationFn: (cmd: string) =>
      apiService.routers.executeMainRouterCommand(cmd),
    onSuccess: (result) => {
      setCommandResult(result.output || "Command executed successfully");
      toast.success("Command executed successfully");
    },
    onError: (error: any) => {
      console.error("Command execution failed:", error);
      setCommandResult("Command execution failed: " + error.message);
      toast.error("Command execution failed");
    },
  });

  // Restart router mutation
  const restartMutation = useMutation({
    mutationFn: () => apiService.routers.restartMainRouter(),
    onSuccess: () => {
      toast.success("Router restart initiated");
      queryClient.invalidateQueries({ queryKey: ["main-router-status"] });
    },
    onError: (error: any) => {
      console.error("Router restart failed:", error);
      toast.error("Router restart failed");
    },
  });

  // Generate chart data
  const generateChartData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date();
      hour.setHours(hour.getHours() - (23 - i));
      return hour.toLocaleTimeString([], { hour: "2-digit" });
    });

    return {
      bandwidth: [
        {
          label: "Download (Mbps)",
          data: hours.map((hour, index) => ({
            label: hour,
            value:
              bandwidth?.historical_data?.download?.[index] ||
              Math.floor(Math.random() * 100) + 50,
          })),
          color: "#3b82f6",
        },
        {
          label: "Upload (Mbps)",
          data: hours.map((hour, index) => ({
            label: hour,
            value:
              bandwidth?.historical_data?.upload?.[index] ||
              Math.floor(Math.random() * 50) + 25,
          })),
          color: "#10b981",
        },
      ],
      resources: [
        {
          label: "CPU",
          value: resources?.cpu_usage || 0,
        },
        {
          label: "Memory",
          value: resources?.memory_usage || 0,
        },
        {
          label: "Disk",
          value: resources?.disk_usage || 0,
        },
      ],
    };
  };

  const handleExecuteCommand = () => {
    if (!command.trim()) {
      toast.error("Please enter a command");
      return;
    }
    executeCommandMutation.mutate(command);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getInterfaceStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "success" | "error" | "warning" | "secondary"
    > = {
      up: "success",
      down: "error",
      disabled: "secondary",
      testing: "warning",
    };
    return (
      <Badge
        variant={variants[status] || "secondary"}
        label={status.charAt(0).toUpperCase() + status.slice(1)}
      />
    );
  };

  if (statusError) {
    return (
      <div className="u-p-4">
        <Callout variant="error">
          <strong>Error loading main router data:</strong> {statusError.message}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["main-router-status"],
              })
            }
            className="u-ms-2"
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
          <h1 className="u-h2 u-mb-2">Main Router Dashboard</h1>
          <p className="u-text-secondary-emphasis">
            Comprehensive monitoring and management of the main network router
          </p>
        </div>
        <div className="u-flex u-gap-3 u-items-center">
          <div className="u-flex u-items-center">
            <Toggle
              checked={autoRefresh}
              onChange={(checked) => setAutoRefresh(checked)}
              className="u-me-2"
            />
            <label className="u-text-sm">Auto Refresh</label>
          </div>
          <Select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            options={TIME_RANGES}
            className="u-min-w-150"
          />
          <Button variant="outline" onClick={() => setIsCommandModalOpen(true)}>
            <Icon name="Terminal" size={16} className="u-me-2" />
            Console
          </Button>
          <Button
            variant="error"
            onClick={() => restartMutation.mutate()}
            disabled={restartMutation.isPending}
          >
            {restartMutation.isPending ? (
              <Spinner size="sm" className="u-me-2" />
            ) : (
              <Icon name="ArrowClockwise" size={16} className="u-me-2" />
            )}
            Restart
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      {routerStatus && (
        <Grid className="u-mb-6">
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-flex u-items-center">
                <div className="u-bg-success-subtle u-p-3 u-rounded u-me-3">
                  <Icon
                    name="CheckCircle"
                    size={24}
                    className="u-text-success"
                  />
                </div>
                <div>
                  <h3 className="u-h4 u-mb-1">
                    {routerStatus.uptime
                      ? formatUptime(routerStatus.uptime)
                      : "N/A"}
                  </h3>
                  <p className="u-text-secondary-emphasis u-mb-0">Uptime</p>
                  <Badge variant="success" label="Online" size="sm" />
                </div>
              </div>
            </Card>
          </GridCol>
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-flex u-items-center">
                <div className="u-bg-primary-subtle u-p-3 u-rounded u-me-3">
                  <Icon name="Cpu" size={24} />
                </div>
                <div>
                  <h3 className="u-h4 u-mb-1">{resources?.cpu_usage || 0}%</h3>
                  <p className="u-text-secondary-emphasis u-mb-0">CPU Usage</p>
                  <Progress
                    value={resources?.cpu_usage || 0}
                    size="sm"
                    variant={
                      (resources?.cpu_usage || 0) > 80
                        ? "error"
                        : (resources?.cpu_usage || 0) > 60
                          ? "warning"
                          : "success"
                    }
                  />
                </div>
              </div>
            </Card>
          </GridCol>
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-flex u-items-center">
                <div className="u-bg-info-subtle u-p-3 u-rounded u-me-3">
                  <Icon name="HardDrive" size={24} className="u-text-info" />
                </div>
                <div>
                  <h3 className="u-h4 u-mb-1">
                    {resources?.memory_usage || 0}%
                  </h3>
                  <p className="u-text-secondary-emphasis u-mb-0">
                    Memory Usage
                  </p>
                  <Progress
                    value={resources?.memory_usage || 0}
                    size="sm"
                    variant={
                      (resources?.memory_usage || 0) > 80
                        ? "warning"
                        : "primary"
                    }
                  />
                </div>
              </div>
            </Card>
          </GridCol>
          <GridCol xs={6} lg={3}>
            <Card className="u-p-4">
              <div className="u-flex u-items-center">
                <div className="u-bg-warning-subtle u-p-3 u-rounded u-me-3">
                  <Icon name="Users" size={24} className="u-text-warning" />
                </div>
                <div>
                  <h3 className="u-h4 u-mb-1">{connectionsData?.count || 0}</h3>
                  <p className="u-text-secondary-emphasis u-mb-0">
                    Active Connections
                  </p>
                  <div className="u-text-sm u-text-secondary-emphasis">
                    {dhcpLeases?.count || 0} DHCP leases
                  </div>
                </div>
              </div>
            </Card>
          </GridCol>
        </Grid>
      )}

      {/* Tabs */}
      <div className="u-mb-6">
        <div className="u-flex u-gap-1 u-border-bottom">
          {[
            { id: "overview", label: "Overview", icon: "ChartLine" },
            { id: "interfaces", label: "Interfaces", icon: "Globe" },
            { id: "connections", label: "Connections", icon: "Link" },
            { id: "dhcp", label: "DHCP Leases", icon: "Broadcast" },
            { id: "logs", label: "Logs", icon: "List" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? "primary" : "ghost"}
              size="sm"
              onClick={() => setSelectedTab(tab.id)}
              className="u-rounded-bottom-0"
            >
              <Icon name={tab.icon as any} size={16} className="u-me-2" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === "overview" && (
        <Grid className="u-mb-6">
          <GridCol xs={12} lg={8}>
            <Card className="u-p-4">
              <div className="u-flex u-justify-between u-items-center u-mb-4">
                <h3 className="u-h5 u-mb-0">Bandwidth Usage</h3>
                <Badge variant="info" label={`Last ${selectedTimeRange}`} />
              </div>
              {bandwidthLoading ? (
                <div className="u-text-center u-p-6">
                  <Spinner />
                  <p className="u-mt-2 u-text-secondary-emphasis">
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
              <h3 className="u-h5 u-mb-4">System Resources</h3>
              {resourcesLoading ? (
                <div className="u-text-center u-p-6">
                  <Spinner />
                  <p className="u-mt-2 u-text-secondary-emphasis">
                    Loading resource data...
                  </p>
                </div>
              ) : (
                <DonutChart data={chartData.resources} size="md" />
              )}
            </Card>
          </GridCol>
        </Grid>
      )}

      {selectedTab === "interfaces" && (
        <Card>
          <div className="u-p-4 u-border-bottom">
            <h3 className="u-h5 u-mb-0">Network Interfaces</h3>
          </div>
          {interfacesLoading ? (
            <div className="u-text-center u-p-6">
              <Spinner size="lg" />
              <p className="u-mt-3 u-text-secondary-emphasis">
                Loading interfaces...
              </p>
            </div>
          ) : (
            <DataTable
              data={
                interfaces?.map((iface: any) => ({
                  id: iface.id,
                  interface: (
                    <div>
                      <div className="u-fw-medium">{iface.name}</div>
                      <div className="u-text-secondary-emphasis u-text-sm">
                        {iface.type}
                      </div>
                    </div>
                  ),
                  status: getInterfaceStatusBadge(iface.status),
                  address: (
                    <div>
                      <div className="u-text-sm">
                        {iface.ip_address || "N/A"}
                      </div>
                      <div className="u-text-secondary-emphasis u-text-sm">
                        {iface.mac_address || "N/A"}
                      </div>
                    </div>
                  ),
                  traffic: (
                    <div>
                      <div className="u-text-sm">
                        <Icon
                          name="ArrowDown"
                          size={12}
                          className="u-me-1 u-text-success"
                        />
                        RX: {formatBytes(iface.rx_bytes || 0)}
                      </div>
                      <div className="u-text-sm">
                        <Icon
                          name="ArrowUp"
                          size={12}
                          className="u-me-1 u-text-info"
                        />
                        TX: {formatBytes(iface.tx_bytes || 0)}
                      </div>
                    </div>
                  ),
                  mtu: iface.mtu || "N/A",
                })) || []
              }
              columns={[
                { key: "interface", title: "Interface" },
                { key: "status", title: "Status" },
                { key: "address", title: "Address" },
                { key: "traffic", title: "Traffic" },
                { key: "mtu", title: "MTU" },
              ]}
            />
          )}
        </Card>
      )}

      {selectedTab === "connections" && (
        <Card>
          <div className="u-p-4 u-border-bottom">
            <h3 className="u-h5 u-mb-0">Active Connections</h3>
          </div>
          {connectionsLoading ? (
            <div className="u-text-center u-p-6">
              <Spinner size="lg" />
              <p className="u-mt-3 u-text-secondary-emphasis">
                Loading connections...
              </p>
            </div>
          ) : (
            <>
              <DataTable
                data={
                  connectionsData?.results?.map((conn: any, index: number) => ({
                    id: index,
                    client: (
                      <div>
                        <div className="u-fw-medium">
                          {conn.client_name || "Unknown"}
                        </div>
                        <div className="u-text-secondary-emphasis u-text-sm">
                          {conn.mac_address || "N/A"}
                        </div>
                      </div>
                    ),
                    address: conn.ip_address || "N/A",
                    protocol: (
                      <Badge
                        variant="secondary"
                        label={conn.protocol || "TCP"}
                        size="sm"
                      />
                    ),
                    port: `${conn.local_port || "N/A"} → ${conn.remote_port || "N/A"}`,
                    duration: conn.duration || "N/A",
                    traffic: (
                      <div>
                        <div className="u-text-sm">
                          ↓ {formatBytes(conn.bytes_received || 0)}
                        </div>
                        <div className="u-text-sm">
                          ↑ {formatBytes(conn.bytes_sent || 0)}
                        </div>
                      </div>
                    ),
                  })) || []
                }
                columns={[
                  { key: "client", title: "Client" },
                  { key: "address", title: "IP Address" },
                  { key: "protocol", title: "Protocol" },
                  { key: "port", title: "Ports" },
                  { key: "duration", title: "Duration" },
                  { key: "traffic", title: "Traffic" },
                ]}
              />

              {connectionsData &&
                Math.ceil((connectionsData.count || 0) / itemsPerPage) > 1 && (
                  <div className="u-p-4 u-border-top">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(
                        (connectionsData.count || 0) / itemsPerPage,
                      )}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
            </>
          )}
        </Card>
      )}

      {selectedTab === "dhcp" && (
        <Card>
          <div className="u-p-4 u-border-bottom">
            <h3 className="u-h5 u-mb-0">DHCP Leases</h3>
          </div>
          {dhcpLoading ? (
            <div className="u-text-center u-p-6">
              <Spinner size="lg" />
              <p className="u-mt-3 u-text-secondary-emphasis">
                Loading DHCP leases...
              </p>
            </div>
          ) : (
            <DataTable
              data={
                dhcpLeases?.results?.map((lease: any) => ({
                  id: lease.id,
                  client: (
                    <div>
                      <div className="u-fw-medium">
                        {lease.hostname || "Unknown"}
                      </div>
                      <div className="u-text-secondary-emphasis u-text-sm">
                        {lease.mac_address}
                      </div>
                    </div>
                  ),
                  address: lease.ip_address,
                  status: (
                    <Badge
                      variant={
                        lease.status === "active" ? "success" : "secondary"
                      }
                      label={lease.status === "active" ? "Active" : "Expired"}
                      size="sm"
                    />
                  ),
                  lease_time: lease.lease_time || "N/A",
                  expires: lease.expires_at
                    ? new Date(lease.expires_at).toLocaleString()
                    : "N/A",
                })) || []
              }
              columns={[
                { key: "client", title: "Client" },
                { key: "address", title: "IP Address" },
                { key: "status", title: "Status" },
                { key: "lease_time", title: "Lease Time" },
                { key: "expires", title: "Expires" },
              ]}
            />
          )}
        </Card>
      )}

      {selectedTab === "logs" && (
        <Card>
          <div className="u-p-4 u-border-bottom">
            <h3 className="u-h5 u-mb-0">System Logs</h3>
          </div>
          {logsLoading ? (
            <div className="u-text-center u-p-6">
              <Spinner size="lg" />
              <p className="u-mt-3 u-text-secondary-emphasis">
                Loading logs...
              </p>
            </div>
          ) : (
            <div className="u-p-4">
              {logs && logs.length > 0 ? (
                <div className="u-space-y-2 u-max-h-125 u-overflow-y-auto">
                  {logs.map((log: any, index: number) => (
                    <div
                      key={index}
                      className="u-p-3 u-bg-gray-subtle u-rounded u-flex u-justify-between"
                    >
                      <div className="u-flex-1">
                        <div className="u-text-sm u-fw-medium u-mb-1">
                          {log.message || sanitizeText(log.log_entry)}
                        </div>
                        <div className="u-text-secondary-emphasis u-text-sm">
                          {log.level && (
                            <Badge
                              variant={
                                log.level === "error"
                                  ? "error"
                                  : log.level === "warning"
                                    ? "warning"
                                    : "secondary"
                              }
                              label={log.level.toUpperCase()}
                              size="sm"
                              className="u-me-2"
                            />
                          )}
                          {log.timestamp
                            ? new Date(log.timestamp).toLocaleString()
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="u-text-center u-p-6">
                  <Icon
                    name="FileText"
                    size={48}
                    className="u-text-secondary-emphasis u-mb-3"
                  />
                  <h3 className="u-h6 u-mb-2">No logs available</h3>
                  <p className="u-text-secondary-emphasis">
                    System logs will appear here when available
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Command Modal */}
      <Modal
        isOpen={isCommandModalOpen}
        onClose={() => {
          setIsCommandModalOpen(false);
          setCommand("");
          setCommandResult("");
        }}
        title="Router Console"
        size="lg"
      >
        <div className="u-space-y-4">
          <div>
            <label className="u-block u-mb-2 u-fw-medium">Command</label>
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter RouterOS command..."
            />
          </div>

          {commandResult && (
            <div>
              <label className="u-block u-mb-2 u-fw-medium">Output</label>
              <Textarea
                value={commandResult}
                readOnly
                rows={10}
                className="u-bg-gray-subtle"
              />
            </div>
          )}
        </div>

        <div className="u-flex u-justify-end u-gap-3 u-mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setIsCommandModalOpen(false);
              setCommand("");
              setCommandResult("");
            }}
            disabled={executeCommandMutation.isPending}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleExecuteCommand}
            disabled={executeCommandMutation.isPending || !command.trim()}
          >
            {executeCommandMutation.isPending ? (
              <>
                <Spinner size="sm" className="u-me-2" />
                Executing...
              </>
            ) : (
              "Execute"
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default MainRouterDashboard;
