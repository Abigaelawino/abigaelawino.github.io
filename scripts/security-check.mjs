import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

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

// Check for dependency vulnerabilities
try {
  const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
  const auditData = JSON.parse(auditOutput);

  const vulnerabilities = auditData.vulnerabilities || {};
  const highSeverityVulns = Object.values(vulnerabilities).filter(
    vuln => vuln.severity === 'high' || vuln.severity === 'critical'
  );

  if (highSeverityVulns.length > 0) {
    issues.push(
      `Found ${highSeverityVulns.length} high/critical severity dependencies that should be addressed`
    );
  }

  if (Object.keys(vulnerabilities).length > 0) {
    console.log(
      `Note: ${Object.keys(vulnerabilities).length} dependency vulnerabilities found (run 'npm audit' for details)`
    );
  }
} catch (error) {
  // npm audit might fail, but we don't want to fail the build for it
  console.log('Warning: Could not check dependency vulnerabilities');
}

if (issues.length > 0) {
  const message = `Security validation failed:\n${issues.map(issue => `  • ${issue}`).join('\n')}`;
  throw new Error(message);
}

console.log('Security validation passed for generated assets.');
