#!/usr/bin/env node

/**
 * Content Update Recommendations Generator
 *
 * Generates specific, actionable recommendations for updating and refreshing
 * content across the portfolio, with prioritized action items and detailed
 * guidance for content maintenance.
 *
 * Features:
 * - Prioritized content update recommendations
 * - Specific action items for each content piece
 * - Content-specific update templates
 * - Bulk update operations
 * - Content performance improvement suggestions
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);

// Configuration
const CONFIG = {
  REPORTS_DIR: '.content-reports',
  FRESHNESS_REPORT: 'freshness-report.json',
  RECOMMENDATIONS_FILE: 'content-recommendations.json',
  RECOMMENDATIONS_MD: 'content-recommendations.md',

  // Content update templates
  UPDATE_TEMPLATES: {
    blog: {
      outdatedStats: {
        trigger: ['statistics', 'metrics', 'numbers', 'percentages'],
        template: 'Update current statistics and performance metrics with latest data',
        actions: [
          'Review all numerical data for accuracy',
          'Add recent performance metrics if available',
          'Update any dated benchmarks or comparisons',
          'Include any new industry standards or baselines',
        ],
      },
      technologyUpdates: {
        trigger: ['version', 'release', 'latest', 'current'],
        template: 'Update technology references and version numbers',
        actions: [
          'Check for newer versions of mentioned technologies',
          'Update version numbers and compatibility notes',
          'Add recent breaking changes or deprecations',
          'Include new features or improvements',
        ],
      },
      linkValidation: {
        trigger: ['http://', 'https://', 'link', 'reference'],
        template: 'Validate and update external links and references',
        actions: [
          'Check all external links for accessibility',
          'Update broken or moved resources',
          'Add newer or more relevant references',
          'Remove outdated or irrelevant links',
        ],
      },
    },
    projects: {
      outcomesUpdate: {
        trigger: ['results', 'outcome', 'impact', 'success'],
        template: 'Update project outcomes and business impact',
        actions: [
          'Add recent project achievements or milestones',
          'Update business impact metrics',
          'Include lessons learned or insights',
          'Add any follow-up projects or developments',
        ],
      },
      technologyStack: {
        trigger: ['tech stack', 'technologies', 'tools'],
        template: 'Update technology stack and implementation details',
        actions: [
          'Review current technology usage',
          'Update any deprecated technologies',
          'Add new tools or methodologies adopted',
          'Include performance improvements or optimizations',
        ],
      },
      visualAssets: {
        trigger: ['screenshot', 'image', 'diagram', 'chart'],
        template: 'Refresh visual assets and documentation',
        actions: [
          'Update screenshots with current UI',
          'Refresh diagrams with latest architecture',
          'Add new visualizations or charts',
          'Ensure all images are high-quality and relevant',
        ],
      },
    },
  },
};

/**
 * Load freshness report
 */
function loadFreshnessReport() {
  const reportPath = join(PROJECT_ROOT, CONFIG.REPORTS_DIR, CONFIG.FRESHNESS_REPORT);

  if (!existsSync(reportPath)) {
    console.error('Freshness report not found. Run content freshness monitor first.');
    process.exit(1);
  }

  try {
    const data = readFileSync(reportPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading freshness report:', error.message);
    process.exit(1);
  }
}

/**
 * Analyze content for specific update opportunities
 */
function analyzeContentForUpdates(contentItem) {
  const { filePath, title, content: contentText, contentType, daysOld, status, tags } = contentItem;

  const recommendations = [];
  const templates = CONFIG.UPDATE_TEMPLATES[contentType] || CONFIG.UPDATE_TEMPLATES.blog;

  // Read the actual content file for detailed analysis
  try {
    const fullContent = readFileSync(filePath, 'utf8');

    // Check each template category
    Object.entries(templates).forEach(([category, template]) => {
      const triggers = template.trigger;
      const hasTriggers = triggers.some(
        trigger =>
          fullContent.toLowerCase().includes(trigger.toLowerCase()) ||
          title.toLowerCase().includes(trigger.toLowerCase())
      );

      if (hasTriggers) {
        recommendations.push({
          category,
          priority: determinePriority(category, status, daysOld),
          title: template.template,
          actions: template.actions,
          rationale: `Content contains ${triggers.join(', ')} which may be outdated`,
          estimatedEffort: estimateEffort(category, contentType),
        });
      }
    });

    // Add time-sensitive recommendations
    if (daysOld > 180) {
      recommendations.push({
        category: 'comprehensive_refresh',
        priority: 'high',
        title: 'Comprehensive Content Refresh',
        actions: [
          'Review entire content for outdated information',
          'Update all statistics, links, and references',
          'Add new sections or insights based on recent experience',
          'Consider expanding with additional examples or case studies',
          'Validate all technical details and code examples',
        ],
        rationale: `Content is ${daysOld} days old and needs comprehensive review`,
        estimatedEffort: 'high',
      });
    }

    // Add seasonal/trending recommendations
    if (tags && tags.length > 0) {
      const trendingTags = identifyTrendingTags(tags);
      if (trendingTags.length > 0) {
        recommendations.push({
          category: 'trending_update',
          priority: 'medium',
          title: 'Align with Current Trends',
          actions: [
            `Update content to reflect recent developments in: ${trendingTags.join(', ')}`,
            'Add new industry trends or emerging technologies',
            'Include recent best practices or methodologies',
            'Reference recent community discussions or developments',
          ],
          rationale: `Tags include currently trending topics: ${trendingTags.join(', ')}`,
          estimatedEffort: 'medium',
        });
      }
    }
  } catch (error) {
    console.warn(`Could not analyze content for ${filePath}:`, error.message);
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Determine priority of recommendation
 */
function determinePriority(category, status, daysOld) {
  // Critical status gets highest priority
  if (status === 'EXPIRED') return 'critical';
  if (status === 'STALE') return 'high';

  // Category-based priorities
  const categoryPriorities = {
    outdatedStats: 'high',
    technologyUpdates: 'medium',
    linkValidation: 'medium',
    outcomesUpdate: 'high',
    technologyStack: 'medium',
    visualAssets: 'low',
    comprehensive_refresh: 'critical',
    trending_update: 'low',
  };

  return categoryPriorities[category] || 'medium';
}

/**
 * Estimate effort required for update
 */
function estimateEffort(category, contentType) {
  const effortMap = {
    linkValidation: 'low',
    technologyUpdates: 'medium',
    outdatedStats: 'medium',
    visualAssets: 'high',
    outcomesUpdate: 'high',
    technologyStack: 'medium',
    comprehensive_refresh: 'high',
    trending_update: 'medium',
  };

  return effortMap[category] || 'medium';
}

/**
 * Identify trending tags based on current tech landscape
 */
function identifyTrendingTags(tags) {
  const trendingTopics = [
    'ai',
    'machine learning',
    'llm',
    'gpt',
    'chatgpt',
    'openai',
    'nextjs',
    'react 18',
    'typescript 5',
    'tailwind css',
    'docker',
    'kubernetes',
    'serverless',
    'edge computing',
    'web3',
    'blockchain',
    'defi',
    'nft',
    'metaverse',
    'python 3.12',
    'node 20',
    'deno',
    'bun',
    'shadcn',
    'radix',
    'framer',
    'remix',
  ];

  return tags.filter(tag =>
    trendingTopics.some(
      trending =>
        tag.toLowerCase().includes(trending.toLowerCase()) ||
        trending.toLowerCase().includes(tag.toLowerCase())
    )
  );
}

/**
 * Generate update templates for different content types
 */
function generateUpdateTemplates(contentItem, recommendations) {
  const { contentType, title, filePath } = contentItem;

  const templates = recommendations.map(rec => ({
    templateName: rec.category,
    title: `Update: ${title}`,
    filePath,
    contentType,
    priority: rec.priority,
    description: rec.title,
    checklist: rec.actions,
    estimatedTime:
      rec.estimatedEffort === 'low'
        ? '30-60 minutes'
        : rec.estimatedEffort === 'medium'
          ? '1-2 hours'
          : '2-4 hours',
  }));

  return templates;
}

/**
 * Generate bulk update operations
 */
function generateBulkOperations(allContent) {
  const operations = {
    linkValidation: {
      title: 'Validate All External Links',
      description: 'Check and update all external links across all content',
      affectedItems: allContent.filter(item =>
        item.recommendations?.some(rec => rec.category === 'linkValidation')
      ).length,
      estimatedEffort: 'high',
      actions: [
        'Use automated link checking tools',
        'Create list of broken links to update',
        'Find replacement resources for broken links',
        'Update all affected content files',
      ],
    },
    technologyVersionUpdates: {
      title: 'Update Technology Version References',
      description: 'Review and update all technology version numbers across content',
      affectedItems: allContent.filter(item =>
        item.recommendations?.some(rec => rec.category === 'technologyUpdates')
      ).length,
      estimatedEffort: 'medium',
      actions: [
        'Inventory all technologies mentioned across content',
        'Check current versions and release notes',
        'Update version numbers in all relevant content',
        'Add notes about breaking changes or new features',
      ],
    },
    statisticsRefresh: {
      title: 'Refresh All Statistics and Metrics',
      description: 'Update outdated statistics and performance metrics',
      affectedItems: allContent.filter(item =>
        item.recommendations?.some(rec => rec.category === 'outdatedStats')
      ).length,
      estimatedEffort: 'high',
      actions: [
        'Gather current industry benchmarks and statistics',
        'Update all numerical data in content',
        'Add new performance metrics if available',
        'Validate all calculations and comparisons',
      ],
    },
  };

  return Object.values(operations).filter(op => op.affectedItems > 0);
}

/**
 * Generate comprehensive recommendations report
 */
function generateRecommendationsReport(freshnessReport) {
  const contentItems = freshnessReport.content.filter(item => !item.error);

  // Analyze each content item for specific updates
  const analyzedContent = contentItems.map(item => ({
    ...item,
    recommendations: analyzeContentForUpdates(item),
    updateTemplates: [], // Will be populated below
  }));

  // Generate update templates for each item
  analyzedContent.forEach(item => {
    item.updateTemplates = generateUpdateTemplates(item, item.recommendations);
  });

  // Sort by urgency
  analyzedContent.sort((a, b) => {
    const aPriority = a.recommendations[0]?.priority || 'low';
    const bPriority = b.recommendations[0]?.priority || 'low';
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[aPriority] - priorityOrder[bPriority];
  });

  // Generate bulk operations
  const bulkOperations = generateBulkOperations(analyzedContent);

  const report = {
    timestamp: new Date().toISOString(),
    reportType: 'content_recommendations',
    summary: {
      totalContent: contentItems.length,
      itemsNeedingUpdates: analyzedContent.filter(item => item.recommendations.length > 0).length,
      totalRecommendations: analyzedContent.reduce(
        (sum, item) => sum + item.recommendations.length,
        0
      ),
      bulkOperations: bulkOperations.length,
    },
    priorityBreakdown: {
      critical: analyzedContent.filter(item =>
        item.recommendations.some(rec => rec.priority === 'critical')
      ).length,
      high: analyzedContent.filter(item =>
        item.recommendations.some(rec => rec.priority === 'high')
      ).length,
      medium: analyzedContent.filter(item =>
        item.recommendations.some(rec => rec.priority === 'medium')
      ).length,
      low: analyzedContent.filter(item => item.recommendations.some(rec => rec.priority === 'low'))
        .length,
    },
    contentUpdates: analyzedContent,
    bulkOperations,
    quickWins: analyzedContent
      .filter(item => item.recommendations.some(rec => rec.estimatedEffort === 'low'))
      .slice(0, 10),
    calendarPlan: generateCalendarPlan(analyzedContent),
  };

  return report;
}

/**
 * Generate calendar-based update plan
 */
function generateCalendarPlan(analyzedContent) {
  const plan = {
    week1: [],
    week2: [],
    week3: [],
    week4: [],
  };

  // Distribute content updates across the month
  let weekIndex = 0;
  const itemsPerWeek = Math.ceil(analyzedContent.length / 4);

  analyzedContent.forEach((item, index) => {
    if (index > 0 && index % itemsPerWeek === 0) {
      weekIndex = Math.min(weekIndex + 1, 3);
    }

    const weekKey = `week${weekIndex + 1}`;
    const highPriorityRecommendations = item.recommendations.filter(
      rec => rec.priority === 'critical' || rec.priority === 'high'
    );

    plan[weekKey].push({
      title: item.title,
      filePath: item.filePath,
      priority: highPriorityRecommendations.length > 0 ? 'high' : 'medium',
      estimatedEffort: item.recommendations.reduce((effort, rec) => {
        const effortScore = { low: 1, medium: 2, high: 3 }[rec.estimatedEffort] || 2;
        return Math.max(effort, effortScore);
      }, 1),
      topRecommendations: highPriorityRecommendations.slice(0, 2),
    });
  });

  return plan;
}

/**
 * Save recommendations report
 */
function saveRecommendationsReport(report) {
  const reportsDir = join(PROJECT_ROOT, CONFIG.REPORTS_DIR);
  const jsonPath = join(reportsDir, CONFIG.RECOMMENDATIONS_FILE);
  const markdownPath = join(reportsDir, CONFIG.RECOMMENDATIONS_MD);

  try {
    // Save JSON report
    writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`Content recommendations saved to: ${jsonPath}`);

    // Generate markdown summary
    generateMarkdownSummary(report, markdownPath);

    return { jsonPath, markdownPath };
  } catch (error) {
    console.error('Error saving recommendations report:', error.message);
    return null;
  }
}

/**
 * Generate markdown summary for recommendations
 */
function generateMarkdownSummary(report, outputPath) {
  const { summary, priorityBreakdown, contentUpdates, bulkOperations, quickWins, calendarPlan } =
    report;

  let markdown = `# Content Update Recommendations

**Generated:** ${new Date().toLocaleDateString()}

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Content Items | ${summary.totalContent} |
| Items Needing Updates | ${summary.itemsNeedingUpdates} |
| Total Recommendations | ${summary.totalRecommendations} |
| Bulk Operations | ${summary.bulkOperations} |

## Priority Breakdown

| Priority | Items | Actions Needed |
|----------|-------|---------------|
| Critical | ${priorityBreakdown.critical} | Immediate attention required |
| High | ${priorityBreakdown.high} | Address this month |
| Medium | ${priorityBreakdown.medium} | Address this quarter |
| Low | ${priorityBreakdown.low} | Address when time permits |

## Quick Wins (Low Effort)

Top 10 items that can be updated quickly:

${quickWins
  .map(
    item =>
      `### ${item.title}
**File:** \`${item.filePath}\`
**Type:** ${item.contentType}
**Status:** ${item.status}
**Quick Actions:**
${item.recommendations
  .filter(rec => rec.estimatedEffort === 'low')
  .slice(0, 3)
  .map(rec => `- ${rec.title}`)
  .join('\n')}
`
  )
  .join('\n---\n')}

## Bulk Operations

High-impact updates that affect multiple content items:

${bulkOperations
  .map(
    op =>
      `### ${op.title}
**Description:** ${op.description}
**Affected Items:** ${op.affectedItems}
**Estimated Effort:** ${op.estimatedEffort}
**Actions:**
${op.actions.map(action => `- ${action}`).join('\n')}
`
  )
  .join('\n')}

## Monthly Update Calendar

### Week 1 (${calendarPlan.week1.length} items)
${calendarPlan.week1
  .map(
    item =>
      `- **${item.title}** (${item.priority} priority, ${item.estimatedEffort === 1 ? 'low' : item.estimatedEffort === 2 ? 'medium' : 'high'} effort)`
  )
  .join('\n')}

### Week 2 (${calendarPlan.week2.length} items)
${calendarPlan.week2
  .map(
    item =>
      `- **${item.title}** (${item.priority} priority, ${item.estimatedEffort === 1 ? 'low' : item.estimatedEffort === 2 ? 'medium' : 'high'} effort)`
  )
  .join('\n')}

### Week 3 (${calendarPlan.week3.length} items)
${calendarPlan.week3
  .map(
    item =>
      `- **${item.title}** (${item.priority} priority, ${item.estimatedEffort === 1 ? 'low' : item.estimatedEffort === 2 ? 'medium' : 'high'} effort)`
  )
  .join('\n')}

### Week 4 (${calendarPlan.week4.length} items)
${calendarPlan.week4
  .map(
    item =>
      `- **${item.title}** (${item.priority} priority, ${item.estimatedEffort === 1 ? 'low' : item.estimatedEffort === 2 ? 'medium' : 'high'} effort)`
  )
  .join('\n')}

---

## Next Steps

1. **Immediate:** Address all critical and high-priority items in Week 1-2
2. **This Week:** Focus on quick wins to build momentum
3. **This Month:** Complete bulk operations and high-effort updates
4. **Ongoing:** Establish regular content review schedule

*Recommendations are based on content age, temporal keywords, and industry trends*
`;

  writeFileSync(outputPath, markdown);
  console.log(`Content recommendations summary saved to: ${outputPath}`);
}

/**
 * Main execution function
 */
function main() {
  console.log('💡 Generating Content Update Recommendations...\n');

  try {
    // Load freshness report
    const freshnessReport = loadFreshnessReport();
    console.log('📊 Loaded content freshness report');

    // Generate recommendations
    const recommendationsReport = generateRecommendationsReport(freshnessReport);

    // Display summary
    console.log('📈 Recommendations Summary:');
    console.log(
      `   Items needing updates: ${recommendationsReport.summary.itemsNeedingUpdates}/${recommendationsReport.summary.totalContent}`
    );
    console.log(`   Total recommendations: ${recommendationsReport.summary.totalRecommendations}`);
    console.log(`   Critical items: ${recommendationsReport.priorityBreakdown.critical}`);
    console.log(`   High priority: ${recommendationsReport.priorityBreakdown.high}`);
    console.log(`   Quick wins: ${recommendationsReport.quickWins.length}`);
    console.log(`   Bulk operations: ${recommendationsReport.bulkOperations.length}`);

    // Save recommendations
    const result = saveRecommendationsReport(recommendationsReport);

    if (result) {
      console.log('\n✅ Content update recommendations generated successfully');
      console.log(`📄 Report: ${result.jsonPath}`);
      console.log(`📋 Summary: ${result.markdownPath}`);
    } else {
      console.error('\n❌ Failed to save recommendations');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error generating recommendations:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeContentForUpdates, generateBulkOperations, generateCalendarPlan };
