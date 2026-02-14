#!/usr/bin/env node

// Ralph TUI Queue Health Dashboard
import fs from 'fs/promises';
import path from 'path';

const monitoringDataDir = path.join(process.cwd(), '.ralph-monitoring');

// Load monitoring data
async function loadMonitoringData() {
  try {
    const metricsFile = path.join(monitoringDataDir, 'metrics.json');
    const metricsData = await fs.readFile(metricsFile, 'utf8');
    return JSON.parse(metricsData);
  } catch (error) {
    console.error('Failed to load monitoring data:', error.message);
    return { checks: [] };
  }
}

// Load recent alerts
async function loadRecentAlerts(hours = 24) {
  try {
    const alertFile = path.join(monitoringDataDir, 'alerts.jsonl');
    const alertData = await fs.readFile(alertFile, 'utf8');
    const alerts = alertData
      .trim()
      .split('\n')
      .filter(line => line)
      .map(JSON.parse);

    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return alerts.filter(alert => new Date(alert.timestamp) > cutoffTime);
  } catch (error) {
    return [];
  }
}

// Generate status indicator
function getStatusIndicator(status) {
  switch (status) {
    case 'healthy':
    case 'running':
    case 'responsive':
      return '✅';
    case 'degraded':
    case 'stale':
      return '⚠️';
    case 'unhealthy':
    case 'stopped':
    case 'unresponsive':
    case 'disconnected':
    case 'error':
      return '❌';
    default:
      return '❓';
  }
}

// Generate trend indicator
function getTrendIndicator(current, previous) {
  if (previous === null || previous === 0) return '➡️';
  const change = ((current - previous) / previous) * 100;
  if (change > 5) return '📈';
  if (change < -5) return '📉';
  return '➡️';
}

// Format duration
function formatDuration(milliseconds) {
  if (!milliseconds) return 'N/A';

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// Generate ASCII dashboard
function generateDashboard(metrics, alerts) {
  const now = new Date().toISOString();

  let dashboard = `
╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                           🎯 RALPH TUI QUEUE HEALTH DASHBOARD                                                  ║
║                                               Last Updated: ${now}                                               ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝

`;

  // Overall Status Section
  const latestCheck = metrics.checks?.[metrics.checks.length - 1];
  const previousCheck = metrics.checks?.[metrics.checks.length - 2];

  let overallStatus = 'Unknown';
  let overallIcon = '❓';
  if (latestCheck) {
    overallStatus =
      latestCheck.overall?.charAt(0).toUpperCase() + latestCheck.overall?.slice(1) || 'Unknown';
    overallIcon = getStatusIndicator(latestCheck.overall);
  }

  dashboard += `┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🎛️  OVERALL STATUS: ${overallIcon} ${overallStatus.padEnd(80)} │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤`;

  if (latestCheck) {
    const queueTrend = previousCheck
      ? getTrendIndicator(latestCheck.metrics.queueDepth, previousCheck.metrics.queueDepth)
      : '➡️';
    const rateTrend = previousCheck
      ? getTrendIndicator(latestCheck.metrics.processingRate, previousCheck.metrics.processingRate)
      : '➡️';

    dashboard += `
│ Queue Depth:     ${latestCheck.metrics.queueDepth.toString().padEnd(3)} beads ${queueTrend}    │ Processing Rate: ${latestCheck.metrics.processingRate.toFixed(1).padEnd(6)}/min ${rateTrend}           │
│ Stuck Beads:     ${latestCheck.metrics.stuckBeads.toString().padEnd(3)} beads           │ Daemon Status:   ${getStatusIndicator(latestCheck.daemon?.status)} ${latestCheck.daemon?.status?.padEnd(15) || 'Unknown'.padEnd(15)}   │
│ Last Check:      ${new Date(latestCheck.timestamp).toLocaleString().padEnd(25)} │ Response Time:  ${latestCheck.responseTime?.toString().padEnd(4)}ms                          │`;
  } else {
    dashboard += `
│ No monitoring data available. Run 'npm run ralph:monitor check' to start monitoring.                                                                                   │
│                                                                                                                                                                         │`;
  }

  dashboard += `
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘`;

  // Daemon Status Section
  if (latestCheck?.daemon) {
    const daemon = latestCheck.daemon;
    dashboard += `

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🤖 DAEMON STATUS                                                                                                                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Status:           ${getStatusIndicator(daemon.status)} ${daemon.status?.padEnd(15)} │ PID:          ${daemon.pid?.toString().padEnd(12) || 'N/A'.padEnd(12)} │ Uptime:      ${daemon.uptime?.padEnd(12) || 'N/A'.padEnd(12)} │
│ Last Activity:    ${daemon.lastActivity ? new Date(daemon.lastActivity).toLocaleString().padEnd(25) : 'Never'.padEnd(25)} │ Age:          ${daemon.age ? formatDuration(daemon.age).padEnd(12) : 'N/A'.padEnd(12)} │ Response:   ${daemon.responseTime?.toString().padEnd(8)}ms       │`;

    if (daemon.error) {
      dashboard += `
│ Error: ${daemon.error.substring(0, 120).padEnd(120)}                                                                                                               │`;
    }

    dashboard += `
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘`;
  }

  // Queue Metrics Section
  if (latestCheck?.beads) {
    const beads = latestCheck.beads;
    dashboard += `

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 📊 QUEUE METRICS                                                                                                                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Total Beads:      ${beads.totalBeads?.toString().padEnd(8)}       │ Queued:        ${beads.queuedBeads?.toString().padEnd(8)}       │ In Progress: ${beads.inProgressBeads?.toString().padEnd(8)}       │
│ Completed:        ${beads.completedBeads?.toString().padEnd(8)}       │ Stuck:         ${beads.stuckBeads?.toString().padEnd(8)}       │ Oldest Bead: ${beads.oldestBeadAge ? formatDuration(beads.oldestBeadAge).padEnd(8) : 'N/A'.padEnd(8)}       │
│ Processing Rate:   ${parseFloat(beads.processingRate || 0)
      .toFixed(1)
      .padEnd(
        8
      )}/min       │ Avg Time:      ${beads.avgProcessingTime ? formatDuration(beads.avgProcessingTime).padEnd(8) : 'N/A'.padEnd(8)}       │`;

    if (beads.error) {
      dashboard += `
│ Error: ${beads.error.substring(0, 120).padEnd(120)}                                                                                                                │`;
    }

    dashboard += `
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘`;
  }

  // Socket Status Section
  if (latestCheck?.socket) {
    const socket = latestCheck.socket;
    dashboard += `

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔌 SOCKET STATUS                                                                                                                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Status:         ${getStatusIndicator(socket.status)} ${socket.status?.padEnd(15)} │ Responsive:   ${socket.responsive ? 'Yes'.padEnd(12) : 'No'.padEnd(12)} │ Response Time: ${socket.responseTime?.toString().padEnd(8)}ms       │`;

    if (socket.error) {
      dashboard += `
│ Error: ${socket.error.substring(0, 120).padEnd(120)}                                                                                                                │`;
    }

    dashboard += `
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘`;
  }

  // Recent Alerts Section
  dashboard += `

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🚨 RECENT ALERTS (Last 24 Hours)                                                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤`;

  if (alerts.length === 0) {
    dashboard += `
│ No recent alerts. All systems operating normally.                                                                                                           │`;
  } else {
    dashboard += `
│ Time                    │ Type                  │ Severity    │ Message                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤`;

    for (const alert of alerts.slice(0, 10)) {
      const time = new Date(alert.timestamp).toLocaleString();
      dashboard += `
│ ${time.padEnd(22)} │ ${alert.type.padEnd(21)} │ ${alert.severity.padEnd(11)} │ ${alert.message.substring(0, 100).padEnd(100)} │`;
    }

    if (alerts.length > 10) {
      dashboard += `
│ ... and ${alerts.length - 10} more alerts (check .ralph-monitoring/alerts.jsonl for full history)                                                                    │`;
    }
  }

  dashboard += `
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘`;

  // Performance Trends Section
  if (metrics.checks && metrics.checks.length > 1) {
    const recentChecks = metrics.checks.slice(-10);
    const avgQueueDepth = (
      recentChecks.reduce((sum, check) => sum + (check.metrics?.queueDepth || 0), 0) /
      recentChecks.length
    ).toFixed(1);
    const avgProcessingRate = (
      recentChecks.reduce((sum, check) => sum + (check.metrics?.processingRate || 0), 0) /
      recentChecks.length
    ).toFixed(1);
    const maxQueueDepth = Math.max(...recentChecks.map(check => check.metrics?.queueDepth || 0));
    const minProcessingRate = Math.min(
      ...recentChecks.map(check => check.metrics?.processingRate || 0)
    );

    dashboard += `

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 📈 PERFORMANCE TRENDS (Last 10 Checks)                                                                                                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Average Queue Depth: ${avgQueueDepth.padEnd(8)} beads   │ Max Queue Depth: ${maxQueueDepth.toString().padEnd(8)} beads   │ Average Processing Rate: ${avgProcessingRate.padEnd(6)}/min   │
│ Min Processing Rate: ${minProcessingRate.toFixed(1).padEnd(6)}/min   │ Total Checks: ${metrics.checks.length.toString().padEnd(8)}           │ Time Span: ${formatDuration(Date.now() - new Date(recentChecks[0].timestamp).getTime()).padEnd(8)}        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘`;
  }

  // Quick Actions Section
  dashboard += `

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🎛️  QUICK ACTIONS                                                                                                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ • npm run ralph:monitor check    - Run immediate health check                                                                                                   │
│ • npm run ralph:monitor watch    - Start continuous monitoring                                                                                                   │
│ • npm run ralph:monitor report   - Generate detailed report                                                                                                    │
│ • npm run ralph:dashboard        - Refresh this dashboard                                                                                                      │
│ • npm run ralph:monitor status   - Get detailed status information                                                                                              │
│ • bd ls                         - List all beads (requires bd command)                                                                                        │
│ • bd daemon status              - Check daemon status (requires bd command)                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘`;

  return dashboard;
}

// Main dashboard function
async function showDashboard() {
  try {
    const metrics = await loadMonitoringData();
    const alerts = await loadRecentAlerts();
    const dashboard = generateDashboard(metrics, alerts);

    // Clear screen and show dashboard
    console.clear();
    console.log(dashboard);
  } catch (error) {
    console.error('Failed to display dashboard:', error.message);
    console.log('\nRun "npm run ralph:monitor check" to generate initial monitoring data.');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'refresh':
    case undefined:
      await showDashboard();
      break;

    case 'watch':
      console.log('👀 Starting dashboard auto-refresh (updates every 30 seconds)...');
      console.log('Press Ctrl+C to exit.\n');

      // Initial display
      await showDashboard();

      // Set up refresh interval
      setInterval(async () => {
        await showDashboard();
      }, 30000); // Refresh every 30 seconds
      break;

    default:
      console.log(`
Usage: node scripts/ralph-queue-dashboard.mjs [command]

Commands:
  (none)     - Display current dashboard
  refresh     - Refresh dashboard data
  watch       - Auto-refresh dashboard every 30 seconds

Examples:
  npm run ralph:dashboard
  npm run ralph:dashboard watch
      `);
      process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Ralph TUI dashboard...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down Ralph TUI dashboard...');
  process.exit(0);
});

// Run the dashboard
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
