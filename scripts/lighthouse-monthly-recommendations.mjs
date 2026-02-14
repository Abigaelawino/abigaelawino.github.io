#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  reportsDir: '.lighthouse-reports',
  historyFile: '.lighthouse-reports/history.json',
  trendsFile: '.lighthouse-reports/core-vitals-trends.json',
  monthlyTrendsFile: '.lighthouse-reports/core-vitals-monthly-trends.json',
  recommendationsFile: '.lighthouse-reports/monthly-recommendations.json',
  currentMonth: new Date().toISOString().slice(0, 7),
};

// Load historical data
function loadHistory() {
  if (fs.existsSync(CONFIG.historyFile)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.historyFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Error loading history file:', error.message);
    }
  }
  return [];
}

// Load latest core vitals analysis
function loadCoreVitalsAnalysis() {
  if (fs.existsSync(CONFIG.trendsFile)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.trendsFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Error loading core vitals analysis:', error.message);
    }
  }
  return null;
}

// Load previous recommendations
function loadPreviousRecommendations() {
  if (fs.existsSync(CONFIG.recommendationsFile)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.recommendationsFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Error loading previous recommendations:', error.message);
    }
  }
  return [];
}

// Save recommendations
function saveRecommendations(recommendations) {
  fs.writeFileSync(CONFIG.recommendationsFile, JSON.stringify(recommendations, null, 2));
}

// Analyze score patterns and trends
function analyzeScorePatterns(history) {
  const patterns = {
    performance: [],
    accessibility: [],
    bestPractices: [],
    seo: [],
    regressions: [],
    improvements: [],
  };

  // Group by page
  const pages = {};
  history.forEach(entry => {
    if (!entry.scores) return;
    if (!pages[entry.name]) {
      pages[entry.name] = [];
    }
    pages[entry.name].push(entry);
  });

  // Analyze each page's trends
  Object.keys(pages).forEach(page => {
    const pageHistory = pages[page].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (pageHistory.length < 2) return;

    // Analyze each category
    ['performance', 'accessibility', 'bestPractices', 'seo'].forEach(category => {
      const scores = pageHistory.map(entry => entry.scores[category]).filter(Boolean);
      if (scores.length < 2) return;

      // Calculate trend
      const recent = scores.slice(-5); // Last 5 measurements
      const older = scores.slice(-10, -5); // Previous 5 measurements

      if (recent.length >= 3) {
        const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
        const trend = recent[recent.length - 1] - recent[0];

        patterns[category].push({
          page,
          trend: trend > 2 ? 'improving' : trend < -2 ? 'declining' : 'stable',
          recentAverage: Math.round(recentAvg),
          latestScore: recent[recent.length - 1],
          measurementCount: recent.length,
        });

        // Detect significant regressions
        if (trend < -5 && recent[recent.length - 1] < 90) {
          patterns.regressions.push({
            page,
            category,
            change: trend,
            from: recent[0],
            to: recent[recent.length - 1],
            severity: recent[recent.length - 1] < 70 ? 'critical' : 'warning',
          });
        }

        // Detect improvements
        if (trend > 5 && recent[recent.length - 1] >= 90) {
          patterns.improvements.push({
            page,
            category,
            change: trend,
            from: recent[0],
            to: recent[recent.length - 1],
          });
        }
      }
    });
  });

  return patterns;
}

// Generate performance optimization recommendations
function generatePerformanceRecommendations(patterns, coreVitalsAnalysis) {
  const recommendations = [];

  // Analyze performance patterns
  const performanceIssues = patterns.performance.filter(
    p => p.trend === 'declining' || p.latestScore < 90
  );

  if (performanceIssues.length > 0) {
    recommendations.push({
      id: 'performance-optimization',
      priority: 'high',
      category: 'performance',
      title: 'Performance Score Optimization',
      description: `${performanceIssues.length} pages need performance optimization to reach 90+ scores.`,
      impact: 'high',
      effort: 'medium',
      timeline: '2-4 weeks',
      actions: [
        'Audit images and convert to WebP format with proper sizing',
        'Implement lazy loading for below-the-fold content',
        'Optimize critical rendering path and eliminate render-blocking resources',
        'Minimize and compress JavaScript and CSS files',
        'Use code splitting to reduce initial bundle size',
      ],
      affectedPages: performanceIssues.map(p => p.page),
      expectedImpact: '+10-20 points to performance score',
      prerequisites: ['Access to image optimization tools', 'Build process modifications'],
    });
  }

  // Core Web Vitals specific recommendations
  if (coreVitalsAnalysis && coreVitalsAnalysis.alerts) {
    const lcpAlerts = coreVitalsAnalysis.alerts.filter(a => a.metric === 'lcp');
    const clsAlerts = coreVitalsAnalysis.alerts.filter(a => a.metric === 'cls');
    const fidAlerts = coreVitalsAnalysis.alerts.filter(a => a.metric === 'fid');

    if (lcpAlerts.length > 0) {
      recommendations.push({
        id: 'lcp-optimization',
        priority: 'high',
        category: 'core-vitals',
        title: 'Largest Contentful Paint (LCP) Optimization',
        description: `Improve LCP on ${lcpAlerts.length} pages to enhance user experience and Core Web Vitals.`,
        impact: 'high',
        effort: 'medium',
        timeline: '1-2 weeks',
        actions: [
          'Optimize and compress hero images using modern formats',
          'Implement image CDN for faster delivery',
          'Preload critical resources (fonts, CSS, hero images)',
          'Optimize server response time (TTFB)',
          'Remove render-blocking JavaScript and CSS',
        ],
        affectedPages: lcpAlerts.map(a => a.page),
        expectedImpact: 'Reduce LCP to < 2.5s, improve search rankings',
        prerequisites: ['Image optimization workflow', 'Server performance analysis'],
      });
    }

    if (clsAlerts.length > 0) {
      recommendations.push({
        id: 'cls-optimization',
        priority: 'high',
        category: 'core-vitals',
        title: 'Cumulative Layout Shift (CLS) Reduction',
        description: `Fix layout shift issues on ${clsAlerts.length} pages to improve user experience.`,
        impact: 'high',
        effort: 'low',
        timeline: '1 week',
        actions: [
          'Add width and height attributes to all images',
          'Reserve space for dynamic content (ads, iframes)',
          'Use transform animations instead of layout-affecting properties',
          'Ensure web fonts load without causing layout shift',
          'Avoid inserting content above existing content',
        ],
        affectedPages: clsAlerts.map(a => a.page),
        expectedImpact: 'Reduce CLS to < 0.1, eliminate jarring user experience',
        prerequisites: ['CSS knowledge', 'Layout debugging skills'],
      });
    }

    if (fidAlerts.length > 0) {
      recommendations.push({
        id: 'fid-optimization',
        priority: 'medium',
        category: 'core-vitals',
        title: 'First Input Delay (FID) Improvement',
        description: `Reduce input delay on ${fidAlerts.length} pages to improve interactivity.`,
        impact: 'medium',
        effort: 'high',
        timeline: '3-4 weeks',
        actions: [
          'Break up long JavaScript tasks (>50ms)',
          'Implement code splitting and lazy loading',
          'Use web workers for heavy computations',
          'Optimize third-party script loading',
          'Reduce JavaScript execution time',
        ],
        affectedPages: fidAlerts.map(a => a.page),
        expectedImpact: 'Reduce FID to < 100ms, improve perceived responsiveness',
        prerequisites: ['JavaScript optimization expertise', 'Performance profiling tools'],
      });
    }
  }

  return recommendations;
}

// Generate accessibility recommendations
function generateAccessibilityRecommendations(patterns) {
  const recommendations = [];

  const accessibilityIssues = patterns.accessibility.filter(
    p => p.trend === 'declining' || p.latestScore < 90
  );

  if (accessibilityIssues.length > 0) {
    recommendations.push({
      id: 'accessibility-improvement',
      priority: 'medium',
      category: 'accessibility',
      title: 'Accessibility Score Enhancement',
      description: `Improve accessibility on ${accessibilityIssues.length} pages to meet WCAG 2.1 AA standards.`,
      impact: 'medium',
      effort: 'medium',
      timeline: '2-3 weeks',
      actions: [
        'Add proper alt text to all images and decorative elements',
        'Ensure sufficient color contrast ratios (4.5:1 for normal text)',
        'Implement proper heading hierarchy and semantic HTML',
        'Add ARIA labels and landmarks for screen readers',
        'Ensure keyboard navigation works for all interactive elements',
        'Add skip links and focus management',
      ],
      affectedPages: accessibilityIssues.map(p => p.page),
      expectedImpact: '+5-15 points to accessibility score, better user experience for all users',
      prerequisites: ['WCAG 2.1 AA knowledge', 'Screen reader testing tools'],
    });
  }

  return recommendations;
}

// Generate SEO recommendations
function generateSEORecommendations(patterns) {
  const recommendations = [];

  const seoIssues = patterns.seo.filter(p => p.trend === 'declining' || p.latestScore < 90);

  if (seoIssues.length > 0) {
    recommendations.push({
      id: 'seo-optimization',
      priority: 'high',
      category: 'seo',
      title: 'SEO Score Enhancement',
      description: `Improve SEO on ${seoIssues.length} pages to boost search engine rankings.`,
      impact: 'high',
      effort: 'low',
      timeline: '1-2 weeks',
      actions: [
        'Optimize meta descriptions to 120-160 characters',
        'Ensure all pages have proper canonical URLs',
        'Add structured data (JSON-LD) for better search understanding',
        'Optimize page titles (50-60 characters) with target keywords',
        'Improve internal linking structure',
        'Add Open Graph and Twitter Card metadata',
      ],
      affectedPages: seoIssues.map(p => p.page),
      expectedImpact: '+10-20 points to SEO score, improved search rankings',
      prerequisites: ['SEO knowledge', 'Google Search Console access'],
    });
  }

  return recommendations;
}

// Generate technical debt recommendations
function generateTechnicalDebtRecommendations(patterns, regressions) {
  const recommendations = [];

  if (regressions.length > 0) {
    recommendations.push({
      id: 'technical-debt-resolution',
      priority: 'high',
      category: 'technical-debt',
      title: 'Performance Regression Resolution',
      description: `Address ${regressions.length} performance regressions to maintain site quality.`,
      impact: 'high',
      effort: 'medium',
      timeline: '1-2 weeks',
      actions: [
        'Review recent code changes that may have impacted performance',
        'Roll back or optimize problematic changes',
        'Implement performance regression testing in CI/CD pipeline',
        'Add performance budgets for resource sizes',
        'Monitor bundle size changes with each deployment',
      ],
      affectedPages: regressions.map(r => r.page),
      expectedImpact: 'Restore previous performance levels, prevent future regressions',
      prerequisites: ['Version control analysis', 'Performance testing setup'],
    });
  }

  return recommendations;
}

// Generate monitoring and automation recommendations
function generateMonitoringRecommendations() {
  return [
    {
      id: 'continuous-monitoring',
      priority: 'medium',
      category: 'monitoring',
      title: 'Continuous Performance Monitoring',
      description: 'Set up automated monitoring to catch performance issues early.',
      impact: 'medium',
      effort: 'low',
      timeline: '1 week',
      actions: [
        'Configure weekly Lighthouse CI/CD checks',
        'Set up performance budgets and alerts',
        'Implement real user monitoring (RUM)',
        'Add performance regression testing to pull requests',
        'Create performance dashboards for stakeholders',
      ],
      affectedPages: ['all'],
      expectedImpact: 'Early detection of performance issues, proactive optimization',
      prerequisites: ['CI/CD pipeline access', 'Monitoring tools'],
    },
  ];
}

// Prioritize recommendations based on impact and effort
function prioritizeRecommendations(recommendations) {
  const priorityScores = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    info: 1,
  };

  return recommendations
    .map(rec => ({
      ...rec,
      priorityScore:
        (priorityScores[rec.priority] || 1) *
        (rec.impact === 'high' ? 1.5 : rec.impact === 'medium' ? 1.2 : 1),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

// Track recommendation implementation
function trackRecommendationProgress(previousRecommendations, currentRecommendations) {
  const implemented = previousRecommendations.filter(prev =>
    currentRecommendations.find(curr => curr.id === prev.id && curr.status === 'implemented')
  );

  const inProgress = previousRecommendations.filter(prev =>
    currentRecommendations.find(curr => curr.id === prev.id && curr.status === 'in-progress')
  );

  const newRecommendations = currentRecommendations.filter(
    curr => !previousRecommendations.find(prev => prev.id === curr.id)
  );

  return {
    implemented: implemented.length,
    inProgress: inProgress.length,
    new: newRecommendations.length,
    implementationRate:
      previousRecommendations.length > 0
        ? Math.round((implemented.length / previousRecommendations.length) * 100)
        : 0,
  };
}

// Generate monthly optimization report
function generateMonthlyReport(history, coreVitalsAnalysis) {
  console.log('🔍 Analyzing performance patterns...');
  const patterns = analyzeScorePatterns(history);

  console.log('💡 Generating recommendations...');
  const allRecommendations = [
    ...generatePerformanceRecommendations(patterns, coreVitalsAnalysis),
    ...generateAccessibilityRecommendations(patterns),
    ...generateSEORecommendations(patterns),
    ...generateTechnicalDebtRecommendations(patterns, patterns.regressions),
    ...generateMonitoringRecommendations(),
  ];

  const prioritizedRecommendations = prioritizeRecommendations(allRecommendations);

  console.log('📊 Tracking progress...');
  const previousRecommendations = loadPreviousRecommendations();
  const progress = trackRecommendationProgress(previousRecommendations, prioritizedRecommendations);

  // Generate summary
  const summary = {
    month: CONFIG.currentMonth,
    totalRecommendations: prioritizedRecommendations.length,
    highPriority: prioritizedRecommendations.filter(
      r => r.priority === 'high' || r.priority === 'critical'
    ).length,
    mediumPriority: prioritizedRecommendations.filter(r => r.priority === 'medium').length,
    lowPriority: prioritizedRecommendations.filter(r => r.priority === 'low').length,
    progress,
    overallAssessment: generateOverallAssessment(patterns, prioritizedRecommendations),
  };

  const report = {
    timestamp: new Date().toISOString(),
    summary,
    patterns,
    recommendations: prioritizedRecommendations.slice(0, 10), // Top 10 recommendations
    allRecommendations: prioritizedRecommendations,
    implementationTimeline: generateImplementationTimeline(prioritizedRecommendations),
    successMetrics: generateSuccessMetrics(prioritizedRecommendations),
  };

  // Save recommendations
  saveRecommendations(report.recommendations);

  return report;
}

// Generate overall assessment
function generateOverallAssessment(patterns, recommendations) {
  const criticalIssues = recommendations.filter(r => r.priority === 'critical').length;
  const regressions = patterns.regressions.filter(r => r.severity === 'critical').length;

  if (criticalIssues > 0 || regressions > 0) {
    return 'Critical performance issues require immediate attention';
  } else if (recommendations.filter(r => r.priority === 'high').length > 3) {
    return 'Multiple high-priority optimizations needed';
  } else if (recommendations.length > 5) {
    return 'Regular optimization maintenance required';
  } else {
    return 'Performance is well-maintained, focus on monitoring';
  }
}

// Generate implementation timeline
function generateImplementationTimeline(recommendations) {
  const timeline = {
    immediate: recommendations.filter(r => r.priority === 'critical'),
    thisMonth: recommendations.filter(r => r.priority === 'high'),
    nextMonth: recommendations.filter(r => r.priority === 'medium'),
    ongoing: recommendations.filter(r => r.priority === 'low' || r.category === 'monitoring'),
  };

  return timeline;
}

// Generate success metrics for tracking
function generateSuccessMetrics(recommendations) {
  return {
    performanceScoreIncrease: 'Target: +10 points',
    lcpReduction: 'Target: < 2.5s',
    clsReduction: 'Target: < 0.1',
    fidImprovement: 'Target: < 100ms',
    accessibilityScore: 'Target: 95+',
    seoScore: 'Target: 95+',
    regressionReduction: 'Target: 0 regressions per month',
  };
}

// Generate markdown report
function generateMarkdownReport(report) {
  const sections = [];

  sections.push(`# Monthly Lighthouse Optimization Report`);
  sections.push(`**Month:** ${report.summary.month}`);
  sections.push(`**Generated:** ${new Date(report.timestamp).toLocaleDateString()}`);
  sections.push('');

  // Executive Summary
  sections.push('## 📊 Executive Summary');
  sections.push(`**Overall Assessment:** ${report.summary.overallAssessment}`);
  sections.push(`**Total Recommendations:** ${report.summary.totalRecommendations}`);
  sections.push(`**Implementation Rate:** ${report.summary.progress.implementationRate}%`);
  sections.push('');

  // Priority Breakdown
  sections.push('## 🎯 Priority Breakdown');
  sections.push(`- 🔴 Critical/High: ${report.summary.highPriority}`);
  sections.push(`- 🟡 Medium: ${report.summary.mediumPriority}`);
  sections.push(`- 🔵 Low: ${report.summary.lowPriority}`);
  sections.push('');

  // Top Recommendations
  sections.push('## 💡 Top 5 Recommendations');
  report.recommendations.slice(0, 5).forEach((rec, index) => {
    const priorityIcon =
      rec.priority === 'critical'
        ? '🔴'
        : rec.priority === 'high'
          ? '🟠'
          : rec.priority === 'medium'
            ? '🟡'
            : '🔵';
    sections.push(`### ${index + 1}. ${priorityIcon} ${rec.title}`);
    sections.push(
      `**Priority:** ${rec.priority} | **Impact:** ${rec.impact} | **Effort:** ${rec.effort}`
    );
    sections.push(`**Timeline:** ${rec.timeline}`);
    sections.push(`**Description:** ${rec.description}`);
    sections.push(`**Expected Impact:** ${rec.expectedImpact}`);
    sections.push(`**Affected Pages:** ${rec.affectedPages.join(', ')}`);
    sections.push('');
  });

  // Implementation Timeline
  sections.push('## 📅 Implementation Timeline');
  sections.push('### Immediate (This Week)');
  if (report.implementationTimeline.immediate.length > 0) {
    report.implementationTimeline.immediate.forEach(rec => {
      sections.push(`- ${rec.title}`);
    });
  } else {
    sections.push('- No immediate critical issues');
  }
  sections.push('');

  sections.push('### This Month');
  if (report.implementationTimeline.thisMonth.length > 0) {
    report.implementationTimeline.thisMonth.forEach(rec => {
      sections.push(`- ${rec.title}`);
    });
  } else {
    sections.push('- No high-priority items this month');
  }
  sections.push('');

  // Success Metrics
  sections.push('## 📈 Success Metrics');
  Object.entries(report.successMetrics).forEach(([metric, target]) => {
    sections.push(`- **${metric}:** ${target}`);
  });
  sections.push('');

  return sections.join('\n');
}

// Main execution
async function main() {
  console.log('🚀 Generating monthly optimization recommendations...\n');

  // Load data
  const history = loadHistory();
  if (history.length === 0) {
    console.log('❌ No historical data found. Run Lighthouse tracking first.');
    return;
  }

  const coreVitalsAnalysis = loadCoreVitalsAnalysis();

  console.log(`📊 Analyzing ${history.length} historical measurements`);

  // Generate report
  const report = generateMonthlyReport(history, coreVitalsAnalysis);

  // Save detailed report
  const reportPath = path.join(
    CONFIG.reportsDir,
    `monthly-recommendations-${CONFIG.currentMonth}.json`
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Save markdown report
  const markdownPath = path.join(CONFIG.reportsDir, `monthly-report-${CONFIG.currentMonth}.md`);
  fs.writeFileSync(markdownPath, generateMarkdownReport(report));

  // Print summary
  console.log('\n📋 Monthly Optimization Summary:');
  console.log(`🎯 Total Recommendations: ${report.summary.totalRecommendations}`);
  console.log(`🔴 High Priority: ${report.summary.highPriority}`);
  console.log(`🟡 Medium Priority: ${report.summary.mediumPriority}`);
  console.log(`🔵 Low Priority: ${report.summary.lowPriority}`);
  console.log(`📊 Implementation Rate: ${report.summary.progress.implementationRate}%`);
  console.log(`📈 Overall Assessment: ${report.summary.overallAssessment}`);

  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  console.log(`📝 Markdown report saved to: ${markdownPath}`);
  console.log(`💾 Recommendations saved to: ${CONFIG.recommendationsFile}`);

  return report;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as generateMonthlyRecommendations };
