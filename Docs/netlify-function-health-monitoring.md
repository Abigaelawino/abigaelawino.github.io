# Netlify Function Health Monitoring System

Comprehensive monitoring solution for Netlify functions that tracks execution times, error rates, cold start frequency, and overall function health with automated alerting and real-time dashboards.

## Overview

The Netlify Function Health Monitoring System provides:

- **Real-time monitoring** of all Netlify functions with performance metrics
- **Automated alerting** for critical issues and performance degradation
- **Historical tracking** of function performance trends
- **Interactive dashboards** for live monitoring
- **GitHub integration** with automated issue creation
- **Configurable thresholds** for different alert types

## 🚀 Quick Start

### Basic Usage

```bash
# Run function health monitoring
npm run function:health

# View real-time dashboard
npm run function:dashboard

# Run alerting system
npm run function:alerting

# Run complete monitoring cycle
npm run function:monitor
```

### Interactive Dashboard

For an enhanced monitoring experience with interactive controls:

```bash
# Start interactive dashboard with keyboard controls
npm run function:dashboard -- --interactive
```

**Controls:**

- `o` - Overview (default view)
- `d` - Detailed function view
- `a` - Alerts center
- `q` - Quit dashboard

## 📊 Monitoring Components

### 1. Health Monitor (`netlify-function-health-monitor.mjs`)

Core monitoring system that tracks function health metrics.

**Features:**

- Execution time tracking
- Error rate monitoring
- Cold start detection
- Availability calculation
- Performance trend analysis
- Historical data storage

**Metrics Tracked:**

- Execution time (ms)
- Error rate (%)
- Cold start rate (%)
- Availability (%)
- Total executions
- Error count
- Cold start count

### 2. Real-time Dashboard (`netlify-function-health-dashboard.mjs`)

ASCII-based dashboard for live monitoring.

**Display Features:**

- Function status grid
- Metrics overview
- Performance distribution
- Recent alerts
- Auto-refresh every 30 seconds

**Interactive Mode:**

- Switch between overview, details, and alerts views
- Keyboard navigation
- Real-time updates

### 3. Alerting System (`netlify-function-health-alerting.mjs`)

Automated alerting with multiple notification channels.

**Alert Types:**

- **Critical:** Function failures, high error rates
- **Warning:** Performance degradation, multiple warnings
- **Performance:** Slow execution, frequent cold starts

**Notification Channels:**

- Console output (always enabled)
- GitHub Issues (configurable)
- Slack notifications (configurable with webhook)

## 🏥 Health Thresholds

### Performance Thresholds

| Metric          | Warning | Critical |
| --------------- | ------- | -------- |
| Execution Time  | 3,000ms | 5,000ms  |
| Error Rate      | 5%      | 10%      |
| Cold Start Rate | 20%     | 30%      |
| Availability    | 95%     | 90%      |

### Alert Cooldown Periods

| Alert Type  | Cooldown |
| ----------- | -------- |
| Critical    | 4 hours  |
| Warning     | 24 hours |
| Performance | 12 hours |

## 📁 File Structure

```
netlify-function-reports/
├── function-health-data.json          # Historical metrics data
├── function-alerts.json               # Current alerts
├── alerts-history.json               # Historical alerts
├── alert-cooldowns.json             # Alert cooldown tracking
├── alert-config.json                 # Alert configuration
├── function-health-report-[timestamp].json  # Individual reports
└── latest-function-health-report.json      # Latest report
```

## ⚙️ Configuration

### Alert Configuration

Create `.netlify-function-reports/alert-config.json` to customize alerting:

```json
{
  "enabled": true,
  "channels": {
    "console": true,
    "github": true,
    "slack": false
  },
  "thresholds": {
    "critical": {
      "minScore": 1,
      "cooldown": 14400000
    },
    "warning": {
      "minScore": 3,
      "cooldown": 86400000
    },
    "performance": {
      "minScore": 2,
      "cooldown": 43200000
    }
  },
  "escalation": {
    "enabled": true,
    "levels": [
      {
        "delay": 1800000,
        "channels": ["console", "github"]
      },
      {
        "delay": 7200000,
        "channels": ["console", "github", "slack"]
      }
    ]
  }
}
```

### Environment Variables

```bash
# Slack webhook for notifications (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# GitHub token for issue creation (handled by Actions automatically)
GITHUB_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXX
```

## 🔧 GitHub Actions Integration

The automated workflow runs every 30 minutes with:

- **Health Analysis:** Full function health monitoring
- **Alert Processing:** Automated alert generation
- **Issue Creation:** GitHub issues for critical findings
- **PR Comments:** Function health impact on pull requests
- **Artifacts:** Detailed reports and analysis

### Workflow Triggers

```yaml
on:
  schedule:
    - cron: '*/30 * * * *' # Every 30 minutes
  workflow_dispatch:
    inputs:
      alerting_enabled:
        type: boolean
        default: true
      create_issues:
        type: boolean
        default: true
      monitoring_level:
        type: choice
        options: [basic, standard, comprehensive]
```

## 📈 Understanding the Reports

### Health Report Structure

```json
{
  "timestamp": "2026-02-14T10:30:00.000Z",
  "summary": {
    "totalFunctions": 7,
    "healthy": 5,
    "warning": 1,
    "critical": 1,
    "newAlerts": 2
  },
  "functions": {
    "function-name": {
      "name": "function-name",
      "status": "healthy|warning|critical|error",
      "metrics": {
        "executionTime": 1200,
        "errorRate": 0.02,
        "coldStartRate": 0.15,
        "availability": 0.98
      },
      "issues": [],
      "recommendations": []
    }
  },
  "alerts": [],
  "recommendations": [],
  "trends": {
    "overall": "stable|improving|degrading",
    "performance": "stable|improving|degrading",
    "reliability": "stable|improving|degrading",
    "efficiency": "stable|improving|degrading"
  }
}
```

### Function Status Indicators

| Status   | Icon | Meaning                                |
| -------- | ---- | -------------------------------------- |
| Healthy  | ✅   | All metrics within acceptable ranges   |
| Warning  | ⚠️   | Some metrics exceed warning thresholds |
| Critical | ❌   | Metrics exceed critical thresholds     |
| Error    | 💥   | Health check failed                    |

## 🚨 Alert Types and Examples

### Critical Alert Example

```
🚨 FUNCTION HEALTH ALERT
Function: deployment-monitoring
Title: Critical Issues in deployment-monitoring
Message: 1 critical issues detected
Time: 2/14/2026, 10:30:00 AM

Issues:
  - Execution time 5200ms exceeds critical threshold (5000ms)

Recommendations:
  * Optimize function code or increase memory allocation
```

### Performance Alert Example

```
⚠️ FUNCTION HEALTH ALERT
Function: asset-optimization
Title: Performance Issues in asset-optimization
Message: 2 performance issues detected
Time: 2/14/2026, 10:30:00 AM

Issues:
  - Execution time 2800ms exceeds warning threshold (3000ms)
  - Cold start rate 25% exceeds warning threshold (20%)

Recommendations:
  * Monitor execution times and consider optimization
  * Monitor cold start patterns
```

## 🔍 Troubleshooting

### Common Issues

1. **Dashboard not updating**
   - Check if monitoring script runs successfully
   - Verify report files are generated
   - Check file permissions in `.netlify-function-reports/`

2. **Alerts not being sent**
   - Verify alert configuration
   - Check cooldown periods
   - Validate notification channel setup

3. **GitHub Issues not being created**
   - Check repository permissions
   - Verify GitHub token has issue creation rights
   - Check workflow permissions settings

### Debug Mode

Run monitoring with verbose output:

```bash
# Enable debug logging
DEBUG=function-monitor npm run function:health

# Run specific function check
node scripts/netlify-function-health-monitor.mjs --function deployment-monitoring
```

### Log Analysis

Check monitoring logs:

```bash
# View recent monitoring logs
tail -f .netlify-function-reports/monitoring.log

# Check alert history
cat .netlify-function-reports/alerts-history.json | jq '.[-5:]'
```

## 📊 Performance Optimization

### Reducing Cold Starts

1. **Function Warming:** Schedule regular function calls
2. **Memory Allocation:** Increase function memory if needed
3. **Bundle Size:** Optimize function dependencies
4. **Keep-Alive:** Use connection pooling for external services

### Improving Execution Times

1. **Code Optimization:** Profile and optimize slow functions
2. **Async Operations:** Use proper async/await patterns
3. **Caching:** Implement response caching where appropriate
4. **External Services:** Optimize API calls and database queries

## 🔄 Integration with Other Systems

### CI/CD Pipeline Integration

```yaml
# Add to your CI pipeline
- name: Function Health Check
  run: |
    npm run function:health
    if [ $? -eq 1 ]; then
      echo "Critical function issues detected"
      exit 1
    fi
```

### Slack Integration

Configure Slack notifications by setting `SLACK_WEBHOOK_URL`:

```bash
# Set webhook URL
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Enable Slack in config
cat > .netlify-function-reports/alert-config.json << EOF
{
  "enabled": true,
  "channels": {
    "console": true,
    "github": true,
    "slack": true
  }
}
EOF
```

### External Monitoring Tools

Export metrics to external systems:

```javascript
// Custom metrics exporter
const metrics = await monitor.checkAllFunctions();

// Send to Prometheus
sendToPrometheus(metrics);

// Send to DataDog
sendToDataDog(metrics);

// Send to custom monitoring system
sendToCustomSystem(metrics);
```

## 📚 Best Practices

### 1. Regular Monitoring

- Run health checks every 30 minutes
- Review weekly trends and patterns
- Address critical issues immediately

### 2. Alert Management

- Configure appropriate thresholds
- Use cooldown periods to prevent alert fatigue
- Regularly review and update alert rules

### 3. Performance Optimization

- Monitor execution time trends
- Track cold start patterns
- Optimize based on monitoring insights

### 4. Documentation

- Document function performance baselines
- Keep alert configurations in version control
- Maintain runbooks for common issues

## 🛠️ Advanced Usage

### Custom Metrics Collection

```javascript
// Extend monitoring with custom metrics
class CustomFunctionMonitor extends FunctionHealthMonitor {
  async checkFunctionHealth(functionName) {
    const health = await super.checkFunctionHealth(functionName);

    // Add custom metrics
    health.metrics.customMetric = await this.collectCustomMetric(functionName);

    return health;
  }
}
```

### Custom Alert Channels

```javascript
// Add custom notification channel
class CustomAlerting extends FunctionHealthAlerting {
  async sendAlert(alert) {
    await super.sendAlert(alert);

    // Custom channel implementation
    await this.sendCustomNotification(alert);
  }
}
```

### Batch Processing

```javascript
// Process multiple functions in parallel
const monitor = new FunctionHealthMonitor();
const results = await Promise.all(FUNCTION_LIST.map(name => monitor.checkFunctionHealth(name)));
```

## 📞 Support and Contributing

### Getting Help

1. Check this documentation for common issues
2. Review the troubleshooting section
3. Check GitHub Issues for known problems
4. Create detailed bug reports if needed

### Contributing

1. Fork the repository
2. Create feature branches
3. Add tests for new functionality
4. Update documentation
5. Submit pull requests

### Feature Requests

- Custom metrics integration
- Additional notification channels
- Advanced visualization options
- Performance prediction algorithms

---

_This documentation covers the complete Netlify Function Health Monitoring System. For specific implementation details, refer to the source code and inline comments._
