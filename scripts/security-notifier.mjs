#!/usr/bin/env node

/**
 * Security Notification System
 *
 * Handles notifications for security vulnerabilities based on severity and configuration.
 * Supports GitHub Issues and Slack integrations.
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Send notification based on configuration and severity
 */
class SecurityNotifier {
  constructor(config = {}) {
    this.config = {
      github: {
        enabled: true,
        createIssues: true,
        labelStrategy: {
          high: ['security', 'vulnerabilities', 'high-priority'],
          critical: ['security', 'vulnerabilities', 'critical', 'urgent'],
          moderate: ['security', 'vulnerabilities'],
          low: ['security', 'maintenance'],
        },
      },
      slack: {
        enabled: false,
        webhook: process.env.SLACK_SECURITY_WEBHOOK,
        channel: '#security-alerts',
        mention: ['@security-team'],
      },
      thresholds: {
        createIssue: 'high',
        immediateNotification: 'critical',
      },
      ...config,
    };
  }

  /**
   * Generate GitHub issue title
   */
  generateIssueTitle(report) {
    const { summary, breakdown } = report;

    if (breakdown.critical > 0 && breakdown.high > 0) {
      return `🚨 Security Alert: ${breakdown.critical} Critical, ${breakdown.high} High Vulnerabilities`;
    } else if (breakdown.critical > 0) {
      return `🚨 Critical Security Alert: ${breakdown.critical} Critical Vulnerabilities`;
    } else if (breakdown.high > 0) {
      return `⚠️ Security Alert: ${breakdown.high} High Vulnerabilities Found`;
    } else {
      return `🔍 Security Scan Results: ${summary.totalVulnerabilities} Vulnerabilities`;
    }
  }

  /**
   * Generate GitHub issue body
   */
  generateIssueBody(report) {
    const { summary, breakdown, requireReview, autoPatched } = report;

    let body = `# 🔍 Security Vulnerability Report\n\n`;
    body += `**Scan Date:** ${report.scanDate}\n`;
    body += `**Total Vulnerabilities:** ${summary.totalVulnerabilities}\n`;
    body += `**Risk Level:** ${summary.riskLevel}\n\n`;

    // Breakdown section
    body += `## 📊 Vulnerability Breakdown\n\n`;
    body += `| Severity | Count |\n`;
    body += `|----------|-------|\n`;
    body += `| Critical | ${breakdown.critical} |\n`;
    body += `| High     | ${breakdown.high} |\n`;
    body += `| Moderate | ${breakdown.moderate} |\n`;
    body += `| Low      | ${breakdown.low} |\n\n`;

    // Auto-patched section
    if (autoPatched && autoPatched.length > 0) {
      body += `## ✅ Auto-Patched Vulnerabilities\n\n`;
      autoPatched.forEach(vuln => {
        body += `• **${vuln.package}** (${vuln.severity}): ${vuln.title}\n`;
      });
      body += `\n`;
    }

    // Review required section
    if (requireReview && requireReview.length > 0) {
      const highCriticalVulns = requireReview.filter(
        v => v.severity === 'high' || v.severity === 'critical'
      );

      const moderateVulns = requireReview.filter(v => v.severity === 'moderate');
      const lowVulns = requireReview.filter(v => v.severity === 'low');

      if (highCriticalVulns.length > 0) {
        body += `## 🚨 High Priority - Immediate Review Required\n\n`;
        highCriticalVulns.forEach((vuln, index) => {
          body += `### ${index + 1}. ${vuln.package} (${vuln.severity.toUpperCase()})\n`;
          body += `**Title:** ${vuln.title}\n`;
          body += `**Recommendation:** ${vuln.recommendation}\n`;
          if (vuln.url) {
            body += `**Details:** [View Advisory](${vuln.url})\n`;
          }
          body += `\n`;
        });
      }

      if (moderateVulns.length > 0) {
        body += `## ⚠️ Moderate Priority\n\n`;
        moderateVulns.forEach((vuln, index) => {
          body += `${index + 1}. **${vuln.package}** (${vuln.severity}): ${vuln.title}\n`;
        });
        body += `\n`;
      }

      if (lowVulns.length > 0) {
        body += `## 📝 Low Priority\n\n`;
        lowVulns.forEach((vuln, index) => {
          body += `${index + 1}. **${vuln.package}** (${vuln.severity}): ${vuln.title}\n`;
        });
        body += `\n`;
      }
    }

    // Action items
    body += `## 📋 Recommended Actions\n\n`;

    if (breakdown.critical > 0 || breakdown.high > 0) {
      body += `1. **URGENT:** Review critical/high vulnerabilities immediately\n`;
      body += `2. **PLAN:** Schedule maintenance window for patching\n`;
      body += `3. **TEST:** Thoroughly test patches in staging environment\n`;
      body += `4. **DEPLOY:** Apply patches with proper rollback plan\n`;
    } else if (breakdown.moderate > 0) {
      body += `1. **SCHEDULE:** Review and patch within next maintenance window\n`;
      body += `2. **TEST:** Verify patches don't break functionality\n`;
      body += `3. **DOCUMENT:** Update security documentation\n`;
    } else {
      body += `1. **MONITOR:** Continue regular security scans\n`;
      body += `2. **MAINTAIN:** Keep dependencies updated\n`;
    }

    body += `\n---\n\n`;
    body += `*This issue was automatically generated by the security scanning system.*\n`;
    body += `*Detailed report is available in the security scan artifacts.*`;

    return body;
  }

  /**
   * Generate Slack notification
   */
  generateSlackMessage(report) {
    const { summary, breakdown } = report;
    const { critical, high } = breakdown;

    const color = critical > 0 ? 'danger' : high > 0 ? 'warning' : 'good';
    const emoji = critical > 0 ? '🚨' : high > 0 ? '⚠️' : '✅';

    let text = `${emoji} Security Scan Results: ${summary.totalVulnerabilities} vulnerabilities found`;
    if (critical > 0) text += ` (${critical} critical)`;
    if (high > 0) text += ` (${high} high)`;

    const message = {
      text,
      channel: this.config.slack.channel,
      username: 'Security Scanner',
      icon_emoji: ':shield:',
      attachments: [
        {
          color,
          fields: [
            {
              title: 'Risk Level',
              value: summary.riskLevel,
              short: true,
            },
            {
              title: 'Auto-Patched',
              value: summary.autoPatched.toString(),
              short: true,
            },
            {
              title: 'Critical',
              value: breakdown.critical.toString(),
              short: true,
            },
            {
              title: 'High',
              value: breakdown.high.toString(),
              short: true,
            },
            {
              title: 'Moderate',
              value: breakdown.moderate.toString(),
              short: true,
            },
            {
              title: 'Low',
              value: breakdown.low.toString(),
              short: true,
            },
          ],
          footer: 'Security Scanner',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    // Add mentions for critical issues
    if (critical > 0 && this.config.slack.mention.length > 0) {
      message.text += ` ${this.config.slack.mention.join(' ')}`;
    }

    return message;
  }

  /**
   * Generate pull request comment
   */
  generatePRComment(report) {
    const { summary, breakdown, requireReview } = report;

    let comment = `## 🔍 Security Scan Results\n\n`;
    comment += `This PR changed dependencies. Security scan results:\n\n`;
    comment += `| Metric | Count |\n`;
    comment += `|--------|-------|\n`;
    comment += `| **Total** | ${summary.totalVulnerabilities} |\n`;
    comment += `| **Critical** | ${breakdown.critical} |\n`;
    comment += `| **High** | ${breakdown.high} |\n`;
    comment += `| **Moderate** | ${breakdown.moderate} |\n`;
    comment += `| **Low** | ${breakdown.low} |\n`;
    comment += `| **Risk Level** | ${summary.riskLevel} |\n\n`;

    // Add specific vulnerability details for high/critical
    const highCriticalVulns =
      requireReview?.filter(v => v.severity === 'high' || v.severity === 'critical') || [];

    if (highCriticalVulns.length > 0) {
      comment += `### 🚨 High Priority Vulnerabilities\n\n`;
      highCriticalVulns.forEach((vuln, index) => {
        comment += `${index + 1}. **${vuln.package}** (${vuln.severity}): ${vuln.title}\n`;
      });
      comment += `\n⚠️ **Recommendation:** Address these vulnerabilities before merging.\n\n`;
    }

    // Add recommendations
    if (summary.riskLevel === 'SECURE') {
      comment += `✅ **Good to merge:** No security vulnerabilities found.\n\n`;
    } else if (summary.riskLevel === 'LOW') {
      comment += `⚠️ **Proceed with caution:** Low-risk vulnerabilities found. Consider patching before merge.\n\n`;
    } else {
      comment += `❌ **Block merge:** ${summary.riskLevel} risk level detected. Address vulnerabilities before merging.\n\n`;
    }

    comment += `*This comment was automatically generated by the security scanner.*`;

    return comment;
  }

  /**
   * Save notification templates for later use
   */
  saveNotificationTemplates(report, outputDir) {
    if (!existsSync(outputDir)) {
      require('fs').mkdirSync(outputDir, { recursive: true });
    }

    // GitHub issue
    const issueBody = this.generateIssueBody(report);
    writeFileSync(join(outputDir, 'github-issue.md'), issueBody);

    // Slack message
    const slackMessage = this.generateSlackMessage(report);
    writeFileSync(join(outputDir, 'slack-message.json'), JSON.stringify(slackMessage, null, 2));

    // PR comment
    const prComment = this.generatePRComment(report);
    writeFileSync(join(outputDir, 'pr-comment.md'), prComment);

    console.log(`📄 Notification templates saved to: ${outputDir}`);

    return {
      issueBody,
      slackMessage,
      prComment,
    };
  }
}

/**
 * Generate notifications for a security report
 */
function generateNotifications(report, config = {}) {
  const notifier = new SecurityNotifier(config);
  const outputDir = join(process.cwd(), '.security-notifications');

  return notifier.saveNotificationTemplates(report, outputDir);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Load latest security report
  const reportsDir = join(process.cwd(), '.security-reports');
  const files = require('fs')
    .readdirSync(reportsDir)
    .filter(f => f.startsWith('security-report-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error('❌ No security report found');
    process.exit(1);
  }

  const reportPath = join(reportsDir, files[0]);
  const report = JSON.parse(require('fs').readFileSync(reportPath, 'utf8'));

  // Generate notifications
  generateNotifications(report);

  console.log('✅ Security notifications generated successfully');
}

export { SecurityNotifier, generateNotifications };
