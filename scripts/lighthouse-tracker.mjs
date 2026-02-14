#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const CONFIG = {
  pages: [
    { url: 'http://localhost:3000', name: 'home' },
    { url: 'http://localhost:3000/about', name: 'about' },
    { url: 'http://localhost:3000/projects', name: 'projects' },
    { url: 'http://localhost:3000/blog', name: 'blog' },
    { url: 'http://localhost:3000/contact', name: 'contact' },
    { url: 'http://localhost:3000/resume', name: 'resume' },
  ],
  thresholds: {
    performance: 90,
    accessibility: 90,
    bestPractices: 90,
    seo: 90,
    pwa: 80, // PWA has lower threshold as it's optional
  },
  reportsDir: '.lighthouse-reports',
  historyFile: '.lighthouse-reports/history.json',
  alertFile: '.lighthouse-reports/alerts.json',
};

// Ensure reports directory exists
if (!fs.existsSync(CONFIG.reportsDir)) {
  fs.mkdirSync(CONFIG.reportsDir, { recursive: true });
}

// Load historical data
function loadHistory() {
  if (fs.existsSync(CONFIG.historyFile)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.historyFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Error loading history file:', error.message);
    }
  }
  return [];
}

// Save historical data
function saveHistory(history) {
  fs.writeFileSync(CONFIG.historyFile, JSON.stringify(history, null, 2));
}

// Load previous alerts
function loadAlerts() {
  if (fs.existsSync(CONFIG.alertFile)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.alertFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Error loading alerts file:', error.message);
    }
  }
  return [];
}

// Save alerts
function saveAlerts(alerts) {
  fs.writeFileSync(CONFIG.alertFile, JSON.stringify(alerts, null, 2));
}

// Run Lighthouse for a single page
async function runLighthouse(url, name) {
  console.log(`🔍 Running Lighthouse on ${name} (${url})...`);

  try {
    const outputDir = path.join(CONFIG.reportsDir, `${name}-${Date.now()}`);
    const tempReportPath = path.join(outputDir, 'report.json');

    // Create output directory
    fs.mkdirSync(outputDir, { recursive: true });

    // Run Lighthouse
    const command = `npx lighthouse "${url}" --output=json --output-path="${tempReportPath}" --quiet --chrome-flags="--headless"`;
    execSync(command, { stdio: 'pipe', timeout: 60000 });

    // Read and parse report
    const reportData = JSON.parse(fs.readFileSync(tempReportPath, 'utf8'));

    // Extract key metrics
    const scores = {
      performance: Math.round(reportData.lhr.categories.performance.score * 100),
      accessibility: Math.round(reportData.lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(reportData.lhr.categories.bestPractices.score * 100),
      seo: Math.round(reportData.lhr.categories.seo.score * 100),
      pwa: reportData.lhr.categories.pwa
        ? Math.round(reportData.lhr.categories.pwa.score * 100)
        : null,
    };

    // Extract Core Web Vitals
    const coreWebVitals = {
      lcp: extractMetric(reportData, 'largest-contentful-paint'),
      fid: extractMetric(reportData, 'first-input-delay'),
      cls: extractMetric(reportData, 'cumulative-layout-shift'),
      fcp: extractMetric(reportData, 'first-contentful-paint'),
      tti: extractMetric(reportData, 'interactive'),
      tbt: extractMetric(reportData, 'total-blocking-time'),
      si: extractMetric(reportData, 'speed-index'),
    };

    // Extract performance opportunities
    const opportunities = extractOpportunities(reportData);

    // Clean up temp file
    fs.unlinkSync(tempReportPath);
    fs.rmdirSync(outputDir);

    return {
      name,
      url,
      timestamp: new Date().toISOString(),
      scores,
      coreWebVitals,
      opportunities,
      overallScore: Math.round(
        Object.values(scores)
          .filter(Boolean)
          .reduce((sum, score) => sum + score, 0) / Object.values(scores).filter(Boolean).length
      ),
    };
  } catch (error) {
    console.error(`❌ Error running Lighthouse on ${name}:`, error.message);
    return {
      name,
      url,
      timestamp: new Date().toISOString(),
      error: error.message,
      scores: null,
      coreWebVitals: null,
      opportunities: null,
      overallScore: 0,
    };
  }
}

// Extract specific metric from Lighthouse report
function extractMetric(reportData, metricId) {
  const audits = reportData.lhr.audits;
  if (audits[metricId]) {
    const metric = audits[metricId];
    return {
      value: metric.numericValue,
      unit: metric.numericUnit,
      displayValue: metric.displayValue,
      score: metric.score,
      rating: metric.rating || 'fail',
    };
  }
  return null;
}

// Extract performance opportunities
function extractOpportunities(reportData) {
  const audits = reportData.lhr.audits;
  const opportunities = [];

  Object.values(audits).forEach(audit => {
    if (audit.details && audit.details.type === 'opportunity') {
      const savings = audit.details.overallSavingsMs;
      if (savings && savings > 100) {
        // Only include significant opportunities
        opportunities.push({
          title: audit.title,
          description: audit.description,
          savingsMs: savings,
          displayValue: audit.displayValue,
          score: audit.score,
          id: audit.id,
        });
      }
    }
  });

  return opportunities.sort((a, b) => b.savingsMs - a.savingsMs).slice(0, 5); // Top 5 opportunities
}

// Analyze trends and detect regressions
function analyzeTrends(currentResults, history) {
  const trends = {};
  const regressions = [];

  currentResults.forEach(result => {
    if (result.error) return;

    trends[result.name] = {
      current: result.scores,
      trend: {},
      regressions: [],
    };

    // Get historical data for this page
    const pageHistory = history
      .filter(h => h.name === result.name)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (pageHistory.length > 0) {
      const lastResult = pageHistory[0];

      // Calculate trends for each category
      Object.keys(result.scores).forEach(category => {
        if (result.scores[category] && lastResult.scores && lastResult.scores[category]) {
          const change = result.scores[category] - lastResult.scores[category];
          trends[result.name].trend[category] = {
            change,
            previous: lastResult.scores[category],
            current: result.scores[category],
            direction: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable',
          };

          // Detect significant regression (> 5 points)
          if (change < -5 && result.scores[category] < 90) {
            trends[result.name].regressions.push({
              category,
              change,
              from: lastResult.scores[category],
              to: result.scores[category],
              severity: result.scores[category] < 70 ? 'critical' : 'warning',
            });
          }
        }
      });
    }

    // Add global regressions
    if (trends[result.name].regressions.length > 0) {
      regressions.push({
        page: result.name,
        url: result.url,
        regressions: trends[result.name].regressions,
        timestamp: result.timestamp,
      });
    }
  });

  return { trends, regressions };
}

// Generate alerts for scores below threshold
function generateAlerts(results, thresholds) {
  const alerts = [];
  const existingAlerts = loadAlerts();

  results.forEach(result => {
    if (result.error) {
      alerts.push({
        type: 'error',
        page: result.name,
        url: result.url,
        message: `Lighthouse execution failed: ${result.error}`,
        timestamp: result.timestamp,
        severity: 'critical',
      });
      return;
    }

    Object.entries(result.scores).forEach(([category, score]) => {
      if (score === null) return; // Skip PWA if not available

      const threshold = thresholds[category] || 90;
      if (score < threshold) {
        // Check if this is a new alert or existing one
        const existingAlert = existingAlerts.find(
          a =>
            a.type === 'threshold' &&
            a.page === result.name &&
            a.category === category &&
            !a.resolved
        );

        if (!existingAlert) {
          alerts.push({
            type: 'threshold',
            page: result.name,
            url: result.url,
            category,
            score,
            threshold,
            deficit: threshold - score,
            timestamp: result.timestamp,
            severity: score < 70 ? 'critical' : score < 80 ? 'warning' : 'info',
          });
        }
      }
    });
  });

  return alerts;
}

// Generate summary statistics
function generateSummary(results, trends) {
  const summary = {
    total: results.length,
    successful: results.filter(r => !r.error).length,
    failed: results.filter(r => r.error).length,
    averageScores: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0, pwa: 0 },
    pagesAboveThreshold: {},
    overallHealth: 'good',
  };

  // Calculate average scores
  const successfulResults = results.filter(r => !r.error && r.scores);
  Object.keys(summary.averageScores).forEach(category => {
    const validScores = successfulResults
      .map(r => r.scores[category])
      .filter(score => score !== null && score !== undefined);

    if (validScores.length > 0) {
      summary.averageScores[category] = Math.round(
        validScores.reduce((sum, score) => sum + score, 0) / validScores.length
      );
    }
  });

  // Count pages above threshold for each category
  Object.entries(CONFIG.thresholds).forEach(([category, threshold]) => {
    summary.pagesAboveThreshold[category] = successfulResults.filter(
      r => r.scores && r.scores[category] !== null && r.scores[category] >= threshold
    ).length;
  });

  // Determine overall health
  const avgScore =
    Object.values(summary.averageScores).reduce((sum, score) => sum + score, 0) /
    Object.values(summary.averageScores).filter(score => score > 0).length;

  if (avgScore >= 95) summary.overallHealth = 'excellent';
  else if (avgScore >= 90) summary.overallHealth = 'good';
  else if (avgScore >= 80) summary.overallHealth = 'fair';
  else summary.overallHealth = 'poor';

  return summary;
}

// Main execution
async function main() {
  console.log('🚀 Starting Lighthouse score tracking...\n');

  // Load historical data
  const history = loadHistory();
  console.log(`📊 Loaded ${history.length} historical data points`);

  // Run Lighthouse for all pages
  const results = [];
  for (const page of CONFIG.pages) {
    const result = await runLighthouse(page.url, page.name);
    results.push(result);
    console.log(`✅ ${page.name}: Overall score ${result.overallScore}`);
  }

  console.log('\n📈 Analyzing trends and regressions...');
  const { trends, regressions } = analyzeTrends(results, history);

  console.log('🚨 Generating alerts...');
  const alerts = generateAlerts(results, CONFIG.thresholds);

  console.log('📋 Generating summary...');
  const summary = generateSummary(results, trends);

  // Save current results to history
  const newHistory = [...history, ...results];
  saveHistory(newHistory);

  // Save new alerts
  const allAlerts = [...loadAlerts(), ...alerts];
  saveAlerts(allAlerts);

  // Generate comprehensive report
  const report = {
    timestamp: new Date().toISOString(),
    summary,
    results,
    trends,
    regressions,
    alerts,
    coreWebVitals: {
      lcp: { current: [], trend: 'stable' },
      fid: { current: [], trend: 'stable' },
      cls: { current: [], trend: 'stable' },
    },
  };

  // Extract Core Web Vitals across all pages
  results.forEach(result => {
    if (result.coreWebVitals) {
      Object.entries(result.coreWebVitals).forEach(([metric, data]) => {
        if (data && report.coreWebVitals[metric]) {
          report.coreWebVitals[metric].current.push({
            page: result.name,
            value: data.value,
            unit: data.unit,
            displayValue: data.displayValue,
            rating: data.rating,
          });
        }
      });
    }
  });

  // Save detailed report
  const reportPath = path.join(CONFIG.reportsDir, `lighthouse-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Save latest report for easy access
  const latestReportPath = path.join(CONFIG.reportsDir, 'latest-report.json');
  fs.writeFileSync(latestReportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n🎯 Summary:');
  console.log(`✅ Successful: ${summary.successful}/${summary.total}`);
  console.log(`❌ Failed: ${summary.failed}/${summary.total}`);
  console.log(`📊 Average scores:`);
  Object.entries(summary.averageScores).forEach(([category, score]) => {
    console.log(`  ${category}: ${score}`);
  });
  console.log(`🏥 Overall health: ${summary.overallHealth}`);

  console.log(`\n🚨 Alerts: ${alerts.length}`);
  alerts.forEach(alert => {
    const icon = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵';
    console.log(
      `  ${icon} ${alert.page} - ${alert.category}: ${alert.score} (< ${alert.threshold})`
    );
  });

  console.log(`\n📉 Regressions: ${regressions.length}`);
  regressions.forEach(regression => {
    console.log(`  📉 ${regression.page}:`);
    regression.regressions.forEach(reg => {
      console.log(`    ${reg.category}: ${reg.from} → ${reg.to} (${reg.change})`);
    });
  });

  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  console.log(`📋 Latest report saved to: ${latestReportPath}`);
  console.log(`📚 History saved to: ${CONFIG.historyFile}`);

  return report;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as trackLighthouse };
