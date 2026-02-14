#!/usr/bin/env node

/**
 * Local Smoke Test - Tests built files directly without requiring a running server
 *
 * This script is useful for CI environments where you want to test the built
 * output without starting a server.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const distDir = './dist';

// Key pages to test
const pages = [
  { path: 'index.html', expectedContent: ['Abigael Awino'] },
  { path: 'about/index.html', expectedContent: ['About'] },
  { path: 'projects/index.html', expectedContent: ['Projects'] },
  { path: 'blog/index.html', expectedContent: ['Blog'] },
  { path: 'contact/index.html', expectedContent: ['Contact'] },
  { path: 'resume/index.html', expectedContent: ['Resume'] },
  { path: 'contact/thanks/index.html', expectedContent: ['Thank'] },
];

// Static assets to test
const assets = ['assets/og.png', 'robots.txt', 'sitemap.xml'];

// Error tracking
const errors = [];
let passed = 0;

// Test a page
function testPage(page) {
  const filePath = join(distDir, page.path);

  if (!existsSync(filePath)) {
    errors.push(`❌ Missing file: ${page.path}`);
    return false;
  }

  try {
    const content = readFileSync(filePath, 'utf8');

    const missingContent = page.expectedContent.filter(expected => !content.includes(expected));

    if (missingContent.length > 0) {
      errors.push(`❌ ${page.path} - Missing content: ${missingContent.join(', ')}`);
      return false;
    }

    console.log(`   ✅ ${page.path}`);
    return true;
  } catch (error) {
    errors.push(`❌ ${page.path} - Error reading file: ${error.message}`);
    return false;
  }
}

// Test an asset
function testAsset(asset) {
  const filePath = join(distDir, asset);

  if (!existsSync(filePath)) {
    errors.push(`❌ Missing asset: ${asset}`);
    return false;
  }

  console.log(`   ✅ ${asset}`);
  return true;
}

// Main execution
function runLocalSmokeTests() {
  console.log('🚀 Starting local smoke tests...');
  console.log(`📍 Testing built files in: ${distDir}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);

  // Test pages
  console.log('\n📄 Testing pages...');
  for (const page of pages) {
    if (testPage(page)) {
      passed++;
    }
  }

  // Test assets
  console.log('\n📁 Testing assets...');
  for (const asset of assets) {
    if (testAsset(asset)) {
      passed++;
    }
  }

  // Results
  const total = pages.length + assets.length;
  console.log('\n' + '='.repeat(60));
  console.log('📊 LOCAL SMOKE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n🚨 ERRORS:');
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  if (errors.length === 0) {
    console.log('\n🎉 All local smoke tests passed!');
    console.log('✅ Built files are ready for deployment');
  } else {
    console.log('\n💥 Local smoke tests failed!');
    console.log('🔧 Fix issues before deploying');
  }

  console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);

  // Exit with appropriate code
  process.exit(errors.length === 0 ? 0 : 1);
}

// Run the tests
runLocalSmokeTests().catch(error => {
  console.error('Local smoke test execution failed:', error);
  process.exit(1);
});
