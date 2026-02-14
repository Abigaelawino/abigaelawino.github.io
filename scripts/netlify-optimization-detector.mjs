#!/usr/bin/env node

/**
 * Netlify Optimization Opportunities Detector
 *
 * Analyzes build data and performance metrics to identify specific
 * optimization opportunities with actionable recommendations.
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const REPORTS_DIR = '.netlify-reports';

/**
 * Optimization Opportunities Detector
 */
class OptimizationDetector {
  constructor() {
    this.opportunities = [];
    this.categories = {
      build_performance: [],
      dependency_management: [],
      function_optimization: [],
      configuration_optimization: [],
      cost_optimization: [],
      reliability_optimization: [],
    };
  }

  /**
   * Analyze build performance for optimization opportunities
   */
  analyzeBuildPerformance(builds, trends) {
    const opportunities = [];

    // Analyze build time patterns
    const buildTimes = builds.map(b => b.duration || 0).filter(t => t > 0);
    if (buildTimes.length === 0) return opportunities;

    const avgBuildTime = buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length;
    const maxBuildTime = Math.max(...buildTimes);

    // Slow build detection
    if (avgBuildTime > 180000) {
      // 3 minutes
      opportunities.push({
        category: 'build_performance',
        priority: 'high',
        title: 'Build Time Optimization',
        description: `Average build time is ${Math.round(avgBuildTime / 1000)}s (exceeds 3min optimal threshold)`,
        potential_savings: `${Math.round((avgBuildTime - 120000) / 1000)}s per build`,
        implementation_effort: 'medium',
        recommendations: [
          'Implement Netlify build caching with npm cache',
          'Use package-lock.json for consistent dependency resolution',
          'Optimize Next.js build configuration with incremental builds',
          'Consider moving heavy operations to Netlify Functions',
          'Review and remove unused dependencies',
        ],
        expected_impact: {
          build_time_reduction: '30-50%',
          developer_productivity: 'High',
          deployment_frequency: 'Increased',
        },
      });
    }

    // Build time variability
    const stdDev = Math.sqrt(
      buildTimes.reduce((sq, n) => sq + Math.pow(n - avgBuildTime, 2), 0) / buildTimes.length
    );
    const variability = stdDev / avgBuildTime;

    if (variability > 0.3) {
      opportunities.push({
        category: 'build_performance',
        priority: 'medium',
        title: 'Build Time Consistency',
        description: `Build time variability is ${(variability * 100).toFixed(1)}% (exceeds 30% threshold)`,
        potential_savings: 'More predictable build times',
        implementation_effort: 'low',
        recommendations: [
          'Stabilize dependency versions in package.json',
          'Implement deterministic build processes',
          'Add build performance monitoring and alerts',
          "Use Netlify's build plugins for optimization",
        ],
        expected_impact: {
          predictability: 'High',
          troubleshooting_time: 'Reduced',
          planning_accuracy: 'Improved',
        },
      });
    }

    // Build failure patterns
    const failedBuilds = builds.filter(b => b.state !== 'ready');
    const failureRate = failedBuilds.length / builds.length;

    if (failureRate > 0.1) {
      // 10% failure rate
      const errorPatterns = this.analyzeErrorPatterns(failedBuilds);

      opportunities.push({
        category: 'reliability_optimization',
        priority: 'high',
        title: 'Build Reliability Improvement',
        description: `Build failure rate is ${(failureRate * 100).toFixed(1)}% (exceeds 10% threshold)`,
        potential_savings: `Up to ${(failureRate * 100).toFixed(1)}% fewer failed deployments`,
        implementation_effort: 'medium',
        recommendations: [
          'Implement pre-commit hooks for code validation',
          'Add comprehensive testing in CI pipeline',
          'Review and fix recurring error patterns',
          'Implement canary deployments for risky changes',
          'Add better error handling and logging',
        ].concat(errorPatterns),
        expected_impact: {
          reliability: 'High',
          deployment_confidence: 'Increased',
          developer_time_saved: 'High',
        },
      });
    }

    return opportunities;
  }

  /**
   * Analyze error patterns to provide specific recommendations
   */
  analyzeErrorPatterns(failedBuilds) {
    const patterns = [];
    const errorTypes = {};

    failedBuilds.forEach(build => {
      if (build.error_message) {
        const type = this.categorizeError(build.error_message);
        errorTypes[type] = (errorTypes[type] || 0) + 1;
      }
    });

    Object.entries(errorTypes).forEach(([type, count]) => {
      switch (type) {
        case 'dependency_issue':
          patterns.push('Audit and update dependencies, implement stricter package management');
          break;
        case 'timeout':
          patterns.push('Optimize build performance, implement better timeout handling');
          break;
        case 'memory_issue':
          patterns.push('Optimize memory usage, implement build caching');
          break;
        case 'code_error':
          patterns.push('Strengthen code review process, add more automated testing');
          break;
        default:
          patterns.push(`Address ${type} issues with targeted improvements`);
      }
    });

    return [...new Set(patterns)];
  }

  /**
   * Categorize errors for pattern analysis
   */
  categorizeError(errorMessage) {
    const message = errorMessage.toLowerCase();

    if (message.includes('dependency') || message.includes('npm install')) {
      return 'dependency_issue';
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'timeout';
    }
    if (message.includes('memory') || message.includes('out of memory')) {
      return 'memory_issue';
    }
    if (message.includes('type') || message.includes('syntax')) {
      return 'code_error';
    }

    return 'other';
  }

  /**
   * Analyze function performance for optimization opportunities
   */
  analyzeFunctionPerformance(functions, builds) {
    const opportunities = [];

    if (!functions || Object.keys(functions).length === 0) {
      return opportunities;
    }

    const functionData = Object.entries(functions);

    // Large function optimization
    const largeFunctions = functionData.filter(([, data]) => data.size && data.size > 1024 * 1024); // > 1MB
    if (largeFunctions.length > 0) {
      opportunities.push({
        category: 'function_optimization',
        priority: 'high',
        title: 'Function Size Optimization',
        description: `${largeFunctions.length} functions exceed 1MB size limit`,
        potential_savings: `${Math.round(largeFunctions.reduce((total, [, data]) => total + data.size, 0) / 1024 / 1024)}MB reduced bundle size`,
        implementation_effort: 'medium',
        recommendations: [
          'Implement code splitting and tree shaking',
          'Remove unused dependencies and imports',
          'Use edge functions for lightweight operations',
          'Optimize static assets and external dependencies',
          'Consider using Netlify Blobs for large file storage',
        ],
        expected_impact: {
          cold_start_time: 'Reduced',
          function_performance: 'Improved',
          bandwidth_usage: 'Reduced',
        },
      });
    }

    // Function count optimization
    if (functionData.length > 20) {
      opportunities.push({
        category: 'function_optimization',
        priority: 'medium',
        title: 'Function Architecture Optimization',
        description: `${functionData.length} functions detected (consider consolidation)`,
        potential_savings: 'Simplified architecture and maintenance',
        implementation_effort: 'high',
        recommendations: [
          'Consolidate related functions into cohesive units',
          'Use Next.js API routes for simple operations',
          'Implement a microservice pattern for complex operations',
          'Review function necessity and eliminate redundancies',
        ],
        expected_impact: {
          maintenance_complexity: 'Reduced',
          deployment_time: 'Improved',
          debugging_simplicity: 'Improved',
        },
      });
    }

    return opportunities;
  }

  /**
   * Analyze configuration and deployment optimizations
   */
  analyzeConfigurationOptimization(trends, builds) {
    const opportunities = [];

    // Caching optimization
    opportunities.push({
      category: 'configuration_optimization',
      priority: 'medium',
      title: 'Caching Strategy Enhancement',
      description: 'Implement comprehensive caching for better performance',
      potential_savings: 'Significant build time reduction',
      implementation_effort: 'low',
      recommendations: [
        'Enable Netlify build caching with proper cache directories',
        'Implement browser caching headers for static assets',
        'Use Next.js incremental Static Regeneration (ISR)',
        'Configure CDN caching for API responses',
        'Implement client-side caching strategies',
      ],
      expected_impact: {
        build_time: 'Reduced 40-60%',
        user_experience: 'Improved',
        bandwidth_costs: 'Reduced',
      },
    });

    // Environment optimization
    if (builds.length > 0) {
      const environmentIssues = [];

      builds.forEach(build => {
        if (build.duration > 300000) {
          // 5 minutes
          environmentIssues.push('Long build times suggest environment optimization needed');
        }
        if (build.error_message && build.error_message.includes('timeout')) {
          environmentIssues.push('Timeout errors suggest resource constraints');
        }
      });

      if (environmentIssues.length > 0) {
        opportunities.push({
          category: 'configuration_optimization',
          priority: 'medium',
          title: 'Environment Configuration Optimization',
          description: 'Optimize build environment for better performance',
          potential_savings: 'Improved build reliability and speed',
          implementation_effort: 'low',
          recommendations: [
            'Configure optimal Node.js memory limits in netlify.toml',
            'Use appropriate build environment variables',
            'Optimize Next.js build configuration',
            'Implement proper environment-specific optimizations',
          ],
          expected_impact: {
            build_stability: 'Improved',
            performance: 'Enhanced',
            resource_usage: 'Optimized',
          },
        });
      }
    }

    return opportunities;
  }

  /**
   * Analyze cost optimization opportunities
   */
  analyzeCostOptimization(trends, builds) {
    const opportunities = [];

    // Build time cost optimization
    if (builds.length > 0) {
      const totalBuildTime = builds.reduce((total, build) => total + (build.duration || 0), 0);
      const avgBuildTime = totalBuildTime / builds.length;

      if (avgBuildTime > 180000) {
        // 3 minutes
        opportunities.push({
          category: 'cost_optimization',
          priority: 'medium',
          title: 'Build Cost Optimization',
          description: `Average build time of ${Math.round(avgBuildTime / 1000)}s suggests cost optimization opportunity`,
          potential_savings: 'Reduced build minutes usage',
          implementation_effort: 'medium',
          recommendations: [
            'Optimize build process to reduce build minutes',
            'Implement build caching to avoid redundant operations',
            'Use more efficient build tools and processes',
            'Consider upgrading to higher-tier plan for better performance',
            'Optimize dependency management for faster installs',
          ],
          expected_impact: {
            build_costs: 'Reduced',
            developer_productivity: 'Increased',
            ci_cd_efficiency: 'Improved',
          },
        });
      }
    }

    // Function usage optimization
    if (trends.function_trends && trends.function_trends.function_growth_trend === 'increasing') {
      opportunities.push({
        category: 'cost_optimization',
        priority: 'low',
        title: 'Function Usage Optimization',
        description: 'Increasing function count suggests review for cost optimization',
        potential_savings: 'Optimized function usage and costs',
        implementation_effort: 'low',
        recommendations: [
          'Review function necessity and consolidate where possible',
          'Implement function caching to reduce invocations',
          'Use edge functions for cost-effective operations',
          'Monitor function usage patterns and optimize accordingly',
          'Consider function warm-up strategies for frequently used functions',
        ],
        expected_impact: {
          operational_costs: 'Optimized',
          resource_efficiency: 'Improved',
          performance: 'Maintained or improved',
        },
      });
    }

    return opportunities;
  }

  /**
   * Generate comprehensive optimization report
   */
  generateOptimizationReport(opportunities) {
    const report = [];

    // Categorize opportunities
    opportunities.forEach(opp => {
      this.categories[opp.category].push(opp);
    });

    // Sort by priority within each category
    Object.keys(this.categories).forEach(category => {
      this.categories[category].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    });

    // Generate report
    report.push('# Netlify Optimization Opportunities Report');
    report.push('');
    report.push(`**Generated:** ${new Date().toLocaleString()}`);
    report.push(`**Total Opportunities:** ${opportunities.length}`);
    report.push(
      `**High Priority:** ${this.categories.build_performance.filter(o => o.priority === 'high').length + this.categories.function_optimization.filter(o => o.priority === 'high').length}`
    );
    report.push('');

    // Executive Summary
    report.push('## Executive Summary');
    report.push('');
    const highPriorityCount = opportunities.filter(o => o.priority === 'high').length;
    const mediumPriorityCount = opportunities.filter(o => o.priority === 'medium').length;
    const lowPriorityCount = opportunities.filter(o => o.priority === 'low').length;

    report.push(`- **High Priority Opportunities:** ${highPriorityCount}`);
    report.push(`- **Medium Priority Opportunities:** ${mediumPriorityCount}`);
    report.push(`- **Low Priority Opportunities:** ${lowPriorityCount}`);
    report.push('');

    if (highPriorityCount > 0) {
      report.push(
        '🚨 **Immediate Action Required:** Address high priority opportunities first for maximum impact.'
      );
      report.push('');
    } else if (mediumPriorityCount > 0) {
      report.push(
        '⚠️ **Review Recommended:** Medium priority opportunities offer good ROI with moderate effort.'
      );
      report.push('');
    } else {
      report.push('✅ **Good Performance:** No critical optimization opportunities detected.');
      report.push('');
    }

    // Detailed opportunities by category
    Object.entries(this.categories).forEach(([category, categoryOpportunities]) => {
      if (categoryOpportunities.length === 0) return;

      report.push(`## ${category.replace('_', ' ').toUpperCase()}`);
      report.push('');

      categoryOpportunities.forEach((opp, index) => {
        const priority = opp.priority === 'high' ? '🔴' : opp.priority === 'medium' ? '🟡' : '🟢';
        report.push(`### ${index + 1}. ${priority} ${opp.title}`);
        report.push(`**Priority:** ${opp.priority.toUpperCase()}`);
        report.push(`**Description:** ${opp.description}`);
        report.push(`**Potential Savings:** ${opp.potential_savings}`);
        report.push(`**Implementation Effort:** ${opp.implementation_effort.toUpperCase()}`);
        report.push('');

        if (opp.recommendations && opp.recommendations.length > 0) {
          report.push('**Recommendations:**');
          opp.recommendations.forEach(rec => {
            report.push(`- ${rec}`);
          });
          report.push('');
        }

        if (opp.expected_impact) {
          report.push('**Expected Impact:**');
          Object.entries(opp.expected_impact).forEach(([key, value]) => {
            report.push(
              `- ${key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}`
            );
          });
          report.push('');
        }
      });
    });

    // Implementation Roadmap
    report.push('## Implementation Roadmap');
    report.push('');

    const roadmap = {
      'Immediate (1-2 weeks)': opportunities.filter(o => o.priority === 'high'),
      'Short-term (1 month)': opportunities.filter(o => o.priority === 'medium'),
      'Long-term (2-3 months)': opportunities.filter(o => o.priority === 'low'),
    };

    Object.entries(roadmap).forEach(([timeframe, timeOpps]) => {
      if (timeOpps.length > 0) {
        report.push(`### ${timeframe}`);
        timeOpps.forEach(opp => {
          report.push(`- **${opp.title}** (${opp.category})`);
        });
        report.push('');
      }
    });

    // Success Metrics
    report.push('## Success Metrics');
    report.push('');
    report.push('Track the following metrics to measure optimization success:');
    report.push('');
    report.push('- **Build Time:** Average build duration should decrease by 30-50%');
    report.push('- **Success Rate:** Target >95% build success rate');
    report.push('- **Function Performance:** Cold start times < 1s');
    report.push('- **Cost Efficiency:** Reduce build minutes usage');
    report.push('- **Developer Productivity:** Faster iteration cycles');
    report.push('');

    return report.join('\n');
  }

  /**
   * Run complete optimization analysis
   */
  async runOptimizationAnalysis() {
    try {
      console.log('🔍 Starting optimization opportunities analysis...');

      // Load existing analysis data
      let builds = [];
      let trends = null;
      let functions = {};

      try {
        const analysisData = await readFile(join(REPORTS_DIR, 'detailed-analysis.json'), 'utf8');
        const analysis = JSON.parse(analysisData);
        builds = analysis.analyses || [];
        trends = analysis.current_metrics || analysis.trends;
        functions = analysis.function_analysis?.performance_by_function || {};
      } catch (error) {
        console.warn('⚠️  Could not load detailed analysis data');
      }

      try {
        const trendsData = await readFile(join(REPORTS_DIR, 'performance-trends.json'), 'utf8');
        const trendsObj = JSON.parse(trendsData);
        trends = trendsObj.trends || trends;
      } catch (error) {
        console.warn('⚠️  Could not load trends data');
      }

      if (builds.length === 0 && !trends) {
        console.log('ℹ️  No data available for optimization analysis');
        return;
      }

      // Run all optimization analyses
      const allOpportunities = [];

      if (builds.length > 0) {
        allOpportunities.push(...this.analyzeBuildPerformance(builds, trends));
      }

      if (Object.keys(functions).length > 0) {
        allOpportunities.push(...this.analyzeFunctionPerformance(functions, builds));
      }

      if (trends) {
        allOpportunities.push(...this.analyzeConfigurationOptimization(trends, builds));
        allOpportunities.push(...this.analyzeCostOptimization(trends, builds));
      }

      // Add some general optimization recommendations
      allOpportunities.push(...this.getGeneralOptimizations());

      // Generate and save report
      const report = this.generateOptimizationReport(allOpportunities);
      await writeFile(join(REPORTS_DIR, 'optimization-opportunities.md'), report);

      // Save structured data
      const structuredReport = {
        timestamp: new Date().toISOString(),
        total_opportunities: allOpportunities.length,
        categories: this.categories,
        opportunities: allOpportunities,
      };
      await writeFile(
        join(REPORTS_DIR, 'optimization-analysis.json'),
        JSON.stringify(structuredReport, null, 2)
      );

      console.log(`✓ Found ${allOpportunities.length} optimization opportunities`);
      console.log(`✓ High priority: ${allOpportunities.filter(o => o.priority === 'high').length}`);
      console.log(
        `✓ Medium priority: ${allOpportunities.filter(o => o.priority === 'medium').length}`
      );
      console.log(`✓ Low priority: ${allOpportunities.filter(o => o.priority === 'low').length}`);
      console.log(`✓ Report saved to .netlify-reports/optimization-opportunities.md`);

      return allOpportunities;
    } catch (error) {
      console.error('❌ Optimization analysis failed:', error.message);
      return [];
    }
  }

  /**
   * Get general optimization recommendations
   */
  getGeneralOptimizations() {
    return [
      {
        category: 'build_performance',
        priority: 'low',
        title: 'Regular Performance Monitoring',
        description: 'Establish ongoing performance monitoring and alerting',
        potential_savings: 'Proactive issue detection and resolution',
        implementation_effort: 'low',
        recommendations: [
          'Set up performance alerts for build time thresholds',
          'Implement weekly performance review meetings',
          'Track key metrics over time for trend analysis',
          'Establish performance budgets for new features',
        ],
        expected_impact: {
          issue_detection_time: 'Reduced',
          performance_awareness: 'Increased',
          proactive_optimization: 'Improved',
        },
      },
    ];
  }
}

/**
 * Main execution function
 */
async function main() {
  const detector = new OptimizationDetector();

  try {
    const opportunities = await detector.runOptimizationAnalysis();

    if (opportunities.length > 0) {
      const highPriority = opportunities.filter(o => o.priority === 'high').length;
      if (highPriority > 0) {
        console.log(`\n🚨 ${highPriority} high priority optimization opportunities found`);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('❌ Optimization detection failed:', error.message);
    process.exit(1);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { OptimizationDetector };
