#!/usr/bin/env node

/**
 * Comprehensive Dependency Security Scanner
 *
 * Performs weekly security vulnerability scans with automated patch capabilities
 * and notification system for high-risk issues.
 *
 * Features:
 * - Automated dependency vulnerability scanning
 * - Risk-based vulnerability classification
 * - Automated patching for low-risk vulnerabilities
 * - Human review recommendations for high-risk issues
 * - Notification system with detailed reports
 * - Integration with GitHub security advisories
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Configuration
const CONFIG = {
  // Risk levels and their handling
  RISK_LEVELS: {
    LOW: {
      severity: ['low', 'moderate'],
      autoPatch: true,
      requireReview: false,
      maxSeverity: 7,
    },
    MEDIUM: {
      severity: ['moderate'],
      autoPatch: false,
      requireReview: true,
      maxSeverity: 6,
    },
    HIGH: {
      severity: ['high', 'critical'],
      autoPatch: false,
      requireReview: true,
      maxSeverity: 4,
    },
  },

  // Safe packages that can be auto-patched even with higher severity
  SAFE_PACKAGES: [
    '@types/*',
    'eslint-*',
    'prettier',
    'jest',
    'vitest',
    'chalk',
    'rimraf',
    'cross-env',
  ],

  // Packages that require manual review regardless of severity
  CRITICAL_PACKAGES: [
    'next',
    'react',
    'react-dom',
    'express',
    'jsonwebtoken',
    'bcrypt',
    'passport',
  ],
};

/**
 * Parse and categorize npm audit output
 */
function parseAuditResults(auditData) {
  const vulnerabilities = auditData.vulnerabilities || {};
  const categorized = {
    low: [],
    moderate: [],
    high: [],
    critical: [],
    total: 0,
    autoPatchable: [],
    requireReview: [],
  };

  Object.entries(vulnerabilities).forEach(([packageName, vuln]) => {
    categorized[vuln.severity].push({
      package: packageName,
      severity: vuln.severity,
      title: vuln.title,
      url: vuln.url,
      fixAvailable: vuln.fixAvailable,
      isDirect: vuln.direct,
      via: vuln.via,
    });
    categorized.total++;
  });

  // Categorize based on risk levels
  Object.values(categorized.low).forEach(vuln => {
    if (CONFIG.RISK_LEVELS.LOW.severity.includes(vuln.severity)) {
      if (shouldAutoPatch(vuln)) {
        categorized.autoPatchable.push(vuln);
      } else {
        categorized.requireReview.push(vuln);
      }
    }
  });

  Object.values(categorized.moderate).forEach(vuln => {
    if (CONFIG.RISK_LEVELS.MEDIUM.severity.includes(vuln.severity)) {
      if (shouldAutoPatch(vuln)) {
        categorized.autoPatchable.push(vuln);
      } else {
        categorized.requireReview.push(vuln);
      }
    }
  });

  Object.values(categorized.high)
    .concat(Object.values(categorized.critical))
    .forEach(vuln => {
      if (CONFIG.RISK_LEVELS.HIGH.severity.includes(vuln.severity)) {
        categorized.requireReview.push(vuln);
      }
    });

  return categorized;
}

/**
 * Determine if a vulnerability can be auto-patched
 */
function shouldAutoPatch(vulnerability) {
  const { package: pkg, fixAvailable, severity } = vulnerability;

  if (!fixAvailable || fixAvailable === false) {
    return false;
  }

  // Check if it's a safe package
  const isSafePackage = CONFIG.SAFE_PACKAGES.some(safe => {
    if (safe.endsWith('*')) {
      return pkg.startsWith(safe.slice(0, -1));
    }
    return pkg === safe;
  });

  // Check if it's a critical package that requires review
  const isCriticalPackage = CONFIG.CRITICAL_PACKAGES.includes(pkg);

  // Auto-patch if safe package and severity is within limits
  if (isSafePackage && CONFIG.RISK_LEVELS.LOW.severity.includes(severity)) {
    return true;
  }

  // Don't auto-patch critical packages
  if (isCriticalPackage) {
    return false;
  }

  // Auto-patch low and moderate vulnerabilities for non-critical packages
  return CONFIG.RISK_LEVELS.LOW.severity.includes(severity);
}

/**
 * Execute automated patching for safe vulnerabilities
 */
function performAutoPatch(patchableVulns) {
  if (patchableVulns.length === 0) {
    console.log('✅ No vulnerabilities eligible for auto-patching');
    return { patched: [], failed: [] };
  }

  const patched = [];
  const failed = [];

  patchableVulns.forEach(vuln => {
    try {
      console.log(`🔧 Auto-patching ${vuln.package} (${vuln.severity})`);
      execSync(`npm install ${vuln.package}@latest`, { stdio: 'pipe' });
      patched.push(vuln);
      console.log(`✅ Successfully patched ${vuln.package}`);
    } catch (error) {
      console.error(`❌ Failed to patch ${vuln.package}: ${error.message}`);
      failed.push({ ...vuln, error: error.message });
    }
  });

  return { patched, failed };
}

/**
 * Generate detailed security report
 */
function generateSecurityReport(categorized, patchResults, timestamp) {
  const { autoPatchable, requireReview, low, moderate, high, critical, total } = categorized;
  const { patched, failed } = patchResults;

  const report = {
    scanDate: timestamp,
    summary: {
      totalVulnerabilities: total,
      autoPatched: patched.length,
      patchFailed: failed.length,
      requireReview: requireReview.length,
      riskLevel: total === 0 ? 'SECURE' : total < 5 ? 'LOW' : total < 15 ? 'MEDIUM' : 'HIGH',
    },
    breakdown: {
      low: low.length,
      moderate: moderate.length,
      high: high.length,
      critical: critical.length,
    },
    autoPatched: patched.map(v => ({
      package: v.package,
      severity: v.severity,
      title: v.title,
      url: v.url,
    })),
    patchFailures: failed.map(v => ({
      package: v.package,
      severity: v.severity,
      error: v.error,
    })),
    requireReview: requireReview.map(v => ({
      package: v.package,
      severity: v.severity,
      title: v.title,
      url: v.url,
      isDirect: v.isDirect,
      recommendation: getRecommendation(v),
    })),
  };

  return report;
}

/**
 * Get recommendation for vulnerability
 */
function getRecommendation(vulnerability) {
  const { package: pkg, severity, fixAvailable } = vulnerability;

  if (!fixAvailable) {
    return 'Monitor for updates from package maintainer';
  }

  if (CONFIG.CRITICAL_PACKAGES.includes(pkg)) {
    return 'CRITICAL: Manual review required before patching';
  }

  if (severity === 'critical') {
    return 'URGENT: Patch immediately after testing';
  }

  if (severity === 'high') {
    return 'HIGH: Review and patch within 3 days';
  }

  return 'Review during next maintenance window';
}

/**
 * Save security report
 */
function saveReport(report) {
  const reportsDir = join(process.cwd(), '.security-reports');
  const reportFile = join(reportsDir, `security-report-${report.scanDate}.json`);

  try {
    execSync(`mkdir -p ${reportsDir}`);
    writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📄 Security report saved to: ${reportFile}`);
    return reportFile;
  } catch (error) {
    console.error(`❌ Failed to save report: ${error.message}`);
    return null;
  }
}

/**
 * Print summary to console
 */
function printSummary(report) {
  const { summary, breakdown } = report;

  console.log('\n' + '='.repeat(60));
  console.log('🔍 DEPENDENCY SECURITY SCAN RESULTS');
  console.log('='.repeat(60));
  console.log(`📅 Scan Date: ${report.scanDate}`);
  console.log(`📊 Risk Level: ${summary.riskLevel}`);
  console.log(`🔢 Total Vulnerabilities: ${summary.totalVulnerabilities}`);

  console.log('\n📈 Breakdown:');
  console.log(`  • Low: ${breakdown.low}`);
  console.log(`  • Moderate: ${breakdown.moderate}`);
  console.log(`  • High: ${breakdown.high}`);
  console.log(`  • Critical: ${breakdown.critical}`);

  if (summary.autoPatched > 0) {
    console.log(`\n✅ Auto-Patched: ${summary.autoPatched} vulnerabilities`);
  }

  if (summary.patchFailed > 0) {
    console.log(`\n❌ Patch Failed: ${summary.patchFailed} vulnerabilities`);
  }

  if (summary.requireReview > 0) {
    console.log(`\n🔎 Require Review: ${summary.requireReview} vulnerabilities`);
    console.log('\nHigh Priority Review Items:');
    report.requireReview
      .filter(v => ['high', 'critical'].includes(v.severity))
      .slice(0, 5)
      .forEach(v => {
        console.log(`  • ${v.package} (${v.severity}): ${v.title}`);
      });
  }

  console.log('='.repeat(60));
}

/**
 * Main scan function
 */
function runSecurityScan() {
  const timestamp = new Date().toISOString().split('T')[0];
  console.log(`🔍 Starting dependency security scan for ${timestamp}...`);

  try {
    // Run npm audit to get vulnerabilities
    console.log('📥 Running npm audit...');
    const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
    const auditData = JSON.parse(auditOutput);

    // Parse and categorize vulnerabilities
    console.log('🔬 Analyzing vulnerabilities...');
    const categorized = parseAuditResults(auditData);

    // Perform automated patching
    console.log('🔧 Performing automated patching...');
    const patchResults = performAutoPatch(categorized.autoPatchable);

    // Generate report
    const report = generateSecurityReport(categorized, patchResults, timestamp);

    // Save report
    saveReport(report);

    // Print summary
    printSummary(report);

    // Return exit code based on findings
    if (categorized.critical.length > 0 || categorized.high.length > 0) {
      console.log('\n⚠️  HIGH/CRITICAL vulnerabilities found - manual review required');
      process.exit(1);
    } else if (categorized.moderate.length > 0) {
      console.log('\n⚠️  MODERATE vulnerabilities found - review recommended');
      process.exit(2);
    } else if (categorized.low.length > 0) {
      console.log('\n✅ LOW severity vulnerabilities found - auto-patching attempted');
      process.exit(0);
    } else {
      console.log('\n✅ No vulnerabilities found - all dependencies secure');
      process.exit(0);
    }
  } catch (error) {
    console.error(`❌ Security scan failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityScan();
}

export { runSecurityScan, parseAuditResults, shouldAutoPatch };
