#!/usr/bin/env node

/**
 * Netlify Function Health Monitor
 *
 * Comprehensive monitoring system for all Netlify functions.
 * Tracks execution times, error rates, cold starts, and performance degradation.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

const REPORTS_DIR = '.netlify-function-reports';
const HEALTH_DATA_FILE = join(REPORTS_DIR, 'function-health-data.json');
const ALERTS_FILE = join(REPORTS_DIR, 'function-alerts.json');
const FUNCTION_LIST = [
  'deployment-monitoring',
  'session-manager',
  'asset-optimization',
  'build-webhook',
  'rate-limiter',
  'form-validator',
  'issue-verification',
];

// Health thresholds
const THRESHOLDS = {
  executionTime: {
    warning: 3000, // 3 seconds
    critical: 5000, // 5 seconds
  },
  errorRate: {
    warning: 0.05, // 5%
    critical: 0.1, // 10%
  },
  coldStartRate: {
    warning: 0.2, // 20%
    critical: 0.3, // 30%
  },
  availability: {
    warning: 0.95, // 95%
    critical: 0.9, // 90%
  },
};

/**
 * Netlify Function Health Monitor
 */
class FunctionHealthMonitor {
  constructor() {
    this.healthData = {};
    this.alerts = [];
    this.startTime = Date.now();
  }

  /**
   * Initialize health monitoring
   */
  async initialize() {
    console.log('🔍 Initializing Netlify Function Health Monitor...');

    // Ensure reports directory exists
    await mkdir(REPORTS_DIR, { recursive: true });

    // Load previous health data
    await this.loadHealthData();

    // Load previous alerts
    await this.loadAlerts();

    console.log(`📊 Monitoring ${FUNCTION_LIST.length} functions: ${FUNCTION_LIST.join(', ')}`);
  }

  /**
   * Load previous health data
   */
  async loadHealthData() {
    try {
      const data = await readFile(HEALTH_DATA_FILE, 'utf8');
      this.healthData = JSON.parse(data);
      console.log('📈 Loaded historical health data');
    } catch (error) {
      this.healthData = {};
      console.log('📝 No previous health data found, starting fresh');
    }
  }

  /**
   * Load previous alerts
   */
  async loadAlerts() {
    try {
      const data = await readFile(ALERTS_FILE, 'utf8');
      this.alerts = JSON.parse(data);
      // Clean old alerts (older than 24 hours)
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
      console.log('🚨 Loaded previous alerts');
    } catch (error) {
      this.alerts = [];
      console.log('📝 No previous alerts found, starting fresh');
    }
  }

  /**
   * Check health of all functions
   */
  async checkAllFunctions() {
    console.log('\n🏥 Checking function health...');

    const results = {};

    for (const functionName of FUNCTION_LIST) {
      console.log(`\n📋 Checking ${functionName}...`);
      results[functionName] = await this.checkFunctionHealth(functionName);
    }

    return results;
  }

  /**
   * Check health of a specific function
   */
  async checkFunctionHealth(functionName) {
    const health = {
      name: functionName,
      timestamp: new Date().toISOString(),
      status: 'healthy',
      metrics: {
        executionTime: null,
        errorRate: 0,
        coldStartRate: 0,
        availability: 1,
        lastExecution: null,
        totalExecutions: 0,
        errors: 0,
        coldStarts: 0,
      },
      issues: [],
      recommendations: [],
    };

    try {
      // Simulate function health check (in production, this would call actual monitoring endpoints)
      const simulatedMetrics = await this.simulateFunctionMetrics(functionName);
      Object.assign(health.metrics, simulatedMetrics);

      // Analyze metrics against thresholds
      this.analyzeHealthMetrics(health);

      // Get historical data
      const historical = this.healthData[functionName];
      if (historical) {
        health.trends = this.analyzeTrends(functionName, health.metrics, historical);
      }
    } catch (error) {
      health.status = 'error';
      health.issues.push({
        type: 'health_check_failed',
        message: `Health check failed: ${error.message}`,
        severity: 'critical',
      });
    }

    return health;
  }

  /**
   * Simulate function metrics (replace with actual monitoring in production)
   */
  async simulateFunctionMetrics(functionName) {
    // In production, this would:
    // 1. Query Netlify function logs
    // 2. Check function execution times
    // 3. Monitor error rates
    // 4. Track cold start frequency

    const baseMetrics = {
      'deployment-monitoring': { execTime: 800, errorRate: 0.02, coldStartRate: 0.15 },
      'session-manager': { execTime: 200, errorRate: 0.01, coldStartRate: 0.1 },
      'asset-optimization': { execTime: 1500, errorRate: 0.03, coldStartRate: 0.25 },
      'build-webhook': { execTime: 600, errorRate: 0.05, coldStartRate: 0.2 },
      'rate-limiter': { execTime: 100, errorRate: 0.01, coldStartRate: 0.08 },
      'form-validator': { execTime: 300, errorRate: 0.02, coldStartRate: 0.12 },
      'issue-verification': { execTime: 400, errorRate: 0.04, coldStartRate: 0.18 },
    };

    const metrics = baseMetrics[functionName] || {
      execTime: 500,
      errorRate: 0.02,
      coldStartRate: 0.15,
    };

    // Add some variance to simulate real conditions
    const variance = 0.2;
    const execTime = Math.round(metrics.execTime * (1 + (Math.random() - 0.5) * variance));
    const errorRate = Math.max(0, metrics.errorRate * (1 + (Math.random() - 0.5) * variance));
    const coldStartRate = Math.max(
      0,
      Math.min(1, metrics.coldStartRate * (1 + (Math.random() - 0.5) * variance))
    );

    return {
      executionTime: execTime,
      errorRate: errorRate,
      coldStartRate: coldStartRate,
      availability: 1 - errorRate,
      lastExecution: new Date(Date.now() - Math.random() * 300000).toISOString(), // Last 5 minutes
      totalExecutions: Math.floor(Math.random() * 1000) + 100,
      errors: Math.floor(errorRate * 100),
      coldStarts: Math.floor(coldStartRate * 50),
    };
  }

  /**
   * Analyze health metrics against thresholds
   */
  analyzeHealthMetrics(health) {
    const { metrics } = health;

    // Execution time analysis
    if (metrics.executionTime > THRESHOLDS.executionTime.critical) {
      health.status = 'critical';
      health.issues.push({
        type: 'slow_execution',
        message: `Execution time ${metrics.executionTime}ms exceeds critical threshold (${THRESHOLDS.executionTime.critical}ms)`,
        severity: 'critical',
      });
      health.recommendations.push('Optimize function code or increase memory allocation');
    } else if (metrics.executionTime > THRESHOLDS.executionTime.warning) {
      if (health.status === 'healthy') health.status = 'warning';
      health.issues.push({
        type: 'slow_execution',
        message: `Execution time ${metrics.executionTime}ms exceeds warning threshold (${THRESHOLDS.executionTime.warning}ms)`,
        severity: 'warning',
      });
      health.recommendations.push('Monitor execution times and consider optimization');
    }

    // Error rate analysis
    if (metrics.errorRate > THRESHOLDS.errorRate.critical) {
      health.status = 'critical';
      health.issues.push({
        type: 'high_error_rate',
        message: `Error rate ${(metrics.errorRate * 100).toFixed(2)}% exceeds critical threshold (${(THRESHOLDS.errorRate.critical * 100).toFixed(2)}%)`,
        severity: 'critical',
      });
      health.recommendations.push('Immediate investigation required - check function logs');
    } else if (metrics.errorRate > THRESHOLDS.errorRate.warning) {
      if (health.status === 'healthy') health.status = 'warning';
      health.issues.push({
        type: 'high_error_rate',
        message: `Error rate ${(metrics.errorRate * 100).toFixed(2)}% exceeds warning threshold (${(THRESHOLDS.errorRate.warning * 100).toFixed(2)}%)`,
        severity: 'warning',
      });
      health.recommendations.push('Monitor error patterns and implement better error handling');
    }

    // Cold start rate analysis
    if (metrics.coldStartRate > THRESHOLDS.coldStartRate.critical) {
      if (health.status === 'healthy') health.status = 'warning';
      health.issues.push({
        type: 'high_cold_start_rate',
        message: `Cold start rate ${(metrics.coldStartRate * 100).toFixed(2)}% exceeds critical threshold (${(THRESHOLDS.coldStartRate.critical * 100).toFixed(2)}%)`,
        severity: 'warning',
      });
      health.recommendations.push('Consider function warming strategies or increase allocation');
    } else if (metrics.coldStartRate > THRESHOLDS.coldStartRate.warning) {
      health.recommendations.push('Monitor cold start patterns');
    }

    // Availability analysis
    if (metrics.availability < THRESHOLDS.availability.critical) {
      health.status = 'critical';
      health.issues.push({
        type: 'low_availability',
        message: `Availability ${(metrics.availability * 100).toFixed(2)}% below critical threshold (${(THRESHOLDS.availability.critical * 100).toFixed(2)}%)`,
        severity: 'critical',
      });
      health.recommendations.push('Service availability critical - immediate action required');
    } else if (metrics.availability < THRESHOLDS.availability.warning) {
      if (health.status === 'healthy') health.status = 'warning';
      health.issues.push({
        type: 'low_availability',
        message: `Availability ${(metrics.availability * 100).toFixed(2)}% below warning threshold (${(THRESHOLDS.availability.warning * 100).toFixed(2)}%)`,
        severity: 'warning',
      });
      health.recommendations.push('Monitor availability trends and investigate root cause');
    }
  }

  /**
   * Analyze trends over time
   */
  analyzeTrends(functionName, currentMetrics, historical) {
    const trends = {
      executionTime: 'stable',
      errorRate: 'stable',
      coldStartRate: 'stable',
      availability: 'stable',
    };

    if (historical.metrics && historical.metrics.length > 0) {
      const recent = historical.metrics.slice(-5); // Last 5 measurements
      const avgExecTime = recent.reduce((sum, m) => sum + m.executionTime, 0) / recent.length;
      const avgErrorRate = recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length;
      const avgColdStartRate = recent.reduce((sum, m) => sum + m.coldStartRate, 0) / recent.length;
      const avgAvailability = recent.reduce((sum, m) => sum + m.availability, 0) / recent.length;

      // Determine trends
      const changeThreshold = 0.15; // 15% change threshold

      if (currentMetrics.executionTime > avgExecTime * (1 + changeThreshold)) {
        trends.executionTime = 'degrading';
      } else if (currentMetrics.executionTime < avgExecTime * (1 - changeThreshold)) {
        trends.executionTime = 'improving';
      }

      if (currentMetrics.errorRate > avgErrorRate * (1 + changeThreshold)) {
        trends.errorRate = 'degrading';
      } else if (currentMetrics.errorRate < avgErrorRate * (1 - changeThreshold)) {
        trends.errorRate = 'improving';
      }

      if (currentMetrics.coldStartRate > avgColdStartRate * (1 + changeThreshold)) {
        trends.coldStartRate = 'degrading';
      } else if (currentMetrics.coldStartRate < avgColdStartRate * (1 - changeThreshold)) {
        trends.coldStartRate = 'improving';
      }

      if (currentMetrics.availability < avgAvailability * (1 - changeThreshold)) {
        trends.availability = 'degrading';
      } else if (currentMetrics.availability > avgAvailability * (1 - changeThreshold)) {
        trends.availability = 'improving';
      }
    }

    return trends;
  }

  /**
   * Generate alerts for critical issues
   */
  generateAlerts(healthResults) {
    const newAlerts = [];

    for (const [functionName, health] of Object.entries(healthResults)) {
      if (health.status === 'critical') {
        const alert = {
          id: `alert_${Date.now()}_${functionName}`,
          functionName,
          timestamp: Date.now(),
          severity: 'critical',
          message: `Critical health issues detected in ${functionName}`,
          issues: health.issues.filter(issue => issue.severity === 'critical'),
          recommendations: health.recommendations,
        };

        newAlerts.push(alert);
        this.alerts.push(alert);
      }
    }

    return newAlerts;
  }

  /**
   * Save health data
   */
  async saveHealthData(healthResults) {
    for (const [functionName, health] of Object.entries(healthResults)) {
      if (!this.healthData[functionName]) {
        this.healthData[functionName] = {
          name: functionName,
          metrics: [],
          alerts: [],
        };
      }

      this.healthData[functionName].metrics.push({
        timestamp: health.timestamp,
        ...health.metrics,
      });

      // Keep only last 100 measurements per function
      if (this.healthData[functionName].metrics.length > 100) {
        this.healthData[functionName].metrics = this.healthData[functionName].metrics.slice(-100);
      }
    }

    await writeFile(HEALTH_DATA_FILE, JSON.stringify(this.healthData, null, 2));
    await writeFile(ALERTS_FILE, JSON.stringify(this.alerts, null, 2));

    console.log('💾 Saved health data and alerts');
  }

  /**
   * Generate comprehensive health report
   */
  generateHealthReport(healthResults, newAlerts) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFunctions: FUNCTION_LIST.length,
        healthy: 0,
        warning: 0,
        critical: 0,
        newAlerts: newAlerts.length,
      },
      functions: healthResults,
      alerts: newAlerts,
      recommendations: this.generateGlobalRecommendations(healthResults),
      trends: this.analyzeGlobalTrends(healthResults),
    };

    // Calculate summary
    for (const health of Object.values(healthResults)) {
      report.summary[health.status]++;
    }

    return report;
  }

  /**
   * Generate global recommendations
   */
  generateGlobalRecommendations(healthResults) {
    const recommendations = [];
    const issues = [];

    // Collect all issues
    for (const health of Object.values(healthResults)) {
      issues.push(...health.issues);
    }

    // Analyze common patterns
    const slowFunctions = issues.filter(i => i.type === 'slow_execution').length;
    const errorProneFunctions = issues.filter(i => i.type === 'high_error_rate').length;
    const coldStartIssues = issues.filter(i => i.type === 'high_cold_start_rate').length;

    if (slowFunctions > 0) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        message: `${slowFunctions} functions showing slow execution times - consider code optimization`,
      });
    }

    if (errorProneFunctions > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'reliability',
        message: `${errorProneFunctions} functions with high error rates - immediate investigation required`,
      });
    }

    if (coldStartIssues > 2) {
      recommendations.push({
        priority: 'medium',
        category: 'optimization',
        message:
          'Multiple functions experiencing cold starts - consider function warming strategies',
      });
    }

    return recommendations;
  }

  /**
   * Analyze global trends
   */
  analyzeGlobalTrends(healthResults) {
    const trends = {
      overall: 'stable',
      performance: 'stable',
      reliability: 'stable',
      efficiency: 'stable',
    };

    const statuses = Object.values(healthResults).map(h => h.status);
    const criticalCount = statuses.filter(s => s === 'critical').length;
    const warningCount = statuses.filter(s => s === 'warning').length;

    if (criticalCount > 0) {
      trends.overall = 'critical';
    } else if (warningCount > 2) {
      trends.overall = 'degrading';
    } else if (warningCount > 0) {
      trends.overall = 'warning';
    }

    return trends;
  }

  /**
   * Save health report
   */
  async saveHealthReport(report) {
    const reportFile = join(REPORTS_DIR, `function-health-report-${Date.now()}.json`);
    await writeFile(reportFile, JSON.stringify(report, null, 2));

    const latestReportFile = join(REPORTS_DIR, 'latest-function-health-report.json');
    await writeFile(latestReportFile, JSON.stringify(report, null, 2));

    console.log(`📋 Health report saved: ${reportFile}`);
    return reportFile;
  }

  /**
   * Run complete health monitoring cycle
   */
  async runHealthCheck() {
    try {
      await this.initialize();

      const healthResults = await this.checkAllFunctions();
      const newAlerts = this.generateAlerts(healthResults);
      const report = this.generateHealthReport(healthResults, newAlerts);

      await this.saveHealthData(healthResults);
      const reportFile = await this.saveHealthReport(report);

      this.displayResults(report);

      return {
        success: true,
        reportFile,
        summary: report.summary,
        alerts: newAlerts,
      };
    } catch (error) {
      console.error('❌ Health monitoring failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Display monitoring results
   */
  displayResults(report) {
    console.log('\n' + '='.repeat(80));
    console.log('🏥 NETLIFY FUNCTION HEALTH REPORT');
    console.log('='.repeat(80));
    console.log(
      `📊 Summary: ${report.summary.healthy} healthy, ${report.summary.warning} warning, ${report.summary.critical} critical`
    );
    console.log(`🚨 New Alerts: ${report.summary.newAlerts}`);
    console.log(`📈 Overall Trend: ${report.trends.overall.toUpperCase()}`);

    console.log('\n📋 Function Status:');
    for (const [name, health] of Object.entries(report.functions)) {
      const status = health.status === 'healthy' ? '✅' : health.status === 'warning' ? '⚠️' : '❌';
      const execTime = health.metrics.executionTime ? `${health.metrics.executionTime}ms` : 'N/A';
      const errorRate = `${(health.metrics.errorRate * 100).toFixed(2)}%`;
      const availability = `${(health.metrics.availability * 100).toFixed(2)}%`;

      console.log(
        `  ${status} ${name}: ${execTime} | ${errorRate} errors | ${availability} available`
      );

      if (health.issues.length > 0) {
        health.issues.forEach(issue => {
          console.log(`    ⚠️  ${issue.message}`);
        });
      }
    }

    if (report.alerts.length > 0) {
      console.log('\n🚨 Critical Alerts:');
      report.alerts.forEach(alert => {
        console.log(`  ${alert.functionName}: ${alert.message}`);
        alert.issues.forEach(issue => {
          console.log(`    - ${issue.message}`);
        });
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        const priority = rec.priority === 'critical' ? '🔴' : rec.priority === 'high' ? '🟠' : '🟡';
        console.log(`  ${priority} [${rec.category.toUpperCase()}] ${rec.message}`);
      });
    }

    console.log('\n' + '='.repeat(80));
  }
}

// Main execution
async function main() {
  const monitor = new FunctionHealthMonitor();
  const result = await monitor.runHealthCheck();

  if (result.success) {
    console.log('\n✅ Function health monitoring completed successfully');
    console.log(`📄 Report saved to: ${result.reportFile}`);

    // Exit with appropriate code for CI/CD
    if (result.summary.critical > 0) {
      process.exit(1); // Critical issues detected
    } else if (result.summary.warning > 0) {
      process.exit(2); // Warnings detected
    } else {
      process.exit(0); // All healthy
    }
  } else {
    console.error('\n❌ Function health monitoring failed');
    console.error(`Error: ${result.error}`);
    process.exit(3);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { FunctionHealthMonitor };
