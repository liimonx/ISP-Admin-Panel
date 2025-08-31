import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Button,
  Icon,
  Grid,
  GridCol,
  Badge,
  Input,
  Modal,
  Callout,
  Progress,
} from "@shohojdhara/atomix";
import { routerService, MAIN_ROUTER_IP } from "@/services/routerService";

const MainRouterDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [commandResult, setCommandResult] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");

  // Main router status
  const { data: routerStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["main-router-status"],
    queryFn: () => routerService.getMainRouterStatus(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Main router interfaces
  const { data: interfaces, isLoading: interfacesLoading } = useQuery({
    queryKey: ["main-router-interfaces"],
    queryFn: () => routerService.getMainRouterInterfaces(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Main router bandwidth
  const { data: bandwidth, isLoading: bandwidthLoading } = useQuery({
    queryKey: ["main-router-bandwidth"],
    queryFn: () => routerService.getMainRouterBandwidth(),
    refetchInterval: 5000, // Refresh every 5 seconds for real-time data
  });

  // Main router connections
  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ["main-router-connections"],
    queryFn: () => routerService.getMainRouterConnections(),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Main router DHCP leases
  const { data: dhcpLeases, isLoading: dhcpLoading } = useQuery({
    queryKey: ["main-router-dhcp"],
    queryFn: () => routerService.getMainRouterDHCPLeases(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Main router resources
  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ["main-router-resources"],
    queryFn: () => routerService.getMainRouterResources(),
    refetchInterval: 20000, // Refresh every 20 seconds
  });

  // Main router logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["main-router-logs"],
    queryFn: () => routerService.getMainRouterLogs(50),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Main router alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["main-router-alerts"],
    queryFn: () => routerService.getMainRouterAlerts(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Execute command mutation
  const executeCommandMutation = useMutation({
    mutationFn: (command: string) => routerService.executeMainRouterCommand(command),
    onSuccess: (data) => {
      setCommandResult(data.result || data.message || "Command executed successfully");
    },
    onError: (error: any) => {
      setCommandResult(error.response?.data?.message || "Command execution failed");
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: () => routerService.testMainRouterConnection(),
    onSuccess: (data) => {
      console.log("Connection test successful:", data);
    },
  });

  // Restart router mutation
  const restartMutation = useMutation({
    mutationFn: () => routerService.restartMainRouter(),
    onSuccess: () => {
      console.log("Router restart initiated");
    },
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId: string) => routerService.acknowledgeMainRouterAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["main-router-alerts"] });
    },
  });

  const handleExecuteCommand = () => {
    if (command.trim()) {
      executeCommandMutation.mutate(command);
    }
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate();
  };

  const handleRestartRouter = () => {
    if (window.confirm("Are you sure you want to restart the main router? This will temporarily disconnect all clients.")) {
      restartMutation.mutate();
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    acknowledgeAlertMutation.mutate(alertId);
  };

  const getStatusBadge = (status: string) => {
    const color = routerService.getConnectionStatusColor(status);
    return (
      <Badge
        variant={color as any}
        size="sm"
        label={status.charAt(0).toUpperCase() + status.slice(1)}
      />
    );
  };

  const formatBandwidth = (bytes: number) => {
    return routerService.formatBandwidth(bytes);
  };

  const formatDataUsage = (bytes: number) => {
    return routerService.formatDataUsage(bytes);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="u-d-flex u-justify-content-between u-align-items-center u-mb-6">
        <div>
          <h1 className="u-mb-2">Main Router Dashboard</h1>
          <p className="u-text-secondary">
            Real-time monitoring and management of main router at {MAIN_ROUTER_IP}
          </p>
        </div>
        <div className="u-d-flex u-gap-2">
          <Button 
            variant="outline" 
            size="md"
            onClick={handleTestConnection}
                          disabled={testConnectionMutation.isPending}
          >
            <Icon name="Globe" size={16} />
            Test Connection
          </Button>
          <Button 
            variant="outline" 
            size="md"
            onClick={() => setIsCommandModalOpen(true)}
          >
            <Icon name="Terminal" size={16} />
            Execute Command
          </Button>
          <Button 
            variant="error" 
            size="md"
            onClick={handleRestartRouter}
                          disabled={restartMutation.isPending}
          >
            <Icon name="ArrowClockwise" size={16} />
            Restart Router
          </Button>
        </div>
      </div>

      {/* Main Router Status Card */}
      <Card className="u-mb-6 u-border-primary">
        <div className="u-d-flex u-justify-content-between u-align-items-center">
          <div>
            <h3 className="u-mb-2">Main Router Status</h3>
            <p className="u-text-secondary u-mb-2">
              IP: {MAIN_ROUTER_IP} | Type: MikroTik RouterOS
            </p>
            <div className="u-d-flex u-gap-2 u-mb-3">
              {routerStatus ? getStatusBadge(routerStatus.status) : getStatusBadge("loading")}
              <Badge variant="primary" size="sm" label="MikroTik" />
            </div>
            {routerStatus && (
              <div className="u-text-sm u-text-secondary">
                <div>Uptime: {routerStatus.uptime || "N/A"}</div>
                <div>Version: {routerStatus.version || "N/A"}</div>
                <div>Last Seen: {routerStatus.last_seen ? new Date(routerStatus.last_seen).toLocaleString() : "N/A"}</div>
              </div>
            )}
          </div>
          <div className="u-text-right">
            <div className="u-d-flex u-gap-2">
              <Button variant="primary" size="sm">
                <Icon name="Gear" size={16} />
                Configure
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div className="u-mb-6">
        <div className="u-d-flex u-gap-1 u-border-bottom">
          {[
            { id: "overview", label: "Overview" },
            { id: "interfaces", label: "Interfaces" },
            { id: "bandwidth", label: "Bandwidth" },
            { id: "connections", label: "Connections" },
            { id: "dhcp", label: "DHCP" },
            { id: "resources", label: "Resources" },
            { id: "logs", label: "Logs" },
            { id: "alerts", label: "Alerts" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? "primary" : "outline"}
              size="sm"
              onClick={() => setSelectedTab(tab.id)}
              className="u-border-radius-0 u-border-bottom-0"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {selectedTab === "overview" && (
          <Grid>
            <GridCol xs={12} md={6} lg={3}>
              <Card>
                <div className="u-text-center">
                  <Icon name="Globe" size={32} className="u-text-success u-mb-2" />
                  <h3 className="u-mb-1">{connections?.total_connections || 0}</h3>
                  <p className="u-text-secondary">Active Connections</p>
                </div>
              </Card>
            </GridCol>
            <GridCol xs={12} md={6} lg={3}>
              <Card>
                <div className="u-text-center">
                  <Icon name="TrendDown" size={32} className="u-text-primary u-mb-2" />
                  <h3 className="u-mb-1">{formatBandwidth(bandwidth?.total_download || 0)}</h3>
                  <p className="u-text-secondary">Download Speed</p>
                </div>
              </Card>
            </GridCol>
            <GridCol xs={12} md={6} lg={3}>
              <Card>
                <div className="u-text-center">
                  <Icon name="TrendUp" size={32} className="u-text-warning u-mb-2" />
                  <h3 className="u-mb-1">{formatBandwidth(bandwidth?.total_upload || 0)}</h3>
                  <p className="u-text-secondary">Upload Speed</p>
                </div>
              </Card>
            </GridCol>
            <GridCol xs={12} md={6} lg={3}>
              <Card>
                <div className="u-text-center">
                  <Icon name="Users" size={32} className="u-text-info u-mb-2" />
                  <h3 className="u-mb-1">{dhcpLeases?.total_leases || 0}</h3>
                  <p className="u-text-secondary">DHCP Leases</p>
                </div>
              </Card>
            </GridCol>
          </Grid>
        )}

        {/* System Resources */}
        {selectedTab === "overview" && resources && (
          <Card className="u-mt-6">
            <h3 className="u-mb-4">System Resources</h3>
            <Grid>
              <GridCol xs={12} md={4}>
                <div className="u-mb-4">
                  <div className="u-d-flex u-justify-content-between u-mb-2">
                    <span>CPU Usage</span>
                    <span>{resources.cpu_usage || 0}%</span>
                  </div>
                  <Progress value={resources.cpu_usage || 0} className="u-mb-2" />
                </div>
              </GridCol>
              <GridCol xs={12} md={4}>
                <div className="u-mb-4">
                  <div className="u-d-flex u-justify-content-between u-mb-2">
                    <span>Memory Usage</span>
                    <span>{resources.memory_usage || 0}%</span>
                  </div>
                  <Progress value={resources.memory_usage || 0} className="u-mb-2" />
                </div>
              </GridCol>
              <GridCol xs={12} md={4}>
                <div className="u-mb-4">
                  <div className="u-d-flex u-justify-content-between u-mb-2">
                    <span>Disk Usage</span>
                    <span>{resources.disk_usage || 0}%</span>
                  </div>
                  <Progress value={resources.disk_usage || 0} className="u-mb-2" />
                </div>
              </GridCol>
            </Grid>
          </Card>
        )}

        {/* Interfaces Tab */}
        {selectedTab === "interfaces" && (
          <Card>
            <h3 className="u-mb-4">Network Interfaces</h3>
            {interfacesLoading ? (
              <div className="u-text-center u-py-8">
                <Icon name="Spinner" size={32} className="u-text-primary u-mb-2" />
                <p>Loading interfaces...</p>
              </div>
            ) : (
              <Grid>
                {interfaces?.map((interface_: any, index: number) => (
                  <GridCol key={index} xs={12} md={6} lg={4}>
                    <Card className="u-height-100">
                      <div className="u-d-flex u-justify-content-between u-align-items-start u-mb-3">
                        <div>
                          <h4 className="u-mb-1">{interface_.name}</h4>
                          <p className="u-text-sm u-text-secondary">{interface_.type}</p>
                        </div>
                        {getStatusBadge(interface_.status)}
                      </div>
                      <div className="u-space-y-2">
                        <div className="u-d-flex u-justify-content-between">
                          <span className="u-text-sm">IP Address:</span>
                          <span className="u-text-sm u-font-mono">{interface_.ip_address || "N/A"}</span>
                        </div>
                        <div className="u-d-flex u-justify-content-between">
                          <span className="u-text-sm">MAC Address:</span>
                          <span className="u-text-sm u-font-mono">{interface_.mac_address || "N/A"}</span>
                        </div>
                        <div className="u-d-flex u-justify-content-between">
                          <span className="u-text-sm">Speed:</span>
                          <span className="u-text-sm">{interface_.speed || "N/A"}</span>
                        </div>
                      </div>
                    </Card>
                  </GridCol>
                ))}
              </Grid>
            )}
          </Card>
        )}

        {/* Bandwidth Tab */}
        {selectedTab === "bandwidth" && (
          <Card>
            <h3 className="u-mb-4">Bandwidth Usage</h3>
            {bandwidthLoading ? (
              <div className="u-text-center u-py-8">
                <Icon name="Spinner" size={32} className="u-text-primary u-mb-2" />
                <p>Loading bandwidth data...</p>
              </div>
            ) : (
              <Grid>
                <GridCol xs={12} md={6}>
                  <Card>
                    <h4 className="u-mb-3">Download</h4>
                    <div className="u-text-center">
                      <h2 className="u-text-primary u-mb-2">{formatBandwidth(bandwidth?.total_download || 0)}</h2>
                      <p className="u-text-secondary">Total Download Speed</p>
                    </div>
                  </Card>
                </GridCol>
                <GridCol xs={12} md={6}>
                  <Card>
                    <h4 className="u-mb-3">Upload</h4>
                    <div className="u-text-center">
                      <h2 className="u-text-warning u-mb-2">{formatBandwidth(bandwidth?.total_upload || 0)}</h2>
                      <p className="u-text-secondary">Total Upload Speed</p>
                    </div>
                  </Card>
                </GridCol>
              </Grid>
            )}
          </Card>
        )}

        {/* Connections Tab */}
        {selectedTab === "connections" && (
          <Card>
            <h3 className="u-mb-4">Active Connections</h3>
            {connectionsLoading ? (
              <div className="u-text-center u-py-8">
                <Icon name="Spinner" size={32} className="u-text-primary u-mb-2" />
                <p>Loading connections...</p>
              </div>
            ) : (
              <div className="u-overflow-x-auto">
                <table className="u-w-100">
                  <thead>
                    <tr className="u-border-bottom">
                      <th className="u-text-left u-p-3">Protocol</th>
                      <th className="u-text-left u-p-3">Source</th>
                      <th className="u-text-left u-p-3">Destination</th>
                      <th className="u-text-left u-p-3">State</th>
                      <th className="u-text-left u-p-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connections?.connections?.map((conn: any, index: number) => (
                      <tr key={index} className="u-border-bottom">
                        <td className="u-p-3">{conn.protocol}</td>
                        <td className="u-p-3 u-font-mono">{conn.source}</td>
                        <td className="u-p-3 u-font-mono">{conn.destination}</td>
                        <td className="u-p-3">{getStatusBadge(conn.state)}</td>
                        <td className="u-p-3">{conn.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* DHCP Tab */}
        {selectedTab === "dhcp" && (
          <Card>
            <h3 className="u-mb-4">DHCP Leases</h3>
            {dhcpLoading ? (
              <div className="u-text-center u-py-8">
                <Icon name="Spinner" size={32} className="u-text-primary u-mb-2" />
                <p>Loading DHCP leases...</p>
              </div>
            ) : (
              <div className="u-overflow-x-auto">
                <table className="u-w-100">
                  <thead>
                    <tr className="u-border-bottom">
                      <th className="u-text-left u-p-3">IP Address</th>
                      <th className="u-text-left u-p-3">MAC Address</th>
                      <th className="u-text-left u-p-3">Hostname</th>
                      <th className="u-text-left u-p-3">Status</th>
                      <th className="u-text-left u-p-3">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dhcpLeases?.leases?.map((lease: any, index: number) => (
                      <tr key={index} className="u-border-bottom">
                        <td className="u-p-3 u-font-mono">{lease.ip_address}</td>
                        <td className="u-p-3 u-font-mono">{lease.mac_address}</td>
                        <td className="u-p-3">{lease.hostname || "N/A"}</td>
                        <td className="u-p-3">{getStatusBadge(lease.status)}</td>
                        <td className="u-p-3">{lease.expires}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Resources Tab */}
        {selectedTab === "resources" && (
          <Card>
            <h3 className="u-mb-4">System Resources</h3>
            {resourcesLoading ? (
              <div className="u-text-center u-py-8">
                <Icon name="Spinner" size={32} className="u-text-primary u-mb-2" />
                <p>Loading resource data...</p>
              </div>
            ) : (
              <Grid>
                <GridCol xs={12} md={6}>
                  <Card>
                    <h4 className="u-mb-3">CPU Usage</h4>
                    <div className="u-text-center u-mb-4">
                      <h2 className="u-text-primary">{resources?.cpu_usage || 0}%</h2>
                    </div>
                    <Progress value={resources?.cpu_usage || 0} />
                  </Card>
                </GridCol>
                <GridCol xs={12} md={6}>
                  <Card>
                    <h4 className="u-mb-3">Memory Usage</h4>
                    <div className="u-text-center u-mb-4">
                      <h2 className="u-text-warning">{resources?.memory_usage || 0}%</h2>
                    </div>
                    <Progress value={resources?.memory_usage || 0} />
                  </Card>
                </GridCol>
                <GridCol xs={12} md={6}>
                  <Card>
                    <h4 className="u-mb-3">Disk Usage</h4>
                    <div className="u-text-center u-mb-4">
                      <h2 className="u-text-error">{resources?.disk_usage || 0}%</h2>
                    </div>
                    <Progress value={resources?.disk_usage || 0} />
                  </Card>
                </GridCol>
                <GridCol xs={12} md={6}>
                  <Card>
                    <h4 className="u-mb-3">Temperature</h4>
                    <div className="u-text-center">
                      <h2 className="u-text-info">{resources?.temperature || "N/A"}°C</h2>
                    </div>
                  </Card>
                </GridCol>
              </Grid>
            )}
          </Card>
        )}

        {/* Logs Tab */}
        {selectedTab === "logs" && (
          <Card>
            <h3 className="u-mb-4">System Logs</h3>
            {logsLoading ? (
              <div className="u-text-center u-py-8">
                <Icon name="Spinner" size={32} className="u-text-primary u-mb-2" />
                <p>Loading logs...</p>
              </div>
            ) : (
              <div className="u-max-height-400 u-overflow-y-auto">
                {logs?.logs?.map((log: any, index: number) => (
                  <div key={index} className="u-p-3 u-border-bottom">
                    <div className="u-d-flex u-justify-content-between u-mb-1">
                      <span className="u-text-sm u-font-mono">{log.timestamp}</span>
                      <Badge variant="secondary" size="sm" label={log.level} />
                    </div>
                    <p className="u-text-sm">{log.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Alerts Tab */}
        {selectedTab === "alerts" && (
          <Card>
            <h3 className="u-mb-4">System Alerts</h3>
            {alertsLoading ? (
              <div className="u-text-center u-py-8">
                <Icon name="Spinner" size={32} className="u-text-primary u-mb-2" />
                <p>Loading alerts...</p>
              </div>
            ) : (
              <div>
                {alerts?.alerts?.map((alert: any, index: number) => (
                  <Card key={index} className="u-mb-3">
                    <div className="u-d-flex u-justify-content-between u-align-items-start">
                      <div className="u-flex-1">
                        <div className="u-d-flex u-align-items-center u-gap-2 u-mb-2">
                          <Icon 
                            name={alert.severity === "high" ? "Warning" : "Info"} 
                            size={16} 
                            className={alert.severity === "high" ? "u-text-error" : "u-text-warning"} 
                          />
                          <h4 className="u-mb-1">{alert.title}</h4>
                          <Badge variant={alert.severity === "high" ? "error" : "warning"} size="sm" label={alert.severity} />
                        </div>
                        <p className="u-text-secondary u-mb-2">{alert.message}</p>
                        <div className="u-text-sm u-text-secondary">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          disabled={acknowledgeAlertMutation.isPending}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Execute Command Modal */}
      <Modal
        isOpen={isCommandModalOpen}
        onClose={() => {
          setIsCommandModalOpen(false);
          setCommand("");
          setCommandResult("");
        }}
        title="Execute Router Command"
        size="lg"
      >
        <div className="u-space-y-4">
          <div>
            <label htmlFor="command" className="u-d-block u-fs-sm u-fw-medium u-mb-1">Command</label>
            <Input
              id="command"
              type="text"
              placeholder="Enter MikroTik command (e.g., /interface print)"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
            />
          </div>
          
          {commandResult && (
            <div>
              <label className="u-d-block u-fs-sm u-fw-medium u-mb-1">Result</label>
              <div className="u-p-3 u-bg-gray-100 u-border-radius-2 u-font-mono u-text-sm u-max-height-200 u-overflow-y-auto">
                {commandResult}
              </div>
            </div>
          )}
          
          <div className="u-d-flex u-justify-content-end u-gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCommandModalOpen(false);
                setCommand("");
                setCommandResult("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExecuteCommand}
              disabled={executeCommandMutation.isPending}
            >
              Execute
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MainRouterDashboard;
