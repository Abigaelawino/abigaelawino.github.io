import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src', 'content', 'scripts', 'test', '.github/workflows'];
const textExtensions = new Set(['.js', '.mjs', '.cjs', '.json', '.yml', '.yaml', '.md']);
const issues = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const fullPath = join(dir, name);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
    if (!textExtensions.has(ext)) {
      continue;
    }

    const content = readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (line.endsWith('\r')) {
        issues.push(`${fullPath}:${index + 1} uses CRLF line endings`);
      }
      if (/[\t]/.test(line)) {
        issues.push(`${fullPath}:${index + 1} contains a tab character`);
      }
      if (/\s+$/.test(line)) {
        issues.push(`${fullPath}:${index + 1} contains trailing whitespace`);
      }
      if (/^(<{7}|={7}|>{7})/.test(line)) {
        issues.push(`${fullPath}:${index + 1} looks like a merge conflict marker`);
      }
    });

    if (!content.endsWith('\n')) {
      issues.push(`${fullPath}: missing trailing newline`);
    }
  }
}

for (const root of roots) {
  try {
    walk(root);
  } catch {
    // Missing directories are valid in early project stages.
  }
}

if (issues.length > 0) {
  console.error('Lint checks failed:');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Lint checks passed.');
