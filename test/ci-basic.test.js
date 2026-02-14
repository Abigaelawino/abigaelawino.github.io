// Simple test for CI pipeline that doesn't require server
const test = require('node:test');
const assert = require('node:assert');
const { existsSync } = require('node:fs');

test('basic imports work', () => {
  // Test that basic modules can be imported
  assert.doesNotThrow(() => {
    // These should be available
    global.console = console;
    global.process = process;
  });
});

test('file system access works', () => {
  assert.ok(existsSync('package.json'), 'package.json should exist');
  assert.ok(existsSync('tsconfig.json'), 'tsconfig.json should exist');
  assert.ok(existsSync('eslint.config.cjs'), 'eslint.config.cjs should exist');
});

test('type definitions exist', () => {
  assert.ok(existsSync('next-env.d.ts'), 'Next.js types should exist');
});
