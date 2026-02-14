#!/usr/bin/env node

/**
 * Netlify Monitoring Dashboard
 *
 * Creates an interactive HTML dashboard for visualizing Netlify performance data,
 * trends, and optimization opportunities.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const REPORTS_DIR = '.netlify-reports';

/**
 * Dashboard Generator
 */
class MonitoringDashboard {
  constructor() {
    this.data = {
      current_metrics: null,
      trends: null,
      optimization_opportunities: [],
      monthly_trends: null,
      recent_builds: [],
    };
  }

  /**
   * Load all monitoring data
   */
  async loadData() {
    try {
      // Load current metrics and trends
      try {
        const trendsData = await readFile(join(REPORTS_DIR, 'performance-trends.json'), 'utf8');
        const trendsObj = JSON.parse(trendsData);
        this.data.trends = trendsObj.trends;
      } catch (error) {
        console.warn('⚠️  Could not load trends data');
      }

      // Load optimization opportunities
      try {
        const optimizationData = await readFile(
          join(REPORTS_DIR, 'optimization-analysis.json'),
          'utf8'
        );
        const optimizationObj = JSON.parse(optimizationData);
        this.data.optimization_opportunities = optimizationObj.opportunities || [];
      } catch (error) {
        console.warn('⚠️  Could not load optimization data');
      }

      // Load monthly trends
      try {
        const monthlyData = await readFile(join(REPORTS_DIR, 'metrics-history.json'), 'utf8');
        const monthlyObj = JSON.parse(monthlyData);
        this.data.monthly_trends = monthlyObj.slice(-12); // Last 12 months
      } catch (error) {
        console.warn('⚠️  Could not load monthly trends data');
      }

      // Load recent builds
      try {
        const analysisData = await readFile(join(REPORTS_DIR, 'detailed-analysis.json'), 'utf8');
        const analysisObj = JSON.parse(analysisData);
        this.data.recent_builds = (analysisObj.analyses || []).slice(-10); // Last 10 builds
        this.data.current_metrics = analysisObj.current_metrics || this.data.trends;
      } catch (error) {
        console.warn('⚠️  Could not load recent builds data');
      }

      console.log('✓ Loaded monitoring data for dashboard');
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error.message);
    }
  }

  /**
   * Generate HTML dashboard
   */
  generateDashboardHTML() {
    const currentMetrics = this.data.current_metrics || this.data.trends;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Netlify Performance Monitoring Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .dashboard-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            color: #333;
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .header .subtitle {
            color: #666;
            font-size: 1.1rem;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .metric-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .metric-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }

        .metric-card h3 {
            color: #333;
            font-size: 1rem;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .metric-value {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .metric-change {
            font-size: 0.9rem;
            padding: 4px 8px;
            border-radius: 20px;
            display: inline-block;
        }

        .metric-change.positive {
            background: #10b981;
            color: white;
        }

        .metric-change.negative {
            background: #ef4444;
            color: white;
        }

        .metric-change.neutral {
            background: #6b7280;
            color: white;
        }

        .health-excellent { color: #10b981; }
        .health-good { color: #f59e0b; }
        .health-poor { color: #ef4444; }

        .charts-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .chart-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .chart-card h3 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.3rem;
        }

        .chart-container {
            position: relative;
            height: 300px;
        }

        .opportunities-section {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
        }

        .opportunities-section h3 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5rem;
        }

        .opportunity-grid {
            display: grid;
            gap: 15px;
        }

        .opportunity-card {
            border-left: 4px solid;
            padding: 15px 20px;
            background: #f9fafb;
            border-radius: 8px;
            transition: transform 0.2s ease;
        }

        .opportunity-card:hover {
            transform: translateX(5px);
        }

        .opportunity-card.high {
            border-left-color: #ef4444;
        }

        .opportunity-card.medium {
            border-left-color: #f59e0b;
        }

        .opportunity-card.low {
            border-left-color: #10b981;
        }

        .opportunity-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }

        .opportunity-description {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 10px;
        }

        .opportunity-meta {
            display: flex;
            gap: 15px;
            font-size: 0.8rem;
            color: #999;
        }

        .builds-section {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .builds-section h3 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5rem;
        }

        .builds-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .build-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid;
        }

        .build-item.success {
            border-left-color: #10b981;
        }

        .build-item.failed {
            border-left-color: #ef4444;
        }

        .build-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .build-status {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }

        .build-status.success {
            background: #10b981;
        }

        .build-status.failed {
            background: #ef4444;
        }

        .build-details {
            color: #666;
            font-size: 0.9rem;
        }

        .build-time {
            color: #333;
            font-weight: bold;
        }

        .no-data {
            text-align: center;
            color: #666;
            padding: 40px;
            font-style: italic;
        }

        .last-updated {
            text-align: center;
            color: rgba(255, 255, 255, 0.8);
            margin-top: 30px;
            font-size: 0.9rem;
        }

        @media (max-width: 768px) {
            .charts-section {
                grid-template-columns: 1fr;
            }

            .metrics-grid {
                grid-template-columns: 1fr;
            }

            .header h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <div class="header">
            <h1>🚀 Netlify Performance Dashboard</h1>
            <div class="subtitle">Real-time monitoring and optimization insights</div>
        </div>

        ${currentMetrics ? this.generateMetricsSection(currentMetrics) : '<div class="no-data">No metrics data available</div>'}

        <div class="charts-section">
            ${this.generateBuildTimeChart()}
            ${this.generateSuccessRateChart()}
        </div>

        ${this.data.optimization_opportunities.length > 0 ? this.generateOpportunitiesSection() : ''}

        ${this.data.recent_builds.length > 0 ? this.generateRecentBuildsSection() : ''}

        <div class="last-updated">
            Last updated: ${new Date().toLocaleString()}
        </div>
    </div>

    <script>
        // Initialize charts
        document.addEventListener('DOMContentLoaded', function() {
            ${this.generateChartScripts()}
        });
    </script>
</body>
</html>`;
  }

  /**
   * Generate metrics cards section
   */
  generateMetricsSection(metrics) {
    const healthScore = metrics.health_score || 0;
    const successRate = metrics.build_performance?.success_rate || 0;
    const avgBuildTime = metrics.build_performance?.average_duration || 0;
    const totalErrors = metrics.error_analysis?.total_errors || 0;
    const functionCount = metrics.function_trends?.average_function_count || 0;
    const recommendations = metrics.performance_recommendations?.length || 0;

    return `
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Health Score</h3>
                <div class="metric-value ${healthScore >= 80 ? 'health-excellent' : healthScore >= 60 ? 'health-good' : 'health-poor'}">
                    ${healthScore}/100
                </div>
                <span class="metric-change ${healthScore >= 80 ? 'positive' : healthScore >= 60 ? 'neutral' : 'negative'}">
                    ${healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Attention'}
                </span>
            </div>

            <div class="metric-card">
                <h3>Success Rate</h3>
                <div class="metric-value ${successRate >= 95 ? 'health-excellent' : successRate >= 90 ? 'health-good' : 'health-poor'}">
                    ${successRate.toFixed(1)}%
                </div>
                <span class="metric-change ${successRate >= 95 ? 'positive' : successRate >= 90 ? 'neutral' : 'negative'}">
                    ${successRate >= 95 ? 'Excellent' : successRate >= 90 ? 'Good' : 'Needs Improvement'}
                </span>
            </div>

            <div class="metric-card">
                <h3>Avg Build Time</h3>
                <div class="metric-value ${avgBuildTime <= 120000 ? 'health-excellent' : avgBuildTime <= 180000 ? 'health-good' : 'health-poor'}">
                    ${Math.round(avgBuildTime / 1000)}s
                </div>
                <span class="metric-change ${avgBuildTime <= 120000 ? 'positive' : avgBuildTime <= 180000 ? 'neutral' : 'negative'}">
                    ${avgBuildTime <= 120000 ? 'Fast' : avgBuildTime <= 180000 ? 'Moderate' : 'Slow'}
                </span>
            </div>

            <div class="metric-card">
                <h3>Build Errors</h3>
                <div class="metric-value ${totalErrors === 0 ? 'health-excellent' : totalErrors <= 2 ? 'health-good' : 'health-poor'}">
                    ${totalErrors}
                </div>
                <span class="metric-change ${totalErrors === 0 ? 'positive' : totalErrors <= 2 ? 'neutral' : 'negative'}">
                    ${totalErrors === 0 ? 'No Errors' : totalErrors <= 2 ? 'Few Errors' : 'Many Errors'}
                </span>
            </div>

            <div class="metric-card">
                <h3>Functions</h3>
                <div class="metric-value">${functionCount}</div>
                <span class="metric-change neutral">Total Functions</span>
            </div>

            <div class="metric-card">
                <h3>Recommendations</h3>
                <div class="metric-value">${recommendations}</div>
                <span class="metric-change ${recommendations === 0 ? 'positive' : recommendations <= 3 ? 'neutral' : 'negative'}">
                    ${recommendations === 0 ? 'All Good' : recommendations <= 3 ? 'Some Actions' : 'Action Needed'}
                </span>
            </div>
        </div>`;
  }

  /**
   * Generate build time chart
   */
  generateBuildTimeChart() {
    const monthlyData = this.data.monthly_trends || [];

    return `
        <div class="chart-card">
            <h3>📊 Build Time Trends</h3>
            <div class="chart-container">
                <canvas id="buildTimeChart"></canvas>
            </div>
        </div>`;
  }

  /**
   * Generate success rate chart
   */
  generateSuccessRateChart() {
    return `
        <div class="chart-card">
            <h3>📈 Success Rate Trends</h3>
            <div class="chart-container">
                <canvas id="successRateChart"></canvas>
            </div>
        </div>`;
  }

  /**
   * Generate opportunities section
   */
  generateOpportunitiesSection() {
    const opportunities = this.data.optimization_opportunities.slice(0, 5); // Show top 5

    return `
        <div class="opportunities-section">
            <h3>🎯 Optimization Opportunities</h3>
            <div class="opportunity-grid">
                ${opportunities
                  .map(
                    opp => `
                    <div class="opportunity-card ${opp.priority}">
                        <div class="opportunity-title">${opp.title}</div>
                        <div class="opportunity-description">${opp.description}</div>
                        <div class="opportunity-meta">
                            <span>Priority: ${opp.priority.toUpperCase()}</span>
                            <span>Effort: ${opp.implementation_effort.toUpperCase()}</span>
                            <span>Category: ${opp.category.replace('_', ' ')}</span>
                        </div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>`;
  }

  /**
   * Generate recent builds section
   */
  generateRecentBuildsSection() {
    const builds = this.data.recent_builds.slice(0, 10); // Show last 10 builds

    return `
        <div class="builds-section">
            <h3>🔨 Recent Builds</h3>
            <div class="builds-list">
                ${builds
                  .map(
                    build => `
                    <div class="build-item ${build.success ? 'success' : 'failed'}">
                        <div class="build-info">
                            <div class="build-status ${build.success ? 'success' : 'failed'}"></div>
                            <div>
                                <div>${new Date(build.timestamp).toLocaleDateString()} - ${build.branch || 'main'}</div>
                                <div class="build-details">${build.build_id}</div>
                            </div>
                        </div>
                        <div class="build-time">${Math.round(build.duration / 1000)}s</div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>`;
  }

  /**
   * Generate Chart.js scripts
   */
  generateChartScripts() {
    const monthlyData = this.data.monthly_trends || [];

    if (monthlyData.length === 0) return '';

    const labels = monthlyData.map(entry => {
      const date = new Date(entry.timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    const buildTimes = monthlyData.map(entry =>
      Math.round((entry.metrics?.build_performance?.average_duration || 0) / 1000)
    );

    const successRates = monthlyData.map(
      entry => entry.metrics?.build_performance?.success_rate || 0
    );

    const healthScores = monthlyData.map(entry => entry.metrics?.health_score || 0);

    return `
        // Build Time Chart
        const buildTimeCtx = document.getElementById('buildTimeChart').getContext('2d');
        new Chart(buildTimeCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(labels)},
                datasets: [{
                    label: 'Build Time (seconds)',
                    data: ${JSON.stringify(buildTimes)},
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Build Time (seconds)'
                        }
                    }
                }
            }
        });

        // Success Rate Chart
        const successRateCtx = document.getElementById('successRateChart').getContext('2d');
        new Chart(successRateCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(labels)},
                datasets: [
                    {
                        label: 'Success Rate (%)',
                        data: ${JSON.stringify(successRates)},
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Health Score',
                        data: ${JSON.stringify(healthScores)},
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Percentage'
                        }
                    }
                }
            }
        });`;
  }

  /**
   * Generate complete dashboard
   */
  async generateDashboard() {
    try {
      console.log('📊 Generating Netlify monitoring dashboard...');

      // Load data
      await this.loadData();

      // Generate HTML
      const html = this.generateDashboardHTML();

      // Save dashboard
      const dashboardPath = join(REPORTS_DIR, 'dashboard.html');
      await writeFile(dashboardPath, html);

      console.log(`✓ Dashboard generated: ${dashboardPath}`);
      console.log(`📈 Open ${dashboardPath} in your browser to view the dashboard`);

      return dashboardPath;
    } catch (error) {
      console.error('❌ Dashboard generation failed:', error.message);
      throw error;
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  const dashboard = new MonitoringDashboard();

  try {
    await dashboard.generateDashboard();
    console.log('\n🎯 Dashboard Features:');
    console.log('   • Real-time performance metrics');
    console.log('   • Interactive charts and trends');
    console.log('   • Optimization opportunities');
    console.log('   • Recent build history');
    console.log('   • Mobile-responsive design');
  } catch (error) {
    console.error('❌ Dashboard creation failed:', error.message);
    process.exit(1);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MonitoringDashboard };
