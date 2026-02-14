#!/usr/bin/env node

/**
 * Content Quarterly Schedule Generator
 *
 * Generates a quarterly content update schedule to help plan and track
 * content maintenance activities across the portfolio.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CONFIG = {
  REPORTS_DIR: '.content-reports',
  FRESHNESS_REPORT: 'freshness-report.json',
  RECOMMENDATIONS_REPORT: 'content-recommendations.json',
  QUARTERLY_SCHEDULE: 'quarterly-schedule.json',
  QUARTERLY_MD: 'quarterly-schedule.md',
};

/**
 * Load content reports
 */
function loadReports() {
  const freshnessPath = join(CONFIG.REPORTS_DIR, CONFIG.FRESHNESS_REPORT);
  const recommendationsPath = join(CONFIG.REPORTS_DIR, CONFIG.RECOMMENDATIONS_REPORT);

  if (!existsSync(freshnessPath)) {
    console.log('No freshness report found, skipping schedule generation');
    return null;
  }

  const freshnessReport = JSON.parse(readFileSync(freshnessPath, 'utf8'));
  const recommendationsReport = existsSync(recommendationsPath)
    ? JSON.parse(readFileSync(recommendationsPath, 'utf8'))
    : null;

  return { freshnessReport, recommendationsReport };
}

/**
 * Generate quarterly schedule
 */
function generateQuarterlySchedule(reports) {
  const { freshnessReport, recommendationsReport } = reports;
  const now = new Date();
  const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
  const currentYear = now.getFullYear();

  // Calculate quarter dates
  const quarterMonths = {
    1: { start: 0, end: 2, name: 'Q1' }, // Jan-Mar
    2: { start: 3, end: 5, name: 'Q2' }, // Apr-Jun
    3: { start: 6, end: 8, name: 'Q3' }, // Jul-Sep
    4: { start: 9, end: 11, name: 'Q4' }, // Oct-Dec
  };

  const quarterInfo = quarterMonths[currentQuarter];
  const quarterStart = new Date(currentYear, quarterInfo.start, 1);
  const quarterEnd = new Date(currentYear, quarterInfo.end + 1, 0); // Last day of quarter

  // Group content by priority and content type
  const contentByPriority = {
    critical: freshnessReport.content.filter(item => !item.error && item.status === 'EXPIRED'),
    high: freshnessReport.content.filter(item => !item.error && item.status === 'STALE'),
    medium: freshnessReport.content.filter(item => !item.error && item.status === 'AGING'),
    routine: freshnessReport.content.filter(item => !item.error && item.status === 'FRESH'),
  };

  // Create quarterly schedule
  const schedule = {
    metadata: {
      generated: now.toISOString(),
      quarter: quarterInfo.name,
      year: currentYear,
      startDate: quarterStart.toISOString(),
      endDate: quarterEnd.toISOString(),
      totalItems: freshnessReport.summary.total,
    },
    monthlySchedule: {
      month1: generateMonthlySchedule(contentByPriority, 1, recommendationsReport),
      month2: generateMonthlySchedule(contentByPriority, 2, recommendationsReport),
      month3: generateMonthlySchedule(contentByPriority, 3, recommendationsReport),
    },
    quarterlyGoals: generateQuarterlyGoals(contentByPriority, freshnessReport),
    contentMaintenancePlan: generateMaintenancePlan(contentByPriority),
    trackingMetrics: {
      targets: {
        expiredContent: 0,
        staleContent: Math.max(1, Math.floor(contentByPriority.routine.length * 0.05)),
        freshContentRatio: 80, // percentage
      },
      current: {
        expiredContent: contentByPriority.critical.length,
        staleContent: contentByPriority.high.length,
        freshContentRatio: (contentByPriority.routine.length / freshnessReport.summary.total) * 100,
      },
    },
  };

  return schedule;
}

/**
 * Generate monthly schedule
 */
function generateMonthlySchedule(contentByPriority, monthNumber, recommendationsReport) {
  const monthGoals = {
    1: {
      // First month: focus on critical items
      critical: contentByPriority.critical.length,
      high: Math.ceil(contentByPriority.high.length * 0.5),
      medium: 0,
      routine: Math.ceil(contentByPriority.routine.length * 0.1),
    },
    2: {
      // Second month: continue high priority, start medium
      critical: 0,
      high: Math.ceil(contentByPriority.high.length * 0.5),
      medium: Math.ceil(contentByPriority.medium.length * 0.5),
      routine: Math.ceil(contentByPriority.routine.length * 0.1),
    },
    3: {
      // Third month: finish medium, routine maintenance
      critical: 0,
      high: 0,
      medium: Math.ceil(contentByPriority.medium.length * 0.5),
      routine: Math.ceil(contentByPriority.routine.length * 0.1),
    },
  };

  const goals = monthGoals[monthNumber];
  const scheduledItems = [];

  // Schedule critical items first
  contentByPriority.critical.slice(0, goals.critical).forEach(item => {
    scheduledItems.push(createScheduleItem(item, 'critical', recommendationsReport));
  });

  // Schedule high priority items
  contentByPriority.high.slice(0, goals.high).forEach(item => {
    scheduledItems.push(createScheduleItem(item, 'high', recommendationsReport));
  });

  // Schedule medium priority items
  contentByPriority.medium.slice(0, goals.medium).forEach(item => {
    scheduledItems.push(createScheduleItem(item, 'medium', recommendationsReport));
  });

  // Schedule routine items
  contentByPriority.routine.slice(0, goals.routine).forEach(item => {
    scheduledItems.push(createScheduleItem(item, 'routine', recommendationsReport));
  });

  return {
    monthName: getMonthName(monthNumber, new Date().getMonth()),
    goals,
    scheduledItems,
    estimatedEffort: calculateMonthlyEffort(scheduledItems),
  };
}

/**
 * Create schedule item
 */
function createScheduleItem(item, priority, recommendationsReport) {
  const recommendations =
    recommendationsReport?.contentUpdates?.find(update => update.filePath === item.filePath)
      ?.recommendations || [];

  return {
    title: item.title,
    filePath: item.filePath,
    contentType: item.contentType,
    currentStatus: item.status,
    priority,
    daysOld: item.daysOld,
    topRecommendation: recommendations[0]?.title || 'General content refresh',
    estimatedEffort: estimateItemEffort(item, recommendations),
    tags: item.tags || [],
  };
}

/**
 * Estimate effort for content item
 */
function estimateItemEffort(item, recommendations) {
  const baseEffort = {
    blog: { low: 30, medium: 60, high: 120 },
    projects: { low: 45, medium: 90, high: 180 },
  };

  const contentTypeEffort = baseEffort[item.contentType] || baseEffort.blog;

  // Determine effort level based on status and recommendations
  let effortLevel = 'medium';
  if (item.status === 'EXPIRED' || recommendations.some(rec => rec.priority === 'critical')) {
    effortLevel = 'high';
  } else if (item.status === 'FRESH' && recommendations.length === 0) {
    effortLevel = 'low';
  }

  return contentTypeEffort[effortLevel];
}

/**
 * Calculate monthly effort
 */
function calculateMonthlyEffort(scheduledItems) {
  const totalMinutes = scheduledItems.reduce((sum, item) => sum + item.estimatedEffort, 0);
  return {
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    dailyTarget: Math.round(totalMinutes / 22), // Assuming 22 working days
  };
}

/**
 * Generate quarterly goals
 */
function generateQuarterlyGoals(contentByPriority, freshnessReport) {
  return {
    contentHealth: {
      target: 'Zero expired content, minimal stale content',
      currentExpired: contentByPriority.critical.length,
      currentStale: contentByPriority.high.length,
      targetFreshRatio: 80,
      currentFreshRatio: (contentByPriority.routine.length / freshnessReport.summary.total) * 100,
    },
    maintenanceDiscipline: {
      target: 'Establish regular content review rhythm',
      milestones: [
        'Week 1-2: Address all critical content',
        'Week 3-6: Complete high-priority updates',
        'Week 7-10: Handle medium-priority items',
        'Week 11-12: Routine maintenance and review',
      ],
    },
    qualityImprovement: {
      target: 'Improve content quality and relevance',
      focusAreas: [
        'Update temporal references and statistics',
        'Refresh visual assets and screenshots',
        'Validate all external links and resources',
        'Enhance content with recent insights',
      ],
    },
  };
}

/**
 * Generate maintenance plan
 */
function generateMaintenancePlan(contentByPriority) {
  return {
    weeklyCadence: {
      monday: "Plan week's content updates",
      wednesday: 'Progress check on content updates',
      friday: 'Review completed updates and plan next week',
    },
    qualityChecklist: [
      'Validate all statistics and metrics',
      'Check external links and references',
      'Update temporal language',
      'Enhance content with new insights',
      'Review formatting and accessibility',
    ],
    toolsAndResources: [
      'Content freshness monitoring reports',
      'Update recommendations and templates',
      'Bulk operation scripts',
      'Link validation tools',
      'Industry trend resources',
    ],
    successMetrics: [
      'Zero expired content by quarter end',
      'Stale content under 5% of total',
      'Fresh content ratio above 80%',
      'Content health score above 85/100',
    ],
  };
}

/**
 * Get month name
 */
function getMonthName(monthNumber, currentMonth) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const targetMonth = (currentMonth + monthNumber - 1) % 12;
  return months[targetMonth];
}

/**
 * Save quarterly schedule
 */
function saveQuarterlySchedule(schedule) {
  const reportsDir = CONFIG.REPORTS_DIR;
  const jsonPath = join(reportsDir, CONFIG.QUARTERLY_SCHEDULE);
  const markdownPath = join(reportsDir, CONFIG.QUARTERLY_MD);

  try {
    // Save JSON schedule
    writeFileSync(jsonPath, JSON.stringify(schedule, null, 2));
    console.log(`Quarterly schedule saved to: ${jsonPath}`);

    // Generate markdown version
    generateMarkdownSchedule(schedule, markdownPath);

    return { jsonPath, markdownPath };
  } catch (error) {
    console.error('Error saving quarterly schedule:', error.message);
    return null;
  }
}

/**
 * Generate markdown schedule
 */
function generateMarkdownSchedule(schedule, outputPath) {
  const { metadata, monthlySchedule, quarterlyGoals, trackingMetrics } = schedule;

  let markdown =
    '# Content Maintenance Schedule\n\n' +
    '**Quarter:** ' +
    metadata.quarter +
    ' ' +
    metadata.year +
    '  \n' +
    '**Generated:** ' +
    new Date(metadata.generated).toLocaleDateString() +
    '  \n' +
    '**Period:** ' +
    new Date(metadata.startDate).toLocaleDateString() +
    ' - ' +
    new Date(metadata.endDate).toLocaleDateString() +
    '\n\n' +
    '## Executive Summary\n\n' +
    '- **Total Content Items:** ' +
    metadata.totalItems +
    '\n' +
    '- **Current Expired Content:** ' +
    trackingMetrics.current.expiredContent +
    '\n' +
    '- **Target Expired Content:** ' +
    trackingMetrics.targets.expiredContent +
    '\n' +
    '- **Current Fresh Content Ratio:** ' +
    trackingMetrics.current.freshContentRatio.toFixed(1) +
    '%\n' +
    '- **Target Fresh Content Ratio:** ' +
    trackingMetrics.targets.freshContentRatio +
    '%\n\n' +
    '## Quarterly Goals\n\n' +
    '### Content Health Goals\n' +
    '- **Achieve zero expired content** by quarter end\n' +
    '- **Maintain stale content under 5%** of total content\n' +
    '- **Keep fresh content ratio above 80%**\n' +
    '- **Improve overall content health score** to 85/100+\n\n' +
    '### Maintenance Discipline\n';

  // Add milestones
  if (quarterlyGoals.maintenanceDiscipline && quarterlyGoals.maintenanceDiscipline.milestones) {
    markdown +=
      '\n' +
      quarterlyGoals.maintenanceDiscipline.milestones
        .map(milestone => '- ' + milestone)
        .join('\n') +
      '\n';
  }

  markdown += '\n### Quality Improvement Focus Areas\n';
  if (quarterlyGoals.qualityImprovement && quarterlyGoals.qualityImprovement.focusAreas) {
    markdown +=
      '\n' +
      quarterlyGoals.qualityImprovement.focusAreas.map(area => '- ' + area).join('\n') +
      '\n';
  }

  markdown += '\n## Monthly Schedule\n\n';

  // Add monthly schedules
  ['month1', 'month2', 'month3'].forEach((monthKey, index) => {
    const month = monthlySchedule[monthKey];
    const monthNumber = index + 1;

    if (month && month.monthName) {
      markdown +=
        '### Month ' +
        monthNumber +
        ': ' +
        month.monthName +
        '\n\n' +
        '**Goals:**\n' +
        '- Critical items: ' +
        month.goals.critical +
        '\n' +
        '- High priority: ' +
        month.goals.high +
        '\n' +
        '- Medium priority: ' +
        month.goals.medium +
        '\n' +
        '- Routine maintenance: ' +
        month.goals.routine +
        '\n\n' +
        '**Estimated Effort:** ' +
        month.estimatedEffort.totalHours +
        ' hours (' +
        month.estimatedEffort.dailyTarget +
        ' minutes/day)\n\n' +
        '**Key Items:**\n';

      if (month.scheduledItems && month.scheduledItems.length > 0) {
        markdown +=
          month.scheduledItems
            .slice(0, 5)
            .map(
              item =>
                '- **' +
                item.title +
                '** (' +
                item.priority +
                ' priority, ' +
                item.estimatedEffort +
                'min)'
            )
            .join('\n') + '\n\n';
      }
    }
  });

  markdown += '\n## Maintenance Workflow\n\n' + '### Weekly Cadence\n';

  if (quarterlyGoals.maintenanceDiscipline && quarterlyGoals.maintenanceDiscipline.weeklyCadence) {
    markdown +=
      '\n' +
      quarterlyGoals.maintenanceDiscipline.weeklyCadence
        .map((task, index) => ['Monday', 'Wednesday', 'Friday'][index] + ': ' + task)
        .join('\n') +
      '\n';
  }

  markdown += '\n### Quality Checklist\n';
  if (quarterlyGoals.qualityImprovement && quarterlyGoals.qualityImprovement.qualityChecklist) {
    markdown +=
      '\n' +
      quarterlyGoals.qualityImprovement.qualityChecklist.map(check => '- [ ] ' + check).join('\n') +
      '\n';
  }

  markdown += '\n### Success Metrics\n';
  if (quarterlyGoals.qualityImprovement && quarterlyGoals.qualityImprovement.successMetrics) {
    markdown +=
      '\n' +
      quarterlyGoals.qualityImprovement.successMetrics.map(metric => '- ' + metric).join('\n') +
      '\n';
  }

  markdown +=
    '\n## Tracking Progress\n\n' +
    'This schedule should be reviewed weekly and updated as content is completed.\n\n' +
    '**Next Review Date:** ' +
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() +
    '\n\n' +
    '---\n\n' +
    '*Schedule generated automatically based on content freshness analysis and update recommendations*\n';

  writeFileSync(outputPath, markdown);
  console.log(`Quarterly schedule markdown saved to: ${outputPath}`);
}

/**
 * Main execution function
 */
function main() {
  console.log('📅 Generating quarterly content maintenance schedule...\n');

  try {
    const reports = loadReports();

    if (!reports) {
      console.log('No reports available, skipping schedule generation');
      return;
    }

    const schedule = generateQuarterlySchedule(reports);

    // Display summary
    console.log('📊 Quarterly Schedule Summary:');
    console.log(`   Quarter: ${schedule.metadata.quarter} ${schedule.metadata.year}`);
    console.log(`   Total items: ${schedule.metadata.totalItems}`);
    console.log(`   Critical items: ${schedule.trackingMetrics.current.expiredContent}`);
    console.log(
      `   High priority: ${schedule.monthlySchedule.month1.goals.high + schedule.monthlySchedule.month2.goals.high}`
    );

    // Save schedule
    const result = saveQuarterlySchedule(schedule);

    if (result) {
      console.log('\n✅ Quarterly content maintenance schedule generated successfully');
      console.log(`📄 Schedule: ${result.jsonPath}`);
      console.log(`📋 Summary: ${result.markdownPath}`);
    } else {
      console.error('\n❌ Failed to save quarterly schedule');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error generating quarterly schedule:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateQuarterlySchedule, generateMonthlySchedule, generateQuarterlyGoals };
