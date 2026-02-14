#!/usr/bin/env node

/**
 * Netlify Function Health Alerting System
 *
 * Automated alerting for function failures, performance degradation,
 * and critical health issues with multiple notification channels.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { FunctionHealthMonitor } from './netlify-function-health-monitor.mjs';

const REPORTS_DIR = '.netlify-function-reports';
const ALERTS_HISTORY = join(REPORTS_DIR, 'alerts-history.json');
const COOLDOWN_FILE = join(REPORTS_DIR, 'alert-cooldowns.json');
const CONFIG_FILE = join(REPORTS_DIR, 'alert-config.json');

// Default alert configuration
const DEFAULT_CONFIG = {
  enabled: true,
  channels: {
    console: true,
    github: true,
    slack: false,
  },
  thresholds: {
    critical: {
      minScore: 1, // Any critical issue
      cooldown: 4 * 60 * 60 * 1000, // 4 hours
    },
    warning: {
      minScore: 3, // 3+ warning issues
      cooldown: 24 * 60 * 60 * 1000, // 24 hours
    },
    performance: {
      minScore: 2, // 2+ performance issues
      cooldown: 12 * 60 * 60 * 1000, // 12 hours
    },
  },
  escalation: {
    enabled: true,
    levels: [
      { delay: 30 * 60 * 1000, channels: ['console', 'github'] }, // 30 min
      { delay: 2 * 60 * 60 * 1000, channels: ['console', 'github', 'slack'] }, // 2 hours
    ],
  },
};

/**
 * Function Health Alerting System
 */
class FunctionHealthAlerting {
  constructor() {
    this.config = DEFAULT_CONFIG;
    this.cooldowns = new Map();
    this.alertsHistory = [];
    this.monitor = new FunctionHealthMonitor();
  }

  /**
   * Initialize alerting system
   */
  async initialize() {
    console.log('🚨 Initializing Function Health Alerting System...');

    // Ensure reports directory exists
    await mkdir(REPORTS_DIR, { recursive: true });

    // Load configuration
    await this.loadConfig();

    // Load cooldowns
    await this.loadCooldowns();

    // Load alerts history
    await this.loadAlertsHistory();

    if (!this.config.enabled) {
      console.log('🔕 Alerting system is disabled');
      return false;
    }

    console.log('✅ Alerting system initialized');
    console.log(
      `📊 Channels enabled: ${Object.entries(this.config.channels)
        .filter(([k, v]) => v)
        .map(([k]) => k)
        .join(', ')}`
    );

    return true;
  }

  /**
   * Load alert configuration
   */
  async loadConfig() {
    try {
      const data = await readFile(CONFIG_FILE, 'utf8');
      this.config = { ...DEFAULT_CONFIG, ...JSON.parse(data) };
      console.log('📋 Loaded custom alert configuration');
    } catch (error) {
      this.config = DEFAULT_CONFIG;
      console.log('📝 Using default alert configuration');
    }
  }

  /**
   * Load cooldown periods
   */
  async loadCooldowns() {
    try {
      const data = await readFile(COOLDOWN_FILE, 'utf8');
      const cooldownsData = JSON.parse(data);
      this.cooldowns = new Map(Object.entries(cooldownsData));

      // Clean expired cooldowns
      const now = Date.now();
      for (const [key, timestamp] of this.cooldowns.entries()) {
        if (timestamp < now) {
          this.cooldowns.delete(key);
        }
      }

      await this.saveCooldowns();
      console.log('⏰ Loaded and cleaned cooldown periods');
    } catch (error) {
      this.cooldowns = new Map();
      console.log('📝 No previous cooldowns found');
    }
  }

  /**
   * Load alerts history
   */
  async loadAlertsHistory() {
    try {
      const data = await readFile(ALERTS_HISTORY, 'utf8');
      this.alertsHistory = JSON.parse(data);

      // Keep only last 1000 alerts
      if (this.alertsHistory.length > 1000) {
        this.alertsHistory = this.alertsHistory.slice(-1000);
      }

      console.log('📚 Loaded alerts history');
    } catch (error) {
      this.alertsHistory = [];
      console.log('📝 No previous alerts history found');
    }
  }

  /**
   * Check cooldown period for alert type
   */
  isInCooldown(alertType, functionName = null) {
    const key = functionName ? `${alertType}:${functionName}` : alertType;
    const cooldownEnd = this.cooldowns.get(key);

    if (cooldownEnd && cooldownEnd > Date.now()) {
      return true;
    }

    return false;
  }

  /**
   * Set cooldown period
   */
  setCooldown(alertType, functionName = null) {
    const key = functionName ? `${alertType}:${functionName}` : alertType;
    const threshold = this.config.thresholds[alertType];

    if (threshold) {
      this.cooldowns.set(key, Date.now() + threshold.cooldown);
    }
  }

  /**
   * Save cooldowns
   */
  async saveCooldowns() {
    const cooldownsData = Object.fromEntries(this.cooldowns);
    await writeFile(COOLDOWN_FILE, JSON.stringify(cooldownsData, null, 2));
  }

  /**
   * Process health check results and send alerts
   */
  async processHealthResults(healthResults) {
    if (!this.config.enabled) {
      return { alertsSent: 0, alertsSkipped: 0 };
    }

    console.log('🔍 Processing health results for alerts...');

    const alerts = this.analyzeHealthResults(healthResults);
    const processedAlerts = [];

    let alertsSent = 0;
    let alertsSkipped = 0;

    for (const alert of alerts) {
      // Check cooldown
      if (this.isInCooldown(alert.type, alert.functionName)) {
        alertsSkipped++;
        console.log(`⏰ Alert skipped due to cooldown: ${alert.type} for ${alert.functionName}`);
        continue;
      }

      // Set cooldown
      this.setCooldown(alert.type, alert.functionName);

      // Send alert
      const sent = await this.sendAlert(alert);
      if (sent) {
        alertsSent++;
        processedAlerts.push(alert);

        // Add to history
        this.alertsHistory.push({
          ...alert,
          sentAt: new Date().toISOString(),
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
      }
    }

    // Save updates
    await this.saveCooldowns();
    await this.saveAlertsHistory();

    console.log(`📨 Alert processing complete: ${alertsSent} sent, ${alertsSkipped} skipped`);

    return { alertsSent, alertsSkipped, alerts: processedAlerts };
  }

  /**
   * Analyze health results to generate alerts
   */
  analyzeHealthResults(healthResults) {
    const alerts = [];

    for (const [functionName, health] of Object.entries(healthResults)) {
      // Critical alerts
      if (health.status === 'critical') {
        const criticalIssues = health.issues.filter(issue => issue.severity === 'critical');

        if (criticalIssues.length > 0) {
          alerts.push({
            type: 'critical',
            severity: 'critical',
            functionName,
            title: `Critical Issues in ${functionName}`,
            message: `${criticalIssues.length} critical issues detected`,
            issues: criticalIssues,
            recommendations: health.recommendations,
            metrics: health.metrics,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Warning alerts
      if (health.status === 'warning') {
        const warningIssues = health.issues.filter(issue => issue.severity === 'warning');

        if (warningIssues.length >= this.config.thresholds.warning.minScore) {
          alerts.push({
            type: 'warning',
            severity: 'warning',
            functionName,
            title: `Multiple Warnings in ${functionName}`,
            message: `${warningIssues.length} warning issues detected`,
            issues: warningIssues,
            recommendations: health.recommendations,
            metrics: health.metrics,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Performance alerts
      const performanceIssues = health.issues.filter(
        issue => issue.type === 'slow_execution' || issue.type === 'high_cold_start_rate'
      );

      if (performanceIssues.length >= this.config.thresholds.performance.minScore) {
        alerts.push({
          type: 'performance',
          severity: 'warning',
          functionName,
          title: `Performance Issues in ${functionName}`,
          message: `${performanceIssues.length} performance issues detected`,
          issues: performanceIssues,
          recommendations: health.recommendations,
          metrics: health.metrics,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return alerts;
  }

  /**
   * Send alert through enabled channels
   */
  async sendAlert(alert) {
    let sent = false;

    try {
      // Console alert
      if (this.config.channels.console) {
        this.sendConsoleAlert(alert);
        sent = true;
      }

      // GitHub alert
      if (this.config.channels.github) {
        await this.sendGitHubAlert(alert);
        sent = true;
      }

      // Slack alert
      if (this.config.channels.slack) {
        await this.sendSlackAlert(alert);
        sent = true;
      }
    } catch (error) {
      console.error(`❌ Failed to send alert for ${alert.functionName}:`, error);
      return false;
    }

    return sent;
  }

  /**
   * Send console alert
   */
  sendConsoleAlert(alert) {
    const icon = alert.severity === 'critical' ? '🚨' : '⚠️';
    console.log(`\n${icon} FUNCTION HEALTH ALERT`);
    console.log(`Function: ${alert.functionName}`);
    console.log(`Title: ${alert.title}`);
    console.log(`Message: ${alert.message}`);
    console.log(`Time: ${new Date(alert.timestamp).toLocaleString()}`);

    if (alert.issues.length > 0) {
      console.log('\nIssues:');
      alert.issues.forEach(issue => {
        console.log(`  - ${issue.message}`);
      });
    }

    if (alert.recommendations.length > 0) {
      console.log('\nRecommendations:');
      alert.recommendations.forEach(rec => {
        console.log(`  * ${rec}`);
      });
    }

    console.log('');
  }

  /**
   * Send GitHub alert (create issue)
   */
  async sendGitHubAlert(alert) {
    // This would integrate with GitHub API to create issues
    // For now, we'll simulate it with console output
    console.log(`📝 GitHub Alert: Would create issue for ${alert.functionName} - ${alert.title}`);

    // In a real implementation:
    // 1. Check if similar issue already exists
    // 2. Create new issue with detailed information
    // 3. Add appropriate labels
    // 4. Link to monitoring dashboard
  }

  /**
   * Send Slack alert
   */
  async sendSlackAlert(alert) {
    if (!process.env.SLACK_WEBHOOK_URL) {
      console.log('⚠️  Slack webhook URL not configured, skipping Slack alert');
      return;
    }

    const color = alert.severity === 'critical' ? 'danger' : 'warning';
    const icon = alert.severity === 'critical' ? ':rotating_light:' : ':warning:';

    const slackMessage = {
      text: `${icon} Function Health Alert: ${alert.functionName}`,
      attachments: [
        {
          color,
          fields: [
            {
              title: 'Function',
              value: alert.functionName,
              short: true,
            },
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Title',
              value: alert.title,
              short: false,
            },
            {
              title: 'Message',
              value: alert.message,
              short: false,
            },
          ],
          footer: 'Function Health Monitor',
          ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
        },
      ],
    };

    // Add issues field if present
    if (alert.issues.length > 0) {
      slackMessage.attachments[0].fields.push({
        title: 'Issues',
        value: alert.issues.map(issue => `• ${issue.message}`).join('\n'),
        short: false,
      });
    }

    // Add recommendations field if present
    if (alert.recommendations.length > 0) {
      slackMessage.attachments[0].fields.push({
        title: 'Recommendations',
        value: alert.recommendations.map(rec => `• ${rec}`).join('\n'),
        short: false,
      });
    }

    try {
      const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
      }

      console.log(`📱 Slack alert sent for ${alert.functionName}`);
    } catch (error) {
      console.error(`❌ Failed to send Slack alert:`, error);
      throw error;
    }
  }

  /**
   * Save alerts history
   */
  async saveAlertsHistory() {
    await writeFile(ALERTS_HISTORY, JSON.stringify(this.alertsHistory, null, 2));
  }

  /**
   * Get alert statistics
   */
  getAlertStats() {
    const last24h = Date.now() - 24 * 60 * 60 * 1000;
    const last7d = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const recentAlerts = this.alertsHistory.filter(
      alert => new Date(alert.sentAt).getTime() > last24h
    );

    const weeklyAlerts = this.alertsHistory.filter(
      alert => new Date(alert.sentAt).getTime() > last7d
    );

    const severityBreakdown = recentAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {});

    const typeBreakdown = recentAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalAlerts: this.alertsHistory.length,
      last24h: recentAlerts.length,
      last7d: weeklyAlerts.length,
      severityBreakdown,
      typeBreakdown,
      activeCooldowns: this.cooldowns.size,
    };
  }

  /**
   * Generate alert report
   */
  generateAlertReport() {
    const stats = this.getAlertStats();
    const recentAlerts = this.alertsHistory.slice(-10).reverse();

    return {
      timestamp: new Date().toISOString(),
      stats,
      recentAlerts,
      config: {
        enabled: this.config.enabled,
        channels: Object.entries(this.config.channels)
          .filter(([k, v]) => v)
          .map(([k]) => k),
      },
    };
  }

  /**
   * Run complete alerting cycle
   */
  async runAlerting() {
    try {
      const initialized = await this.initialize();

      if (!initialized) {
        return { success: false, reason: 'Alerting system disabled' };
      }

      console.log('🏥 Running health check for alerting...');

      // Run health check
      const healthResults = await this.monitor.checkAllFunctions();

      // Process alerts
      const result = await this.processHealthResults(healthResults);

      // Generate report
      const report = this.generateAlertReport();

      console.log('✅ Alerting cycle completed');

      return {
        success: true,
        ...result,
        report,
      };
    } catch (error) {
      console.error('❌ Alerting failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Main execution
async function main() {
  const alerting = new FunctionHealthAlerting();
  const result = await alerting.runAlerting();

  if (result.success) {
    console.log('\n✅ Function health alerting completed successfully');
    console.log(`📨 Alerts sent: ${result.alertsSent}`);
    console.log(`⏰ Alerts skipped: ${result.alertsSkipped}`);

    if (result.alerts && result.alerts.length > 0) {
      console.log('\n📊 Alert Summary:');
      result.alerts.forEach(alert => {
        console.log(`  ${alert.severity.toUpperCase()}: ${alert.functionName} - ${alert.title}`);
      });
    }

    process.exit(0);
  } else {
    console.error('\n❌ Function health alerting failed');
    console.error(`Reason: ${result.reason || result.error}`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { FunctionHealthAlerting };
