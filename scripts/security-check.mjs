import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const inspectionFiles = [
  join('src', 'generated', 'projects-index.json'),
  join('src', 'generated', 'blog-index.json'),
];

const contentDirs = [join('content', 'projects'), join('content', 'blog')];
const suspiciousPatterns = [
  { regexp: /<script/i, reason: 'embedded <script> tag' },
  { regexp: /javascript:/i, reason: 'javascript: URI' },
  { regexp: /\son\w+=/i, reason: 'inline event handler' },
];

const issues = [];

const additionalFiles = [];

for (const dir of contentDirs) {
  if (!existsSync(dir)) {
    continue;
  }

  for (const entry of readdirSync(dir)) {
    if (entry.endsWith('.mdx')) {
      additionalFiles.push(join(dir, entry));
    }
  }
}

for (const file of [...inspectionFiles, ...additionalFiles]) {
  if (!existsSync(file)) {
    issues.push(`Missing generated/content file: ${file}`);
    continue;
  }

  const content = readFileSync(file, 'utf8');
  for (const pattern of suspiciousPatterns) {
    if (pattern.regexp.test(content)) {
      issues.push(`${file} contains suspicious pattern: ${pattern.reason}`);
    }
  }
}

if (issues.length > 0) {
  const message = `Security validation failed:\n${issues.map((issue) => `  • ${issue}`).join('\n')}`;
  throw new Error(message);
}

console.log('Security validation passed for generated assets.');
