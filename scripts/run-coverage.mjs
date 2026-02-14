import { mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const COVERAGE_DIR = 'coverage';
const SUMMARY_PATH = join(COVERAGE_DIR, 'coverage-summary.json');
const TAP_PATH = join(COVERAGE_DIR, 'node-coverage.tap');

rmSync(COVERAGE_DIR, { recursive: true, force: true });
mkdirSync(COVERAGE_DIR, { recursive: true });

const result = spawnSync(
  process.execPath,
  [
    '--test',
    '--test-reporter=tap',
    `--test-reporter-destination=${TAP_PATH}`,
    '--experimental-test-coverage',
    '--no-warnings',
    'test/ci-comprehensive.test.js',
  ],
  { encoding: 'utf8' }
);

if (result.status !== 0) {
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  process.exit(result.status ?? 1);
}

const output = readFileSync(TAP_PATH, 'utf8');
if (output) {
  process.stdout.write(output);
}
const allFilesLine = output
  .split('\n')
  .map(line => line.trim())
  .reverse()
  .find(line => /^#\s*all files\s+\|/.test(line));

if (!allFilesLine) {
  throw new Error('Coverage report missing "all files" summary row.');
}

// Example:
// # all files |  95.88 |    78.68 |  100.00 |
const match = allFilesLine.match(
  /^# all files\s*\|\s*([0-9.]+)\s*\|\s*([0-9.]+)\s*\|\s*([0-9.]+)\s*\|/
);
if (!match) {
  throw new Error(`Unable to parse coverage summary row: ${allFilesLine}`);
}

const [, linePctRaw, branchPctRaw, funcsPctRaw] = match;
const linePct = Number(linePctRaw);
const branchPct = Number(branchPctRaw);
const funcsPct = Number(funcsPctRaw);

if ([linePct, branchPct, funcsPct].some(value => Number.isNaN(value))) {
  throw new Error(`Invalid numeric coverage values in row: ${allFilesLine}`);
}

// Map Node's metrics to Istanbul-style summary used by scripts/check-coverage.mjs.
// Node reports line/branch/func coverage; treat statements ~= lines for thresholding.
const summary = {
  total: {
    statements: { pct: linePct },
    branches: { pct: branchPct },
    functions: { pct: funcsPct },
    lines: { pct: linePct },
  },
};

writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);
