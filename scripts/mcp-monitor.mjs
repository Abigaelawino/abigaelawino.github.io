#!/usr/bin/env node

// MCP Server Health Monitoring System
import { performance } from 'perf_hooks';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Configuration for MCP servers to monitor
const MCP_SERVERS = {
  netlify: {
    name: 'Netlify MCP',
    command: 'npx',
    args: ['-y', '@netlify/mcp'],
    healthCheck: 'ping',
    timeout: 10000, // 10 seconds
    expectedResponseTime: 2000, // 2 seconds
  },
  shadcn: {
    name: 'shadcn/ui MCP',
    command: './node_modules/.bin/shadcn',
    args: ['mcp'],
    healthCheck: 'list-components',
    timeout: 8000, // 8 seconds
    expectedResponseTime: 1500, // 1.5 seconds
  },
};

// Health metrics storage
const healthMetrics = new Map();
const alertHistory = new Map();
const monitoringDataDir = path.join(process.cwd(), '.mcp-monitoring');

// Initialize monitoring data directory
async function ensureMonitoringDataDir() {
  try {
    await fs.mkdir(monitoringDataDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create monitoring directory:', error);
  }
}

// Check if a command is available
async function isCommandAvailable(command) {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

// Perform health check on MCP server
async function checkServerHealth(serverId, serverConfig) {
  const startTime = performance.now();
  let healthStatus = {
    serverId,
    serverName: serverConfig.name,
    timestamp: new Date().toISOString(),
    status: 'unknown',
    responseTime: null,
    error: null,
    uptime: null,
  };

  try {
    // Check if command is available
    const commandAvailable = await isCommandAvailable(serverConfig.command);
    if (!commandAvailable) {
      healthStatus.status = 'unavailable';
      healthStatus.error = `Command '${serverConfig.command}' not found`;
      return healthStatus;
    }

    // Execute health check with timeout
    const commandString = `${serverConfig.command} ${serverConfig.args.join(' ')}`;
    const { stdout, stderr } = await execAsync(commandString, {
      timeout: serverConfig.timeout,
    });

    const endTime = performance.now();
    healthStatus.responseTime = Math.round(endTime - startTime);
    healthStatus.status = 'healthy';

    // Check if response time is within acceptable range
    if (healthStatus.responseTime > serverConfig.expectedResponseTime) {
      healthStatus.status = 'degraded';
      healthStatus.warning = `Response time ${healthStatus.responseTime}ms exceeds expected ${serverConfig.expectedResponseTime}ms`;
    }

    // Parse output for additional health indicators
    if (stderr) {
      healthStatus.status = 'unhealthy';
      healthStatus.error = stderr.trim();
    }
  } catch (error) {
    const endTime = performance.now();
    healthStatus.responseTime = Math.round(endTime - startTime);
    healthStatus.status = 'unhealthy';
    healthStatus.error = error.message;

    // Categorize error types
    if (error.code === 'ETIMEDOUT') {
      healthStatus.errorType = 'timeout';
    } else if (error.code === 'ENOENT') {
      healthStatus.errorType = 'command_not_found';
    } else {
      healthStatus.errorType = 'execution_error';
    }
  }

  return healthStatus;
}

// Update server metrics
function updateServerMetrics(healthStatus) {
  const { serverId } = healthStatus;

  if (!healthMetrics.has(serverId)) {
    healthMetrics.set(serverId, {
      serverName: healthStatus.serverName,
      checks: [],
      uptime: 0,
      downtime: 0,
      totalChecks: 0,
      healthyChecks: 0,
      unhealthyChecks: 0,
      degradedChecks: 0,
      averageResponseTime: 0,
      lastStatusChange: null,
    });
  }

  const metrics = healthMetrics.get(serverId);
  metrics.checks.push(healthStatus);
  metrics.totalChecks++;

  // Keep only last 100 checks to prevent memory bloat
  if (metrics.checks.length > 100) {
    metrics.checks = metrics.checks.slice(-100);
  }

  // Update status counters
  switch (healthStatus.status) {
    case 'healthy':
      metrics.healthyChecks++;
      break;
    case 'unhealthy':
      metrics.unhealthyChecks++;
      break;
    case 'degraded':
      metrics.degradedChecks++;
      break;
  }

  // Calculate average response time
  const responseTimes = metrics.checks
    .filter(check => check.responseTime !== null)
    .map(check => check.responseTime);

  if (responseTimes.length > 0) {
    metrics.averageResponseTime = Math.round(
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    );
  }

  // Track status changes
  const lastCheck = metrics.checks[metrics.checks.length - 2];
  if (lastCheck && lastCheck.status !== healthStatus.status) {
    metrics.lastStatusChange = {
      from: lastCheck.status,
      to: healthStatus.status,
      timestamp: healthStatus.timestamp,
    };
  }

  // Calculate uptime percentage (last 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentChecks = metrics.checks.filter(
    check => new Date(check.timestamp) > twentyFourHoursAgo
  );

  const healthyRecentChecks = recentChecks.filter(
    check => check.status === 'healthy' || check.status === 'degraded'
  );

  metrics.uptime =
    recentChecks.length > 0
      ? Math.round((healthyRecentChecks.length / recentChecks.length) * 100)
      : 0;

  metrics.downtime = 100 - metrics.uptime;
}

// Check for alerts
async function checkForAlerts(healthStatus) {
  const { serverId, status, error, responseTime } = healthStatus;
  const serverConfig = MCP_SERVERS[serverId];

  // Generate alert key based on server and type
  const alertKey = `${serverId}_${status}`;
  const now = Date.now();

  // Check if we should send an alert (avoid spam)
  const lastAlert = alertHistory.get(alertKey);
  const alertCooldown = 5 * 60 * 1000; // 5 minutes

  if (lastAlert && now - lastAlert < alertCooldown) {
    return; // Skip alert to avoid spam
  }

  let alert = null;

  switch (status) {
    case 'unhealthy':
      alert = {
        type: 'server_down',
        severity: 'critical',
        message: `${healthStatus.serverName} is unhealthy`,
        details: error || 'Unknown error',
        serverId,
        timestamp: healthStatus.timestamp,
      };
      break;

    case 'degraded':
      if (responseTime > serverConfig.expectedResponseTime * 2) {
        alert = {
          type: 'performance_degradation',
          severity: 'warning',
          message: `${healthStatus.serverName} performance degraded`,
          details: `Response time: ${responseTime}ms (expected: ${serverConfig.expectedResponseTime}ms)`,
          serverId,
          timestamp: healthStatus.timestamp,
        };
      }
      break;
  }

  if (alert) {
    await sendAlert(alert);
    alertHistory.set(alertKey, now);

    // Clean old alert history
    const cutoffTime = now - 60 * 60 * 1000; // 1 hour
    for (const [key, timestamp] of alertHistory.entries()) {
      if (timestamp < cutoffTime) {
        alertHistory.delete(key);
      }
    }
  }
}

// Send alert (placeholder for notification integration)
async function sendAlert(alert) {
  console.error(`🚨 MCP SERVER ALERT: ${alert.message}`);
  console.error(`   Type: ${alert.type}`);
  console.error(`   Severity: ${alert.severity}`);
  console.error(`   Server: ${alert.serverId}`);
  console.error(`   Details: ${alert.details}`);
  console.error(`   Time: ${alert.timestamp}`);

  // In a real implementation, you would:
  // - Send to Slack webhook
  // - Send email notification
  // - Create GitHub issue
  // - Send to monitoring service

  // Save alert to file for logging
  const alertFile = path.join(monitoringDataDir, `alerts.jsonl`);
  try {
    await fs.appendFile(alertFile, JSON.stringify(alert) + '\n');
  } catch (error) {
    console.error('Failed to save alert:', error);
  }
}

// Save metrics to file
async function saveMetrics() {
  const metricsFile = path.join(monitoringDataDir, 'metrics.json');

  const allMetrics = {};
  for (const [serverId, metrics] of healthMetrics.entries()) {
    allMetrics[serverId] = {
      ...metrics,
      lastUpdated: new Date().toISOString(),
    };
  }

  try {
    await fs.writeFile(metricsFile, JSON.stringify(allMetrics, null, 2));
  } catch (error) {
    console.error('Failed to save metrics:', error);
  }
}

// Generate monitoring report
async function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalServers: Object.keys(MCP_SERVERS).length,
      healthyServers: 0,
      unhealthyServers: 0,
      degradedServers: 0,
    },
    servers: [],
  };

  for (const [serverId, serverConfig] of Object.entries(MCP_SERVERS)) {
    const metrics = healthMetrics.get(serverId);

    if (metrics) {
      const serverReport = {
        serverId,
        serverName: serverConfig.name,
        status:
          metrics.checks.length > 0 ? metrics.checks[metrics.checks.length - 1].status : 'unknown',
        uptime: metrics.uptime,
        averageResponseTime: metrics.averageResponseTime,
        totalChecks: metrics.totalChecks,
        lastCheck:
          metrics.checks.length > 0 ? metrics.checks[metrics.checks.length - 1].timestamp : null,
      };

      report.servers.push(serverReport);

      // Update summary
      switch (serverReport.status) {
        case 'healthy':
          report.summary.healthyServers++;
          break;
        case 'unhealthy':
          report.summary.unhealthyServers++;
          break;
        case 'degraded':
          report.summary.degradedServers++;
          break;
      }
    }
  }

  // Save report
  const reportFile = path.join(monitoringDataDir, 'latest-report.json');
  try {
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Failed to save report:', error);
  }

  return report;
}

// Main monitoring function
async function runMonitoring() {
  console.log('🔍 Starting MCP Server Health Monitoring...');

  await ensureMonitoringDataDir();

  // Check all configured MCP servers
  for (const [serverId, serverConfig] of Object.entries(MCP_SERVERS)) {
    console.log(`Checking ${serverConfig.name}...`);

    try {
      const healthStatus = await checkServerHealth(serverId, serverConfig);
      updateServerMetrics(healthStatus);
      await checkForAlerts(healthStatus);

      console.log(`  Status: ${healthStatus.status}`);
      if (healthStatus.responseTime) {
        console.log(`  Response Time: ${healthStatus.responseTime}ms`);
      }
      if (healthStatus.error) {
        console.log(`  Error: ${healthStatus.error}`);
      }
    } catch (error) {
      console.error(`  Failed to check ${serverConfig.name}:`, error.message);
    }
  }

  // Save metrics and generate report
  await saveMetrics();
  const report = await generateReport();

  console.log('\n📊 Monitoring Summary:');
  console.log(`  Total Servers: ${report.summary.totalServers}`);
  console.log(`  Healthy: ${report.summary.healthyServers}`);
  console.log(`  Degraded: ${report.summary.degradedServers}`);
  console.log(`  Unhealthy: ${report.summary.unhealthyServers}`);

  console.log('\n✅ Monitoring cycle completed');
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';

  switch (command) {
    case 'check':
      await runMonitoring();
      break;

    case 'report': {
      const report = await generateReport();
      console.log(JSON.stringify(report, null, 2));
      break;
    }

    case 'watch':
      console.log('👀 Starting continuous monitoring (checks every 60 seconds)...');
      setInterval(runMonitoring, 60000);
      await runMonitoring(); // Initial check
      break;

    case 'server': {
      const serverId = args[1];
      if (!serverId || !MCP_SERVERS[serverId]) {
        console.error('Invalid server ID. Available servers:', Object.keys(MCP_SERVERS));
        process.exit(1);
      }

      const healthStatus = await checkServerHealth(serverId, MCP_SERVERS[serverId]);
      console.log(JSON.stringify(healthStatus, null, 2));
      break;
    }

    default: {
      const helpText = 'Usage: node scripts/mcp-monitor.mjs <command>\n\n' +
        'Commands:\n' +
        '  check     - Run one-time health check on all servers\n' +
        '  report    - Generate detailed report\n' +
        '  watch     - Run continuous monitoring (checks every 60 seconds)\n' +
        '  server <id> - Check specific server (available: ' + Object.keys(MCP_SERVERS).join(', ') + ')\n\n' +
        'Examples:\n' +
        '  node scripts/mcp-monitor.mjs check\n' +
        '  node scripts/mcp-monitor.mjs server netlify\n' +
        '  node scripts/mcp-monitor.mjs watch';
      console.log(helpText);
      process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down MCP monitoring...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down MCP monitoring...');
  process.exit(0);
});

// Run the monitoring
if (import.meta.url === 'file://' + process.argv[1]) {
  main().catch(console.error);
}
