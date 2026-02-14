#!/usr/bin/env node

/**
 * Netlify Log Analyzer
 *
 * Fetches and analyzes Netlify build logs to track performance metrics,
 * identify error patterns, and monitor function performance.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { createHash } from 'crypto';

const REPORTS_DIR = '.netlify-reports';
const ANALYSIS_FILE = join(REPORTS_DIR, 'log-analysis.json');
const TRENDS_FILE = join(REPORTS_DIR, 'performance-trends.json');

/**
 * Execute Netlify CLI command with timeout
 */
async function executeNetlifyCommand(command, timeout = 30000) {
  try {
    const result = execSync(`netlify ${command}`, {
      encoding: 'utf8',
      timeout,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    };
  }
}

/**
 * Fetch recent build logs from Netlify
 */
async function fetchBuildLogs(limit = 50) {
  console.log(`📊 Fetching last ${limit} Netlify builds...`);

  // Get site info
  const siteResult = await executeNetlifyCommand('sites:list --json');
  if (!siteResult.success) {
    throw new Error(`Failed to fetch site info: ${siteResult.error}`);
  }

  const sites = JSON.parse(siteResult.data);
  const site = sites[0]; // Assume first site

  // Get build logs
  const logsResult = await executeNetlifyCommand(
    `builds:list --site-id=${site.site_id} --limit=${limit}`
  );
  if (!logsResult.success) {
    throw new Error(`Failed to fetch build logs: ${logsResult.error}`);
  }

  const builds = JSON.parse(logsResult.data);
  console.log(`✓ Retrieved ${builds.length} build records`);

  return builds.map(build => ({
    id: build.id,
    state: build.state,
    created_at: build.created_at,
    updated_at: build.updated_at,
    started_at: build.started_at,
    completed_at: build.completed_at,
    duration: build.duration,
    deploy_url: build.deploy_url,
    branch: build.branch,
    commit_ref: build.commit_ref,
    commit_message: build.commit_message,
    error_message: build.error_message,
    buildbot_version: build.buildbot_version,
    edge_functions: build.edge_functions,
    functions: build.functions,
    netlify_build_version: build.netlify_build_version,
    runtime: build.runtime,
  }));
}

/**
 * Parse build log entries for detailed analysis
 */
function parseBuildLogEntry(build) {
  const analysis = {
    build_id: build.id,
    timestamp: new Date(build.created_at).toISOString(),
    state: build.state,
    duration: build.duration || 0,
    branch: build.branch || 'main',
    success: build.state === 'ready',
    error_type: null,
    error_pattern: null,
    performance_issues: [],
    function_metrics: {
      count: 0,
      total_size: 0,
      cold_start_issues: 0,
    },
    build_metrics: {
      npm_install_time: 0,
      next_build_time: 0,
      static_generation_time: 0,
    },
  };

  // Analyze errors
  if (build.error_message) {
    analysis.error_type = categorizeError(build.error_message);
    analysis.error_pattern = extractErrorPattern(build.error_message);
  }

  // Analyze performance issues
  if (build.duration > 300000) {
    // 5 minutes
    analysis.performance_issues.push({
      type: 'slow_build',
      severity: 'high',
      description: `Build took ${Math.round(build.duration / 1000)}s (exceeds 5min threshold)`,
      recommendation: 'Consider optimizing build process or caching dependencies',
    });
  } else if (build.duration > 180000) {
    // 3 minutes
    analysis.performance_issues.push({
      type: 'moderate_build',
      severity: 'medium',
      description: `Build took ${Math.round(build.duration / 1000)}s (exceeds 3min threshold)`,
      recommendation: 'Monitor build times and consider optimization',
    });
  }

  // Analyze function metrics
  if (build.functions) {
    analysis.function_metrics.count = Object.keys(build.functions).length;
    analysis.function_metrics.total_size = Object.values(build.functions).reduce(
      (total, fn) => total + (fn.size || 0),
      0
    );
  }

  if (build.edge_functions) {
    analysis.function_metrics.count += Object.keys(build.edge_functions).length;
  }

  return analysis;
}

/**
 * Categorize error types for pattern analysis
 */
function categorizeError(errorMessage) {
  const message = errorMessage.toLowerCase();

  if (
    message.includes('dependency') ||
    message.includes('npm install') ||
    message.includes('package')
  ) {
    return 'dependency_issue';
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout';
  }
  if (message.includes('memory') || message.includes('out of memory')) {
    return 'memory_issue';
  }
  if (message.includes('type') || message.includes('typescript') || message.includes('syntax')) {
    return 'code_error';
  }
  if (message.includes('permission') || message.includes('access denied')) {
    return 'permission_issue';
  }
  if (message.includes('next') && message.includes('build')) {
    return 'nextjs_build_error';
  }

  return 'other';
}

/**
 * Extract error patterns for recurring issue detection
 */
function extractErrorPattern(errorMessage) {
  // Remove specific details like file paths, line numbers, and unique identifiers
  const pattern = errorMessage
    .replace(/\/[^\s]+/g, '/path/to/file') // Replace file paths
    .replace(/\d+/g, 'N') // Replace numbers
    .replace(/[a-f0-9]{8,}/gi, 'HASH') // Replace commit hashes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  return createHash('md5').update(pattern).digest('hex').substring(0, 16);
}

/**
 * Analyze performance trends across multiple builds
 */
function analyzeTrends(buildAnalyses) {
  const trends = {
    period: {
      start: buildAnalyses[0]?.timestamp || new Date().toISOString(),
      end: buildAnalyses[buildAnalyses.length - 1]?.timestamp || new Date().toISOString(),
      total_builds: buildAnalyses.length,
    },
    build_performance: {
      average_duration: 0,
      min_duration: Infinity,
      max_duration: 0,
      success_rate: 0,
      failure_rate: 0,
    },
    error_analysis: {
      total_errors: 0,
      error_types: {},
      recurring_patterns: {},
      most_common_errors: [],
    },
    function_trends: {
      average_function_count: 0,
      function_growth_trend: 'stable',
      total_function_size: 0,
    },
    performance_recommendations: [],
    health_score: 0,
  };

  if (buildAnalyses.length === 0) return trends;

  // Calculate build performance metrics
  const durations = buildAnalyses.map(b => b.duration).filter(d => d > 0);
  const successfulBuilds = buildAnalyses.filter(b => b.success);

  trends.build_performance.average_duration =
    durations.reduce((a, b) => a + b, 0) / durations.length;
  trends.build_performance.min_duration = Math.min(...durations);
  trends.build_performance.max_duration = Math.max(...durations);
  trends.build_performance.success_rate = (successfulBuilds.length / buildAnalyses.length) * 100;
  trends.build_performance.failure_rate = 100 - trends.build_performance.success_rate;

  // Analyze errors
  const failedBuilds = buildAnalyses.filter(b => !b.success);
  trends.error_analysis.total_errors = failedBuilds.length;

  failedBuilds.forEach(build => {
    if (build.error_type) {
      trends.error_analysis.error_types[build.error_type] =
        (trends.error_analysis.error_types[build.error_type] || 0) + 1;
    }
    if (build.error_pattern) {
      trends.error_analysis.recurring_patterns[build.error_pattern] =
        (trends.error_analysis.recurring_patterns[build.error_pattern] || 0) + 1;
    }
  });

  // Find most common errors
  trends.error_analysis.most_common_errors = Object.entries(trends.error_analysis.error_types)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  // Analyze function trends
  const functionCounts = buildAnalyses.map(b => b.function_metrics.count);
  trends.function_trends.average_function_count =
    functionCounts.reduce((a, b) => a + b, 0) / functionCounts.length;

  if (functionCounts.length > 1) {
    const recent =
      functionCounts.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, functionCounts.length);
    const older =
      functionCounts.slice(0, -5).reduce((a, b) => a + b, 0) /
      Math.max(1, functionCounts.length - 5);

    if (recent > older * 1.1) {
      trends.function_trends.function_growth_trend = 'increasing';
    } else if (recent < older * 0.9) {
      trends.function_trends.function_growth_trend = 'decreasing';
    }
  }

  trends.function_trends.total_function_size = buildAnalyses.reduce(
    (total, b) => total + b.function_metrics.total_size,
    0
  );

  // Generate performance recommendations
  if (trends.build_performance.average_duration > 180000) {
    // 3 minutes
    trends.performance_recommendations.push({
      priority: 'high',
      category: 'build_performance',
      issue: 'Average build time exceeds 3 minutes',
      recommendation:
        'Implement build caching, optimize dependencies, or consider moving heavy operations to functions',
    });
  }

  if (trends.build_performance.success_rate < 90) {
    trends.performance_recommendations.push({
      priority: 'high',
      category: 'reliability',
      issue: `Success rate is ${trends.build_performance.success_rate.toFixed(1)}% (below 90%)`,
      recommendation: 'Investigate recurring build failures and implement better error handling',
    });
  }

  const recurringPatterns = Object.entries(trends.error_analysis.recurring_patterns).filter(
    ([, count]) => count > 2
  );

  if (recurringPatterns.length > 0) {
    trends.performance_recommendations.push({
      priority: 'medium',
      category: 'error_patterns',
      issue: `${recurringPatterns.length} recurring error patterns detected`,
      recommendation: 'Address root causes of recurring errors to improve build reliability',
    });
  }

  // Calculate health score (0-100)
  let healthScore = 100;
  healthScore -= (100 - trends.build_performance.success_rate) * 0.5;
  healthScore -= Math.max(0, (trends.build_performance.average_duration - 120000) / 60000) * 10; // Penalty for builds over 2 minutes
  healthScore -= Math.min(30, recurringPatterns.length * 5); // Penalty for recurring errors
  trends.health_score = Math.max(0, Math.round(healthScore));

  return trends;
}

/**
 * Save analysis results to files
 */
async function saveResults(analyses, trends) {
  await mkdir(REPORTS_DIR, { recursive: true });

  // Save detailed analysis
  await writeFile(
    ANALYSIS_FILE,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        total_builds: analyses.length,
        analyses: analyses,
      },
      null,
      2
    )
  );

  // Save trends data
  await writeFile(
    TRENDS_FILE,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        trends: trends,
      },
      null,
      2
    )
  );
}

/**
 * Generate human-readable report
 */
function generateReport(analyses, trends) {
  const report = [];

  report.push('# Netlify Performance Analysis Report');
  report.push('');
  report.push(`**Generated:** ${new Date().toLocaleString()}`);
  report.push(
    `**Period:** ${new Date(trends.period.start).toLocaleDateString()} - ${new Date(trends.period.end).toLocaleDateString()}`
  );
  report.push(`**Total Builds Analyzed:** ${trends.period.total_builds}`);
  report.push('');

  // Executive Summary
  report.push('## Executive Summary');
  report.push('');
  report.push(
    `**Health Score:** ${trends.health_score}/100 ${trends.health_score >= 80 ? '✅' : trends.health_score >= 60 ? '⚠️' : '❌'}`
  );
  report.push(`**Success Rate:** ${trends.build_performance.success_rate.toFixed(1)}%`);
  report.push(
    `**Average Build Time:** ${Math.round(trends.build_performance.average_duration / 1000)}s`
  );
  report.push(`**Function Count:** ${Math.round(trends.function_trends.average_function_count)}`);
  report.push('');

  // Build Performance
  report.push('## Build Performance');
  report.push('');
  report.push(
    `- **Success Rate:** ${trends.build_performance.success_rate.toFixed(1)}% (${trends.build_performance.success_rate >= 95 ? '✅' : '⚠️'})`
  );
  report.push(
    `- **Average Duration:** ${Math.round(trends.build_performance.average_duration / 1000)}s`
  );
  report.push(`- **Min Duration:** ${Math.round(trends.build_performance.min_duration / 1000)}s`);
  report.push(`- **Max Duration:** ${Math.round(trends.build_performance.max_duration / 1000)}s`);
  report.push('');

  // Error Analysis
  if (trends.error_analysis.total_errors > 0) {
    report.push('## Error Analysis');
    report.push('');
    report.push(`**Total Failures:** ${trends.error_analysis.total_errors}`);
    report.push('');

    if (Object.keys(trends.error_analysis.error_types).length > 0) {
      report.push('### Error Types:');
      Object.entries(trends.error_analysis.error_types)
        .sort(([, a], [, b]) => b - a)
        .forEach(([type, count]) => {
          report.push(`- ${type}: ${count} occurrences`);
        });
      report.push('');
    }

    if (Object.keys(trends.error_analysis.recurring_patterns).length > 0) {
      report.push('### Recurring Error Patterns:');
      Object.entries(trends.error_analysis.recurring_patterns)
        .filter(([, count]) => count > 1)
        .sort(([, a], [, b]) => b - a)
        .forEach(([pattern, count]) => {
          report.push(`- Pattern ${pattern}: ${count} occurrences`);
        });
      report.push('');
    }
  }

  // Recommendations
  if (trends.performance_recommendations.length > 0) {
    report.push('## Performance Recommendations');
    report.push('');

    trends.performance_recommendations.forEach((rec, index) => {
      const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      report.push(`### ${index + 1}. ${priority} ${rec.category.replace('_', ' ').toUpperCase()}`);
      report.push(`**Issue:** ${rec.issue}`);
      report.push(`**Recommendation:** ${rec.recommendation}`);
      report.push('');
    });
  }

  return report.join('\n');
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting Netlify log analysis...');

    // Fetch build logs
    const builds = await fetchBuildLogs(50);

    // Analyze each build
    const analyses = builds.map(parseBuildLogEntry);
    console.log(`✓ Analyzed ${analyses.length} build entries`);

    // Analyze trends
    const trends = analyzeTrends(analyses);
    console.log(`✓ Generated performance trends (Health Score: ${trends.health_score}/100)`);

    // Save results
    await saveResults(analyses, trends);
    console.log(`✓ Saved analysis results to .netlify-reports/`);

    // Generate and save human-readable report
    const report = generateReport(analyses, trends);
    await writeFile(join(REPORTS_DIR, 'performance-report.md'), report);
    console.log(`✓ Generated human-readable report`);

    // Print summary
    console.log('\n📊 Analysis Summary:');
    console.log(`   Health Score: ${trends.health_score}/100`);
    console.log(`   Success Rate: ${trends.build_performance.success_rate.toFixed(1)}%`);
    console.log(
      `   Avg Build Time: ${Math.round(trends.build_performance.average_duration / 1000)}s`
    );
    console.log(`   Total Failures: ${trends.error_analysis.total_errors}`);
    console.log(`   Recommendations: ${trends.performance_recommendations.length}`);

    if (trends.health_score < 80) {
      console.log('\n⚠️  Health score below 80% - review recommendations');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  fetchBuildLogs,
  parseBuildLogEntry,
  analyzeTrends,
  generateReport,
  categorizeError,
  extractErrorPattern,
};
