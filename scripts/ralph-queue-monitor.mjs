#!/usr/bin/env node

// Ralph TUI Queue Health Monitoring System
import { performance } from 'perf_hooks';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Configuration for Ralph TUI queue monitoring
const RALPH_CONFIG = {
  beadsDbPath: path.join(process.cwd(), '.beads/beads.db'),
  daemonPidPath: path.join(process.cwd(), '.beads/daemon.pid'),
  daemonLogPath: path.join(process.cwd(), '.beads/daemon.log'),
  issuesPath: path.join(process.cwd(), '.beads/issues.jsonl'),
  socketPath: path.join(process.cwd(), '.beads/bd.sock'),

  // Monitoring thresholds
  thresholds: {
    maxQueueDepth: 50, // Alert if more than 50 beads in queue
    maxStuckTime: 3600000, // 1 hour in milliseconds - bead considered stuck
    minProcessingRate: 0.5, // Minimum beads per minute
    maxDaemonAge: 300000, // 5 minutes - daemon considered stale
    queueStarvationTime: 600000, // 10 minutes - no processing activity
  },

  // Alert cooldowns
  alertCooldowns: {
    queueStarvation: 10 * 60 * 1000, // 10 minutes
    stuckBeads: 30 * 60 * 1000, // 30 minutes
    daemonDown: 5 * 60 * 1000, // 5 minutes
  },
};

// Health metrics storage
const healthMetrics = new Map();
const alertHistory = new Map();
const monitoringDataDir = path.join(process.cwd(), '.ralph-monitoring');

// Initialize monitoring data directory
async function ensureMonitoringDataDir() {
  try {
    await fs.mkdir(monitoringDataDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create monitoring directory:', error);
  }
}

// Check if Ralph daemon is running
async function checkDaemonHealth() {
  const startTime = performance.now();
  const daemonHealth = {
    status: 'unknown',
    pid: null,
    age: null,
    lastActivity: null,
    uptime: null,
    responseTime: null,
    error: null,
  };

  try {
    // Check if daemon PID file exists
    const pidExists = await fileExists(RALPH_CONFIG.daemonPidPath);
    if (!pidExists) {
      daemonHealth.status = 'stopped';
      daemonHealth.error = 'Daemon PID file not found';
      return daemonHealth;
    }

    // Read daemon PID
    const pidData = await fs.readFile(RALPH_CONFIG.daemonPidPath, 'utf8');
    daemonHealth.pid = parseInt(pidData.trim());

    // Check if process is running
    try {
      const { stdout } = await execAsync(`ps -p ${daemonHealth.pid} -o etime= --no-headers`, {
        timeout: 5000,
      });
      daemonHealth.status = 'running';
      daemonHealth.uptime = stdout.trim();
    } catch (error) {
      daemonHealth.status = 'stopped';
      daemonHealth.error = `Process ${daemonHealth.pid} not found`;
      return daemonHealth;
    }

    // Check daemon log for recent activity
    const logExists = await fileExists(RALPH_CONFIG.daemonLogPath);
    if (logExists) {
      const logStats = await fs.stat(RALPH_CONFIG.daemonLogPath);
      daemonHealth.lastActivity = logStats.mtime;
      daemonHealth.age = Date.now() - logStats.mtime.getTime();

      if (daemonHealth.age > RALPH_CONFIG.thresholds.maxDaemonAge) {
        daemonHealth.status = 'stale';
        daemonHealth.error = `Daemon inactive for ${Math.round(daemonHealth.age / 60000)} minutes`;
      }
    }

    const endTime = performance.now();
    daemonHealth.responseTime = Math.round(endTime - startTime);
  } catch (error) {
    daemonHealth.status = 'error';
    daemonHealth.error = error.message;
  }

  return daemonHealth;
}

// Get bead information from database
async function getBeadInfo() {
  const beadInfo = {
    totalBeads: 0,
    queuedBeads: 0,
    inProgressBeads: 0,
    completedBeads: 0,
    stuckBeads: 0,
    oldestBead: null,
    oldestBeadAge: null,
    processingRate: 0,
    avgProcessingTime: 0,
    beads: [],
  };

  try {
    // Check if beads database exists
    const dbExists = await fileExists(RALPH_CONFIG.beadsDbPath);
    if (!dbExists) {
      beadInfo.error = 'Beads database not found';
      return beadInfo;
    }

    // Use bd command to get bead information if available
    const bdAvailable = await isCommandAvailable('bd');
    if (bdAvailable) {
      try {
        // Get queued beads
        const { stdout: queuedOutput } = await execAsync('bd ls --status=queued --format=json', {
          timeout: 10000,
        });
        const queuedBeads = JSON.parse(queuedOutput || '[]');
        beadInfo.queuedBeads = queuedBeads.length;

        // Get in-progress beads
        const { stdout: progressOutput } = await execAsync(
          'bd ls --status=in-progress --format=json',
          { timeout: 10000 }
        );
        const inProgressBeads = JSON.parse(progressOutput || '[]');
        beadInfo.inProgressBeads = inProgressBeads.length;

        // Get completed beads (last 50 for rate calculation)
        const { stdout: completedOutput } = await execAsync(
          'bd ls --status=completed --limit=50 --format=json',
          { timeout: 10000 }
        );
        const completedBeads = JSON.parse(completedOutput || '[]');
        beadInfo.completedBeads = completedBeads.length;

        // Combine all beads for analysis
        const allBeads = [...queuedBeads, ...inProgressBeads, ...completedBeads];
        beadInfo.totalBeads = allBeads.length;
        beadInfo.beads = allBeads;

        // Find oldest bead
        const allBeadsWithTime = allBeads.filter(bead => bead.created_at);
        if (allBeadsWithTime.length > 0) {
          const oldestBeadData = allBeadsWithTime.reduce((oldest, bead) =>
            new Date(bead.created_at) < new Date(oldest.created_at) ? bead : oldest
          );
          beadInfo.oldestBead = oldestBeadData;
          beadInfo.oldestBeadAge = Date.now() - new Date(oldestBeadData.created_at).getTime();
        }

        // Identify stuck beads (queued for too long)
        const now = Date.now();
        beadInfo.stuckBeads = queuedBeads.filter(
          bead =>
            bead.created_at &&
            now - new Date(bead.created_at).getTime() > RALPH_CONFIG.thresholds.maxStuckTime
        ).length;

        // Calculate processing rate (beads per minute from completed beads)
        if (completedBeads.length >= 2) {
          const sortedBeads = completedBeads
            .filter(bead => bead.created_at && bead.completed_at)
            .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));

          if (sortedBeads.length >= 2) {
            const timeSpan =
              new Date(sortedBeads[sortedBeads.length - 1].completed_at) -
              new Date(sortedBeads[0].completed_at);
            if (timeSpan > 0) {
              beadInfo.processingRate = (sortedBeads.length / (timeSpan / 60000)).toFixed(2);
            }
          }

          // Calculate average processing time
          const processingTimes = sortedBeads.map(
            bead => new Date(bead.completed_at) - new Date(bead.created_at)
          );
          if (processingTimes.length > 0) {
            beadInfo.avgProcessingTime = Math.round(
              processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
            );
          }
        }
      } catch (error) {
        beadInfo.error = `Failed to get bead info: ${error.message}`;
      }
    } else {
      // Fallback: count beads from issues.jsonl
      const issuesExists = await fileExists(RALPH_CONFIG.issuesPath);
      if (issuesExists) {
        const issuesData = await fs.readFile(RALPH_CONFIG.issuesPath, 'utf8');
        const issues = issuesData
          .trim()
          .split('\n')
          .filter(line => line)
          .map(JSON.parse);
        beadInfo.totalBeads = issues.length;

        // Simple status estimation based on issue content
        // This is a fallback when bd command is not available
        beadInfo.queuedBeads = issues.filter(
          issue => !issue.status || issue.status === 'open'
        ).length;
      }
    }
  } catch (error) {
    beadInfo.error = `Error accessing bead data: ${error.message}`;
  }

  return beadInfo;
}

// Check if socket is responsive
async function checkSocketHealth() {
  const socketHealth = {
    status: 'unknown',
    responsive: false,
    responseTime: null,
    error: null,
  };

  try {
    const startTime = performance.now();
    const socketExists = await fileExists(RALPH_CONFIG.socketPath);

    if (!socketExists) {
      socketHealth.status = 'disconnected';
      socketHealth.error = 'Socket file not found';
      return socketHealth;
    }

    // Try to connect to socket (simple check)
    try {
      const { stdout } = await execAsync(`echo 'ping' | nc -U ${RALPH_CONFIG.socketPath}`, {
        timeout: 3000,
      });
      socketHealth.responsive = true;
      socketHealth.status = 'responsive';
    } catch (error) {
      socketHealth.status = 'unresponsive';
      socketHealth.error = 'Socket not responding';
    }

    const endTime = performance.now();
    socketHealth.responseTime = Math.round(endTime - startTime);
  } catch (error) {
    socketHealth.status = 'error';
    socketHealth.error = error.message;
  }

  return socketHealth;
}

// Check if a file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
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

// Perform comprehensive Ralph TUI health check
async function checkRalphHealth() {
  const startTime = performance.now();

  const healthStatus = {
    timestamp: new Date().toISOString(),
    overall: 'unknown',
    daemon: null,
    beads: null,
    socket: null,
    alerts: [],
    metrics: {
      queueDepth: 0,
      processingRate: 0,
      stuckBeads: 0,
      uptime: 0,
    },
    responseTime: null,
  };

  try {
    // Run all checks in parallel for efficiency
    const [daemonHealth, beadInfo, socketHealth] = await Promise.all([
      checkDaemonHealth(),
      getBeadInfo(),
      checkSocketHealth(),
    ]);

    healthStatus.daemon = daemonHealth;
    healthStatus.beads = beadInfo;
    healthStatus.socket = socketHealth;

    // Calculate overall health
    const checks = [daemonHealth.status, socketHealth.status];
    const healthyCount = checks.filter(
      status => status === 'running' || status === 'responsive'
    ).length;

    if (healthyCount === checks.length && !beadInfo.error) {
      healthStatus.overall = 'healthy';
    } else if (healthyCount > 0) {
      healthStatus.overall = 'degraded';
    } else {
      healthStatus.overall = 'unhealthy';
    }

    // Update metrics
    healthStatus.metrics.queueDepth = beadInfo.queuedBeads;
    healthStatus.metrics.processingRate = parseFloat(beadInfo.processingRate || 0);
    healthStatus.metrics.stuckBeads = beadInfo.stuckBeads;
    healthStatus.metrics.uptime = daemonHealth.uptime;

    // Check for alerts
    checkForAlerts(healthStatus);

    const endTime = performance.now();
    healthStatus.responseTime = Math.round(endTime - startTime);
  } catch (error) {
    healthStatus.overall = 'error';
    healthStatus.error = error.message;
  }

  return healthStatus;
}

// Check for alerts based on health status
async function checkForAlerts(healthStatus) {
  const alerts = [];
  const now = Date.now();

  // Check queue depth
  if (healthStatus.metrics.queueDepth > RALPH_CONFIG.thresholds.maxQueueDepth) {
    const alertKey = 'queue_depth';
    if (shouldSendAlert(alertKey, RALPH_CONFIG.alertCooldowns.queueStarvation)) {
      alerts.push({
        type: 'queue_overflow',
        severity: 'warning',
        message: `Queue depth (${healthStatus.metrics.queueDepth}) exceeds threshold (${RALPH_CONFIG.thresholds.maxQueueDepth})`,
        details: `Consider processing beads manually or investigating processing bottlenecks`,
        value: healthStatus.metrics.queueDepth,
        threshold: RALPH_CONFIG.thresholds.maxQueueDepth,
      });
      markAlertSent(alertKey);
    }
  }

  // Check for stuck beads
  if (healthStatus.metrics.stuckBeads > 0) {
    const alertKey = 'stuck_beads';
    if (shouldSendAlert(alertKey, RALPH_CONFIG.alertCooldowns.stuckBeads)) {
      alerts.push({
        type: 'stuck_beads',
        severity: 'critical',
        message: `${healthStatus.metrics.stuckBeads} beads stuck in queue`,
        details: `Beads have been queued for more than ${RALPH_CONFIG.thresholds.maxStuckTime / 60000} minutes`,
        value: healthStatus.metrics.stuckBeads,
        threshold: RALPH_CONFIG.thresholds.maxStuckTime / 60000,
      });
      markAlertSent(alertKey);
    }
  }

  // Check processing rate
  if (
    healthStatus.metrics.processingRate < RALPH_CONFIG.thresholds.minProcessingRate &&
    healthStatus.metrics.queueDepth > 0
  ) {
    const alertKey = 'low_processing_rate';
    if (shouldSendAlert(alertKey, RALPH_CONFIG.alertCooldowns.queueStarvation)) {
      alerts.push({
        type: 'queue_starvation',
        severity: 'warning',
        message: `Processing rate (${healthStatus.metrics.processingRate}/min) below threshold`,
        details: `Queue is not being processed efficiently`,
        value: healthStatus.metrics.processingRate,
        threshold: RALPH_CONFIG.thresholds.minProcessingRate,
      });
      markAlertSent(alertKey);
    }
  }

  // Check daemon status
  if (healthStatus.daemon.status !== 'running') {
    const alertKey = 'daemon_down';
    if (shouldSendAlert(alertKey, RALPH_CONFIG.alertCooldowns.daemonDown)) {
      alerts.push({
        type: 'daemon_down',
        severity: 'critical',
        message: `Ralph daemon is ${healthStatus.daemon.status}`,
        details: healthStatus.daemon.error || 'Daemon process not running',
        status: healthStatus.daemon.status,
      });
      markAlertSent(alertKey);
    }
  }

  healthStatus.alerts = alerts;

  // Send alerts
  for (const alert of alerts) {
    await sendAlert(alert);
  }
}

// Check if we should send an alert (cooldown logic)
function shouldSendAlert(alertKey, cooldown) {
  const lastAlert = alertHistory.get(alertKey);
  if (!lastAlert) return true;
  return Date.now() - lastAlert > cooldown;
}

// Mark alert as sent
function markAlertSent(alertKey) {
  alertHistory.set(alertKey, Date.now());
}

// Send alert
async function sendAlert(alert) {
  console.error(`🚨 RALPH TUI ALERT: ${alert.message}`);
  console.error(`   Type: ${alert.type}`);
  console.error(`   Severity: ${alert.severity}`);
  console.error(`   Details: ${alert.details}`);
  console.error(`   Time: ${new Date().toISOString()}`);

  // Save alert to file
  const alertFile = path.join(monitoringDataDir, 'alerts.jsonl');
  try {
    const alertData = {
      ...alert,
      timestamp: new Date().toISOString(),
    };
    await fs.appendFile(alertFile, JSON.stringify(alertData) + '\n');
  } catch (error) {
    console.error('Failed to save alert:', error);
  }
}

// Save metrics to file
async function saveMetrics(healthStatus) {
  const metricsFile = path.join(monitoringDataDir, 'metrics.json');

  try {
    // Load existing metrics
    let existingMetrics = {};
    try {
      const existingData = await fs.readFile(metricsFile, 'utf8');
      existingMetrics = JSON.parse(existingData);
    } catch {
      // File doesn't exist, start fresh
    }

    // Update metrics with new data
    if (!existingMetrics.checks) existingMetrics.checks = [];
    existingMetrics.checks.push(healthStatus);

    // Keep only last 100 checks
    if (existingMetrics.checks.length > 100) {
      existingMetrics.checks = existingMetrics.checks.slice(-100);
    }

    existingMetrics.lastUpdated = new Date().toISOString();

    await fs.writeFile(metricsFile, JSON.stringify(existingMetrics, null, 2));
  } catch (error) {
    console.error('Failed to save metrics:', error);
  }
}

// Generate monitoring report
async function generateReport() {
  const metricsFile = path.join(monitoringDataDir, 'metrics.json');

  try {
    const metricsData = await fs.readFile(metricsFile, 'utf8');
    const metrics = JSON.parse(metricsData);

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overall: 'unknown',
        queueDepth: 0,
        processingRate: 0,
        stuckBeads: 0,
        daemonStatus: 'unknown',
        totalChecks: metrics.checks?.length || 0,
      },
      trend: {
        avgProcessingRate: 0,
        maxQueueDepth: 0,
        totalAlerts: 0,
      },
      recentAlerts: [],
    };

    if (metrics.checks && metrics.checks.length > 0) {
      const latestCheck = metrics.checks[metrics.checks.length - 1];
      report.summary.overall = latestCheck.overall;
      report.summary.queueDepth = latestCheck.metrics?.queueDepth || 0;
      report.summary.processingRate = latestCheck.metrics?.processingRate || 0;
      report.summary.stuckBeads = latestCheck.metrics?.stuckBeads || 0;
      report.summary.daemonStatus = latestCheck.daemon?.status || 'unknown';

      // Calculate trends
      const recentChecks = metrics.checks.slice(-10); // Last 10 checks
      const processingRates = recentChecks
        .map(check => check.metrics?.processingRate || 0)
        .filter(rate => rate > 0);

      if (processingRates.length > 0) {
        report.trend.avgProcessingRate = (
          processingRates.reduce((sum, rate) => sum + rate, 0) / processingRates.length
        ).toFixed(2);
      }

      report.trend.maxQueueDepth = Math.max(
        ...recentChecks.map(check => check.metrics?.queueDepth || 0)
      );

      report.trend.totalAlerts = recentChecks.reduce(
        (sum, check) => sum + (check.alerts?.length || 0),
        0
      );
    }

    // Load recent alerts
    const alertFile = path.join(monitoringDataDir, 'alerts.jsonl');
    try {
      const alertData = await fs.readFile(alertFile, 'utf8');
      const alerts = alertData
        .trim()
        .split('\n')
        .filter(line => line)
        .map(JSON.parse);

      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      report.recentAlerts = alerts
        .filter(alert => new Date(alert.timestamp) > twentyFourHoursAgo)
        .slice(-10); // Last 10 alerts
    } catch {
      // No alerts file
    }

    return report;
  } catch (error) {
    console.error('Failed to generate report:', error);
    return {
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}

// Main monitoring function
async function runMonitoring() {
  console.log('🔍 Starting Ralph TUI Queue Health Monitoring...');

  await ensureMonitoringDataDir();

  try {
    const healthStatus = await checkRalphHealth();
    await saveMetrics(healthStatus);

    console.log(`\n📊 Ralph TUI Status: ${healthStatus.overall}`);
    console.log(`  Daemon: ${healthStatus.daemon?.status || 'unknown'}`);
    console.log(`  Queue Depth: ${healthStatus.metrics.queueDepth}`);
    console.log(`  Processing Rate: ${healthStatus.metrics.processingRate}/min`);
    console.log(`  Stuck Beads: ${healthStatus.metrics.stuckBeads}`);

    if (healthStatus.alerts.length > 0) {
      console.log(`\n🚨 Active Alerts: ${healthStatus.alerts.length}`);
      healthStatus.alerts.forEach(alert => {
        console.log(`  • ${alert.severity}: ${alert.message}`);
      });
    }

    console.log('\n✅ Monitoring cycle completed');
  } catch (error) {
    console.error('❌ Monitoring failed:', error.message);
  }
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

    case 'status': {
      const healthStatus = await checkRalphHealth();
      console.log(JSON.stringify(healthStatus, null, 2));
      break;
    }

    default: {
      const helpText =
        'Usage: node scripts/ralph-queue-monitor.mjs <command>\n\n' +
        'Commands:\n' +
        '  check    - Run one-time health check on Ralph TUI queue\n' +
        '  report   - Generate detailed health report\n' +
        '  watch    - Run continuous monitoring (checks every 60 seconds)\n' +
        '  status   - Get detailed status information\n\n' +
        'Examples:\n' +
        '  node scripts/ralph-queue-monitor.mjs check\n' +
        '  node scripts/ralph-queue-monitor.mjs watch\n' +
        '  node scripts/ralph-queue-monitor.mjs status';
      console.log(helpText);
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Ralph TUI monitoring...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down Ralph TUI monitoring...');
  process.exit(0);
});

// Run the monitoring
if (import.meta.url === 'file://' + process.argv[1]) {
  main().catch(console.error);
}
