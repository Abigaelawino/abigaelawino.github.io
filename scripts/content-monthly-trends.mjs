#!/usr/bin/env node

/**
 * Content Monthly Trends Analyzer
 *
 * Analyzes content freshness trends over time to identify patterns,
 * measure content lifecycle, and provide strategic recommendations
 * for content planning and maintenance.
 *
 * Features:
 * - Monthly trend analysis and pattern detection
 * - Content lifecycle metrics
 * - Content performance indicators
 * - Strategic planning recommendations
 * - Historical comparison and forecasting
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);

// Configuration
const CONFIG = {
  REPORTS_DIR: '.content-reports',
  CURRENT_REPORT: 'freshness-report.json',
  HISTORICAL_DATA: 'historical-data.json',
  MONTHLY_TRENDS: 'monthly-trends.json',

  // Analysis parameters
  MONTHS_TO_ANALYZE: 12, // Look back 12 months
  TREND_WINDOW: 3, // 3-month rolling average

  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    excellentFreshness: 80, // % of content that should be fresh
    acceptableAging: 15, // % of content that can be aging
    maxStale: 5, // % of content that should be stale
    criticalExpired: 0, // % of expired content should be 0
  },
};

/**
 * Load historical data from previous reports
 */
function loadHistoricalData() {
  const historicalPath = join(PROJECT_ROOT, CONFIG.REPORTS_DIR, CONFIG.HISTORICAL_DATA);

  if (!existsSync(historicalPath)) {
    return [];
  }

  try {
    const data = readFileSync(historicalPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('Error loading historical data:', error.message);
    return [];
  }
}

/**
 * Load current freshness report
 */
function loadCurrentReport() {
  const reportPath = join(PROJECT_ROOT, CONFIG.REPORTS_DIR, CONFIG.CURRENT_REPORT);

  if (!existsSync(reportPath)) {
    console.error('Current freshness report not found. Run content freshness monitor first.');
    process.exit(1);
  }

  try {
    const data = readFileSync(reportPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading current report:', error.message);
    process.exit(1);
  }
}

/**
 * Update historical data with current report
 */
function updateHistoricalData(currentReport, historicalData) {
  const currentEntry = {
    timestamp: currentReport.timestamp,
    summary: currentReport.summary,
    trends: currentReport.trends,
    averageAge: currentReport.trends.averageAge,
    contentByType: currentReport.trends.contentByType,
    contentByStatus: currentReport.trends.contentByStatus,
    temporalKeywordUsage: currentReport.trends.temporalKeywordUsage,
  };

  // Add to historical data (keep last 12 months)
  const updatedHistorical = [...historicalData, currentEntry];

  // Keep only last 12 months of data
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - CONFIG.MONTHS_TO_ANALYZE);

  return updatedHistorical.filter(entry => new Date(entry.timestamp) >= cutoffDate);
}

/**
 * Calculate month-over-month trends
 */
function calculateMonthlyTrends(historicalData) {
  if (historicalData.length < 2) {
    return {
      trend: 'insufficient_data',
      message: 'Need at least 2 months of data for trend analysis',
    };
  }

  const latest = historicalData[historicalData.length - 1];
  const previous = historicalData[historicalData.length - 2];

  const trends = {
    contentVolume: calculateTrend(previous.summary.total, latest.summary.total),
    freshContentRatio: calculateTrend(
      (previous.summary.fresh / previous.summary.total) * 100,
      (latest.summary.fresh / latest.summary.total) * 100
    ),
    staleContentRatio: calculateTrend(
      (previous.summary.stale / previous.summary.total) * 100,
      (latest.summary.stale / latest.summary.total) * 100
    ),
    expiredContentRatio: calculateTrend(
      (previous.summary.expired / previous.summary.total) * 100,
      (latest.summary.expired / latest.summary.total) * 100
    ),
    averageAge: calculateTrend(previous.averageAge, latest.averageAge),
  };

  // Determine overall trend direction
  const trendScore = Object.values(trends).reduce((score, trend) => {
    if (trend.direction === 'improving') return score + 1;
    if (trend.direction === 'declining') return score - 1;
    return score;
  }, 0);

  let overallTrend = 'stable';
  let trendMessage = 'Content freshness is relatively stable';

  if (trendScore > 2) {
    overallTrend = 'improving';
    trendMessage = 'Content freshness is improving significantly';
  } else if (trendScore < -2) {
    overallTrend = 'declining';
    trendMessage = 'Content freshness is declining and needs attention';
  }

  return {
    overall: overallTrend,
    message: trendMessage,
    score: trendScore,
    details: trends,
    recommendations: generateTrendRecommendations(trends),
  };
}

/**
 * Calculate trend between two values
 */
function calculateTrend(previous, current) {
  const change = current - previous;
  const percentChange = previous === 0 ? 0 : (change / previous) * 100;

  let direction = 'stable';
  let significance = 'minor';

  if (Math.abs(percentChange) > 10) {
    significance = 'major';
  } else if (Math.abs(percentChange) > 5) {
    significance = 'moderate';
  }

  if (percentChange > 5) {
    direction = 'increasing';
  } else if (percentChange < -5) {
    direction = 'decreasing';
  }

  // For some metrics, increasing is good (fresh content ratio)
  // For others, decreasing is good (stale content ratio, average age)
  let improving = 'stable';
  if (['freshContentRatio'].includes(Object.keys(arguments)[2])) {
    improving = percentChange > 5 ? 'improving' : percentChange < -5 ? 'declining' : 'stable';
  } else if (
    ['staleContentRatio', 'expiredContentRatio', 'averageAge'].includes(Object.keys(arguments)[2])
  ) {
    improving = percentChange < -5 ? 'improving' : percentChange > 5 ? 'declining' : 'stable';
  }

  return {
    previous,
    current,
    change,
    percentChange: Math.round(percentChange * 100) / 100,
    direction,
    significance,
    improving,
  };
}

/**
 * Generate trend-based recommendations
 */
function generateTrendRecommendations(trends) {
  const recommendations = [];

  if (trends.expiredContentRatio.improving === 'declining') {
    recommendations.push({
      type: 'critical',
      title: 'Expired Content Increasing',
      message: 'The percentage of expired content is growing',
      actions: [
        'Immediate review and update of all expired content',
        'Implement monthly content review process',
        'Set up automated alerts for content approaching expiration',
      ],
    });
  }

  if (trends.staleContentRatio.improving === 'declining') {
    recommendations.push({
      type: 'warning',
      title: 'Stale Content Growing',
      message: 'Stale content is accumulating faster than fresh content',
      actions: [
        'Prioritize updating stale content over creating new content',
        'Establish quarterly content refresh cycles',
        'Consider consolidating or removing outdated content',
      ],
    });
  }

  if (trends.freshContentRatio.improving === 'declining') {
    recommendations.push({
      type: 'strategy',
      title: 'Fresh Content Ratio Declining',
      message: 'Fewer items are being kept fresh over time',
      actions: [
        'Review content creation workflow',
        'Implement content aging tracking',
        'Balance new content creation with content maintenance',
      ],
    });
  }

  if (trends.averageAge.improving === 'declining') {
    recommendations.push({
      type: 'maintenance',
      title: 'Content Aging Accelerating',
      message: 'Average content age is increasing significantly',
      actions: [
        'Implement scheduled content reviews',
        'Create content update templates',
        'Set calendar reminders for content maintenance',
      ],
    });
  }

  return recommendations;
}

/**
 * Analyze content lifecycle patterns
 */
function analyzeContentLifecycle(historicalData) {
  if (historicalData.length < 3) {
    return { status: 'insufficient_data' };
  }

  const lifecycle = {
    averageContentLifespan: 0,
    typicalFreshDuration: 0,
    typicalAgingDuration: 0,
    contentVelocity: 0, // How quickly content moves through lifecycle stages
    lifecycleEfficiency: 0, // How well content is maintained
  };

  // Calculate average time content stays in each stage
  const stageTransitions = [];

  for (let i = 1; i < historicalData.length; i++) {
    const previous = historicalData[i - 1];
    const current = historicalData[i];

    // Track how content moves between stages
    const transition = {
      freshToAging: previous.summary.fresh - current.summary.fresh,
      agingToStale: previous.summary.aging - current.summary.aging,
      staleToExpired: previous.summary.stale - current.summary.stale,
    };

    stageTransitions.push(transition);
  }

  // Calculate average transition times (in months)
  const avgTransitions = stageTransitions.reduce((acc, trans) => {
    Object.keys(trans).forEach(key => {
      acc[key] = (acc[key] || 0) + Math.max(0, trans[key]);
    });
    return acc;
  }, {});

  Object.keys(avgTransitions).forEach(key => {
    avgTransitions[key] = (avgTransitions[key] / stageTransitions.length).toFixed(1);
  });

  lifecycle.typicalFreshDuration = avgTransitions.freshToAging || 0;
  lifecycle.typicalAgingDuration = avgTransitions.agingToStale || 0;
  lifecycle.averageContentLifespan =
    parseFloat(lifecycle.typicalFreshDuration) +
    parseFloat(lifecycle.typicalAgingDuration) +
    (avgTransitions.staleToExpired || 0);

  // Calculate content velocity (items moving to next stage per month)
  lifecycle.contentVelocity =
    stageTransitions.reduce(
      (sum, trans) => sum + Object.values(trans).filter(v => v > 0).length,
      0
    ) / stageTransitions.length;

  // Calculate lifecycle efficiency (how much content stays fresh vs expires)
  const latest = historicalData[historicalData.length - 1];
  const totalContent = latest.summary.total;
  const healthyContent = latest.summary.fresh + latest.summary.aging;
  lifecycle.lifecycleEfficiency = (healthyContent / totalContent) * 100;

  return lifecycle;
}

/**
 * Generate strategic recommendations
 */
function generateStrategicRecommendations(currentReport, trends, lifecycle) {
  const recommendations = [];

  // Content portfolio health
  const freshPercentage = (currentReport.summary.fresh / currentReport.summary.total) * 100;
  const stalePercentage = (currentReport.summary.stale / currentReport.summary.total) * 100;
  const expiredPercentage = (currentReport.summary.expired / currentReport.summary.total) * 100;

  if (freshPercentage < CONFIG.PERFORMANCE_THRESHOLDS.excellentFreshness) {
    recommendations.push({
      category: 'content_portfolio',
      priority: 'high',
      title: 'Increase Fresh Content Ratio',
      current: `${freshPercentage.toFixed(1)}%`,
      target: `${CONFIG.PERFORMANCE_THRESHOLDS.excellentFreshness}%`,
      actions: [
        'Schedule regular content reviews and updates',
        'Prioritize updating aging content over creating new content',
        'Implement content aging alerts and reminders',
        'Create content update templates to streamline refreshes',
      ],
    });
  }

  if (expiredPercentage > CONFIG.PERFORMANCE_THRESHOLDS.criticalExpired) {
    recommendations.push({
      category: 'critical_maintenance',
      priority: 'critical',
      title: 'Eliminate Expired Content',
      current: `${expiredPercentage.toFixed(1)}%`,
      target: '0%',
      actions: [
        'Immediate audit and update of all expired content',
        'Implement automated expiration alerts',
        'Consider removing or archiving severely outdated content',
        'Establish monthly content health reviews',
      ],
    });
  }

  // Lifecycle efficiency recommendations
  if (lifecycle.lifecycleEfficiency < 70) {
    recommendations.push({
      category: 'lifecycle_optimization',
      priority: 'medium',
      title: 'Improve Content Lifecycle Efficiency',
      current: `${lifecycle.lifecycleEfficiency.toFixed(1)}%`,
      target: '80%+',
      actions: [
        'Implement proactive content refresh scheduling',
        'Use content templates for consistent updates',
        'Track content performance and usage metrics',
        'Consider content consolidation or removal strategies',
      ],
    });
  }

  // Trend-based recommendations
  if (trends.overall === 'declining') {
    recommendations.push({
      category: 'trend_reversal',
      priority: 'high',
      title: 'Reverse Declining Freshness Trend',
      actions: [
        'Conduct comprehensive content audit',
        'Increase frequency of content reviews',
        'Implement automated freshness monitoring',
        'Assign content ownership and maintenance schedules',
      ],
    });
  }

  // Content type-specific recommendations
  const contentByType = currentReport.trends.contentByType;
  if (contentByType.blog && contentByType.projects) {
    const blogRatio = contentByType.blog / currentReport.summary.total;
    const projectsRatio = contentByType.projects / currentReport.summary.total;

    if (blogRatio > 0.7) {
      recommendations.push({
        category: 'content_balance',
        priority: 'low',
        title: 'Balance Content Types',
        message: 'Portfolio is blog-heavy, consider more project content',
        actions: [
          'Focus on creating detailed project case studies',
          'Update existing project descriptions with recent outcomes',
          'Balance new blog posts with project updates',
        ],
      });
    }
  }

  return recommendations;
}

/**
 * Generate monthly trends report
 */
function generateMonthlyTrendsReport(currentReport, historicalData) {
  const trends = calculateMonthlyTrends(historicalData);
  const lifecycle = analyzeContentLifecycle(historicalData);
  const recommendations = generateStrategicRecommendations(currentReport, trends, lifecycle);

  const report = {
    timestamp: new Date().toISOString(),
    reportType: 'monthly_trends',
    currentSnapshot: {
      date: currentReport.timestamp,
      summary: currentReport.summary,
      trends: currentReport.trends,
    },
    historicalAnalysis: {
      dataPoints: historicalData.length,
      periodAnalyzed: `${CONFIG.MONTHS_TO_ANALYZE} months`,
      trends: trends,
    },
    lifecycleMetrics: lifecycle,
    performanceMetrics: {
      freshContentPercentage: (
        (currentReport.summary.fresh / currentReport.summary.total) *
        100
      ).toFixed(1),
      staleContentPercentage: (
        (currentReport.summary.stale / currentReport.summary.total) *
        100
      ).toFixed(1),
      expiredContentPercentage: (
        (currentReport.summary.expired / currentReport.summary.total) *
        100
      ).toFixed(1),
      averageAge: currentReport.trends.averageAge,
      contentHealthScore: calculateContentHealthScore(currentReport),
    },
    strategicRecommendations: recommendations,
    actionPlan: generateActionPlan(recommendations),
  };

  return report;
}

/**
 * Calculate overall content health score
 */
function calculateContentHealthScore(report) {
  const { summary } = report;
  const total = summary.total;

  if (total === 0) return 0;

  // Weight different status categories
  const freshScore = (summary.fresh / total) * 100 * 1.0; // Perfect score
  const agingScore = (summary.aging / total) * 100 * 0.8; // Good score
  const staleScore = (summary.stale / total) * 100 * 0.4; // Poor score
  const expiredScore = (summary.expired / total) * 100 * 0.0; // Fail score

  return Math.round(freshScore + agingScore + staleScore + expiredScore);
}

/**
 * Generate actionable plan from recommendations
 */
function generateActionPlan(recommendations) {
  const actionPlan = {
    immediate: [],
    thisMonth: [],
    thisQuarter: [],
    ongoing: [],
  };

  recommendations.forEach(rec => {
    const action = {
      title: rec.title,
      description: rec.message || rec.title,
      actions: rec.actions || [],
      category: rec.category,
    };

    switch (rec.priority) {
      case 'critical':
        actionPlan.immediate.push(action);
        break;
      case 'high':
        actionPlan.thisMonth.push(action);
        break;
      case 'medium':
        actionPlan.thisQuarter.push(action);
        break;
      case 'low':
      default:
        actionPlan.ongoing.push(action);
        break;
    }
  });

  return actionPlan;
}

/**
 * Save monthly trends report
 */
function saveMonthlyTrendsReport(report) {
  const reportsDir = join(PROJECT_ROOT, CONFIG.REPORTS_DIR);
  const trendsPath = join(reportsDir, CONFIG.MONTHLY_TRENDS);
  const markdownPath = join(reportsDir, 'monthly-trends-summary.md');

  try {
    // Save JSON report
    writeFileSync(trendsPath, JSON.stringify(report, null, 2));
    console.log(`Monthly trends report saved to: ${trendsPath}`);

    // Generate markdown summary
    generateMarkdownSummary(report, markdownPath);

    return { trendsPath, markdownPath };
  } catch (error) {
    console.error('Error saving monthly trends report:', error.message);
    return null;
  }
}

/**
 * Generate markdown summary for monthly trends
 */
function generateMarkdownSummary(report, outputPath) {
  const {
    currentSnapshot,
    historicalAnalysis,
    performanceMetrics,
    strategicRecommendations,
    actionPlan,
  } = report;

  let markdown =
    '# Content Freshness Monthly Trends Report\n\n' +
    '**Generated:** ' +
    new Date().toLocaleDateString() +
    '\n\n' +
    '## Executive Summary\n\n' +
    historicalAnalysis.trends.message +
    '\n\n' +
    '## Performance Metrics\n\n' +
    '| Metric | Current | Target | Status |\n' +
    '|--------|---------|--------|--------|\n' +
    '| Fresh Content | ' +
    performanceMetrics.freshContentPercentage +
    '% | ' +
    CONFIG.PERFORMANCE_THRESHOLDS.excellentFreshness +
    '% | ' +
    (performanceMetrics.freshContentPercentage >= CONFIG.PERFORMANCE_THRESHOLDS.excellentFreshness
      ? '✅'
      : '⚠️') +
    ' |\n' +
    '| Stale Content | ' +
    performanceMetrics.staleContentPercentage +
    '% | ≤' +
    CONFIG.PERFORMANCE_THRESHOLDS.maxStale +
    '% | ' +
    (performanceMetrics.staleContentPercentage <= CONFIG.PERFORMANCE_THRESHOLDS.maxStale
      ? '✅'
      : '⚠️') +
    ' |\n' +
    '| Expired Content | ' +
    performanceMetrics.expiredContentPercentage +
    '% | ' +
    CONFIG.PERFORMANCE_THRESHOLDS.criticalExpired +
    '% | ' +
    (performanceMetrics.expiredContentPercentage <= CONFIG.PERFORMANCE_THRESHOLDS.criticalExpired
      ? '✅'
      : '❌') +
    ' |\n' +
    '| Average Age | ' +
    performanceMetrics.averageAge +
    ' days | ≤90 days | ' +
    (performanceMetrics.averageAge <= 90 ? '✅' : '⚠️') +
    ' |\n' +
    '| Health Score | ' +
    performanceMetrics.contentHealthScore +
    '/100 | ≥80 | ' +
    (performanceMetrics.contentHealthScore >= 80 ? '✅' : '⚠️') +
    ' |\n\n' +
    '## Content Trends\n\n' +
    '### Month-over-Month Changes\n\n';

  // Add trends details if available
  if (historicalAnalysis.trends.details) {
    markdown +=
      Object.entries(historicalAnalysis.trends.details)
        .map(
          ([key, trend]) =>
            '- **' +
            key.replace(/([A-Z])/g, ' $1').trim() +
            ':** ' +
            trend.current +
            ' ' +
            trend.direction +
            ' (' +
            trend.percentChange +
            '%) ' +
            trend.significance
        )
        .join('\n') + '\n\n';
  }

  markdown +=
    '## Action Plan\n\n' +
    '### Immediate Actions (' +
    actionPlan.immediate.length +
    ' items)\n' +
    actionPlan.immediate
      .map(
        action => '- **' + action.title + '**\n  ' + action.actions.map(a => '  - ' + a).join('\n')
      )
      .join('\n') +
    '\n\n' +
    '### This Month (' +
    actionPlan.thisMonth.length +
    ' items)\n' +
    actionPlan.thisMonth
      .map(
        action => '- **' + action.title + '**\n  ' + action.actions.map(a => '  - ' + a).join('\n')
      )
      .join('\n') +
    '\n\n' +
    '### This Quarter (' +
    actionPlan.thisQuarter.length +
    ' items)\n' +
    actionPlan.thisQuarter
      .map(
        action => '- **' + action.title + '**\n  ' + action.actions.map(a => '  - ' + a).join('\n')
      )
      .join('\n') +
    '\n\n' +
    '## Strategic Recommendations\n\n' +
    'Top priorities:\n' +
    strategicRecommendations
      .filter(rec => rec.priority === 'critical' || rec.priority === 'high')
      .slice(0, 5)
      .map(rec => '- **' + rec.title + ':** ' + (rec.message || rec.title))
      .join('\n') +
    '\n\n' +
    '---\n\n' +
    '*Report generated based on ' +
    historicalAnalysis.dataPoints +
    ' data points over ' +
    historicalAnalysis.periodAnalyzed +
    '*\n';

  writeFileSync(outputPath, markdown);
  console.log(`Monthly trends summary saved to: ${outputPath}`);
}

/**
 * Main execution function
 */
function main() {
  console.log('📈 Starting Monthly Content Trends Analysis...\n');

  try {
    // Load current report
    const currentReport = loadCurrentReport();
    console.log('📊 Loaded current freshness report');

    // Load historical data
    const historicalData = loadHistoricalData();
    console.log(`📚 Loaded ${historicalData.length} historical data points`);

    // Update historical data with current report
    const updatedHistorical = updateHistoricalData(currentReport, historicalData);

    // Generate monthly trends analysis
    const trendsReport = generateMonthlyTrendsReport(currentReport, updatedHistorical);

    // Save updated historical data
    const historicalPath = join(PROJECT_ROOT, CONFIG.REPORTS_DIR, CONFIG.HISTORICAL_DATA);
    writeFileSync(historicalPath, JSON.stringify(updatedHistorical, null, 2));

    // Save monthly trends report
    const result = saveMonthlyTrendsReport(trendsReport);

    if (result) {
      console.log('\n✅ Monthly content trends analysis completed successfully');
      console.log(`📄 Report: ${result.trendsPath}`);
      console.log(`📋 Summary: ${result.markdownPath}`);
    } else {
      console.error('\n❌ Failed to save trends analysis results');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error during monthly trends analysis:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { calculateMonthlyTrends, analyzeContentLifecycle, generateStrategicRecommendations };
