# Router Integration Documentation

## Overview

This document describes the integration with the main router at IP `103.115.252.60` and the comprehensive router management system built into the ISP Admin Panel.

## Main Router Configuration

### Router Details
- **IP Address**: `103.115.252.60`
- **Type**: MikroTik RouterOS
- **API Port**: 8728 (default MikroTik API port)
- **SSH Port**: 22 (default SSH port)
- **Protocol**: API over TCP

### Integration Features

The router integration provides the following capabilities:

1. **Real-time Monitoring**
   - Live status monitoring
   - Bandwidth usage tracking
   - System resource monitoring
   - Connection tracking
   - DHCP lease management

2. **Configuration Management**
   - Interface configuration
   - Firewall rule management
   - DHCP server configuration
   - Queue tree management
   - Bandwidth limiting

3. **System Administration**
   - Command execution
   - Log monitoring
   - Firmware management
   - Backup and restore
   - System restart/shutdown

4. **Security Features**
   - Security status monitoring
   - Alert management
   - Access control
   - Audit logging

## Pages and Components

### 1. Router Management (`/routers`)
General router management page that allows:
- Adding new routers
- Editing existing router configurations
- Testing router connections
- Managing multiple routers

### 2. Main Router Dashboard (`/main-router`)
Specialized dashboard for the main router at `103.115.252.60` featuring:
- Real-time status monitoring
- Tabbed interface for different aspects
- Command execution interface
- System resource monitoring

## API Endpoints

### Router Service Endpoints

The router integration uses the following API endpoints:

#### Main Router Specific Endpoints
```
GET    /api/network/routers/main/status/           # Get router status
GET    /api/network/routers/main/interfaces/       # Get interface information
GET    /api/network/routers/main/bandwidth/        # Get bandwidth usage
GET    /api/network/routers/main/connections/      # Get active connections
GET    /api/network/routers/main/dhcp-leases/      # Get DHCP leases
GET    /api/network/routers/main/resources/        # Get system resources
GET    /api/network/routers/main/logs/             # Get system logs
GET    /api/network/routers/main/alerts/           # Get system alerts
POST   /api/network/routers/main/execute/          # Execute command
POST   /api/network/routers/main/test-connection/  # Test connection
POST   /api/network/routers/main/restart/          # Restart router
POST   /api/network/routers/main/shutdown/         # Shutdown router
```

#### Advanced Management Endpoints
```
GET    /api/network/routers/main/firewall-rules/   # Get firewall rules
GET    /api/network/routers/main/queue-tree/       # Get queue tree
GET    /api/network/routers/main/wireless-clients/ # Get wireless clients
GET    /api/network/routers/main/performance/      # Get performance metrics
GET    /api/network/routers/main/security/         # Get security status
GET    /api/network/routers/main/firmware/         # Get firmware info
GET    /api/network/routers/main/backup/           # Get configuration backup
GET    /api/network/routers/main/export-config/    # Export configuration
POST   /api/network/routers/main/import-config/    # Import configuration
POST   /api/network/routers/main/bandwidth-limit/  # Add bandwidth limit
DELETE /api/network/routers/main/bandwidth-limit/  # Remove bandwidth limit
```

## Data Models

### Router Status Response
```typescript
interface RouterStatus {
  status: 'online' | 'offline' | 'maintenance';
  uptime: string;
  version: string;
  last_seen: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  temperature: number;
}
```

### Interface Information
```typescript
interface RouterInterface {
  name: string;
  type: string;
  status: string;
  ip_address: string;
  mac_address: string;
  speed: string;
}
```

### Bandwidth Usage
```typescript
interface BandwidthUsage {
  total_download: number;
  total_upload: number;
  download_speed: number;
  upload_speed: number;
  interfaces: {
    [interface_name: string]: {
      download: number;
      upload: number;
    };
  };
}
```

### DHCP Lease
```typescript
interface DHCPLease {
  ip_address: string;
  mac_address: string;
  hostname: string;
  status: string;
  expires: string;
}
```

## Usage Examples

### Testing Router Connection
```typescript
import { routerService } from '@/services/routerService';

// Test connection to main router
const testConnection = async () => {
  try {
    const result = await routerService.testMainRouterConnection();
    console.log('Connection successful:', result);
  } catch (error) {
    console.error('Connection failed:', error);
  }
};
```

### Executing Router Commands
```typescript
// Execute a MikroTik command
const executeCommand = async (command: string) => {
  try {
    const result = await routerService.executeMainRouterCommand(command);
    console.log('Command result:', result);
  } catch (error) {
    console.error('Command failed:', error);
  }
};

// Example commands
executeCommand('/interface print');           // List interfaces
executeCommand('/ip dhcp-server lease print'); // List DHCP leases
executeCommand('/system resource print');     // Get system resources
```

### Monitoring Bandwidth
```typescript
// Get real-time bandwidth usage
const getBandwidth = async () => {
  try {
    const bandwidth = await routerService.getMainRouterBandwidth();
    console.log('Download:', routerService.formatBandwidth(bandwidth.total_download));
    console.log('Upload:', routerService.formatBandwidth(bandwidth.total_upload));
  } catch (error) {
    console.error('Failed to get bandwidth:', error);
  }
};
```

## Security Considerations

### Authentication
- All router API calls require proper authentication
- Credentials are stored securely and not exposed in frontend code
- API tokens are used for router communication

### Access Control
- Router management is restricted to admin and support roles
- Command execution requires additional confirmation
- All actions are logged for audit purposes

### Network Security
- Router communication uses encrypted channels
- API endpoints are protected by authentication middleware
- Rate limiting is implemented to prevent abuse

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check if router is accessible at `103.115.252.60`
   - Verify API port 8728 is open
   - Check firewall rules

2. **Authentication Failed**
   - Verify router credentials
   - Check API user permissions
   - Ensure API is enabled on router

3. **Command Execution Failed**
   - Verify command syntax
   - Check user permissions for specific commands
   - Review router logs for errors

### Debug Information

Enable debug logging by setting the appropriate environment variables:
```bash
DEBUG_ROUTER=true
DEBUG_API=true
```

### Log Locations
- Frontend logs: Browser console
- Backend logs: `/backend/logs/django.log`
- Router logs: Available through the router interface

## Performance Optimization

### Caching Strategy
- Router status cached for 10 seconds
- Interface data cached for 30 seconds
- Bandwidth data cached for 5 seconds
- Resource data cached for 20 seconds

### Real-time Updates
- WebSocket connections for live data
- Polling intervals optimized for different data types
- Background refresh to maintain data freshness

## Future Enhancements

### Planned Features
1. **Advanced Monitoring**
   - Custom alert rules
   - Performance baselines
   - Trend analysis

2. **Configuration Management**
   - Configuration templates
   - Bulk configuration updates
   - Configuration validation

3. **Automation**
   - Scheduled tasks
   - Automated backups
   - Self-healing capabilities

4. **Integration**
   - SNMP monitoring
   - Third-party monitoring tools
   - API integrations

## Support and Maintenance

### Regular Maintenance
- Monitor router performance
- Review system logs
- Update firmware when available
- Backup configurations regularly

### Support Contacts
- Technical support: [support@company.com]
- Emergency contact: [emergency@company.com]
- Documentation: [docs.company.com]

## Conclusion

The router integration provides comprehensive management capabilities for the main router at `103.115.252.60`. The system is designed to be secure, reliable, and user-friendly while providing powerful monitoring and management features.

For additional support or questions, please refer to the main documentation or contact the development team.
