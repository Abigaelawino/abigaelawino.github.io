#!/usr/bin/env node

/**
 * Netlify Function Health Dashboard
 *
 * Real-time ASCII dashboard for monitoring Netlify function health.
 * Provides live visualization of function metrics, trends, and alerts.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { setInterval, clearInterval } from 'timers';
import { FunctionHealthMonitor } from './netlify-function-health-monitor.mjs';

const REPORTS_DIR = '.netlify-function-reports';
const HEALTH_DATA_FILE = join(REPORTS_DIR, 'function-health-data.json');
const ALERTS_FILE = join(REPORTS_DIR, 'function-alerts.json');
const LATEST_REPORT_FILE = join(REPORTS_DIR, 'latest-function-health-report.json');

/**
 * ASCII Dashboard for Function Health Monitoring
 */
class FunctionHealthDashboard {
  constructor() {
    this.monitor = new FunctionHealthMonitor();
    this.isRunning = false;
    this.intervalId = null;
    this.refreshInterval = 30000; // 30 seconds
    this.lastUpdate = null;
  }

  /**
   * Start the dashboard
   */
  async start() {
    console.log('🚀 Starting Netlify Function Health Dashboard...');

    // Initialize the monitor
    await this.monitor.initialize();

    // Load existing data
    await this.loadExistingData();

    // Start real-time monitoring
    this.isRunning = true;
    this.startMonitoring();

    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());

    console.log('✅ Dashboard started. Press Ctrl+C to stop.');
  }

  /**
   * Load existing health data
   */
  async loadExistingData() {
    try {
      await readFile(HEALTH_DATA_FILE, 'utf8');
      await readFile(ALERTS_FILE, 'utf8');
      console.log('📊 Loaded existing health data');
    } catch (error) {
      console.log('📝 No existing data found, will collect on first run');
    }
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring() {
    // Initial health check
    this.updateDashboard();

    // Set up periodic updates
    this.intervalId = setInterval(() => {
      this.updateDashboard();
    }, this.refreshInterval);
  }

  /**
   * Update dashboard with fresh data
   */
  async updateDashboard() {
    try {
      // Clear screen
      console.clear();

      // Run health check
      const result = await this.monitor.runHealthCheck();

      if (result.success) {
        this.lastUpdate = new Date();

        // Read the latest report file for full data
        const reportData = await this.loadLatestReport();
        this.renderDashboard(reportData);
      } else {
        this.renderError(result.error);
      }
    } catch (error) {
      this.renderError(error.message);
    }
  }

  /**
   * Load latest report data
   */
  async loadLatestReport() {
    try {
      const data = await readFile(LATEST_REPORT_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // Fallback to basic health check
      const result = await this.monitor.runHealthCheck();
      return {
        summary: result.summary || {},
        functions: result.functions || {},
        alerts: result.alerts || [],
        trends: result.trends || { overall: 'stable' },
      };
    }
  }

  /**
   * Render the main dashboard
   */
  renderDashboard(result) {
    const { summary, functions, alerts, trends } = result;

    // Header
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + this.centerText('🏥 NETLIFY FUNCTION HEALTH DASHBOARD', 78) + '║');
    console.log('╠' + '═'.repeat(78) + '╣');

    // Summary row
    console.log('║' + this.formatSummaryRow(summary, 78) + '║');
    console.log('╠' + '═'.repeat(78) + '╣');

    // Function status grid
    console.log('║' + this.centerText('📊 FUNCTION STATUS', 78) + '║');
    console.log('╠' + '═'.repeat(78) + '╣');

    const functionRows = this.createFunctionGrid(functions);
    functionRows.forEach(row => {
      console.log('║' + row.padEnd(78) + '║');
    });

    console.log('╠' + '═'.repeat(78) + '╣');

    // Metrics overview
    console.log('║' + this.centerText('📈 METRICS OVERVIEW', 78) + '║');
    console.log('╠' + '═'.repeat(78) + '╣');

    const metricsRows = this.createMetricsOverview(functions);
    metricsRows.forEach(row => {
      console.log('║' + row.padEnd(78) + '║');
    });

    console.log('╠' + '═'.repeat(78) + '╣');

    // Recent alerts
    if (alerts && alerts.length > 0) {
      console.log('║' + this.centerText('🚨 RECENT ALERTS', 78) + '║');
      console.log('╠' + '═'.repeat(78) + '╣');

      const alertRows = this.createAlertsSection(alerts);
      alertRows.forEach(row => {
        console.log('║' + row.padEnd(78) + '║');
      });

      console.log('╠' + '═'.repeat(78) + '╣');
    }

    // Footer with timestamp
    console.log(
      '║' +
        this.centerText(`Last Update: ${this.lastUpdate?.toLocaleString() || 'Never'}`, 78) +
        '║'
    );
    console.log(
      '║' + this.centerText('Auto-refresh every 30 seconds | Press Ctrl+C to exit', 78) + '║'
    );
    console.log('╚' + '═'.repeat(78) + '╝');
  }

  /**
   * Format summary row
   */
  formatSummaryRow(summary, width) {
    const healthy = `✅ ${summary.healthy}`;
    const warning = `⚠️ ${summary.warning}`;
    const critical = `❌ ${summary.critical}`;
    const newAlerts = `🚨 ${summary.newAlerts}`;

    const content = `Status: ${healthy} | ${warning} | ${critical} | New Alerts: ${newAlerts}`;
    return content.padEnd(width - 2) + ' ';
  }

  /**
   * Create function status grid
   */
  createFunctionGrid(functions) {
    const rows = [];
    const functionNames = Object.keys(functions);

    // Create 3-column grid
    const cols = 3;
    const rowsNeeded = Math.ceil(functionNames.length / cols);

    for (let i = 0; i < rowsNeeded; i++) {
      let row = '';
      for (let j = 0; j < cols; j++) {
        const index = i * cols + j;
        if (index < functionNames.length) {
          const name = functionNames[index];
          const health = functions[name];
          const status = this.getStatusIcon(health.status);
          const paddedName = name.padEnd(20);
          const metrics = `${health.metrics.executionTime || 'N/A'}ms | ${(health.metrics.errorRate * 100).toFixed(1)}%`;
          const cell = `${status} ${paddedName} ${metrics}`;
          row += cell.padEnd(25);
        } else {
          row += ''.padEnd(25);
        }
      }
      rows.push(row);
    }

    return rows;
  }

  /**
   * Create metrics overview section
   */
  createMetricsOverview(functions) {
    const rows = [];

    // Calculate averages
    const metrics = this.calculateAverageMetrics(functions);

    rows.push(`Average Execution Time: ${metrics.avgExecTime}ms`);
    rows.push(`Average Error Rate: ${(metrics.avgErrorRate * 100).toFixed(2)}%`);
    rows.push(`Average Cold Start Rate: ${(metrics.avgColdStartRate * 100).toFixed(2)}%`);
    rows.push(`Overall Availability: ${(metrics.avgAvailability * 100).toFixed(2)}%`);
    rows.push('');
    rows.push('Performance Distribution:');
    rows.push(`  Fast (<500ms): ${metrics.fastFunctions}`);
    rows.push(`  Medium (500ms-2s): ${metrics.mediumFunctions}`);
    rows.push(`  Slow (>2s): ${metrics.slowFunctions}`);

    return rows;
  }

  /**
   * Create alerts section
   */
  createAlertsSection(alerts) {
    const rows = [];
    const maxAlerts = 5; // Show max 5 recent alerts

    alerts.slice(0, maxAlerts).forEach((alert, index) => {
      const time = new Date(alert.timestamp).toLocaleTimeString();
      rows.push(`${index + 1}. [${time}] ${alert.functionName}: ${alert.message}`);
    });

    if (alerts.length > maxAlerts) {
      rows.push(`... and ${alerts.length - maxAlerts} more alerts`);
    }

    return rows;
  }

  /**
   * Calculate average metrics across all functions
   */
  calculateAverageMetrics(functions) {
    const functionArray = Object.values(functions);

    const avgExecTime =
      functionArray.reduce((sum, f) => sum + (f.metrics.executionTime || 0), 0) /
      functionArray.length;
    const avgErrorRate =
      functionArray.reduce((sum, f) => sum + f.metrics.errorRate, 0) / functionArray.length;
    const avgColdStartRate =
      functionArray.reduce((sum, f) => sum + f.metrics.coldStartRate, 0) / functionArray.length;
    const avgAvailability =
      functionArray.reduce((sum, f) => sum + f.metrics.availability, 0) / functionArray.length;

    // Performance distribution
    const fastFunctions = functionArray.filter(f => (f.metrics.executionTime || 0) < 500).length;
    const mediumFunctions = functionArray.filter(f => {
      const time = f.metrics.executionTime || 0;
      return time >= 500 && time <= 2000;
    }).length;
    const slowFunctions = functionArray.filter(f => (f.metrics.executionTime || 0) > 2000).length;

    return {
      avgExecTime: Math.round(avgExecTime),
      avgErrorRate,
      avgColdStartRate,
      avgAvailability,
      fastFunctions,
      mediumFunctions,
      slowFunctions,
    };
  }

  /**
   * Get status icon
   */
  getStatusIcon(status) {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'critical':
        return '❌';
      case 'error':
        return '💥';
      default:
        return '❓';
    }
  }

  /**
   * Center text within width
   */
  centerText(text, width) {
    const padding = Math.max(0, width - text.length - 2);
    const leftPadding = Math.floor(padding / 2);
    const rightPadding = padding - leftPadding;
    return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
  }

  /**
   * Render error message
   */
  renderError(error) {
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + this.centerText('💥 DASHBOARD ERROR', 78) + '║');
    console.log('╠' + '═'.repeat(78) + '╣');
    console.log('║' + this.centerText(`Error: ${error}`, 78) + '║');
    console.log('║' + this.centerText('Please check your configuration and try again', 78) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    console.log('\n🛑 Shutting down dashboard...');

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.isRunning = false;
    console.log('✅ Dashboard stopped');
    process.exit(0);
  }
}

/**
 * Interactive dashboard mode
 */
class InteractiveDashboard extends FunctionHealthDashboard {
  constructor() {
    super();
    this.mode = 'overview'; // overview, details, alerts
  }

  /**
   * Start interactive dashboard
   */
  async startInteractive() {
    console.log('🎮 Starting Interactive Function Health Dashboard...');
    console.log('📋 Controls: [o] Overview [d] Details [a] Alerts [q] Quit');

    // Set up keyboard input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', key => {
      this.handleKeyPress(key);
    });

    await this.start();
  }

  /**
   * Handle keyboard input
   */
  handleKeyPress(key) {
    switch (key) {
      case 'o':
        this.mode = 'overview';
        break;
      case 'd':
        this.mode = 'details';
        break;
      case 'a':
        this.mode = 'alerts';
        break;
      case 'q':
      case '\u0003': // Ctrl+C
        this.shutdown();
        break;
    }
  }

  /**
   * Render dashboard based on mode
   */
  async renderDashboard(result) {
    switch (this.mode) {
      case 'overview':
        super.renderDashboard(result);
        break;
      case 'details':
        this.renderDetailedView(result);
        break;
      case 'alerts':
        this.renderAlertsView(result);
        break;
    }
  }

  /**
   * Render detailed function view
   */
  renderDetailedView(result) {
    console.clear();

    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + this.centerText('📋 DETAILED FUNCTION VIEW', 78) + '║');
    console.log('╠' + '═'.repeat(78) + '╣');

    Object.entries(result.functions).forEach(([name, health], index) => {
      console.log(`║ ${index + 1}. ${name}`);
      console.log(
        `║    Status: ${this.getStatusIcon(health.status)} ${health.status.toUpperCase()}`
      );
      console.log(`║    Execution: ${health.metrics.executionTime}ms`);
      console.log(`║    Error Rate: ${(health.metrics.errorRate * 100).toFixed(2)}%`);
      console.log(`║    Availability: ${(health.metrics.availability * 100).toFixed(2)}%`);
      console.log(`║    Cold Starts: ${(health.metrics.coldStartRate * 100).toFixed(2)}%`);

      if (health.issues.length > 0) {
        console.log(`║    Issues: ${health.issues.length}`);
        health.issues.slice(0, 2).forEach(issue => {
          console.log(`║      - ${issue.message}`);
        });
      }

      console.log('║' + '─'.repeat(78) + '║');
    });

    console.log('║' + this.centerText('[o] Overview [d] Details [a] Alerts [q] Quit', 78) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
  }

  /**
   * Render alerts view
   */
  renderAlertsView(result) {
    console.clear();

    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + this.centerText('🚨 ALERTS CENTER', 78) + '║');
    console.log('╠' + '═'.repeat(78) + '╣');

    if (result.alerts && result.alerts.length > 0) {
      result.alerts.forEach((alert, index) => {
        const time = new Date(alert.timestamp).toLocaleString();
        console.log(`║ ${index + 1}. [${time}]`);
        console.log(`║    Function: ${alert.functionName}`);
        console.log(`║    Severity: ${alert.severity.toUpperCase()}`);
        console.log(`║    Message: ${alert.message}`);

        if (alert.issues.length > 0) {
          console.log(`║    Issues:`);
          alert.issues.forEach(issue => {
            console.log(`║      - ${issue.message}`);
          });
        }

        if (alert.recommendations.length > 0) {
          console.log(`║    Recommendations:`);
          alert.recommendations.forEach(rec => {
            console.log(`║      * ${rec}`);
          });
        }

        console.log('║' + '─'.repeat(78) + '║');
      });
    } else {
      console.log('║' + this.centerText('✅ No active alerts', 78) + '║');
      console.log('║' + '─'.repeat(78) + '║');
    }

    console.log('║' + this.centerText('[o] Overview [d] Details [a] Alerts [q] Quit', 78) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const interactive = args.includes('--interactive') || args.includes('-i');

  let dashboard;

  if (interactive) {
    dashboard = new InteractiveDashboard();
    await dashboard.startInteractive();
  } else {
    dashboard = new FunctionHealthDashboard();
    await dashboard.start();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { FunctionHealthDashboard, InteractiveDashboard };
