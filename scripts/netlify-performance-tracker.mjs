#!/usr/bin/env node

/**
 * Netlify Performance Metrics Tracker
 *
 * Extends log analysis with detailed performance monitoring,
 * historical data tracking, and optimization recommendations.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { fetchBuildLogs, parseBuildLogEntry, analyzeTrends } from './netlify-log-analyzer.mjs';

const REPORTS_DIR = '.netlify-reports';
const METRICS_HISTORY = join(REPORTS_DIR, 'metrics-history.json');
const PERFORMANCE_BASELINE = join(REPORTS_DIR, 'performance-baseline.json');

/**
 * Track performance metrics over time
 */
class PerformanceTracker {
  constructor() {
    this.metricsHistory = [];
    this.baseline = null;
  }

  /**
   * Load historical metrics data
   */
  async loadHistory() {
    try {
      const data = await readFile(METRICS_HISTORY, 'utf8');
      this.metricsHistory = JSON.parse(data);
    } catch (error) {
      this.metricsHistory = [];
    }

    try {
      const baselineData = await readFile(PERFORMANCE_BASELINE, 'utf8');
      this.baseline = JSON.parse(baselineData);
    } catch (error) {
      this.baseline = null;
    }
  }

  /**
   * Save current metrics to history
   */
  async saveMetrics(currentMetrics) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      metrics: currentMetrics,
    };

    this.metricsHistory.push(entry);

    // Keep only last 90 days of data
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    this.metricsHistory = this.metricsHistory.filter(
      entry => new Date(entry.timestamp) > ninetyDaysAgo
    );

    await writeFile(METRICS_HISTORY, JSON.stringify(this.metricsHistory, null, 2));

    // Set baseline if this is the first entry
    if (!this.baseline && this.metricsHistory.length === 1) {
      this.baseline = { ...currentMetrics, timestamp };
      await writeFile(PERFORMANCE_BASELINE, JSON.stringify(this.baseline, null, 2));
    }
  }

  /**
   * Analyze performance trends and detect anomalies
   */
  analyzeTrends(currentMetrics) {
    if (this.metricsHistory.length < 5) {
      return {
        trend: 'insufficient_data',
        changes: [],
        anomalies: [],
        recommendations: [],
      };
    }

    const recent = this.metricsHistory.slice(-5);
    const baseline = this.baseline || this.metricsHistory[0]?.metrics;

    const trends = {
      trend: 'stable',
      changes: [],
      anomalies: [],
      recommendations: [],
    };

    // Analyze build time trends
    const recentBuildTimes = recent.map(entry => entry.metrics.build_performance.average_duration);
    const currentBuildTime = currentMetrics.build_performance.average_duration;
    const baselineBuildTime = baseline?.build_performance?.average_duration || recentBuildTimes[0];

    if (currentBuildTime > baselineBuildTime * 1.2) {
      trends.trend = 'degrading';
      trends.changes.push({
        metric: 'build_time',
        type: 'increase',
        severity: 'high',
        current: Math.round(currentBuildTime / 1000),
        baseline: Math.round(baselineBuildTime / 1000),
        percentage: Math.round(((currentBuildTime - baselineBuildTime) / baselineBuildTime) * 100),
      });
    } else if (currentBuildTime < baselineBuildTime * 0.8) {
      trends.trend = 'improving';
      trends.changes.push({
        metric: 'build_time',
        type: 'decrease',
        severity: 'positive',
        current: Math.round(currentBuildTime / 1000),
        baseline: Math.round(baselineBuildTime / 1000),
        percentage: Math.round(((baselineBuildTime - currentBuildTime) / baselineBuildTime) * 100),
      });
    }

    // Analyze success rate trends
    const currentSuccessRate = currentMetrics.build_performance.success_rate;
    const baselineSuccessRate = baseline?.build_performance?.success_rate || 95;

    if (currentSuccessRate < baselineSuccessRate - 5) {
      trends.trend = trends.trend === 'degrading' ? 'degrading' : 'concerning';
      trends.changes.push({
        metric: 'success_rate',
        type: 'decrease',
        severity: 'high',
        current: currentSuccessRate.toFixed(1),
        baseline: baselineSuccessRate.toFixed(1),
        percentage: Math.round(baselineSuccessRate - currentSuccessRate),
      });
    } else if (currentSuccessRate > baselineSuccessRate + 2) {
      trends.changes.push({
        metric: 'success_rate',
        type: 'increase',
        severity: 'positive',
        current: currentSuccessRate.toFixed(1),
        baseline: baselineSuccessRate.toFixed(1),
        percentage: Math.round(currentSuccessRate - baselineSuccessRate),
      });
    }

    // Detect anomalies using statistical analysis
    const allBuildTimes = this.metricsHistory.map(
      entry => entry.metrics.build_performance.average_duration
    );
    const mean = allBuildTimes.reduce((a, b) => a + b, 0) / allBuildTimes.length;
    const stdDev = Math.sqrt(
      allBuildTimes.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / allBuildTimes.length
    );

    if (Math.abs(currentBuildTime - mean) > stdDev * 2) {
      trends.anomalies.push({
        metric: 'build_time',
        type: currentBuildTime > mean ? 'spike' : 'drop',
        severity: 'high',
        current: Math.round(currentBuildTime / 1000),
        expected: Math.round(mean / 1000),
        deviation: Math.round((Math.abs(currentBuildTime - mean) / mean) * 100),
      });
    }

    // Generate specific recommendations based on trends
    if (trends.trend === 'degrading' || trends.anomalies.length > 0) {
      trends.recommendations.push({
        priority: 'high',
        category: 'immediate_action',
        title: 'Performance Degradation Detected',
        description: 'Recent metrics show concerning trends that require immediate attention',
        actions: [
          'Review recent code changes for performance impact',
          'Check for dependency updates that may have increased build time',
          'Verify build configuration and environment variables',
          'Consider implementing build caching strategies',
        ],
      });
    }

    if (currentMetrics.error_analysis.total_errors > 3) {
      trends.recommendations.push({
        priority: 'medium',
        category: 'error_resolution',
        title: 'Recurring Build Errors',
        description: `${currentMetrics.error_analysis.total_errors} build failures detected in recent builds`,
        actions: [
          'Analyze error patterns in detailed log analysis',
          'Implement better error handling and validation',
          'Consider adding pre-commit hooks to catch issues early',
        ],
      });
    }

    return trends;
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(currentMetrics, trends) {
    const report = [];

    report.push('# Netlify Performance Metrics Report');
    report.push('');
    report.push(`**Generated:** ${new Date().toLocaleString()}`);
    report.push(`**Analysis Period:** Last ${this.metricsHistory.length} data points`);
    report.push('');

    // Current Status
    report.push('## Current Performance Status');
    report.push('');
    report.push(
      `**Health Score:** ${currentMetrics.health_score}/100 ${currentMetrics.health_score >= 80 ? '✅' : currentMetrics.health_score >= 60 ? '⚠️' : '❌'}`
    );
    report.push(
      `**Trend:** ${trends.trend === 'improving' ? '📈 Improving' : trends.trend === 'degrading' ? '📉 Degrading' : trends.trend === 'concerning' ? '⚠️ Concerning' : '➡️ Stable'}`
    );
    report.push('');

    // Key Metrics
    report.push('### Key Metrics');
    report.push('');
    report.push(`| Metric | Current | Baseline | Change |`);
    report.push(`|--------|---------|----------|--------|`);
    report.push(
      `| Success Rate | ${currentMetrics.build_performance.success_rate.toFixed(1)}% | ${this.baseline?.build_performance?.success_rate?.toFixed(1) || 'N/A'}% | ${this.formatChange(currentMetrics.build_performance.success_rate, this.baseline?.build_performance?.success_rate)} |`
    );
    report.push(
      `| Avg Build Time | ${Math.round(currentMetrics.build_performance.average_duration / 1000)}s | ${Math.round((this.baseline?.build_performance?.average_duration || 0) / 1000)}s | ${this.formatTimeChange(currentMetrics.build_performance.average_duration, this.baseline?.build_performance?.average_duration)} |`
    );
    report.push(
      `| Function Count | ${Math.round(currentMetrics.function_trends.average_function_count)} | ${Math.round(this.baseline?.function_trends?.average_function_count || 0)} | ${this.formatChange(currentMetrics.function_trends.average_function_count, this.baseline?.function_trends?.average_function_count)} |`
    );
    report.push('');

    // Changes and Anomalies
    if (trends.changes.length > 0) {
      report.push('## Performance Changes');
      report.push('');
      trends.changes.forEach(change => {
        const icon =
          change.severity === 'high' ? '🔴' : change.severity === 'positive' ? '🟢' : '🟡';
        report.push(`### ${icon} ${change.metric.replace('_', ' ').toUpperCase()}`);
        report.push(`- **Type:** ${change.type}`);
        report.push(`- **Current:** ${change.current}`);
        report.push(`- **Baseline:** ${change.baseline}`);
        report.push(`- **Change:** ${change.percentage}%`);
        report.push('');
      });
    }

    if (trends.anomalies.length > 0) {
      report.push('## Anomalies Detected');
      report.push('');
      trends.anomalies.forEach(anomaly => {
        const icon = anomaly.severity === 'high' ? '🚨' : '⚠️';
        report.push(
          `### ${icon} ${anomaly.metric.replace('_', ' ').toUpperCase()} ${anomaly.type.toUpperCase()}`
        );
        report.push(`- **Current:** ${anomaly.current}`);
        report.push(`- **Expected:** ${anomaly.expected}`);
        report.push(`- **Deviation:** ${anomaly.deviation}% from normal`);
        report.push('');
      });
    }

    // Recommendations
    if (trends.recommendations.length > 0) {
      report.push('## Recommendations');
      report.push('');
      trends.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        report.push(`### ${index + 1}. ${priority} ${rec.title.toUpperCase()}`);
        report.push(`**Description:** ${rec.description}`);
        report.push('');
        if (rec.actions && rec.actions.length > 0) {
          report.push('**Actions:**');
          rec.actions.forEach(action => {
            report.push(`- ${action}`);
          });
          report.push('');
        }
      });
    }

    // Historical Context
    if (this.metricsHistory.length > 1) {
      report.push('## Historical Context');
      report.push('');
      report.push(`**Data Points:** ${this.metricsHistory.length}`);
      report.push(
        `**Tracking Period:** ${new Date(this.metricsHistory[0].timestamp).toLocaleDateString()} - Present`
      );
      report.push('');

      // Calculate improvement metrics
      const first = this.metricsHistory[0].metrics;
      const improvement = {
        success_rate:
          currentMetrics.build_performance.success_rate - first.build_performance.success_rate,
        build_time:
          first.build_performance.average_duration -
          currentMetrics.build_performance.average_duration,
      };

      report.push('### Overall Improvements');
      report.push('');
      if (improvement.success_rate > 0) {
        report.push(`- ✅ Success rate improved by ${improvement.success_rate.toFixed(1)}%`);
      } else if (improvement.success_rate < 0) {
        report.push(
          `- ❌ Success rate decreased by ${Math.abs(improvement.success_rate).toFixed(1)}%`
        );
      }

      if (improvement.build_time > 0) {
        report.push(`- ✅ Build time improved by ${Math.round(improvement.build_time / 1000)}s`);
      } else if (improvement.build_time < 0) {
        report.push(
          `- ❌ Build time increased by ${Math.round(Math.abs(improvement.build_time) / 1000)}s`
        );
      }
      report.push('');
    }

    return report.join('\n');
  }

  formatChange(current, baseline) {
    if (baseline === undefined || baseline === null) return '🆕 New';
    const change = current - baseline;
    if (Math.abs(change) < 0.1) return '➡️ Stable';
    const icon = change > 0 ? '📈' : '📉';
    return `${icon} ${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  }

  formatTimeChange(current, baseline) {
    if (baseline === undefined || baseline === null || baseline === 0) return '🆕 New';
    const change = current - baseline;
    if (Math.abs(change) < 5000) return '➡️ Stable'; // Less than 5 seconds
    const icon = change < 0 ? '✅' : '⚠️';
    return `${icon} ${change < 0 ? '-' : '+'}${Math.round(Math.abs(change) / 1000)}s`;
  }
}

/**
 * Advanced function performance analysis
 */
function analyzeFunctionPerformance(builds) {
  const functionAnalysis = {
    performance_by_function: {},
    cold_start_patterns: [],
    size_analysis: {},
    optimization_opportunities: [],
  };

  builds.forEach(build => {
    if (build.functions) {
      Object.entries(build.functions).forEach(([name, data]) => {
        if (!functionAnalysis.performance_by_function[name]) {
          functionAnalysis.performance_by_function[name] = {
            invocations: 0,
            total_duration: 0,
            errors: 0,
            max_duration: 0,
            avg_duration: 0,
            size: data.size || 0,
          };
        }

        const func = functionAnalysis.performance_by_function[name];
        func.invocations++;
        func.total_duration += data.duration || 0;
        func.max_duration = Math.max(func.max_duration, data.duration || 0);
        if (data.error) func.errors++;
        func.avg_duration = func.total_duration / func.invocations;
      });
    }
  });

  // Identify optimization opportunities
  Object.entries(functionAnalysis.performance_by_function).forEach(([name, metrics]) => {
    // Large functions (>1MB)
    if (metrics.size > 1024 * 1024) {
      functionAnalysis.optimization_opportunities.push({
        function: name,
        type: 'size_optimization',
        severity: 'medium',
        description: `Function is ${Math.round(metrics.size / 1024 / 1024)}MB (exceeds 1MB)`,
        recommendation:
          'Consider code splitting, removing unused dependencies, or using edge functions',
      });
    }

    // Slow functions (>2s average)
    if (metrics.avg_duration > 2000) {
      functionAnalysis.optimization_opportunities.push({
        function: name,
        type: 'performance_optimization',
        severity: 'high',
        description: `Average function duration is ${Math.round(metrics.avg_duration)}ms (exceeds 2s)`,
        recommendation:
          'Optimize function logic, add caching, or consider moving to edge functions',
      });
    }

    // High error rate
    const errorRate = metrics.errors / metrics.invocations;
    if (errorRate > 0.05) {
      functionAnalysis.optimization_opportunities.push({
        function: name,
        type: 'reliability_optimization',
        severity: 'high',
        description: `Error rate is ${(errorRate * 100).toFixed(1)}% (exceeds 5%)`,
        recommendation: 'Add better error handling, input validation, and retry logic',
      });
    }
  });

  return functionAnalysis;
}

/**
 * Main execution function
 */
async function main() {
  const tracker = new PerformanceTracker();

  try {
    console.log('📊 Starting detailed performance metrics tracking...');

    // Load historical data
    await tracker.loadHistory();
    console.log(`✓ Loaded ${tracker.metricsHistory.length} historical data points`);

    // Fetch and analyze current data
    console.log('📈 Fetching current build data...');
    const builds = await fetchBuildLogs(30);
    const analyses = builds.map(parseBuildLogEntry);
    const currentMetrics = analyzeTrends(analyses);

    // Analyze function performance
    const functionAnalysis = analyzeFunctionPerformance(builds);
    currentMetrics.function_analysis = functionAnalysis;

    // Analyze trends
    const trends = tracker.analyzeTrends(currentMetrics);
    console.log(`✓ Analyzed performance trends: ${trends.trend}`);

    // Save metrics
    await tracker.saveMetrics(currentMetrics);
    console.log(`✓ Saved metrics to history`);

    // Generate comprehensive report
    const report = tracker.generatePerformanceReport(currentMetrics, trends);
    await writeFile(join(REPORTS_DIR, 'performance-metrics-report.md'), report);
    console.log(`✓ Generated detailed performance metrics report`);

    // Update main analysis file with function data
    const analysisData = {
      timestamp: new Date().toISOString(),
      total_builds: analyses.length,
      analyses,
      current_metrics: currentMetrics,
      trends,
      function_analysis: functionAnalysis,
    };
    await writeFile(
      join(REPORTS_DIR, 'detailed-analysis.json'),
      JSON.stringify(analysisData, null, 2)
    );

    // Print summary
    console.log('\n📊 Performance Metrics Summary:');
    console.log(`   Health Score: ${currentMetrics.health_score}/100`);
    console.log(`   Trend: ${trends.trend}`);
    console.log(`   Success Rate: ${currentMetrics.build_performance.success_rate.toFixed(1)}%`);
    console.log(
      `   Avg Build Time: ${Math.round(currentMetrics.build_performance.average_duration / 1000)}s`
    );
    console.log(
      `   Functions Analyzed: ${Object.keys(functionAnalysis.performance_by_function).length}`
    );
    console.log(
      `   Optimization Opportunities: ${functionAnalysis.optimization_opportunities.length}`
    );
    console.log(`   Historical Data Points: ${tracker.metricsHistory.length}`);

    if (trends.trend === 'degrading' || trends.anomalies.length > 0) {
      console.log('\n⚠️  Performance degradation detected - review recommendations');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Performance tracking failed:', error.message);
    process.exit(1);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { PerformanceTracker, analyzeFunctionPerformance };
