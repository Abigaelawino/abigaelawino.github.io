# MCP Server Health Monitoring System

This document describes the comprehensive monitoring system implemented for Model Context Protocol (MCP) servers used by Ralph TUI.

## Overview

The MCP monitoring system provides real-time health checking, alerting, and dashboard visualization for MCP servers. It monitors server availability, response times, error rates, and provides automated alerting when issues are detected.

## Architecture

### Core Components

1. **Health Monitor Script** (`scripts/mcp-monitor.mjs`)
   - Performs periodic health checks on configured MCP servers
   - Tracks response times, error rates, and availability metrics
   - Generates alerts for server downtime and performance degradation
   - Stores historical data for trend analysis

2. **Monitoring Dashboard** (`scripts/mcp-dashboard.mjs`)
   - Real-time ASCII dashboard showing server status
   - Displays recent alerts and performance metrics
   - Provides quick action commands for monitoring management
   - Auto-refresh capability for continuous monitoring

3. **GitHub Actions Workflow** (`.github/workflows/mcp-monitoring.yml`)
   - Automated monitoring runs every 5 minutes
   - Creates GitHub issues for critical alerts
   - Uploads monitoring data as artifacts
   - Provides manual triggers for specific server checks

4. **Test Suite** (`test/mcp-monitoring.test.js`)
   - Comprehensive test coverage for all monitoring components
   - Simulates various failure scenarios
   - Validates data storage and alert generation

## Configured MCP Servers

### Netlify MCP Server

- **Command**: `npx -y @netlify/mcp`
- **Expected Response Time**: 2000ms
- **Timeout**: 10000ms
- **Health Check**: Basic connectivity test

### shadcn/ui MCP Server

- **Command**: `./node_modules/.bin/shadcn mcp`
- **Expected Response Time**: 1500ms
- **Timeout**: 8000ms
- **Health Check**: Component list verification

## Usage

### Command Line Interface

#### Health Monitoring

```bash
# Run one-time health check on all servers
npm run mcp-monitor check

# Check specific server
npm run mcp-monitor server netlify
npm run mcp-monitor server shadcn

# Generate monitoring report
npm run mcp-monitor report

# Start continuous monitoring
npm run mcp-monitor watch
```

#### Dashboard

```bash
# Display current dashboard
npm run mcp-dashboard

# Refresh dashboard data
npm run mcp-dashboard refresh

# Auto-refresh dashboard every 30 seconds
npm run mcp-dashboard watch
```

### GitHub Actions

#### Automated Monitoring

- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Manual Trigger**: Available with parameters:
  - `action`: `check`, `report`, or `server`
  - `server`: Specific server ID (optional)

#### Alert Integration

- Creates GitHub issues for critical alerts
- Uploads monitoring data as workflow artifacts
- Generates status summaries with server health information

## Monitoring Metrics

### Health Status Categories

- **Healthy**: Server responding within expected timeframes
- **Degraded**: Server responding but slower than expected
- **Unhealthy**: Server not responding or returning errors
- **Unavailable**: Server command not found

### Tracked Metrics

- **Response Time**: Milliseconds for server to respond
- **Uptime Percentage**: Percentage of successful checks in last 24 hours
- **Error Rate**: Frequency of failed health checks
- **Status Changes**: Historical tracking of health status transitions
- **Performance Trends**: Average response times over recent checks

### Alert Types

- **server_down**: Server completely unavailable
- **performance_degradation**: Response time exceeds 2x expected threshold
- **timeout**: Server takes longer than configured timeout

## Data Storage

### File Structure

```
.mcp-monitoring/
├── metrics.json          # Comprehensive server metrics
├── latest-report.json   # Latest monitoring summary
└── alerts.jsonl        # Historical alert log
```

### Data Retention

- **Metrics**: Last 100 health checks per server
- **Alerts**: Stored indefinitely in JSONL format
- **Dashboard**: Real-time generation from stored data

## Alert System

### Alert Conditions

1. **Critical Alerts** (Immediate notification)
   - Server completely unreachable
   - Multiple consecutive failures

2. **Warning Alerts** (Performance issues)
   - Response time > 2x expected threshold
   - Intermittent failures

### Alert Delivery

- **Console Output**: Immediate display during monitoring
- **File Logging**: Persistent storage in `alerts.jsonl`
- **GitHub Issues**: Automatic creation for critical alerts
- **Future Extensions**: Slack, email, webhook integrations

### Alert Cooldown

- **Duration**: 5 minutes between identical alerts
- **Purpose**: Prevent alert spam while allowing repeated notifications
- **History**: Tracked in memory with 1-hour retention

## Dashboard Features

### Real-time Status Display

- Server health indicators with emoji status
- Response time metrics and uptime percentages
- Last check timestamps and status history
- Quick action command reference

### Alert Summary

- Recent alerts from last 24 hours
- Severity categorization and server identification
- Detailed error messages and timestamps
- Full history access via alert files

### Performance Metrics

- Historical performance data visualization
- Success rate calculations across check cycles
- Average response time trends
- Server health change tracking

## Configuration

### Server Configuration

Located in `scripts/mcp-monitor.mjs`:

```javascript
const MCP_SERVERS = {
  netlify: {
    name: 'Netlify MCP',
    command: 'npx',
    args: ['-y', '@netlify/mcp'],
    healthCheck: 'ping',
    timeout: 10000,
    expectedResponseTime: 2000,
  },
  shadcn: {
    name: 'shadcn/ui MCP',
    command: './node_modules/.bin/shadcn',
    args: ['mcp'],
    healthCheck: 'list-components',
    timeout: 8000,
    expectedResponseTime: 1500,
  },
};
```

### Adding New Servers

1. Add server configuration to `MCP_SERVERS` object
2. Specify command, arguments, and thresholds
3. Test with `npm run mcp-monitor server <new-server-id>`
4. Update dashboard if custom display needed

## Testing

### Running Tests

```bash
# Run all monitoring tests
node --test test/mcp-monitoring.test.js

# Run specific test patterns
npm test -- --grep "MCP Monitor Script"
```

### Test Coverage

- Health monitoring logic and error handling
- Dashboard rendering and data display
- Data storage and retrieval
- Alert generation and management
- Performance tracking and metrics calculation
- Integration scenarios and edge cases

## Troubleshooting

### Common Issues

#### Servers Showing as Unhealthy

1. **Command Not Found**: Verify server command is available
2. **Timeout Issues**: Check network connectivity and server responsiveness
3. **Permission Errors**: Ensure scripts have execute permissions

#### Dashboard Not Displaying Data

1. **No Monitoring Data**: Run `npm run mcp-monitor check` first
2. **File Permissions**: Check `.mcp-monitoring/` directory permissions
3. **Data Corruption**: Delete monitoring data and regenerate

#### Alerts Not Triggering

1. **Cooldown Period**: Wait 5 minutes between similar alerts
2. **Threshold Settings**: Verify alert thresholds are appropriate
3. **Configuration**: Check server configuration in monitoring script

### Debug Mode

Enable verbose logging by setting environment variable:

```bash
DEBUG=mcp-monitor npm run mcp-monitor check
```

## Performance Considerations

### Resource Usage

- **Memory**: Stores last 100 checks per server
- **Disk**: Minimal data storage in JSON format
- **CPU**: Efficient command execution with timeouts

### Scalability

- **Server Count**: Designed for 10+ concurrent servers
- **Check Frequency**: Configurable via GitHub Actions schedule
- **Data Retention**: Automatic cleanup of old data

## Security Considerations

### Command Execution

- **Timeout Protection**: All commands have timeout limits
- **Input Validation**: Server IDs validated against configuration
- **Error Handling**: Graceful degradation on command failures

### Data Protection

- **Local Storage**: All data stored locally by default
- **No External Dependencies**: Minimal external service requirements
- **Audit Trail**: Complete history of health checks and alerts

## Future Enhancements

### Planned Features

1. **Web Dashboard**: Browser-based monitoring interface
2. **Slack Integration**: Direct alert delivery to Slack channels
3. **Metrics API**: RESTful API for monitoring data
4. **Historical Analysis**: Long-term trend analysis tools
5. **Auto-Healing**: Automated recovery attempts for common issues

### Integration Opportunities

1. **Prometheus Metrics**: Export metrics for Prometheus scraping
2. **Grafana Dashboards**: Integration with existing monitoring infrastructure
3. **PagerDuty**: Critical alert escalation to on-call staff
4. **Service Discovery**: Automatic detection of new MCP servers

## Conclusion

The MCP Server Health Monitoring System provides comprehensive visibility into the health and performance of MCP servers used by Ralph TUI. With automated health checks, real-time alerting, and intuitive dashboards, it ensures reliable operation of critical development infrastructure.

For questions or issues, refer to the test suite and troubleshooting sections, or create an issue in the repository.
