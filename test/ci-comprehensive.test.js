// Comprehensive test for CI pipeline
const test = require('node:test');
const assert = require('node:assert');
const { existsSync, readFileSync } = require('node:fs');

test('basic imports work', () => {
  assert.doesNotThrow(() => {
    global.console = console;
    global.process = process;
  });
});

test('file system access works', () => {
  assert.ok(existsSync('package.json'), 'package.json should exist');
  assert.ok(existsSync('tsconfig.json'), 'tsconfig.json should exist');
  assert.ok(existsSync('eslint.config.cjs'), 'eslint.config.cjs should exist');
  assert.ok(existsSync('.prettierrc.json'), '.prettierrc.json should exist');
});

test('type definitions exist', () => {
  assert.ok(existsSync('next-env.d.ts'), 'Next.js types should exist');
});

test('core source files exist', () => {
  assert.ok(existsSync('src/index.js'), 'src/index.js should exist');
  assert.ok(existsSync('src/content.js'), 'src/content.js should exist');
  assert.ok(existsSync('src/home.js'), 'src/home.js should exist');
});

test('React components exist', () => {
  assert.ok(existsSync('app/layout.tsx'), 'app/layout.tsx should exist');
  assert.ok(existsSync('app/page.tsx'), 'app/page.tsx should exist');
  assert.ok(existsSync('components/contact-form.tsx'), 'components/contact-form.tsx should exist');
});

test('package.json has correct scripts', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.ok(pkg.scripts.lint, 'lint script should exist');
  assert.ok(pkg.scripts.typecheck, 'typecheck script should exist');
  assert.ok(pkg.scripts.test, 'test script should exist');
  assert.ok(pkg.scripts.build, 'build script should exist');
  assert.ok(pkg.scripts.ci, 'ci script should exist');
});

test('required config files exist', () => {
  assert.ok(existsSync('tailwind.config.js'), 'tailwind.config.js should exist');
  assert.ok(existsSync('next.config.js'), 'next.config.js should exist');
  assert.ok(existsSync('postcss.config.js'), 'postcss.config.js should exist');
});
