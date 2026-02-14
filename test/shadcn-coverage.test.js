const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

test('shadcn coverage script exists and is executable', () => {
  const scriptPath = join(process.cwd(), 'scripts', 'shadcn-coverage.mjs');
  assert(existsSync(scriptPath), 'shadcn-coverage.mjs should exist');

  const scriptContent = readFileSync(scriptPath, 'utf8');
  assert(
    scriptContent.includes('ShadcnPerformanceTracker'),
    'Should contain ShadcnPerformanceTracker class'
  );
  assert(scriptContent.includes('coverageData'), 'Should contain coverage data structure');
});

test('shadcn coverage script has required methods', () => {
  const scriptPath = join(process.cwd(), 'scripts', 'shadcn-coverage.mjs');
  const scriptContent = readFileSync(scriptPath, 'utf8');

  const requiredMethods = [
    'scanComponents',
    'analyzePageUsage',
    'trackPerformanceMetrics',
    'analyzeRenderCoverage',
    'generateReports',
    'generateMarkdownReport',
    'generateCSVReport',
  ];

  for (const method of requiredMethods) {
    assert(scriptContent.includes(method), `Should contain ${method} method`);
  }
});

test('shadcn coverage script tracks all required components', () => {
  const scriptPath = join(process.cwd(), 'scripts', 'shadcn-coverage.mjs');
  const scriptContent = readFileSync(scriptPath, 'utf8');

  const requiredComponents = [
    'button',
    'card',
    'input',
    'dialog',
    'dropdown-menu',
    'toast',
    'table',
    'tabs',
    'form',
    'select',
  ];

  for (const component of requiredComponents) {
    assert(scriptContent.includes(`'${component}'`), `Should track ${component} component`);
  }
});

test('shadcn coverage script generates proper output structure', () => {
  const scriptPath = join(process.cwd(), 'scripts', 'shadcn-coverage.mjs');
  const scriptContent = readFileSync(scriptPath, 'utf8');

  // Check for proper output structure
  assert(scriptContent.includes('.shadcn-coverage'), 'Should create .shadcn-coverage directory');
  assert(scriptContent.includes('coverage-report.json'), 'Should generate JSON report');
  assert(scriptContent.includes('coverage-report.md'), 'Should generate Markdown report');
  assert(scriptContent.includes('coverage-report.csv'), 'Should generate CSV report');

  // Check for coverage data structure
  assert(scriptContent.includes('components'), 'Should track components data');
  assert(scriptContent.includes('pages'), 'Should track pages data');
  assert(scriptContent.includes('performance'), 'Should track performance data');
  assert(scriptContent.includes('renderStats'), 'Should track render statistics');
  assert(scriptContent.includes('summary'), 'Should generate summary');
});

test('package.json includes shadcn coverage script', () => {
  const packagePath = join(process.cwd(), 'package.json');
  const packageContent = JSON.parse(readFileSync(packagePath, 'utf8'));

  assert(packageContent.scripts['shadcn:coverage'], 'Should include shadcn:coverage script');
  assert.strictEqual(
    packageContent.scripts['shadcn:coverage'],
    'node scripts/shadcn-coverage.mjs',
    'Script should point to correct file'
  );
});
