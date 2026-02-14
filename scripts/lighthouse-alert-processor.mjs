#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  reportsDir: '.lighthouse-reports',
  alertsFile: '.lighthouse-reports/alerts.json',
  githubToken: process.env.GITHUB_TOKEN,
  repository: process.env.GITHUB_REPOSITORY || 'abigaelawino/abigaelawino.github.io',
  issueCooldown: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  criticalCooldown: 4 * 60 * 60 * 1000, // 4 hours for critical issues
};

// Load existing alerts
function loadAlerts() {
  if (fs.existsSync(CONFIG.alertsFile)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.alertsFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Error loading alerts file:', error.message);
    }
  }
  return [];
}

// Save alerts
function saveAlerts(alerts) {
  fs.writeFileSync(CONFIG.alertsFile, JSON.stringify(alerts, null, 2));
}

// Load latest Lighthouse report
function loadLatestReport() {
  const latestReportPath = path.join(CONFIG.reportsDir, 'latest-report.json');
  if (fs.existsSync(latestReportPath)) {
    try {
      return JSON.parse(fs.readFileSync(latestReportPath, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Error loading latest report:', error.message);
    }
  }
  return null;
}

// Check if an issue should be created based on cooldown
function shouldCreateIssue(alert, existingIssues) {
  const now = Date.now();
  const lastIssue = existingIssues
    .filter(issue => issue.title.includes(alert.page) && issue.title.includes(alert.category))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

  if (!lastIssue) return true;

  const timeSinceLastIssue = now - new Date(lastIssue.created_at).getTime();
  const cooldown = alert.severity === 'critical' ? CONFIG.criticalCooldown : CONFIG.issueCooldown;

  return timeSinceLastIssue > cooldown;
}

// Generate issue title
function generateIssueTitle(alert) {
  const prefix = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵';
  const category = alert.category.toUpperCase();
  return `${prefix} Performance Alert: ${alert.page} - ${category} score dropped to ${alert.score}`;
}

// Generate issue body
function generateIssueBody(alert, report) {
  const sections = [];

  sections.push(`## 🚨 Performance Alert`);
  sections.push(`**Page:** ${alert.page} (${alert.url})`);
  sections.push(`**Category:** ${alert.category.toUpperCase()}`);
  sections.push(`**Current Score:** ${alert.score}`);
  sections.push(`**Threshold:** ${alert.threshold}`);
  sections.push(`**Deficit:** ${alert.deficit} points`);
  sections.push(`**Severity:** ${alert.severity}`);
  sections.push(`**Timestamp:** ${new Date(alert.timestamp).toLocaleString()}`);
  sections.push('');

  // Impact assessment
  sections.push(`## 📊 Impact Assessment`);
  if (alert.severity === 'critical') {
    sections.push(
      `This issue severely impacts user experience and should be addressed immediately.`
    );
  } else if (alert.severity === 'warning') {
    sections.push(`This issue impacts user experience and should be addressed soon.`);
  } else {
    sections.push(`This issue has minor impact on user experience.`);
  }
  sections.push('');

  // Recommendations
  sections.push(`## 💡 Immediate Recommendations`);

  if (alert.category === 'performance') {
    sections.push(`- Audit images and optimize for web delivery`);
    sections.push(`- Eliminate render-blocking resources`);
    sections.push(`- Minimize and compress JavaScript/CSS`);
    sections.push(`- Implement lazy loading for below-the-fold content`);
    sections.push(`- Use code splitting to reduce initial bundle size`);
  } else if (alert.category === 'accessibility') {
    sections.push(`- Ensure all images have proper alt text`);
    sections.push(`- Check color contrast ratios (4.5:1 minimum)`);
    sections.push(`- Verify keyboard navigation works properly`);
    sections.push(`- Add proper heading hierarchy`);
    sections.push(`- Implement ARIA labels where needed`);
  } else if (alert.category === 'seo') {
    sections.push(`- Optimize meta descriptions (120-160 characters)`);
    sections.push(`- Ensure proper title tags (50-60 characters)`);
    sections.push(`- Add structured data (JSON-LD)`);
    sections.push(`- Verify canonical URLs are set correctly`);
    sections.push(`- Check Open Graph and Twitter Card metadata`);
  } else if (alert.category === 'bestPractices') {
    sections.push(`- Implement proper CSP headers`);
    sections.push(`- Ensure HTTPS is used everywhere`);
    sections.push(`- Add proper error handling`);
    sections.push(`- Optimize third-party script loading`);
    sections.push(`- Implement proper security headers`);
  }

  sections.push('');

  // Next steps
  sections.push(`## 🔄 Next Steps`);
  sections.push(`1. Investigate the root cause of the performance regression`);
  sections.push(`2. Implement the recommended fixes`);
  sections.push(`3. Test the changes locally`);
  sections.push(`4. Deploy to production`);
  sections.push(`5. Monitor the Lighthouse scores in the next weekly check`);
  sections.push('');

  // Labels
  sections.push(`## 🏷️ Labels`);
  sections.push(`performance, ${alert.category}, ${alert.severity}, lighthouse-alert`);
  sections.push('');

  // Automation info
  sections.push(`---`);
  sections.push(`*This issue was automatically created by the Lighthouse monitoring system.*`);
  sections.push(`*Last updated: ${new Date().toISOString()}*`);

  return sections.join('\n');
}

// Create GitHub issue
async function createGitHubIssue(title, body, labels) {
  if (!CONFIG.githubToken) {
    console.warn('⚠️  No GITHUB_TOKEN provided, skipping issue creation');
    return null;
  }

  const url = `https://api.github.com/repos/${CONFIG.repository}/issues`;
  const headers = {
    Authorization: `token ${CONFIG.githubToken}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Lighthouse-Monitor',
  };

  const payload = {
    title,
    body,
    labels: labels || ['performance', 'lighthouse-alert'],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} ${error}`);
    }

    const issue = await response.json();
    console.log(`✅ Created issue: ${issue.html_url}`);
    return issue;
  } catch (error) {
    console.error(`❌ Failed to create GitHub issue:`, error.message);
    return null;
  }
}

// Get existing issues from GitHub
async function getExistingIssues() {
  if (!CONFIG.githubToken) {
    console.warn('⚠️  No GITHUB_TOKEN provided, using empty issues list');
    return [];
  }

  const url = `https://api.github.com/repos/${CONFIG.repository}/issues?state=open&labels=lighthouse-alert`;
  const headers = {
    Authorization: `token ${CONFIG.githubToken}`,
    'User-Agent': 'Lighthouse-Monitor',
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`⚠️  Failed to fetch existing issues:`, error.message);
    return [];
  }
}

// Close resolved issues
async function closeResolvedIssues(alerts, existingIssues) {
  if (!CONFIG.githubToken) return;

  const activePages = new Set(alerts.map(a => `${a.page}-${a.category}`));
  const resolvedIssues = existingIssues.filter(issue => {
    const pageInfo = existingIssues.find(
      existing => existing.title.includes(issue.title) && activePages.has(existing.title)
    );
    return !pageInfo;
  });

  for (const issue of resolvedIssues) {
    try {
      const url = `https://api.github.com/repos/${CONFIG.repository}/issues/${issue.number}`;
      const headers = {
        Authorization: `token ${CONFIG.githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Lighthouse-Monitor',
      };

      const payload = {
        state: 'closed',
        state_reason: 'resolved',
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`✅ Closed resolved issue: ${issue.title}`);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to close issue ${issue.number}:`, error.message);
    }
  }
}

// Process alerts and create issues
async function processAlerts() {
  console.log('🚀 Processing Lighthouse alerts...\n');

  // Load data
  const alerts = loadAlerts();
  const report = loadLatestReport();

  if (!report) {
    console.log('❌ No Lighthouse report found. Run tracking first.');
    return;
  }

  // Filter unresolved alerts
  const unresolvedAlerts = alerts.filter(alert => !alert.resolved && !alert.acknowledged);

  if (unresolvedAlerts.length === 0) {
    console.log('✅ No unresolved alerts to process');
    return;
  }

  console.log(`📊 Found ${unresolvedAlerts.length} unresolved alerts`);

  // Get existing issues
  console.log('📋 Fetching existing GitHub issues...');
  const existingIssues = await getExistingIssues();

  // Process each alert
  const createdIssues = [];
  for (const alert of unresolvedAlerts) {
    console.log(`\n🔍 Processing alert: ${alert.page} - ${alert.category} (${alert.score})`);

    // Check if we should create an issue (respect cooldown)
    if (shouldCreateIssue(alert, existingIssues)) {
      console.log(`📝 Creating GitHub issue...`);

      const title = generateIssueTitle(alert);
      const body = generateIssueBody(alert, report);
      const labels = [
        'performance',
        alert.category,
        alert.severity,
        'lighthouse-alert',
        `page-${alert.page}`,
      ];

      const issue = await createGitHubIssue(title, body, labels);

      if (issue) {
        createdIssues.push(issue);
        alert.issueNumber = issue.number;
        alert.issueCreatedAt = issue.created_at;
      }
    } else {
      console.log(`⏳ Skipping issue creation (cooldown period active)`);
    }
  }

  // Close resolved issues
  console.log('\n🔍 Checking for resolved issues to close...');
  await closeResolvedIssues(unresolvedAlerts, existingIssues);

  // Save updated alerts
  saveAlerts(alerts);

  // Summary
  console.log('\n📋 Alert Processing Summary:');
  console.log(`🔍 Total unresolved alerts: ${unresolvedAlerts.length}`);
  console.log(`📝 Issues created: ${createdIssues.length}`);
  console.log(
    `🔢 Critical alerts: ${unresolvedAlerts.filter(a => a.severity === 'critical').length}`
  );
  console.log(
    `⚠️  Warning alerts: ${unresolvedAlerts.filter(a => a.severity === 'warning').length}`
  );
  console.log(`ℹ️  Info alerts: ${unresolvedAlerts.filter(a => a.severity === 'info').length}`);

  if (createdIssues.length > 0) {
    console.log('\n📋 Created Issues:');
    createdIssues.forEach(issue => {
      console.log(`  🔗 ${issue.html_url}`);
    });
  }

  return createdIssues;
}

// Send notification (placeholder for future integration)
async function sendNotification(alerts) {
  // This could be extended to send Slack notifications, emails, etc.
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');

  if (criticalAlerts.length > 0) {
    console.log(
      `\n🚨 CRITICAL: ${criticalAlerts.length} critical alerts require immediate attention`
    );
  }

  console.log(`📊 Total alerts: ${alerts.length}`);
}

// Main execution
async function main() {
  console.log('🚨 Lighthouse Alert System\n');

  try {
    const createdIssues = await processAlerts();
    await sendNotification(loadAlerts().filter(a => !a.resolved));

    console.log('\n✅ Alert processing completed');
    return createdIssues;
  } catch (error) {
    console.error('❌ Error in alert processing:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as processLighthouseAlerts };
