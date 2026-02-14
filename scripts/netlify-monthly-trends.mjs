#!/usr/bin/env node

/**
 * Netlify Monthly Performance Trends Analyzer
 *
 * Generates comprehensive monthly performance trend reports,
 * identifies long-term patterns, and provides strategic recommendations.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const REPORTS_DIR = '.netlify-reports';
const MONTHLY_REPORTS_DIR = join(REPORTS_DIR, 'monthly');
const METRICS_HISTORY = join(REPORTS_DIR, 'metrics-history.json');

/**
 * Analyze long-term performance trends
 */
class MonthlyTrendAnalyzer {
  constructor() {
    this.monthlyData = [];
    this.quarterlyData = [];
    this.yearlyData = [];
  }

  /**
   * Load and aggregate historical data
   */
  async loadHistoricalData() {
    try {
      const historyData = await readFile(METRICS_HISTORY, 'utf8');
      const history = JSON.parse(historyData);

      // Group data by month
      const monthlyGroups = {};

      history.forEach(entry => {
        const date = new Date(entry.timestamp);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyGroups[monthKey]) {
          monthlyGroups[monthKey] = [];
        }

        monthlyGroups[monthKey].push(entry.metrics);
      });

      // Calculate monthly averages
      this.monthlyData = Object.entries(monthlyGroups)
        .map(([month, metrics]) => {
          const avgMetrics = this.calculateAverages(metrics);
          return {
            month,
            year: parseInt(month.split('-')[0]),
            month_num: parseInt(month.split('-')[1]),
            metrics: avgMetrics,
            sample_size: metrics.length,
          };
        })
        .sort((a, b) => a.month.localeCompare(b.month));

      // Group by quarter
      const quarterlyGroups = {};
      this.monthlyData.forEach(monthData => {
        const quarter = Math.ceil(monthData.month_num / 3);
        const quarterKey = `${monthData.year}-Q${quarter}`;

        if (!quarterlyGroups[quarterKey]) {
          quarterlyGroups[quarterKey] = [];
        }

        quarterlyGroups[quarterKey].push(monthData.metrics);
      });

      this.quarterlyData = Object.entries(quarterlyGroups)
        .map(([quarter, metrics]) => ({
          quarter,
          metrics: this.calculateAverages(metrics),
          sample_size: metrics.length,
        }))
        .sort((a, b) => a.quarter.localeCompare(b.quarter));

      console.log(
        `✓ Loaded ${history.length} data points across ${this.monthlyData.length} months`
      );
    } catch (error) {
      console.warn('⚠️  No historical data found, generating sample data for demonstration');
      this.generateSampleData();
    }
  }

  /**
   * Calculate average metrics from multiple data points
   */
  calculateAverages(metricsArray) {
    if (metricsArray.length === 0) return null;

    const sum = metricsArray.reduce(
      (acc, metrics) => {
        acc.health_score += metrics.health_score || 0;
        acc.success_rate += metrics.build_performance?.success_rate || 0;
        acc.avg_build_time += metrics.build_performance?.average_duration || 0;
        acc.function_count += metrics.function_trends?.average_function_count || 0;
        acc.total_errors += metrics.error_analysis?.total_errors || 0;
        acc.recommendations += (metrics.performance_recommendations || []).length;
        return acc;
      },
      {
        health_score: 0,
        success_rate: 0,
        avg_build_time: 0,
        function_count: 0,
        total_errors: 0,
        recommendations: 0,
      }
    );

    const count = metricsArray.length;

    return {
      health_score: Math.round(sum.health_score / count),
      build_performance: {
        success_rate: Math.round((sum.success_rate / count) * 10) / 10,
        average_duration: Math.round(sum.avg_build_time / count),
        failure_rate: Math.round((100 - sum.success_rate / count) * 10) / 10,
      },
      function_trends: {
        average_function_count: Math.round(sum.function_count / count),
      },
      error_analysis: {
        total_errors: Math.round(sum.total_errors / count),
      },
      performance_recommendations_count: Math.round(sum.recommendations / count),
    };
  }

  /**
   * Generate sample data for demonstration purposes
   */
  generateSampleData() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Generate 6 months of sample data
    for (let i = 5; i >= 0; i--) {
      const month = currentMonth - i;
      const year = month > 0 ? currentYear : currentYear - 1;
      const adjustedMonth = month > 0 ? month : month + 12;

      const monthKey = `${year}-${String(adjustedMonth).padStart(2, '0')}`;

      // Simulate some trends with noise
      const baseHealthScore = 85;
      const baseBuildTime = 120000; // 2 minutes
      const baseSuccessRate = 95;

      this.monthlyData.push({
        month: monthKey,
        year,
        month_num: adjustedMonth,
        sample_size: 20 + Math.floor(Math.random() * 10),
        metrics: {
          health_score: Math.max(
            60,
            Math.min(100, baseHealthScore + (Math.random() - 0.5) * 20 - i * 2)
          ),
          build_performance: {
            success_rate: Math.max(80, Math.min(100, baseSuccessRate + (Math.random() - 0.5) * 10)),
            average_duration: Math.max(
              60000,
              baseBuildTime + (Math.random() - 0.5) * 60000 + i * 10000
            ),
            failure_rate: 0,
          },
          function_trends: {
            average_function_count: Math.max(5, 8 + Math.floor(Math.random() * 5)),
          },
          error_analysis: {
            total_errors: Math.floor(Math.random() * 5),
          },
          performance_recommendations_count: Math.floor(Math.random() * 8),
        },
      });
    }

    // Generate quarterly data from monthly
    const quarterlyGroups = {};
    this.monthlyData.forEach(monthData => {
      const quarter = Math.ceil(monthData.month_num / 3);
      const quarterKey = `${monthData.year}-Q${quarter}`;

      if (!quarterlyGroups[quarterKey]) {
        quarterlyGroups[quarterKey] = [];
      }

      quarterlyGroups[quarterKey].push(monthData.metrics);
    });

    this.quarterlyData = Object.entries(quarterlyGroups)
      .map(([quarter, metrics]) => ({
        quarter,
        metrics: this.calculateAverages(metrics),
        sample_size: metrics.length,
      }))
      .sort((a, b) => a.quarter.localeCompare(b.quarter));
  }

  /**
   * Analyze month-over-month trends
   */
  analyzeMonthlyTrends() {
    if (this.monthlyData.length < 2) {
      return { trend: 'insufficient_data', insights: [] };
    }

    const trends = {
      trend: 'stable',
      insights: [],
      forecast: {},
      strategic_recommendations: [],
    };

    const current = this.monthlyData[this.monthlyData.length - 1].metrics;
    const previous = this.monthlyData[this.monthlyData.length - 2].metrics;
    const threeMonthsAgo =
      this.monthlyData.length >= 3
        ? this.monthlyData[this.monthlyData.length - 3].metrics
        : previous;

    // Health score trend
    const healthChange = current.health_score - previous.health_score;
    const healthThreeMonthChange = current.health_score - threeMonthsAgo.health_score;

    if (healthThreeMonthChange > 5) {
      trends.trend = 'improving';
      trends.insights.push({
        metric: 'health_score',
        type: 'positive_trend',
        description: `Health score improved by ${healthThreeMonthChange} points over 3 months`,
        impact: 'positive',
      });
    } else if (healthThreeMonthChange < -5) {
      trends.trend = 'degrading';
      trends.insights.push({
        metric: 'health_score',
        type: 'negative_trend',
        description: `Health score declined by ${Math.abs(healthThreeMonthChange)} points over 3 months`,
        impact: 'negative',
      });
    }

    // Build time trend
    const buildTimeChange =
      current.build_performance.average_duration - previous.build_performance.average_duration;
    if (Math.abs(buildTimeChange) > 30000) {
      // 30 seconds
      trends.insights.push({
        metric: 'build_time',
        type: buildTimeChange > 0 ? 'increase' : 'decrease',
        description: `Build time ${buildTimeChange > 0 ? 'increased' : 'decreased'} by ${Math.round(Math.abs(buildTimeChange) / 1000)}s this month`,
        impact: buildTimeChange > 0 ? 'negative' : 'positive',
      });
    }

    // Success rate trend
    const successRateChange =
      current.build_performance.success_rate - previous.build_performance.success_rate;
    if (Math.abs(successRateChange) > 2) {
      trends.insights.push({
        metric: 'success_rate',
        type: successRateChange > 0 ? 'improvement' : 'decline',
        description: `Success rate ${successRateChange > 0 ? 'improved' : 'declined'} by ${Math.abs(successRateChange).toFixed(1)}%`,
        impact: successRateChange > 0 ? 'positive' : 'negative',
      });
    }

    // Generate simple forecasts
    const avgMonthlyHealthChange =
      this.monthlyData.length >= 3
        ? (current.health_score - this.monthlyData[0].metrics.health_score) /
          (this.monthlyData.length - 1)
        : 0;

    trends.forecast = {
      next_month_health_score: Math.max(
        0,
        Math.min(100, current.health_score + avgMonthlyHealthChange)
      ),
      next_month_build_time: current.build_performance.average_duration + buildTimeChange,
      confidence_level: this.monthlyData.length >= 3 ? 'medium' : 'low',
    };

    // Strategic recommendations
    if (trends.trend === 'degrading') {
      trends.strategic_recommendations.push({
        priority: 'high',
        category: 'performance_turnaround',
        title: 'Performance Turnaround Strategy',
        description: 'Declining performance trends require immediate strategic intervention',
        actions: [
          'Conduct comprehensive performance audit',
          'Implement performance optimization roadmap',
          'Establish stricter performance thresholds',
          'Consider architectural improvements',
        ],
        timeline: '1-3 months',
      });
    }

    if (current.build_performance.average_duration > 180000) {
      // 3 minutes
      trends.strategic_recommendations.push({
        priority: 'medium',
        category: 'build_optimization',
        title: 'Build Process Optimization',
        description: 'Build times exceed 3 minutes on average',
        actions: [
          'Implement build caching strategies',
          'Optimize dependency management',
          'Consider moving to edge functions',
          'Evaluate build tooling improvements',
        ],
        timeline: '2-4 weeks',
      });
    }

    return trends;
  }

  /**
   * Generate comprehensive monthly report
   */
  generateMonthlyReport() {
    const trends = this.analyzeMonthlyTrends();
    const currentMonth = this.monthlyData[this.monthlyData.length - 1];
    const previousMonth =
      this.monthlyData.length >= 2 ? this.monthlyData[this.monthlyData.length - 2] : null;

    const report = [];

    // Header
    report.push('# Netlify Monthly Performance Trends Report');
    report.push('');
    report.push(
      `**Report Period:** ${this.monthlyData[0]?.month || 'N/A'} - ${currentMonth?.month || 'N/A'}`
    );
    report.push(`**Generated:** ${new Date().toLocaleString()}`);
    report.push(`**Data Points:** ${this.monthlyData.length} months analyzed`);
    report.push('');

    // Executive Summary
    report.push('## Executive Summary');
    report.push('');
    const trendIcon =
      trends.trend === 'improving' ? '📈' : trends.trend === 'degrading' ? '📉' : '➡️';
    report.push(
      `**Overall Trend:** ${trendIcon} ${trends.trend.charAt(0).toUpperCase() + trends.trend.slice(1)}`
    );
    report.push(`**Current Health Score:** ${currentMonth?.metrics?.health_score || 'N/A'}/100`);
    report.push(
      `**Current Success Rate:** ${currentMonth?.metrics?.build_performance?.success_rate || 'N/A'}%`
    );
    report.push(
      `**Current Build Time:** ${Math.round((currentMonth?.metrics?.build_performance?.average_duration || 0) / 1000)}s`
    );
    report.push('');

    // Key Performance Indicators
    report.push('## Key Performance Indicators');
    report.push('');
    report.push('| Month | Health Score | Success Rate | Build Time | Functions | Errors |');
    report.push('|-------|-------------|--------------|------------|-----------|--------|');

    this.monthlyData.slice(-6).forEach(month => {
      const healthIcon =
        month.metrics.health_score >= 80 ? '✅' : month.metrics.health_score >= 60 ? '⚠️' : '❌';
      report.push(
        `| ${month.month} | ${healthIcon} ${month.metrics.health_score}/100 | ${month.metrics.build_performance.success_rate.toFixed(1)}% | ${Math.round(month.metrics.build_performance.average_duration / 1000)}s | ${month.metrics.function_trends.average_function_count} | ${month.metrics.error_analysis.total_errors} |`
      );
    });
    report.push('');

    // Trend Analysis
    report.push('## Trend Analysis');
    report.push('');
    if (trends.insights.length > 0) {
      trends.insights.forEach(insight => {
        const icon =
          insight.impact === 'positive' ? '🟢' : insight.impact === 'negative' ? '🔴' : '🟡';
        report.push(`### ${icon} ${insight.metric.replace('_', ' ').toUpperCase()}`);
        report.push(`**Type:** ${insight.type.replace('_', ' ').toUpperCase()}`);
        report.push(`**Description:** ${insight.description}`);
        report.push('');
      });
    } else {
      report.push('No significant trends detected in the current period.');
      report.push('');
    }

    // Forecast
    report.push('## Performance Forecast');
    report.push('');
    report.push(
      `**Next Month Health Score:** ${Math.round(trends.forecast.next_month_health_score)}/100`
    );
    report.push(
      `**Next Month Build Time:** ${Math.round(trends.forecast.next_month_build_time / 1000)}s`
    );
    report.push(`**Confidence Level:** ${trends.forecast.confidence_level.toUpperCase()}`);
    report.push('');

    // Strategic Recommendations
    if (trends.strategic_recommendations.length > 0) {
      report.push('## Strategic Recommendations');
      report.push('');
      trends.strategic_recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        report.push(`### ${index + 1}. ${priority} ${rec.title.toUpperCase()}`);
        report.push(`**Category:** ${rec.category.replace('_', ' ').toUpperCase()}`);
        report.push(`**Timeline:** ${rec.timeline}`);
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

    // Quarterly Comparison
    if (this.quarterlyData.length >= 2) {
      report.push('## Quarterly Comparison');
      report.push('');
      report.push('| Quarter | Health Score | Success Rate | Build Time |');
      report.push('|---------|-------------|--------------|------------|');

      this.quarterlyData.slice(-4).forEach(quarter => {
        const healthIcon =
          quarter.metrics.health_score >= 80
            ? '✅'
            : quarter.metrics.health_score >= 60
              ? '⚠️'
              : '❌';
        report.push(
          `| ${quarter.quarter} | ${healthIcon} ${quarter.metrics.health_score}/100 | ${quarter.metrics.build_performance.success_rate.toFixed(1)}% | ${Math.round(quarter.metrics.build_performance.average_duration / 1000)}s |`
        );
      });
      report.push('');
    }

    // Year-over-Year Comparison (if available)
    if (this.monthlyData.length >= 12) {
      report.push('## Year-over-Year Comparison');
      report.push('');
      const currentYear = this.monthlyData[this.monthlyData.length - 1].year;
      const previousYear = currentYear - 1;

      const currentYearData = this.monthlyData.filter(m => m.year === currentYear);
      const previousYearData = this.monthlyData.filter(m => m.year === previousYear);

      if (currentYearData.length > 0 && previousYearData.length > 0) {
        const currentAvg = this.calculateAverages(currentYearData.map(m => m.metrics));
        const previousAvg = this.calculateAverages(previousYearData.map(m => m.metrics));

        report.push(`| Metric | ${previousYear} | ${currentYear} | Change |`);
        report.push(`|--------|--------------|--------------|--------|`);
        report.push(
          `| Health Score | ${previousAvg.health_score}/100 | ${currentAvg.health_score}/100 | ${this.formatChange(currentAvg.health_score - previousAvg.health_score)} |`
        );
        report.push(
          `| Success Rate | ${previousAvg.build_performance.success_rate.toFixed(1)}% | ${currentAvg.build_performance.success_rate.toFixed(1)}% | ${this.formatChange(currentAvg.build_performance.success_rate - previousAvg.build_performance.success_rate)}% |`
        );
        report.push(
          `| Build Time | ${Math.round(previousAvg.build_performance.average_duration / 1000)}s | ${Math.round(currentAvg.build_performance.average_duration / 1000)}s | ${this.formatTimeChange(currentAvg.build_performance.average_duration - previousAvg.build_performance.average_duration)} |`
        );
        report.push('');
      }
    }

    // Recommendations
    report.push('## Recommendations for Next Month');
    report.push('');
    if (currentMonth?.metrics?.health_score < 80) {
      report.push('### 🔴 High Priority');
      report.push('- Address declining health score immediately');
      report.push('- Review and resolve recurring build failures');
      report.push('- Optimize build process to reduce build time');
      report.push('');
    }

    if (currentMonth?.metrics?.build_performance?.average_duration > 180000) {
      report.push('### 🟡 Medium Priority');
      report.push('- Implement build caching to reduce build time');
      report.push('- Review dependency management and updates');
      report.push('- Consider moving heavy operations to edge functions');
      report.push('');
    }

    report.push('### 🟢 Continuous Improvement');
    report.push('- Monitor error patterns and address root causes');
    report.push('- Regular performance reviews and optimization');
    report.push('- Keep dependencies updated and optimized');
    report.push('');

    // Appendix
    report.push('## Appendix');
    report.push('');
    report.push('### Data Quality');
    report.push(`- **Total Data Points:** ${this.monthlyData.length} months`);
    report.push(
      `- **Sample Size Range:** ${Math.min(...this.monthlyData.map(m => m.sample_size))} - ${Math.max(...this.monthlyData.map(m => m.sample_size))} builds per month`
    );
    report.push(
      `- **Data Completeness:** ${this.monthlyData.every(m => m.sample_size > 0) ? '✅ Complete' : '⚠️ Partial'}`
    );
    report.push('');

    return report.join('\n');
  }

  formatChange(change) {
    if (Math.abs(change) < 0.1) return '➡️ Stable';
    const icon = change > 0 ? '📈' : '📉';
    return `${icon} ${change > 0 ? '+' : ''}${change.toFixed(1)}`;
  }

  formatTimeChange(change) {
    if (Math.abs(change) < 5000) return '➡️ Stable';
    const icon = change < 0 ? '✅' : '⚠️';
    return `${icon} ${change < 0 ? '-' : '+'}${Math.round(Math.abs(change) / 1000)}s`;
  }

  /**
   * Save monthly report
   */
  async saveMonthlyReport() {
    await mkdir(MONTHLY_REPORTS_DIR, { recursive: true });

    const currentDate = new Date();
    const reportName = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-monthly-trends.md`;
    const reportPath = join(MONTHLY_REPORTS_DIR, reportName);

    const report = this.generateMonthlyReport();
    await writeFile(reportPath, report);

    // Also save to main reports directory
    await writeFile(join(REPORTS_DIR, 'monthly-trends.md'), report);

    console.log(`✓ Monthly trends report saved to ${reportPath}`);
    return reportPath;
  }
}

/**
 * Main execution function
 */
async function main() {
  const analyzer = new MonthlyTrendAnalyzer();

  try {
    console.log('📊 Starting monthly performance trends analysis...');

    // Load and analyze historical data
    await analyzer.loadHistoricalData();

    if (analyzer.monthlyData.length === 0) {
      console.log('ℹ️  No historical data available for trends analysis');
      process.exit(0);
    }

    // Generate and save report
    const reportPath = await analyzer.saveMonthlyReport();

    // Print summary
    console.log('\n📈 Monthly Trends Summary:');
    console.log(`   Months Analyzed: ${analyzer.monthlyData.length}`);
    console.log(
      `   Current Health Score: ${analyzer.monthlyData[analyzer.monthlyData.length - 1]?.metrics?.health_score || 'N/A'}/100`
    );
    console.log(
      `   Current Success Rate: ${analyzer.monthlyData[analyzer.monthlyData.length - 1]?.metrics?.build_performance?.success_rate?.toFixed(1) || 'N/A'}%`
    );
    console.log(
      `   Current Build Time: ${Math.round((analyzer.monthlyData[analyzer.monthlyData.length - 1]?.metrics?.build_performance?.average_duration || 0) / 1000)}s`
    );
    console.log(
      `   Strategic Recommendations: ${analyzer.analyzeMonthlyTrends().strategic_recommendations.length}`
    );
    console.log(`   Report: ${reportPath}`);
  } catch (error) {
    console.error('❌ Monthly trends analysis failed:', error.message);
    process.exit(1);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MonthlyTrendAnalyzer };
