# Ralph TUI Queue Health Monitoring System

This document provides comprehensive documentation for the Ralph TUI queue health monitoring system, which provides real-time monitoring, alerting, and analysis of Ralph TUI queue performance and bead processing.

## Overview

The Ralph TUI queue monitoring system consists of four main components:

1. **Queue Monitor** (`scripts/ralph-queue-monitor.mjs`) - Core health checking and alerting
2. **Health Dashboard** (`scripts/ralph-queue-dashboard.mjs`) - Real-time ASCII visualization
3. **Bead Aging Analysis** (`scripts/ralph-bead-aging.mjs`) - Aging reports and trend analysis
4. **GitHub Actions Workflow** (`.github/workflows/ralph-queue-monitoring.yml`) - Automated monitoring

## Features

### 🔍 Queue Monitoring

- **Queue Depth Tracking**: Monitor number of beads in queue
- **Processing Rate Analysis**: Track beads processed per minute
- **Stuck Bead Detection**: Identify beads stuck in queue for extended periods
- **Daemon Health Checks**: Monitor Ralph daemon status and responsiveness
- **Socket Connectivity**: Verify communication channels are working

### 🚨 Intelligent Alerting

- **Queue Overflow Alerts**: Warn when queue depth exceeds thresholds
- **Stuck Bead Alerts**: Notify about beads stuck for too long
- **Queue Starvation Detection**: Alert when processing rate is too low
- **Daemon Down Alerts**: Critical alerts when daemon stops responding
- **Cooldown Management**: Prevent alert spam with intelligent cooldowns

### 📊 Real-time Dashboard

- **ASCII-based Interface**: No dependencies required, works in any terminal
- **Live Status Updates**: Real-time view of queue health and metrics
- **Historical Trends**: Track performance over time
- **Alert Summary**: View recent alerts and their severity
- **Performance Metrics**: Response times, processing rates, and queue statistics

### 📈 Aging Analysis

- **Bead Age Categorization**: Fresh (1d), Aging (3d), Stale (7d), Critical (14d)
- **Priority-based Analysis**: Weighted analysis by bead priority
- **Trend Detection**: Identify patterns in queue growth and processing
- **Actionable Recommendations**: Automated suggestions for improvement
- **Historical Reporting**: Track aging patterns over time

## Quick Start

### Basic Usage

```bash
# Run one-time health check
npm run ralph:monitor check

# View real-time dashboard
npm run ralph:dashboard

# Generate aging analysis report
npm run ralph:aging analyze

# Get actionable recommendations
npm run ralph:aging recommendations

# Run comprehensive monitoring
npm run ralph:monitoring
```

### Continuous Monitoring

```bash
# Start continuous monitoring (checks every 60 seconds)
npm run ralph:monitor watch

# Auto-refreshing dashboard (updates every 30 seconds)
npm run ralph:dashboard watch
```

### Trend Analysis

```bash
# Analyze trends over last 7 days
npm run ralph:aging trends

# Analyze trends over custom period (14 days)
node scripts/ralph-bead-aging.mjs trends 14
```

## Configuration

### Monitoring Thresholds

The monitoring system uses configurable thresholds defined in `scripts/ralph-queue-monitor.mjs`:

```javascript
const RALPH_CONFIG = {
  thresholds: {
    maxQueueDepth: 50, // Alert if more than 50 beads in queue
    maxStuckTime: 3600000, // 1 hour - bead considered stuck
    minProcessingRate: 0.5, // Minimum beads per minute
    maxDaemonAge: 300000, // 5 minutes - daemon considered stale
    queueStarvationTime: 600000, // 10 minutes - no processing activity
  },

  alertCooldowns: {
    queueStarvation: 10 * 60 * 1000, // 10 minutes
    stuckBeads: 30 * 60 * 1000, // 30 minutes
    daemonDown: 5 * 60 * 1000, // 5 minutes
  },
};
```

### Aging Configuration

Bead aging thresholds are defined in `scripts/ralph-bead-aging.mjs`:

```javascript
const AGING_CONFIG = {
  thresholds: {
    fresh: 24 * 60 * 60 * 1000, // 24 hours
    aging: 3 * 24 * 60 * 60 * 1000, // 3 days
    stale: 7 * 24 * 60 * 60 * 1000, // 7 days
    critical: 14 * 24 * 60 * 60 * 1000, // 14 days
  },

  priorityWeights: {
    high: 3,
    medium: 2,
    low: 1,
  },
};
```

## Data Storage

All monitoring data is stored in the `.ralph-monitoring/` directory:

- `metrics.json` - Historical health check data
- `alerts.jsonl` - Alert history in JSONL format
- `aging-report.json` - Latest aging analysis report

## Dashboard Interface

### Main Sections

1. **Overall Status**: Quick health summary with key metrics
2. **Daemon Status**: Detailed daemon health information
3. **Queue Metrics**: Current queue statistics and processing rates
4. **Socket Status**: Communication channel health
5. **Recent Alerts**: Latest alerts and warnings
6. **Performance Trends**: Historical performance analysis
7. **Quick Actions**: Useful commands for manual intervention

### Status Indicators

- ✅ **Healthy/Green**: Normal operation
- ⚠️ **Degraded/Yellow**: Performance issues detected
- ❌ **Unhealthy/Red**: Critical problems
- ❓ **Unknown**: Insufficient data

## Alert Types

### Critical Alerts

- **daemon_down**: Ralph daemon is not running
- **stuck_beads**: Beads have been stuck for extended periods

### Warning Alerts

- **queue_overflow**: Queue depth exceeds maximum threshold
- **queue_starvation**: Processing rate is too low

### Alert Management

- **Cooldown Periods**: Prevent alert spam
- **Severity Levels**: Critical, Warning, Info
- **Persistent Storage**: All alerts logged for analysis
- **GitHub Integration**: Automated issue creation for critical alerts

## Automated Monitoring

### GitHub Actions

The system includes automated monitoring via GitHub Actions:

- **Schedule**: Runs every 30 minutes
- **Manual Trigger**: Can be run on-demand
- **Artifact Storage**: Reports saved as GitHub artifacts
- **Issue Creation**: Critical alerts automatically create GitHub issues
- **Summary Reports**: Detailed workflow summaries

### Workflow Features

1. **Health Checks**: Comprehensive queue health monitoring
2. **Aging Analysis**: Detailed bead aging reports
3. **Trend Analysis**: 7-day performance trends
4. **Alert Processing**: Critical alert detection and issue creation
5. **Artifact Upload**: All reports saved for analysis
6. **Summary Reporting**: Comprehensive workflow summaries

## Troubleshooting

### Common Issues

1. **No Monitoring Data**
   - Run `npm run ralph:monitor check` to generate initial data
   - Check that Ralph daemon is running
   - Verify `.beads/` directory exists

2. **Daemon Not Responding**
   - Check daemon status: `bd daemon status`
   - Restart daemon: `bd daemon restart`
   - Check daemon logs: `tail -f .beads/daemon.log`

3. **High Queue Depth**
   - Check processing rates
   - Review stuck beads: `bd ls --status=queued`
   - Consider manual processing

4. **Missing bd Command**
   - Install Ralph TUI and ensure bd is in PATH
   - Monitor works with limited functionality without bd

### Debug Commands

```bash
# Check Ralph daemon status
bd daemon status

# List all beads
bd ls --all

# Check queued beads
bd ls --status=queued

# View daemon logs
tail -f .beads/daemon.log

# Check monitoring data
cat .ralph-monitoring/metrics.json

# View recent alerts
cat .ralph-monitoring/alerts.jsonl
```

## Integration Examples

### Custom Alert Integration

You can extend the alert system to integrate with external services:

```javascript
// In scripts/ralph-queue-monitor.mjs
async function sendAlert(alert) {
  // Existing console logging...

  // Add custom integrations:
  await sendToSlack(alert);
  await sendToDiscord(alert);
  await createPagerDutyIncident(alert);
}
```

### Custom Metrics

Add custom monitoring metrics:

```javascript
// Extend health status with custom metrics
healthStatus.customMetrics = {
  errorRate: calculateErrorRate(),
  memoryUsage: getMemoryUsage(),
  diskSpace: getDiskSpace(),
};
```

## Best Practices

1. **Regular Monitoring**: Set up continuous monitoring for production systems
2. **Alert Thresholds**: Adjust thresholds based on your specific requirements
3. **Historical Analysis**: Use trend analysis to identify patterns
4. **Proactive Maintenance**: Address aging beads before they become critical
5. **Documentation**: Keep monitoring configuration documented
6. **Testing**: Regularly test alerting mechanisms

## Performance Considerations

- **Monitoring Overhead**: Minimal impact on Ralph TUI performance
- **Data Retention**: Automatic cleanup of old monitoring data
- **Resource Usage**: Low memory and CPU footprint
- **Scalability**: Handles large queues efficiently

## Security

- **Local Access**: All monitoring data stored locally
- **No External Dependencies**: Minimal attack surface
- **Secure Logging**: No sensitive information in logs
- **GitHub Integration**: Uses standard GitHub Actions permissions

## Contributing

To extend the monitoring system:

1. **Add Metrics**: Extend health checks with new metrics
2. **Custom Alerts**: Create new alert types and conditions
3. **Dashboard Enhancements**: Add new dashboard sections
4. **Integration**: Add external service integrations
5. **Documentation**: Update this documentation for new features

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review monitoring logs in `.ralph-monitoring/`
3. Create GitHub issues for bugs or feature requests
4. Use `npm run ralph:monitor status` for detailed diagnostics
