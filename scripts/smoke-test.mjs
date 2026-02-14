#!/usr/bin/env node

/**
 * Smoke Test Script for Rendered Endpoints
 *
 * This script tests key URLs after each build/deploy cycle to confirm:
 * - HTTP 200 responses
 * - Expected content is present
 * - No broken paths
 *
 * Usage:
 *   node scripts/smoke-test.mjs [base-url] [--quick]
 *   node scripts/smoke-test.mjs http://localhost:3000
 *   node scripts/smoke-test.mjs https://abigael-awino-portfolio.netlify.app --quick
 *   npm run smoke-test  # tests local dev server
 *   npm run smoke-test:prod  # tests production site
 */

import { createHash } from 'crypto';

// Parse arguments
const args = process.argv.slice(2);
const baseUrl = args.find(arg => !arg.startsWith('--')) || 'http://localhost:3000';
const isQuickMode = args.includes('--quick');

// Key endpoints to test
const endpoints = [
  { path: '/', expectedContent: ['Abigael Awino'] },
  { path: '/about/', expectedContent: ['About'] },
  { path: '/projects/', expectedContent: ['Projects'] },
  { path: '/blog/', expectedContent: ['Blog'] },
  { path: '/contact/', expectedContent: ['Contact'] },
  { path: '/resume/', expectedContent: ['Resume'] },
  { path: '/contact/thanks/', expectedContent: ['Thank'] },
];

// API endpoints to test
const apiEndpoints = [
  { path: '/api/webhooks/build', method: 'POST', skipContentCheck: true }, // webhook, may not return 200 for GET
  { path: '/api/deployments', expectedContent: ['deployments'] },
  { path: '/api/sessions', expectedContent: ['sessions'] },
  { path: '/api/optimize', method: 'POST', skipContentCheck: true }, // POST endpoint
  { path: '/api/rate-limit', expectedContent: ['rate'] },
];

// Static assets to test
const staticAssets = [
  '/assets/og.png',
  '/robots.txt',
  '/sitemap.xml',
];

// Error log
const errors = [];
const warnings = [];

// Simple fetch function with timeout
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Test a single endpoint
async function testEndpoint(endpoint) {
  const url = `${baseUrl}${endpoint.path}`;
  const method = endpoint.method || 'GET';
  const options = method === 'POST' ? { method } : {};

  try {
    console.log(`\n🧪 Testing: ${method} ${url}`);

    const response = await fetchWithTimeout(url, options);
    const status = response.status;

    console.log(`   Status: ${status}`);

    if (status !== 200) {
      const error = `❌ ${method} ${url} - Status: ${status}`;
      errors.push(error);
      console.log(`   ${error}`);
      return false;
    }

    if (!endpoint.skipContentCheck && endpoint.expectedContent) {
      const text = await response.text();
      const missingContent = endpoint.expectedContent.filter(content =>
        !text.includes(content)
      );

      if (missingContent.length > 0) {
        const error = `❌ ${method} ${url} - Missing content: ${missingContent.join(', ')}`;
        errors.push(error);
        console.log(`   ${error}`);
        return false;
      }
    }

    console.log(`   ✅ ${method} ${url}`);
    return true;

  } catch (fetchError) {
    const error = `❌ ${method} ${url} - Error: ${fetchError.message}`;
    errors.push(error);
    console.log(`   ${error}`);
    return false;
  }
}

// Test static asset
async function testStaticAsset(asset) {
  const url = `${baseUrl}${asset}`;

  try {
    console.log(`\n🖼️  Testing asset: ${url}`);

    const response = await fetchWithTimeout(url);
    const status = response.status;

    console.log(`   Status: ${status}`);

    if (status !== 200) {
      const error = `❌ GET ${url} - Status: ${status}`;
      errors.push(error);
      console.log(`   ${error}`);
      return false;
    }

    console.log(`   ✅ GET ${url}`);
    return true;

  } catch (fetchError) {
    const error = `❌ GET ${url} - Error: ${fetchError.message}`;
    errors.push(error);
    console.log(`   ${error}`);
    return false;
  }
}

// Check for redirect loops and chains
async function checkRedirects() {
  console.log('\n🔄 Checking for redirect loops...');

  const testUrls = [
    '/about',
    '/projects',
    '/blog',
    '/contact',
    '/resume',
  ];

  for (const path of testUrls) {
    const url = `${baseUrl}${path}`;
    const visited = new Set();
    let currentUrl = url;
    let redirectCount = 0;
    const maxRedirects = 10;

    try {
      while (redirectCount < maxRedirects) {
        if (visited.has(currentUrl)) {
          const warning = `⚠️  Redirect loop detected for ${path}`;
          warnings.push(warning);
          console.log(`   ${warning}`);
          break;
        }

        visited.add(currentUrl);

        const response = await fetchWithTimeout(currentUrl, { redirect: 'manual' });

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (location) {
            currentUrl = location.startsWith('http') ? location : `${baseUrl}${location}`;
            redirectCount++;
            continue;
          }
        }

        // No more redirects
        if (redirectCount > 0) {
          console.log(`   ✅ ${path} - ${redirectCount} redirect(s)`);
        }
        break;

      }

      if (redirectCount >= maxRedirects) {
        const warning = `⚠️  Too many redirects (${redirectCount}) for ${path}`;
        warnings.push(warning);
        console.log(`   ${warning}`);
      }

    } catch (error) {
      const warning = `⚠️  Error checking redirects for ${path}: ${error.message}`;
      warnings.push(warning);
      console.log(`   ${warning}`);
    }
  }
}

// Main execution
async function runSmokeTests() {
  console.log('🚀 Starting smoke tests...');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);

  let passed = 0;
  let total = 0;

  // Test main endpoints
  console.log('\n📄 Testing main endpoints...');
  for (const endpoint of endpoints) {
    total++;
    if (await testEndpoint(endpoint)) {
      passed++;
    }
  }

// Test API endpoints (skip in quick mode)
  if (!isQuickMode) {
    console.log('\n🔌 Testing API endpoints...');
    for (const endpoint of apiEndpoints) {
      total++;
      if (await testEndpoint(endpoint)) {
        passed++;
      }
    }
  }

  // Test static assets (skip in quick mode)
  if (!isQuickMode) {
    console.log('\n📁 Testing static assets...');
    for (const asset of staticAssets) {
      total++;
      if (await testStaticAsset(asset)) {
        passed++;
      }
    }
  }

  // Check redirects (skip in quick mode)
  if (!isQuickMode) {
    await checkRedirects();
  }

  // Results
  console.log('\n' + '='.repeat(60));
  console.log('📊 SMOKE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Errors: ${errors.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n🚨 ERRORS:');
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }

  if (errors.length === 0) {
    console.log('\n🎉 All smoke tests passed!');
    console.log('✅ Site is ready for production');
  } else {
    console.log('\n💥 Smoke tests failed!');
    console.log('🔧 Fix issues before deploying to production');
  }

  console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);

  // Exit with appropriate code
  process.exit(errors.length === 0 ? 0 : 1);
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the tests
runSmokeTests().catch(error => {
  console.error('Smoke test execution failed:', error);
  process.exit(1);
});
