#!/usr/bin/env node

/**
 * Content Freshness Monitor
 *
 * Monitors content freshness across the portfolio website to identify
 * outdated blog posts, stale project descriptions, and expired certifications.
 *
 * Features:
 * - Automated content freshness analysis
 * - Risk-based content classification (FRESH/AGING/STALE)
 * - Content update recommendations
 * - Quarterly refresh scheduling
 * - Integration with GitHub Issues for stale content alerts
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);

// Configuration
const CONFIG = {
  // Freshness thresholds in days
  THRESHOLDS: {
    FRESH: 30, // Content under 30 days is fresh
    AGING: 90, // Content 30-90 days is aging (attention needed)
    STALE: 180, // Content 90-180 days is stale (update recommended)
    EXPIRED: 365, // Content over 1 year is expired (critical update needed)
  },

  // Content type-specific freshness requirements
  CONTENT_REQUIREMENTS: {
    blog: {
      freshThreshold: 30,
      agingThreshold: 60,
      staleThreshold: 120,
      expiredThreshold: 365,
      updateFrequency: 'monthly',
    },
    projects: {
      freshThreshold: 90,
      agingThreshold: 180,
      staleThreshold: 365,
      expiredThreshold: 730,
      updateFrequency: 'quarterly',
    },
    certifications: {
      freshThreshold: 365,
      agingThreshold: 730,
      staleThreshold: 1095,
      expiredThreshold: 1825,
      updateFrequency: 'yearly',
    },
  },

  // Keywords indicating time-sensitive content
  TEMPORAL_KEYWORDS: [
    'latest',
    'current',
    'new',
    'upcoming',
    'recent',
    'modern',
    '2023',
    '2024',
    '2025',
    '2026',
    'this year',
    'last year',
    'beta',
    'alpha',
    'preview',
    'v1',
    'v2',
    'v3',
  ],

  // Directories to scan
  CONTENT_DIRS: ['content/blog', 'content/projects'],

  // Output directories
  OUTPUT_DIR: '.content-reports',
  REPORT_FILE: 'freshness-report.json',
};

/**
 * Parse frontmatter from MDX content
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content };
  }

  try {
    // Simple YAML parsing for basic structures
    const frontmatterText = match[1];
    const data = {};

    // Extract basic fields
    const fieldRegex = /^(\w+):\s*(.*)$/gm;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(frontmatterText)) !== null) {
      const [, key, value] = fieldMatch;

      // Handle different value types
      if (value.startsWith('[') && value.endsWith(']')) {
        // Array
        data[key] = value
          .slice(1, -1)
          .split(',')
          .map(item => item.trim().replace(/['"]/g, ''));
      } else if (value === 'true' || value === 'false') {
        // Boolean
        data[key] = value === 'true';
      } else if (!isNaN(value)) {
        // Number
        data[key] = Number(value);
      } else {
        // String
        data[key] = value.replace(/^["']|["']$/g, '');
      }
    }

    return { data, content: match[2] };
  } catch (error) {
    console.warn('Error parsing frontmatter:', error.message);
    return { data: {}, content: match[2] || content };
  }
}

/**
 * Calculate days since a given date
 */
function daysSince(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determine freshness status based on content type and age
 */
function getFreshnessStatus(contentType, daysOld, hasTemporalKeywords = false) {
  const requirements = CONFIG.CONTENT_REQUIREMENTS[contentType] || CONFIG.CONTENT_REQUIREMENTS.blog;

  // Adjust for temporal keywords (more urgent if present)
  const multiplier = hasTemporalKeywords ? 0.7 : 1.0;

  const adjustedFreshThreshold = requirements.freshThreshold * multiplier;
  const adjustedAgingThreshold = requirements.agingThreshold * multiplier;
  const adjustedStaleThreshold = requirements.staleThreshold * multiplier;
  const adjustedExpiredThreshold = requirements.expiredThreshold * multiplier;

  if (daysOld <= adjustedFreshThreshold) {
    return { status: 'FRESH', urgency: 'low', priority: 4 };
  } else if (daysOld <= adjustedAgingThreshold) {
    return { status: 'AGING', urgency: 'medium', priority: 3 };
  } else if (daysOld <= adjustedStaleThreshold) {
    return { status: 'STALE', urgency: 'high', priority: 2 };
  } else {
    return { status: 'EXPIRED', urgency: 'critical', priority: 1 };
  }
}

/**
 * Check for temporal keywords in content
 */
function hasTemporalKeywords(text) {
  const lowerText = text.toLowerCase();
  return CONFIG.TEMPORAL_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Analyze a single content file
 */
function analyzeContentFile(filePath, contentType) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const { data: frontmatter, content: bodyContent } = parseFrontmatter(content);

    // Extract metadata
    const title = frontmatter.title || 'Untitled';
    const date = frontmatter.date || frontmatter.publishedDate;
    const tags = frontmatter.tags || [];
    const summary = frontmatter.summary || '';
    const status = frontmatter.status || 'published';

    if (!date) {
      return {
        filePath,
        title,
        error: 'No date found in frontmatter',
        status: 'ERROR',
        urgency: 'critical',
        priority: 0,
      };
    }

    // Calculate age
    const daysOld = daysSince(date);

    // Check for temporal keywords
    const hasTemporal = hasTemporalKeywords(bodyContent + summary + title);

    // Determine freshness
    const freshness = getFreshnessStatus(contentType, daysOld, hasTemporal);

    // Generate recommendations
    const recommendations = generateRecommendations(freshness, contentType, daysOld, hasTemporal);

    return {
      filePath,
      title,
      date,
      daysOld,
      contentType,
      tags,
      status: freshness.status,
      urgency: freshness.urgency,
      priority: freshness.priority,
      hasTemporalKeywords: hasTemporal,
      recommendations,
      lastModified: frontmatter.lastModified || date,
      wordCount: bodyContent.split(/\s+/).length,
    };
  } catch (error) {
    return {
      filePath,
      error: error.message,
      status: 'ERROR',
      urgency: 'critical',
      priority: 0,
    };
  }
}

/**
 * Generate content update recommendations
 */
function generateRecommendations(freshness, contentType, daysOld, hasTemporalKeywords) {
  const recommendations = [];

  if (freshness.status === 'EXPIRED') {
    recommendations.push({
      type: 'critical',
      action: 'immediate_update',
      message: `Content is ${daysOld} days old and requires immediate refresh`,
      suggestedActions: [
        'Update statistics and metrics',
        'Add recent developments or trends',
        'Review and update technical details',
        'Add new examples or case studies',
      ],
    });
  } else if (freshness.status === 'STALE') {
    recommendations.push({
      type: 'warning',
      action: 'planned_update',
      message: `Content is ${daysOld} days old and should be updated soon`,
      suggestedActions: [
        'Review for outdated information',
        'Add recent insights or experiences',
        'Update related links and resources',
        'Consider adding new sections',
      ],
    });
  }

  if (hasTemporalKeywords && freshness.status !== 'FRESH') {
    recommendations.push({
      type: 'temporal',
      action: 'time_sensitive',
      message: 'Contains time-sensitive language that may be outdated',
      suggestedActions: [
        'Review and update temporal references',
        'Add specific dates instead of relative terms',
        'Update version numbers and status indicators',
      ],
    });
  }

  if (contentType === 'blog' && daysOld > 60) {
    recommendations.push({
      type: 'content',
      action: 'blog_refresh',
      message: 'Blog post may benefit from fresh perspective',
      suggestedActions: [
        'Add follow-up or update section',
        'Create new post based on updated experiences',
        'Link to more recent related content',
      ],
    });
  }

  if (contentType === 'projects' && daysOld > 180) {
    recommendations.push({
      type: 'content',
      action: 'project_update',
      message: 'Project description could reflect recent developments',
      suggestedActions: [
        'Update project status and outcomes',
        'Add recent achievements or learnings',
        'Include new technologies or methodologies',
        'Update screenshots or visualizations',
      ],
    });
  }

  return recommendations;
}

/**
 * Scan content directory and analyze all files
 */
function scanContentDirectory() {
  const analysis = {
    timestamp: new Date().toISOString(),
    summary: {
      total: 0,
      fresh: 0,
      aging: 0,
      stale: 0,
      expired: 0,
      errors: 0,
    },
    content: [],
    recommendations: [],
    trends: {},
  };

  for (const dir of CONFIG.CONTENT_DIRS) {
    const fullPath = join(PROJECT_ROOT, dir);

    if (!existsSync(fullPath)) {
      console.warn(`Content directory not found: ${fullPath}`);
      continue;
    }

    const files = readdirSync(fullPath).filter(file => file.endsWith('.mdx'));
    const contentType = dir.includes('blog') ? 'blog' : 'projects';

    for (const file of files) {
      const filePath = join(fullPath, file);
      const result = analyzeContentFile(filePath, contentType);

      analysis.content.push(result);
      analysis.summary.total++;

      if (result.error) {
        analysis.summary.errors++;
      } else {
        analysis.summary[result.status.toLowerCase()]++;
      }

      // Collect recommendations
      if (result.recommendations) {
        analysis.recommendations.push(...result.recommendations);
      }
    }
  }

  // Calculate trends
  analysis.trends = calculateTrends(analysis.content);

  return analysis;
}

/**
 * Calculate content trends and statistics
 */
function calculateTrends(content) {
  const trends = {
    averageAge: 0,
    oldestContent: null,
    newestContent: null,
    contentByType: {},
    contentByStatus: {},
    tagsFrequency: {},
    temporalKeywordUsage: 0,
  };

  const validContent = content.filter(item => !item.error && item.daysOld);

  if (validContent.length === 0) {
    return trends;
  }

  // Average age
  const totalAge = validContent.reduce((sum, item) => sum + item.daysOld, 0);
  trends.averageAge = Math.round(totalAge / validContent.length);

  // Oldest and newest content
  trends.oldestContent = validContent.reduce((oldest, item) =>
    item.daysOld > oldest.daysOld ? item : oldest
  );
  trends.newestContent = validContent.reduce((newest, item) =>
    item.daysOld < newest.daysOld ? item : newest
  );

  // Content by type and status
  validContent.forEach(item => {
    trends.contentByType[item.contentType] = (trends.contentByType[item.contentType] || 0) + 1;
    trends.contentByStatus[item.status] = (trends.contentByStatus[item.status] || 0) + 1;

    if (item.hasTemporalKeywords) {
      trends.temporalKeywordUsage++;
    }

    // Tag frequency
    if (item.tags) {
      item.tags.forEach(tag => {
        trends.tagsFrequency[tag] = (trends.tagsFrequency[tag] || 0) + 1;
      });
    }
  });

  return trends;
}

/**
 * Generate content update schedule
 */
function generateUpdateSchedule(analysis) {
  const schedule = {
    immediate: [],
    thisMonth: [],
    thisQuarter: [],
    thisYear: [],
  };

  analysis.content
    .filter(item => !item.error)
    .sort((a, b) => a.priority - b.priority)
    .forEach(item => {
      const updateItem = {
        title: item.title,
        filePath: item.filePath,
        currentStatus: item.status,
        urgency: item.urgency,
        recommendations: item.recommendations,
      };

      if (item.urgency === 'critical' || item.status === 'EXPIRED') {
        schedule.immediate.push(updateItem);
      } else if (item.urgency === 'high' || item.status === 'STALE') {
        schedule.thisMonth.push(updateItem);
      } else if (item.urgency === 'medium' || item.status === 'AGING') {
        schedule.thisQuarter.push(updateItem);
      } else {
        schedule.thisYear.push(updateItem);
      }
    });

  return schedule;
}

/**
 * Save analysis results
 */
function saveResults(analysis) {
  const outputDir = join(PROJECT_ROOT, CONFIG.OUTPUT_DIR);
  const reportPath = join(outputDir, CONFIG.REPORT_FILE);

  try {
    // Create directory if it doesn't exist
    execSync(`mkdir -p "${outputDir}"`);

    // Generate update schedule
    analysis.updateSchedule = generateUpdateSchedule(analysis);

    // Save full report
    writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    console.log(`Content freshness report saved to: ${reportPath}`);

    // Generate human-readable summary
    const summaryPath = join(outputDir, 'freshness-summary.md');
    generateMarkdownSummary(analysis, summaryPath);

    return { reportPath, summaryPath };
  } catch (error) {
    console.error('Error saving results:', error.message);
    return null;
  }
}

/**
 * Generate markdown summary
 */
function generateMarkdownSummary(analysis, outputPath) {
  const { summary, trends, updateSchedule } = analysis;

  let markdown = `# Content Freshness Report

**Generated:** ${new Date().toLocaleDateString()}

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Content Items | ${summary.total} |
| Fresh Content | ${summary.fresh} |
| Aging Content | ${summary.aging} |
| Stale Content | ${summary.stale} |
| Expired Content | ${summary.expired} |
| Errors | ${summary.errors} |

## Content Health

${summary.expired > 0 ? '⚠️ **Critical:** Expired content requires immediate attention' : ''}
${summary.stale > 0 ? '⚡ **Warning:** Stale content should be updated soon' : ''}
${summary.aging > 0 ? '👀 **Monitor:** Aging content may need attention' : ''}
${summary.fresh > summary.total * 0.5 ? '✅ **Good:** Majority of content is fresh' : ''}

## Trends & Insights

- **Average Content Age:** ${trends.averageAge} days
- **Oldest Content:** "${trends.oldestContent?.title}" (${trends.oldestContent?.daysOld} days old)
- **Newest Content:** "${trends.newestContent?.title}" (${trends.newestContent?.daysOld} days old)
- **Content with Temporal Keywords:** ${trends.temporalKeywordUsage} items

## Update Schedule

### Immediate Action Required (${updateSchedule.immediate.length} items)
${updateSchedule.immediate.map(item => `- **${item.title}** (${item.urgency})`).join('\n')}

### This Month (${updateSchedule.thisMonth.length} items)
${updateSchedule.thisMonth.map(item => `- **${item.title}** (${item.urgency})`).join('\n')}

### This Quarter (${updateSchedule.thisQuarter.length} items)
${updateSchedule.thisQuarter
  .slice(0, 10)
  .map(item => `- **${item.title}** (${item.urgency})`)
  .join('\n')}
${updateSchedule.thisQuarter.length > 10 ? `... and ${updateSchedule.thisQuarter.length - 10} more` : ''}

## Recommendations

Top priority actions:
${analysis.recommendations
  .filter(rec => rec.type === 'critical')
  .slice(0, 5)
  .map(rec => `- ${rec.message}`)
  .join('\n')}
`;

  writeFileSync(outputPath, markdown);
  console.log(`Content freshness summary saved to: ${outputPath}`);
}

/**
 * Main execution function
 */
function main() {
  console.log('🔍 Starting Content Freshness Analysis...\n');

  try {
    // Scan all content
    const analysis = scanContentDirectory();

    // Display summary
    console.log('📊 Analysis Summary:');
    console.log(`   Total items: ${analysis.summary.total}`);
    console.log(`   Fresh: ${analysis.summary.fresh} | Aging: ${analysis.summary.aging}`);
    console.log(`   Stale: ${analysis.summary.stale} | Expired: ${analysis.summary.expired}`);
    console.log(`   Errors: ${analysis.summary.errors}`);

    if (analysis.trends.averageAge) {
      console.log(`   Average age: ${analysis.trends.averageAge} days`);
    }

    // Save results
    const result = saveResults(analysis);

    if (result) {
      console.log('\n✅ Content freshness analysis completed successfully');
      console.log(`📄 Report: ${result.reportPath}`);
      console.log(`📋 Summary: ${result.summaryPath}`);
    } else {
      console.error('\n❌ Failed to save analysis results');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error during content freshness analysis:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { scanContentDirectory, analyzeContentFile, generateUpdateSchedule };
