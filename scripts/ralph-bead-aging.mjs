#!/usr/bin/env node

// Ralph TUI Bead Aging and Trend Analysis
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const monitoringDataDir = path.join(process.cwd(), '.ralph-monitoring');

// Configuration for bead aging analysis
const AGING_CONFIG = {
  // Age thresholds in milliseconds
  thresholds: {
    fresh: 24 * 60 * 60 * 1000, // 24 hours
    aging: 3 * 24 * 60 * 60 * 1000, // 3 days
    stale: 7 * 24 * 60 * 60 * 1000, // 7 days
    critical: 14 * 24 * 60 * 60 * 1000, // 14 days
  },

  // Priority weighting
  priorityWeights: {
    high: 3,
    medium: 2,
    low: 1,
  },
};

// Load monitoring data
async function loadMonitoringData() {
  try {
    const metricsFile = path.join(monitoringDataDir, 'metrics.json');
    const metricsData = await fs.readFile(metricsFile, 'utf8');
    return JSON.parse(metricsData);
  } catch (error) {
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

// Get detailed bead information
async function getDetailedBeadInfo() {
  const beadInfo = {
    byAge: {
      fresh: [],
      aging: [],
      stale: [],
      critical: [],
    },
    byPriority: {
      high: [],
      medium: [],
      low: [],
    },
    byStatus: {
      queued: [],
      inProgress: [],
      completed: [],
    },
    agingTrends: [],
    recommendations: [],
  };

  try {
    // Try to get detailed bead information using bd command
    const bdAvailable = await isCommandAvailable('bd');
    if (bdAvailable) {
      try {
        // Get all beads with detailed information
        const { stdout: allBeadsOutput } = await execAsync('bd ls --all --format=json', {
          timeout: 15000,
        });
        const allBeads = JSON.parse(allBeadsOutput || '[]');

        const now = Date.now();

        for (const bead of allBeads) {
          if (!bead.created_at) continue;

          const beadAge = now - new Date(bead.created_at).getTime();
          const ageCategory = categorizeBeadAge(beadAge);
          const priority = bead.priority || 'medium';
          const status = bead.status || 'queued';

          // Add to age categories
          beadInfo.byAge[ageCategory].push({
            ...bead,
            age: beadAge,
            ageCategory,
            priority,
            status,
          });

          // Add to priority categories
          if (!beadInfo.byPriority[priority]) {
            beadInfo.byPriority[priority] = [];
          }
          beadInfo.byPriority[priority].push({
            ...bead,
            age: beadAge,
            ageCategory,
            priority,
            status,
          });

          // Add to status categories
          if (!beadInfo.byStatus[status]) {
            beadInfo.byStatus[status] = [];
          }
          beadInfo.byStatus[status].push({
            ...bead,
            age: beadAge,
            ageCategory,
            priority,
            status,
          });
        }

        // Generate aging trends
        beadInfo.agingTrends = generateAgingTrends(allBeads);

        // Generate recommendations
        beadInfo.recommendations = generateRecommendations(beadInfo);
      } catch (error) {
        beadInfo.error = `Failed to get detailed bead info: ${error.message}`;
      }
    } else {
      beadInfo.error = 'bd command not available for detailed analysis';
    }
  } catch (error) {
    beadInfo.error = `Error accessing bead data: ${error.message}`;
  }

  return beadInfo;
}

// Categorize bead age
function categorizeBeadAge(age) {
  if (age <= AGING_CONFIG.thresholds.fresh) return 'fresh';
  if (age <= AGING_CONFIG.thresholds.aging) return 'aging';
  if (age <= AGING_CONFIG.thresholds.stale) return 'stale';
  return 'critical';
}

// Generate aging trends
function generateAgingTrends(beads) {
  const trends = {
    totalBeads: beads.length,
    ageDistribution: {
      fresh: 0,
      aging: 0,
      stale: 0,
      critical: 0,
    },
    priorityDistribution: {
      high: { fresh: 0, aging: 0, stale: 0, critical: 0 },
      medium: { fresh: 0, aging: 0, stale: 0, critical: 0 },
      low: { fresh: 0, aging: 0, stale: 0, critical: 0 },
    },
    avgAgeByPriority: {
      high: 0,
      medium: 0,
      low: 0,
    },
  };

  const now = Date.now();

  for (const bead of beads) {
    if (!bead.created_at) continue;

    const beadAge = now - new Date(bead.created_at).getTime();
    const ageCategory = categorizeBeadAge(beadAge);
    const priority = bead.priority || 'medium';

    // Update age distribution
    trends.ageDistribution[ageCategory]++;

    // Update priority distribution
    if (!trends.priorityDistribution[priority]) {
      trends.priorityDistribution[priority] = { fresh: 0, aging: 0, stale: 0, critical: 0 };
    }
    trends.priorityDistribution[priority][ageCategory]++;

    // Track ages for averaging
    if (!trends.avgAgeByPriority[priority]) {
      trends.avgAgeByPriority[priority] = { total: 0, count: 0 };
    }
    trends.avgAgeByPriority[priority].total += beadAge;
    trends.avgAgeByPriority[priority].count++;
  }

  // Calculate average ages
  for (const priority of ['high', 'medium', 'low']) {
    const data = trends.avgAgeByPriority[priority];
    if (data && data.count > 0) {
      trends.avgAgeByPriority[priority] = Math.round(data.total / data.count);
    } else {
      trends.avgAgeByPriority[priority] = 0;
    }
  }

  return trends;
}

// Generate recommendations based on aging analysis
function generateRecommendations(beadInfo) {
  const recommendations = [];
  const now = Date.now();

  // Check for critical beads
  const criticalBeads = beadInfo.byAge.critical;
  if (criticalBeads.length > 0) {
    recommendations.push({
      type: 'critical',
      priority: 'high',
      title: `${criticalBeads.length} critical beads require immediate attention`,
      description: `These beads have been queued for more than 14 days and may indicate system issues or stuck processes.`,
      beads: criticalBeads.slice(0, 5), // Show first 5
      action: 'Review and manually process or clean up these beads',
    });
  }

  // Check for stale beads
  const staleBeads = beadInfo.byAge.stale;
  if (staleBeads.length > 3) {
    recommendations.push({
      type: 'stale',
      priority: 'medium',
      title: `${staleBeads.length} stale beads detected`,
      description: `These beads have been queued for more than 7 days and may indicate processing bottlenecks.`,
      beads: staleBeads.slice(0, 5),
      action: 'Investigate processing pipeline and consider manual intervention',
    });
  }

  // Check high-priority aging beads
  const highPriorityAging = [
    ...beadInfo.byAge.aging,
    ...beadInfo.byAge.stale,
    ...beadInfo.byAge.critical,
  ].filter(bead => bead.priority === 'high');

  if (highPriorityAging.length > 2) {
    recommendations.push({
      type: 'priority_aging',
      priority: 'high',
      title: `${highPriorityAging.length} high-priority beads are aging`,
      description: `High-priority beads should be processed quickly but some have been waiting for days.`,
      beads: highPriorityAging.slice(0, 5),
      action: 'Prioritize these beads for immediate processing',
    });
  }

  // Check queue health trends
  const totalQueued = beadInfo.byStatus.queued?.length || 0;
  const totalInProgress = beadInfo.byStatus.inProgress?.length || 0;

  if (totalQueued > 50) {
    recommendations.push({
      type: 'queue_depth',
      priority: 'medium',
      title: `Queue depth is high: ${totalQueued} beads`,
      description: `Large queue depth may indicate capacity issues or processing bottlenecks.`,
      action: 'Consider scaling processing resources or optimizing pipeline',
    });
  }

  if (totalQueued > 0 && totalInProgress === 0) {
    recommendations.push({
      type: 'no_processing',
      priority: 'high',
      title: `Queue has ${totalQueued} beads but no active processing`,
      description: `Beads are queued but none are being processed, indicating possible daemon issues.`,
      action: 'Check daemon status and restart if necessary',
    });
  }

  // Check aging patterns
  const agingBeads = beadInfo.byAge.aging;
  if (agingBeads.length > 10) {
    recommendations.push({
      type: 'aging_pattern',
      priority: 'low',
      title: `${agingBeads.length} beads are aging (1-3 days old)`,
      description: `Growing number of aging beads may indicate processing slowdown.`,
      action: 'Monitor processing rates and investigate bottlenecks',
    });
  }

  return recommendations;
}

// Check if command is available
async function isCommandAvailable(command) {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

// Generate aging analysis report
async function generateAgingReport() {
  const monitoringData = await loadMonitoringData();
  const recentAlerts = await loadRecentAlerts();
  const beadInfo = await getDetailedBeadInfo();

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalBeads: beadInfo.agingTrends?.totalBeads || 0,
      criticalBeads: beadInfo.byAge.critical?.length || 0,
      staleBeads: beadInfo.byAge.stale?.length || 0,
      agingBeads: beadInfo.byAge.aging?.length || 0,
      freshBeads: beadInfo.byAge.fresh?.length || 0,
      recommendations: beadInfo.recommendations?.length || 0,
      recentAlerts: recentAlerts.length,
      overallHealth: 'unknown',
    },
    agingTrends: beadInfo.agingTrends,
    recommendations: beadInfo.recommendations,
    alerts: recentAlerts,
    beadInfo: {
      byAge: {
        fresh: beadInfo.byAge.fresh?.length || 0,
        aging: beadInfo.byAge.aging?.length || 0,
        stale: beadInfo.byAge.stale?.length || 0,
        critical: beadInfo.byAge.critical?.length || 0,
      },
      byPriority: {
        high: beadInfo.byPriority.high?.length || 0,
        medium: beadInfo.byPriority.medium?.length || 0,
        low: beadInfo.byPriority.low?.length || 0,
      },
      byStatus: {
        queued: beadInfo.byStatus.queued?.length || 0,
        inProgress: beadInfo.byStatus.inProgress?.length || 0,
        completed: beadInfo.byStatus.completed?.length || 0,
      },
    },
    error: beadInfo.error,
  };

  // Calculate overall health
  const criticalCount = report.summary.criticalBeads;
  const staleCount = report.summary.staleBeads;
  const alertCount = report.summary.recentAlerts;

  if (criticalCount > 0) {
    report.summary.overallHealth = 'critical';
  } else if (staleCount > 5 || alertCount > 10) {
    report.summary.overallHealth = 'poor';
  } else if (staleCount > 0 || alertCount > 5) {
    report.summary.overallHealth = 'fair';
  } else {
    report.summary.overallHealth = 'good';
  }

  return report;
}

// Generate trend analysis over time
async function generateTrendAnalysis(days = 7) {
  const monitoringData = await loadMonitoringData();

  if (!monitoringData.checks || monitoringData.checks.length === 0) {
    return { error: 'No monitoring data available for trend analysis' };
  }

  const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const recentChecks = monitoringData.checks.filter(
    check => new Date(check.timestamp) > cutoffTime
  );

  if (recentChecks.length === 0) {
    return { error: `No monitoring data available for the last ${days} days` };
  }

  const trendAnalysis = {
    period: `${days} days`,
    startDate: new Date(recentChecks[0].timestamp).toISOString(),
    endDate: new Date(recentChecks[recentChecks.length - 1].timestamp).toISOString(),
    totalChecks: recentChecks.length,
    metrics: {
      queueDepth: {
        min: Math.min(...recentChecks.map(check => check.metrics?.queueDepth || 0)),
        max: Math.max(...recentChecks.map(check => check.metrics?.queueDepth || 0)),
        avg: (
          recentChecks.reduce((sum, check) => sum + (check.metrics?.queueDepth || 0), 0) /
          recentChecks.length
        ).toFixed(1),
        trend: calculateTrend(recentChecks.map(check => check.metrics?.queueDepth || 0)),
      },
      processingRate: {
        min: Math.min(...recentChecks.map(check => check.metrics?.processingRate || 0)),
        max: Math.max(...recentChecks.map(check => check.metrics?.processingRate || 0)),
        avg: (
          recentChecks.reduce((sum, check) => sum + (check.metrics?.processingRate || 0), 0) /
          recentChecks.length
        ).toFixed(2),
        trend: calculateTrend(recentChecks.map(check => check.metrics?.processingRate || 0)),
      },
      stuckBeads: {
        min: Math.min(...recentChecks.map(check => check.metrics?.stuckBeads || 0)),
        max: Math.max(...recentChecks.map(check => check.metrics?.stuckBeads || 0)),
        avg: (
          recentChecks.reduce((sum, check) => sum + (check.metrics?.stuckBeads || 0), 0) /
          recentChecks.length
        ).toFixed(1),
        trend: calculateTrend(recentChecks.map(check => check.metrics?.stuckBeads || 0)),
      },
    },
    alerts: {
      total: recentChecks.reduce((sum, check) => sum + (check.alerts?.length || 0), 0),
      byType: {},
    },
    recommendations: [],
  };

  // Analyze alert trends
  for (const check of recentChecks) {
    if (check.alerts) {
      for (const alert of check.alerts) {
        if (!trendAnalysis.alerts.byType[alert.type]) {
          trendAnalysis.alerts.byType[alert.type] = 0;
        }
        trendAnalysis.alerts.byType[alert.type]++;
      }
    }
  }

  // Generate trend-based recommendations
  trendAnalysis.recommendations = generateTrendRecommendations(trendAnalysis);

  return trendAnalysis;
}

// Calculate trend direction
function calculateTrend(values) {
  if (values.length < 2) return 'stable';

  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (Math.abs(change) < 5) return 'stable';
  return change > 0 ? 'increasing' : 'decreasing';
}

// Generate trend-based recommendations
function generateTrendRecommendations(trendAnalysis) {
  const recommendations = [];

  // Queue depth trends
  const queueTrend = trendAnalysis.metrics.queueDepth.trend;
  if (queueTrend === 'increasing' && trendAnalysis.metrics.queueDepth.avg > 20) {
    recommendations.push({
      type: 'trend_queue_growth',
      priority: 'high',
      title: 'Queue depth is consistently increasing',
      description: `Average queue depth: ${trendAnalysis.metrics.queueDepth.avg}, trend: ${queueTrend}`,
      action: 'Investigate processing capacity and consider scaling',
    });
  }

  // Processing rate trends
  const rateTrend = trendAnalysis.metrics.processingRate.trend;
  if (rateTrend === 'decreasing' && trendAnalysis.metrics.processingRate.avg < 1.0) {
    recommendations.push({
      type: 'trend_processing_decline',
      priority: 'medium',
      title: 'Processing rate is declining',
      description: `Average processing rate: ${trendAnalysis.metrics.processingRate.avg}/min, trend: ${rateTrend}`,
      action: 'Check for performance bottlenecks and optimize processing pipeline',
    });
  }

  // Stuck beads trends
  const stuckTrend = trendAnalysis.metrics.stuckBeads.trend;
  if (stuckTrend === 'increasing' && trendAnalysis.metrics.stuckBeads.avg > 0) {
    recommendations.push({
      type: 'trend_stuck_growth',
      priority: 'high',
      title: 'Stuck beads are increasing',
      description: `Average stuck beads: ${trendAnalysis.metrics.stuckBeads.avg}, trend: ${stuckTrend}`,
      action: 'Investigate bead processing failures and implement recovery mechanisms',
    });
  }

  return recommendations;
}

// Save aging analysis to file
async function saveAgingReport(report) {
  const reportFile = path.join(monitoringDataDir, 'aging-report.json');
  try {
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    return reportFile;
  } catch (error) {
    console.error('Failed to save aging report:', error);
    return null;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';

  switch (command) {
    case 'analyze': {
      const report = await generateAgingReport();
      console.log(JSON.stringify(report, null, 2));

      const savedFile = await saveAgingReport(report);
      if (savedFile) {
        console.log(`\nReport saved to: ${savedFile}`);
      }
      break;
    }

    case 'trends': {
      const days = parseInt(args[1]) || 7;
      const trends = await generateTrendAnalysis(days);
      console.log(JSON.stringify(trends, null, 2));
      break;
    }

    case 'recommendations': {
      const report = await generateAgingReport();
      console.log('\n🎯 RALPH TUI BEAD AGING RECOMMENDATIONS\n');
      console.log('=====================================\n');

      if (report.recommendations.length === 0) {
        console.log('✅ No recommendations at this time. All systems operating normally.');
      } else {
        report.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
          console.log(`   ${rec.description}`);
          console.log(`   Action: ${rec.action}\n`);
        });
      }

      console.log(`Overall Health: ${report.summary.overallHealth.toUpperCase()}`);
      console.log(`Total Beads: ${report.summary.totalBeads}`);
      console.log(`Critical: ${report.summary.criticalBeads}`);
      console.log(`Stale: ${report.summary.staleBeads}`);
      break;
    }

    default:
      console.log(`
Usage: node scripts/ralph-bead-aging.mjs <command>

Commands:
  analyze                 - Generate detailed bead aging analysis
  trends [days]          - Analyze trends over specified days (default: 7)
  recommendations        - Show actionable recommendations only

Examples:
  node scripts/ralph-bead-aging.mjs analyze
  node scripts/ralph-bead-aging.mjs trends 14
  node scripts/ralph-bead-aging.mjs recommendations
      `);
      process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down bead aging analysis...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down bead aging analysis...');
  process.exit(0);
});

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
