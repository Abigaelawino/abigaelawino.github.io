#!/usr/bin/env node

/**
 * Content Health Validator
 *
 * Validates content health metrics and generates status badges
 * for monitoring content freshness across the portfolio.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CONFIG = {
  REPORTS_DIR: '.content-reports',
  FRESHNESS_REPORT: 'freshness-report.json',
  MONTHLY_TRENDS: 'monthly-trends.json',
  HEALTH_BADGE: 'content-health-badge.svg',
};

/**
 * Load content reports
 */
function loadReports() {
  const freshnessPath = join(CONFIG.REPORTS_DIR, CONFIG.FRESHNESS_REPORT);
  const trendsPath = join(CONFIG.REPORTS_DIR, CONFIG.MONTHLY_TRENDS);

  const freshnessReport = existsSync(freshnessPath)
    ? JSON.parse(readFileSync(freshnessPath, 'utf8'))
    : null;

  const trendsReport = existsSync(trendsPath) ? JSON.parse(readFileSync(trendsPath, 'utf8')) : null;

  return { freshnessReport, trendsReport };
}

/**
 * Calculate content health score
 */
function calculateHealthScore(reports) {
  const { freshnessReport, trendsReport } = reports;

  if (!freshnessReport) {
    return { score: 0, grade: 'F', status: 'No data available' };
  }

  const { summary } = freshnessReport;
  const total = summary.total;

  if (total === 0) {
    return { score: 0, grade: 'F', status: 'No content found' };
  }

  // Calculate weighted score
  let score = 0;

  // Fresh content (100% weight)
  score += (summary.fresh / total) * 100;

  // Aging content (80% weight)
  score += (summary.aging / total) * 80;

  // Stale content (40% weight)
  score += (summary.stale / total) * 40;

  // Expired content (0% weight)
  score += (summary.expired / total) * 0;

  // Bonus for zero expired content
  if (summary.expired === 0) {
    score += 5;
  }

  // Penalty for high expired content
  if (summary.expired > total * 0.1) {
    score -= 10;
  }

  // Cap score between 0-100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Determine grade
  let grade = 'F';
  let status = 'Critical';

  if (score >= 90) {
    grade = 'A+';
    status = 'Excellent';
  } else if (score >= 85) {
    grade = 'A';
    status = 'Very Good';
  } else if (score >= 80) {
    grade = 'B+';
    status = 'Good';
  } else if (score >= 70) {
    grade = 'B';
    status = 'Fair';
  } else if (score >= 60) {
    grade = 'C';
    status = 'Poor';
  } else {
    grade = 'F';
    status = 'Critical';
  }

  return { score, grade, status };
}

/**
 * Generate SVG badge
 */
function generateBadge(score, grade, status) {
  const colors = {
    'A+': '#28a745', // Green
    A: '#28a745',
    'B+': '#ffc107', // Yellow
    B: '#fd7e14', // Orange
    C: '#fd7e14',
    F: '#dc3545', // Red
  };

  const color = colors[grade] || '#6c757d';
  const text = `${grade} (${score})`;

  // Build SVG string to avoid template literal issues
  const svgParts = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">',
    '  <linearGradient id="b" x2="0" y2="100%">',
    '    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>',
    '    <stop offset="1" stop-opacity=".1"/>',
    '  </linearGradient>',
    '  <mask id="a">',
    '    <rect width="120" height="20" rx="3" fill="#fff"/>',
    '  </mask>',
    '  <g mask="url(#a)">',
    '    <rect width="60" height="20" fill="#555"/>',
    `    <rect x="60" width="60" height="20" fill="${color}"/>`,
    '    <rect width="120" height="20" fill="url(#b)"/>',
    '  </g>',
    '  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">',
    '    <text x="30" y="15" fill="#010101" fill-opacity=".3">Content</text>',
    '    <text x="30" y="14">Content</text>',
    `    <text x="90" y="15" fill="#010101" fill-opacity=".3">${text}</text>`,
    `    <text x="90" y="14">${text}</text>`,
    '  </g>',
    '</svg>',
  ];

  return svgParts.join('\n');
}

/**
 * Validate health metrics against thresholds
 */
function validateHealthMetrics(reports) {
  const { freshnessReport, trendsReport } = reports;
  const validation = {
    passed: true,
    warnings: [],
    errors: [],
    metrics: {},
  };

  if (!freshnessReport) {
    validation.passed = false;
    validation.errors.push('No freshness report available');
    return validation;
  }

  const { summary } = freshnessReport;
  const total = summary.total;

  // Check expired content
  const expiredPercentage = (summary.expired / total) * 100;
  validation.metrics.expiredContent = {
    current: expiredPercentage,
    target: 0,
    passed: summary.expired === 0,
  };

  if (summary.expired > 0) {
    validation.passed = false;
    validation.errors.push(`${summary.expired} expired content items found`);
  }

  // Check stale content
  const stalePercentage = (summary.stale / total) * 100;
  validation.metrics.staleContent = {
    current: stalePercentage,
    target: 5,
    passed: stalePercentage <= 5,
  };

  if (stalePercentage > 5) {
    validation.warnings.push(`${stalePercentage.toFixed(1)}% stale content (target: ≤5%)`);
  }

  // Check fresh content ratio
  const freshPercentage = (summary.fresh / total) * 100;
  validation.metrics.freshContent = {
    current: freshPercentage,
    target: 80,
    passed: freshPercentage >= 80,
  };

  if (freshPercentage < 80) {
    validation.warnings.push(`${freshPercentage.toFixed(1)}% fresh content (target: ≥80%)`);
  }

  // Check average age
  const averageAge = freshnessReport.trends?.averageAge || 0;
  validation.metrics.averageAge = {
    current: averageAge,
    target: 90,
    passed: averageAge <= 90,
  };

  if (averageAge > 90) {
    validation.warnings.push(`Average content age: ${averageAge} days (target: ≤90 days)`);
  }

  // Check trends if available
  if (trendsReport) {
    const trend = trendsReport.historicalAnalysis?.trends?.overall;
    validation.metrics.trend = {
      current: trend,
      target: 'stable or improving',
      passed: trend !== 'declining',
    };

    if (trend === 'declining') {
      validation.errors.push('Content freshness trend is declining');
      validation.passed = false;
    }
  }

  return validation;
}

/**
 * Generate health summary report
 */
function generateHealthSummary(reports) {
  const healthScore = calculateHealthScore(reports);
  const validation = validateHealthMetrics(reports);

  const summary = {
    timestamp: new Date().toISOString(),
    healthScore,
    validation,
    recommendations: generateHealthRecommendations(healthScore, validation),
    actionItems: generateActionItems(validation),
  };

  return summary;
}

/**
 * Generate health recommendations
 */
function generateHealthRecommendations(healthScore, validation) {
  const recommendations = [];

  if (healthScore.score < 60) {
    recommendations.push({
      priority: 'critical',
      title: 'Critical Content Health Issues',
      description: 'Content health score is critically low and requires immediate attention',
      actions: [
        'Immediately address all expired content items',
        'Implement emergency content review process',
        'Schedule daily content health checks',
        'Consider content consolidation or removal strategies',
      ],
    });
  } else if (healthScore.score < 70) {
    recommendations.push({
      priority: 'high',
      title: 'Content Health Improvement Needed',
      description: 'Content health score needs improvement to maintain quality standards',
      actions: [
        'Focus on updating stale content items',
        'Implement weekly content review schedule',
        'Prioritize content with temporal keywords',
        'Update statistics and performance metrics',
      ],
    });
  } else if (healthScore.score < 80) {
    recommendations.push({
      priority: 'medium',
      title: 'Content Health Optimization',
      description: 'Content health is good but can be optimized',
      actions: [
        'Implement proactive content refresh schedule',
        'Focus on maintaining fresh content ratio',
        'Regular link validation and updates',
        'Enhance content with recent insights',
      ],
    });
  }

  if (validation.metrics.expiredContent?.current > 0) {
    recommendations.push({
      priority: 'critical',
      title: 'Eliminate Expired Content',
      description: `${validation.metrics.expiredContent.current.toFixed(1)}% of content is expired`,
      actions: [
        'Immediate audit and update of expired content',
        'Implement automated expiration alerts',
        'Review content creation and update processes',
      ],
    });
  }

  return recommendations;
}

/**
 * Generate action items
 */
function generateActionItems(validation) {
  const actionItems = [];

  Object.entries(validation.metrics).forEach(([metric, data]) => {
    if (!data.passed) {
      let action = '';
      switch (metric) {
        case 'expiredContent':
          action = `Update or remove ${data.current} expired content items`;
          break;
        case 'staleContent':
          action = `Refresh stale content to reduce from ${data.current.toFixed(1)}% to ${data.target}%`;
          break;
        case 'freshContent':
          action = `Update content to increase fresh ratio from ${data.current.toFixed(1)}% to ${data.target}%`;
          break;
        case 'averageAge':
          action = `Update older content to reduce average age from ${data.current} to ${data.target} days`;
          break;
        case 'trend':
          action = `Reverse declining freshness trend through systematic updates`;
          break;
      }
      actionItems.push({
        metric,
        current: data.current,
        target: data.target,
        action,
        priority: metric === 'expiredContent' || metric === 'trend' ? 'critical' : 'high',
      });
    }
  });

  return actionItems;
}

/**
 * Save health validation results
 */
function saveHealthValidation(healthSummary, badgeSvg) {
  const reportsDir = CONFIG.REPORTS_DIR;
  const summaryPath = join(reportsDir, 'content-health-summary.json');
  const badgePath = join(reportsDir, CONFIG.HEALTH_BADGE);

  try {
    // Save health summary
    writeFileSync(summaryPath, JSON.stringify(healthSummary, null, 2));
    console.log('Content health summary saved to: ' + summaryPath);

    // Save badge
    writeFileSync(badgePath, badgeSvg);
    console.log('Content health badge saved to: ' + badgePath);

    return { summaryPath, badgePath };
  } catch (error) {
    console.error('Error saving health validation:', error.message);
    return null;
  }
}

/**
 * Main execution function
 */
function main() {
  console.log('🏥 Validating content health metrics...\n');

  try {
    const reports = loadReports();

    if (!reports.freshnessReport) {
      console.log('❌ No freshness report found for health validation');
      process.exit(1);
    }

    // Generate health summary
    const healthSummary = generateHealthSummary(reports);

    // Generate badge
    const badgeSvg = generateBadge(
      healthSummary.healthScore.score,
      healthSummary.healthScore.grade,
      healthSummary.healthScore.status
    );

    // Display results
    console.log('📊 Content Health Validation Results:');
    console.log(
      '   Health Score: ' +
        healthSummary.healthScore.score +
        '/100 (' +
        healthSummary.healthScore.grade +
        ')'
    );
    console.log('   Status: ' + healthSummary.healthScore.status);
    console.log('   Validation Passed: ' + (healthSummary.validation.passed ? '✅' : '❌'));
    console.log('   Warnings: ' + healthSummary.validation.warnings.length);
    console.log('   Errors: ' + healthSummary.validation.errors.length);

    if (healthSummary.validation.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      healthSummary.validation.warnings.forEach(warning => {
        console.log('   - ' + warning);
      });
    }

    if (healthSummary.validation.errors.length > 0) {
      console.log('\n❌ Errors:');
      healthSummary.validation.errors.forEach(error => {
        console.log('   - ' + error);
      });
    }

    // Save results
    const result = saveHealthValidation(healthSummary, badgeSvg);

    if (result) {
      console.log('\n✅ Content health validation completed successfully');
      console.log('📄 Summary: ' + result.summaryPath);
      console.log('🏷️ Badge: ' + result.badgePath);
    } else {
      console.error('\n❌ Failed to save health validation results');
      process.exit(1);
    }

    // Exit with error code if validation failed
    if (!healthSummary.validation.passed) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error during content health validation:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === 'file://' + process.argv[1]) {
  main();
}
