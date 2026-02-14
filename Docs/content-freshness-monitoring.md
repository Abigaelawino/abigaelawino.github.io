# Content Freshness Monitoring System

This document provides comprehensive documentation for the automated content freshness monitoring system that tracks, analyzes, and maintains content quality across the portfolio website.

## Overview

The Content Freshness Monitoring System is a comprehensive solution that automatically monitors content age, identifies outdated material, generates update recommendations, and provides actionable insights for maintaining a high-quality portfolio.

### Key Features

- **Automated Freshness Analysis**: Scans all content and classifies by age (Fresh/Aging/Stale/Expired)
- **Trend Analysis**: Tracks content health over time with monthly trend reports
- **Smart Recommendations**: Generates specific, actionable update recommendations based on content type and age
- **Quarterly Planning**: Creates structured maintenance schedules and quarterly goals
- **Health Validation**: Validates content quality with comprehensive health scoring
- **Automated Alerts**: Creates GitHub issues for critical content updates
- **Visual Dashboards**: Generates reports and badges for content health monitoring

## Architecture

### Core Components

1. **Content Freshness Monitor** (`scripts/content-freshness-monitor.mjs`)
   - Analyzes content files and calculates freshness status
   - Generates recommendations based on content type and temporal keywords
   - Creates comprehensive freshness reports

2. **Monthly Trends Analyzer** (`scripts/content-monthly-trends.mjs`)
   - Tracks content freshness trends over time
   - Identifies patterns and generates strategic insights
   - Maintains historical data for trend analysis

3. **Content Recommendations Generator** (`scripts/content-recommendations.mjs`)
   - Generates specific update recommendations for each content item
   - Creates update templates and bulk operation suggestions
   - Provides monthly calendar-based update plans

4. **Quarterly Schedule Generator** (`scripts/content-quarterly-schedule.mjs`)
   - Creates quarterly content maintenance schedules
   - Sets goals and milestones for content improvement
   - Generates actionable monthly breakdowns

5. **Content Health Validator** (`scripts/content-health-validator.mjs`)
   - Validates content health metrics against thresholds
   - Generates health badges and scoring
   - Provides comprehensive health summaries

### Workflow Integration

The system integrates with GitHub Actions for automated monitoring:

- **Monthly Triggers**: Automatic analysis on the 1st of each month
- **Manual Triggers**: On-demand analysis via workflow dispatch
- **Issue Creation**: Automatic GitHub issues for critical content
- **Report Generation**: Comprehensive reports and artifacts

## Configuration

### Freshness Thresholds

Content freshness is determined by age and content type:

```javascript
THRESHOLDS = {
  FRESH: 30, // Content under 30 days
  AGING: 90, // Content 30-90 days old
  STALE: 180, // Content 90-180 days old
  EXPIRED: 365, // Content over 1 year old
};

CONTENT_REQUIREMENTS = {
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
};
```

### Performance Targets

The system monitors these key metrics:

- **Fresh Content Ratio**: ≥80% of content should be fresh
- **Stale Content**: ≤5% of content should be stale
- **Expired Content**: 0% content should be expired
- **Content Health Score**: Target ≥85/100
- **Average Content Age**: Target ≤90 days

## Usage

### Manual Content Analysis

Run comprehensive content freshness analysis:

```bash
# Run freshness analysis
npm run content:freshness

# Generate monthly trends
npm run content:trends

# Create update recommendations
npm run content:recommendations

# Generate quarterly schedule
npm run content:quarterly

# Validate content health
npm run content:health

# Run all monitoring
npm run content:monitor
```

### Automated Workflow

The GitHub Actions workflow provides automated monitoring:

```yaml
# Monthly scheduled run (1st of each month at 2 AM UTC)
schedule:
  - cron: '0 2 1 * *'

# Manual trigger with options
workflow_dispatch:
  inputs:
    analysis_type: [freshness, trends, recommendations, comprehensive]
    create_issue: [true, false]
    update_schedule: [true, false]
```

## Output Reports

The system generates several types of reports in the `.content-reports/` directory:

### 1. Freshness Report (`freshness-report.json`)

Comprehensive analysis of all content items with freshness status and recommendations.

```json
{
  "timestamp": "2026-02-14T12:00:00.000Z",
  "summary": {
    "total": 15,
    "fresh": 8,
    "aging": 4,
    "stale": 2,
    "expired": 1,
    "errors": 0
  },
  "content": [
    {
      "filePath": "content/blog/react-performance-tips.mdx",
      "title": "React Performance Optimization Techniques",
      "daysOld": 45,
      "status": "AGING",
      "recommendations": [...]
    }
  ]
}
```

### 2. Monthly Trends (`monthly-trends.json`)

Historical analysis with trends and strategic recommendations.

```json
{
  "historicalAnalysis": {
    "trends": {
      "overall": "stable",
      "message": "Content freshness is relatively stable",
      "details": {
        "freshContentRatio": {...},
        "staleContentRatio": {...}
      }
    }
  },
  "performanceMetrics": {
    "freshContentPercentage": "73.3%",
    "staleContentPercentage": "13.3%",
    "expiredContentPercentage": "0.0%",
    "contentHealthScore": 85
  }
}
```

### 3. Content Recommendations (`content-recommendations.json`)

Specific, actionable recommendations for each content item.

```json
{
  "contentUpdates": [
    {
      "title": "React Performance Optimization Techniques",
      "filePath": "content/blog/react-performance-tips.mdx",
      "recommendations": [
        {
          "category": "outdatedStats",
          "title": "Update current statistics and performance metrics",
          "actions": [...],
          "priority": "high"
        }
      ]
    }
  ],
  "bulkOperations": [
    {
      "title": "Validate All External Links",
      "affectedItems": 5,
      "actions": [...]
    }
  ]
}
```

### 4. Quarterly Schedule (`quarterly-schedule.json`)

Structured quarterly maintenance plan with monthly breakdowns.

```json
{
  "metadata": {
    "quarter": "Q1",
    "year": 2026,
    "totalItems": 15
  },
  "monthlySchedule": {
    "month1": {
      "goals": {
        "critical": 1,
        "high": 3,
        "medium": 0,
        "routine": 2
      },
      "scheduledItems": [...]
    }
  },
  "quarterlyGoals": {
    "contentHealth": {
      "target": "Zero expired content, minimal stale content"
    }
  }
}
```

### 5. Content Health Summary (`content-health-summary.json`)

Comprehensive health validation with scoring and recommendations.

```json
{
  "healthScore": {
    "score": 85,
    "grade": "B+",
    "status": "Good"
  },
  "validation": {
    "passed": true,
    "warnings": [...],
    "errors": [],
    "metrics": {
      "expiredContent": {
        "current": 0,
        "target": 0,
        "passed": true
      }
    }
  }
}
```

## Content Classification System

### Freshness Categories

- **FRESH** (Green): Content within threshold, no immediate action needed
- **AGING** (Yellow): Content approaching threshold, attention recommended
- **STALE** (Orange): Content exceeds threshold, update needed
- **EXPIRED** (Red): Content significantly outdated, immediate update required

### Priority Levels

- **Critical**: Expired content or critical issues requiring immediate attention
- **High**: Stale content or important recommendations
- **Medium**: Aging content or standard maintenance
- **Low**: Fresh content or optional improvements

### Content Type Requirements

Different content types have different freshness requirements:

- **Blog Posts**: Fresh for 30 days, expire after 1 year
- **Projects**: Fresh for 90 days, expire after 2 years
- **Certifications**: Fresh for 1 year, expire after 5 years

## Integration with Development Workflow

### Pre-commit Integration

Add content freshness check to pre-commit hooks:

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Checking content freshness..."
npm run content:freshness

if [ $? -ne 0 ]; then
  echo "❌ Content freshness check failed"
  exit 1
fi

echo "✅ Content freshness check passed"
```

### CI/CD Integration

Include content monitoring in CI pipeline:

```yaml
- name: Content Freshness Check
  run: npm run content:monitor

- name: Upload Content Reports
  uses: actions/upload-artifact@v4
  with:
    name: content-reports
    path: .content-reports/
```

### Development Workflow

1. **Before Publishing**: Run `npm run content:freshness` to check content status
2. **Regular Maintenance**: Review monthly trends and recommendations
3. **Quarterly Planning**: Use quarterly schedule for content planning
4. **Issue Resolution**: Address GitHub issues for critical content updates

## Advanced Features

### Temporal Keyword Detection

The system automatically detects temporal keywords that indicate time-sensitive content:

- **Time References**: "latest", "current", "new", "recent"
- **Year References**: "2023", "2024", "2025", "2026"
- **Status Indicators**: "beta", "alpha", "preview", "v1", "v2"

Content with temporal keywords gets priority for updates.

### Bulk Operations

The system identifies opportunities for bulk updates affecting multiple items:

- **Link Validation**: Check and update all external links
- **Technology Version Updates**: Update version references
- **Statistics Refresh**: Update outdated metrics and benchmarks

### Trend Analysis

Historical tracking provides insights into:

- **Content Lifecycle**: How quickly content ages and needs updates
- **Maintenance Efficiency**: Effectiveness of content update processes
- **Quality Trends**: Improvements or declines in content health

### Automated Issue Creation

Critical content automatically generates GitHub issues with:

- Detailed problem descriptions
- Specific action items
- Priority classifications
- Progress tracking

## Troubleshooting

### Common Issues

**Content Not Found**

- Check that content files exist in `content/blog/` and `content/projects/`
- Verify frontmatter includes required `date` field

**False Expired Content**

- Review date formats in frontmatter (YYYY-MM-DD recommended)
- Check for manual content status overrides

**Missing Recommendations**

- Ensure content has sufficient text for analysis
- Verify tags and categories are properly formatted

**Health Score Low**

- Focus on eliminating expired content first
- Prioritize high-priority recommendations

### Debug Mode

Enable debug output for troubleshooting:

```bash
NODE_ENV=debug npm run content:freshness
```

### Manual Overrides

For special cases, add frontmatter to override freshness:

```yaml
---
title: 'Special Content'
date: 2024-01-01
lastModified: 2024-12-01 # Manual update date
status: 'published' # Override automatic classification
contentLifecycle: 'evergreen' # Never expires
---
```

## Best Practices

### Content Creation

1. **Include Dates**: Always include publication and last modified dates
2. **Use Temporal Language**: Avoid ambiguous time references
3. **Regular Updates**: Schedule content reviews based on content type
4. **Version References**: Use specific versions instead of "latest"

### Maintenance Workflow

1. **Monthly Reviews**: Review aging and stale content
2. **Quarterly Planning**: Update project case studies and certifications
3. **Annual Audits**: Comprehensive content review and cleanup

### Monitoring

1. **Health Score**: Monitor overall content health score
2. **Trend Analysis**: Track freshness trends over time
3. **Alert Response**: Address critical issues promptly

## Future Enhancements

### Planned Features

- **Content Performance Metrics**: Integration with analytics for usage-based prioritization
- **AI-Powered Recommendations**: Enhanced recommendations using content analysis
- **Multi-Repository Support**: Monitor content across multiple repositories
- **Custom Thresholds**: Per-content-type custom freshness rules
- **Automated Updates**: AI-assisted content updates for routine maintenance

### Integration Opportunities

- **Analytics Platforms**: Content performance data for prioritization
- **CMS Systems**: Direct integration with content management
- **Notification Systems**: Slack/email alerts for critical updates
- **Calendar Integration**: Automated scheduling of content reviews

---

This system provides comprehensive content freshness monitoring to ensure the portfolio maintains high quality and relevance over time. Regular use of these tools helps keep content current, engaging, and valuable to visitors.
