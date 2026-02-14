#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Core Web Vitals thresholds and benchmarks
const CORE_WEB_VITALS_THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000, unit: 'ms', name: 'Largest Contentful Paint' },
  fid: { good: 100, needsImprovement: 300, unit: 'ms', name: 'First Input Delay' },
  cls: { good: 0.1, needsImprovement: 0.25, unit: '', name: 'Cumulative Layout Shift' },
  fcp: { good: 1800, needsImprovement: 3000, unit: 'ms', name: 'First Contentful Paint' },
  tti: { good: 3800, needsImprovement: 7300, unit: 'ms', name: 'Time to Interactive' },
  tbt: { good: 200, needsImprovement: 600, unit: 'ms', name: 'Total Blocking Time' },
  si: { good: 3400, needsImprovement: 5800, unit: 'ms', name: 'Speed Index' },
};

// Configuration
const CONFIG = {
  reportsDir: '.lighthouse-reports',
  historyFile: '.lighthouse-reports/history.json',
  coreVitalsFile: '.lighthouse-reports/core-vitals-trends.json',
  trendsFile: '.lighthouse-reports/core-vitals-monthly-trends.json',
};

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

// Load existing core vitals trends
function loadCoreVitalsTrends() {
  if (fs.existsSync(CONFIG.coreVitalsFile)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.coreVitalsFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Error loading core vitals trends file:', error.message);
    }
  }
  return {};
}

// Save core vitals trends
function saveCoreVitalsTrends(trends) {
  fs.writeFileSync(CONFIG.coreVitalsFile, JSON.stringify(trends, null, 2));
}

// Load monthly trends
function loadMonthlyTrends() {
  if (fs.existsSync(CONFIG.trendsFile)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.trendsFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Error loading monthly trends file:', error.message);
    }
  }
  return [];
}

// Save monthly trends
function saveMonthlyTrends(trends) {
  fs.writeFileSync(CONFIG.trendsFile, JSON.stringify(trends, null, 2));
}

// Analyze Core Web Vitals performance
function analyzeCoreWebVitals(history) {
  const analysis = {
    metrics: {},
    trends: {},
    alerts: [],
    recommendations: [],
    summary: {
      totalMeasurements: 0,
      healthyMetrics: 0,
      needsImprovement: 0,
      poor: 0,
    },
  };

  // Group measurements by page and metric
  const measurements = {};

  history.forEach(entry => {
    if (!entry.coreWebVitals) return;

    entry.coreWebVitals.forEach((vital, index) => {
      const metricName = Object.keys(vital)[0];
      if (!metricName) return;

      const metric = vital[metricName];
      if (!metric || metric.value === undefined) return;

      if (!measurements[entry.name]) {
        measurements[entry.name] = {};
      }

      if (!measurements[entry.name][metricName]) {
        measurements[entry.name][metricName] = [];
      }

      measurements[entry.name][metricName].push({
        value: metric.value,
        timestamp: entry.timestamp,
        unit: metric.unit,
        rating: metric.rating,
      });

      analysis.summary.totalMeasurements++;
    });
  });

  // Analyze each metric for each page
  Object.keys(measurements).forEach(page => {
    Object.keys(measurements[page]).forEach(metricName => {
      const values = measurements[page][metricName].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      if (values.length === 0) return;

      const threshold = CORE_WEB_VITALS_THRESHOLDS[metricName];
      if (!threshold) return;

      // Calculate statistics
      const numericValues = values.map(v => v.value);
      const latest = numericValues[numericValues.length - 1];
      const average = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);

      // Determine rating
      let rating = 'good';
      if (latest > threshold.needsImprovement) {
        rating = 'poor';
      } else if (latest > threshold.good) {
        rating = 'needsImprovement';
      }

      // Calculate trend (last 3 measurements)
      let trend = 'stable';
      if (values.length >= 3) {
        const recent = numericValues.slice(-3);
        const change = recent[2] - recent[0];
        const percentChange = (change / recent[0]) * 100;

        if (Math.abs(percentChange) > 10) {
          trend = percentChange > 0 ? 'degrading' : 'improving';
        }
      }

      analysis.metrics[metricName] = analysis.metrics[metricName] || {};
      analysis.metrics[metricName][page] = {
        latest,
        average: Math.round(average * 100) / 100,
        min,
        max,
        unit: threshold.unit,
        rating,
        trend,
        measurementCount: values.length,
        threshold: threshold,
      };

      // Update summary counts
      if (rating === 'good') analysis.summary.healthyMetrics++;
      else if (rating === 'needsImprovement') analysis.summary.needsImprovement++;
      else analysis.summary.poor++;

      // Generate alerts for poor performance
      if (rating === 'poor' || trend === 'degrading') {
        analysis.alerts.push({
          type: rating === 'poor' ? 'threshold' : 'trend',
          metric: metricName,
          page,
          value: latest,
          threshold: threshold,
          trend,
          severity: rating === 'poor' ? 'critical' : 'warning',
          recommendation: generateMetricRecommendation(metricName, latest, trend),
        });
      }
    });
  });

  // Generate overall recommendations
  analysis.recommendations = generateOverallRecommendations(analysis.metrics, analysis.alerts);

  return analysis;
}

// Generate recommendation for specific metric
function generateMetricRecommendation(metricName, value, trend) {
  const recommendations = {
    lcp: {
      poor: 'Largest Contentful Paint is too slow. Optimize images, use modern image formats (WebP), implement lazy loading, and improve server response time.',
      improving:
        'LCP is improving. Continue image optimization and consider using CDNs for static assets.',
      degrading:
        'LCP is degrading. Check for large assets that were recently added and optimize them.',
    },
    fid: {
      poor: 'First Input Delay is too high. Reduce JavaScript execution time, break up long tasks, and use code splitting.',
      improving:
        'FID is improving. Continue optimizing JavaScript execution and consider web workers for heavy tasks.',
      degrading:
        'FID is degrading. Review recent JavaScript changes and look for blocking code execution.',
    },
    cls: {
      poor: 'Cumulative Layout Shift is too high. Ensure images have dimensions, avoid inserting content above existing content, and use transform animations.',
      improving:
        'CLS is improving. Continue ensuring consistent page layout and proper image dimensioning.',
      degrading:
        'CLS is degrading. Check for recently added dynamic content or images without explicit dimensions.',
    },
    fcp: {
      poor: 'First Contentful Paint is slow. Optimize server response time, minimize render-blocking resources, and optimize critical resources.',
      improving: 'FCP is improving. Continue server optimization and resource prioritization.',
      degrading:
        'FCP is degrading. Check for new render-blocking resources or server performance issues.',
    },
    tti: {
      poor: 'Time to Interactive is too slow. Reduce JavaScript payload, use code splitting, and optimize third-party scripts.',
      improving:
        'TTI is improving. Continue JavaScript optimization and lazy loading of non-critical features.',
      degrading:
        'TTI is degrading. Review recent JavaScript additions and consider lazy loading strategies.',
    },
    tbt: {
      poor: 'Total Blocking Time is high. Optimize JavaScript execution, break up long tasks, and use web workers.',
      improving: 'TBT is improving. Continue task optimization and consider code splitting.',
      degrading:
        'TBT is degrading. Look for recently added heavy JavaScript tasks that block the main thread.',
    },
    si: {
      poor: 'Speed Index is slow. Optimize above-the-fold content, use critical CSS, and optimize images.',
      improving:
        'Speed Index is improving. Continue optimizing visible content and critical resources.',
      degrading:
        'Speed Index is degrading. Check for new above-the-fold content that needs optimization.',
    },
  };

  const metricRecs = recommendations[metricName];
  if (!metricRecs) return 'Continue monitoring and optimize based on Lighthouse recommendations.';

  if (trend === 'degrading') return metricRecs.degrading;
  if (trend === 'improving') return metricRecs.improving;
  return metricRecs.poor;
}

// Generate overall recommendations
function generateOverallRecommendations(metrics, alerts) {
  const recommendations = [];

  // Count issues by type
  const issueCounts = {
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    tti: 0,
    tbt: 0,
    si: 0,
  };

  alerts.forEach(alert => {
    if (issueCounts[alert.metric] !== undefined) {
      issueCounts[alert.metric]++;
    }
  });

  // Generate prioritized recommendations
  if (issueCounts.lcp > 0) {
    recommendations.push({
      priority: 'high',
      category: 'performance',
      title: 'Optimize Largest Contentful Paint',
      description:
        'Multiple pages have slow LCP. Focus on image optimization, server response time, and resource loading.',
      actions: [
        'Convert images to WebP format with responsive sizing',
        'Implement lazy loading for below-the-fold images',
        'Optimize server response time and use CDN',
        'Prioritize loading of critical resources',
      ],
      affectedPages: issueCounts.lcp,
    });
  }

  if (issueCounts.cls > 0) {
    recommendations.push({
      priority: 'high',
      category: 'user-experience',
      title: 'Fix Layout Shift Issues',
      description: 'Layout shift is affecting user experience. Ensure visual stability.',
      actions: [
        'Set explicit dimensions on all images and videos',
        'Avoid inserting content above existing content',
        'Use transform animations instead of layout-affecting properties',
        'Reserve space for dynamic content and ads',
      ],
      affectedPages: issueCounts.cls,
    });
  }

  if (issueCounts.fid > 0 || issueCounts.tti > 0 || issueCounts.tbt > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'javascript',
      title: 'Optimize JavaScript Execution',
      description: 'JavaScript performance is impacting interactivity.',
      actions: [
        'Implement code splitting and lazy loading',
        'Use web workers for heavy computations',
        'Break up long tasks (>50ms)',
        'Optimize third-party script loading',
      ],
      affectedPages: (issueCounts.fid || 0) + (issueCounts.tti || 0) + (issueCounts.tbt || 0),
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// Generate monthly trends analysis
function generateMonthlyTrends(history, coreVitalsTrends) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthlyData = loadMonthlyTrends();

  // Get data for the current month
  const currentMonthData = history.filter(entry => entry.timestamp.startsWith(currentMonth));

  if (currentMonthData.length === 0) {
    console.log('No data available for current month');
    return null;
  }

  // Analyze metrics for the month
  const monthAnalysis = analyzeCoreWebVitals(currentMonthData);

  // Compare with previous month if available
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previousMonthStr = previousMonth.toISOString().slice(0, 7);

  const previousMonthData = history.filter(entry => entry.timestamp.startsWith(previousMonthStr));

  let monthOverMonthChange = null;
  if (previousMonthData.length > 0) {
    const previousAnalysis = analyzeCoreWebVitals(previousMonthData);
    monthOverMonthChange = {
      healthyMetrics:
        monthAnalysis.summary.healthyMetrics - previousAnalysis.summary.healthyMetrics,
      needsImprovement:
        monthAnalysis.summary.needsImprovement - previousAnalysis.summary.needsImprovement,
      poor: monthAnalysis.summary.poor - previousAnalysis.summary.poor,
    };
  }

  const monthlyTrend = {
    month: currentMonth,
    analysis: monthAnalysis,
    monthOverMonthChange,
    totalMeasurements: currentMonthData.length,
    reportGenerated: new Date().toISOString(),
  };

  // Add to monthly trends
  monthlyData.push(monthlyTrend);

  // Keep only last 12 months
  const last12Months = monthlyData.slice(-12);
  saveMonthlyTrends(last12Months);

  return monthlyTrend;
}

// Generate ASCII dashboard for Core Web Vitals
function generateCoreVitalsDashboard(analysis) {
  const dashboard = [];

  dashboard.push('🚀 Core Web Vitals Dashboard');
  dashboard.push('='.repeat(50));
  dashboard.push('');

  // Summary
  dashboard.push('📊 Summary:');
  dashboard.push(`  Total Measurements: ${analysis.summary.totalMeasurements}`);
  dashboard.push(`  🟢 Healthy: ${analysis.summary.healthyMetrics}`);
  dashboard.push(`  🟡 Needs Improvement: ${analysis.summary.needsImprovement}`);
  dashboard.push(`  🔴 Poor: ${analysis.summary.poor}`);
  dashboard.push('');

  // Metrics breakdown
  dashboard.push('📈 Metrics by Page:');
  Object.keys(analysis.metrics).forEach(metricName => {
    const threshold = CORE_WEB_VITALS_THRESHOLDS[metricName];
    if (!threshold) return;

    dashboard.push(`\n${threshold.name} (${metricName.toUpperCase()}):`);
    Object.keys(analysis.metrics[metricName]).forEach(page => {
      const data = analysis.metrics[metricName][page];
      const trendIcon =
        data.trend === 'improving' ? '📈' : data.trend === 'degrading' ? '📉' : '➡️';
      const ratingIcon =
        data.rating === 'good' ? '🟢' : data.rating === 'needsImprovement' ? '🟡' : '🔴';

      dashboard.push(
        `  ${ratingIcon} ${page}: ${data.latest}${data.unit} (${data.rating}) ${trendIcon} ${data.trend}`
      );
      dashboard.push(
        `     Average: ${data.average}${data.unit}, Range: ${data.min}-${data.max}${data.unit}`
      );
    });
  });

  // Alerts
  if (analysis.alerts.length > 0) {
    dashboard.push('\n🚨 Alerts:');
    analysis.alerts.forEach(alert => {
      const severityIcon = alert.severity === 'critical' ? '🔴' : '🟡';
      dashboard.push(
        `  ${severityIcon} ${alert.page} - ${alert.metric.toUpperCase()}: ${alert.value}${alert.threshold.unit}`
      );
    });
  }

  // Top recommendations
  if (analysis.recommendations.length > 0) {
    dashboard.push('\n💡 Top Recommendations:');
    analysis.recommendations.slice(0, 3).forEach((rec, index) => {
      const priorityIcon = rec.priority === 'high' ? '🔥' : rec.priority === 'medium' ? '⚡' : '💭';
      dashboard.push(`  ${priorityIcon} ${index + 1}. ${rec.title}`);
      dashboard.push(`     ${rec.description}`);
    });
  }

  return dashboard.join('\n');
}

// Main execution
async function main() {
  console.log('🎯 Analyzing Core Web Vitals performance...\n');

  // Load historical data
  const history = loadHistory();
  if (history.length === 0) {
    console.log('❌ No historical data found. Run Lighthouse tracking first.');
    return;
  }

  console.log(`📊 Analyzing ${history.length} measurements`);

  // Analyze current performance
  const analysis = analyzeCoreWebVitals(history);
  saveCoreVitalsTrends(analysis);

  // Generate monthly trends
  console.log('📅 Generating monthly trends...');
  const monthlyTrend = generateMonthlyTrends(history, analysis);

  // Generate and display dashboard
  const dashboard = generateCoreVitalsDashboard(analysis);
  console.log(dashboard);

  // Save analysis results
  const reportPath = path.join(CONFIG.reportsDir, `core-vitals-analysis-${Date.now()}.json`);
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        analysis,
        monthlyTrend,
        dashboard,
      },
      null,
      2
    )
  );

  console.log(`\n📄 Detailed analysis saved to: ${reportPath}`);
  console.log(`📚 Core vitals trends saved to: ${CONFIG.coreVitalsFile}`);

  return analysis;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as analyzeCoreVitals };
