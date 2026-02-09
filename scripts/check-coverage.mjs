import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const summaryPath = join('coverage', 'coverage-summary.json');

if (!existsSync(summaryPath)) {
  throw new Error('Coverage summary missing. Run the coverage script before running this check.');
}

const { total } = JSON.parse(readFileSync(summaryPath, 'utf8'));
const thresholds = {
  statements: 99,
  branches: 95,
  functions: 99,
  lines: 99,
};

const failures = [];

for (const [metric, required] of Object.entries(thresholds)) {
  const meta = total[metric];
  if (!meta) {
    failures.push(`Coverage metric ${metric} missing from summary`);
    continue;
  }

  if (meta.pct < required) {
    failures.push(`Coverage for ${metric} is ${meta.pct.toFixed(2)}%, required ${required}%`);
  }
}

if (failures.length > 0) {
  throw new Error(`Coverage threshold not met:\n${failures.map((item) => `  • ${item}`).join('\n')}`);
}

console.log(
  `Coverage check passed: statements ${total.statements.pct.toFixed(
    2,
  )}%, branches ${total.branches.pct.toFixed(2)}%, functions ${total.functions.pct.toFixed(
    2,
  )}%, lines ${total.lines.pct.toFixed(2)}%`,
);
