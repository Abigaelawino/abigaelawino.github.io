const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const { escapeHtml } = require('../src/utils/escape-html.js');
const { renderHomePage } = require('../src/home.js');
const { renderProjectCard } = require('../src/projects.js');
const { renderBlogCard } = require('../src/blog.js');

const malicious = '<script>alert("x")</script>';
const maliciousProject = {
  title: malicious,
  summary: malicious,
  slug: malicious,
  date: '2026-03-01',
  repo: 'https://github.com/abigaelawino',
  cover: '/images/broken.png',
  tags: ['ml', 'hack'],
  caseStudyData: 'Data',
  caseStudyMethods: 'Methods',
  caseStudyResults: 'Results',
  caseStudyReproducibility: 'Reproducibility',
  caseStudyReflection: 'Reflection',
};

test('escapeHtml removes unsafe characters', () => {
  const escaped = escapeHtml(malicious);
  assert.equal(escaped, '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
});

test('home page renderer escapes featured project metadata', () => {
  const page = renderHomePage(maliciousProject);
  assert.doesNotMatch(page, /<script>/);
  assert.match(page, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
});

test('project card escapes slug/data attributes', () => {
  const card = renderProjectCard(maliciousProject);
  assert.doesNotMatch(card, /<script>/);
  assert.match(card, /data-project-card/);
});

test('blog card escapes title and summary', () => {
  const post = {
    slug: malicious,
    title: malicious,
    summary: malicious,
    date: '2026-02-28',
    readingTime: 3,
    tags: ['security'],
  };
  const card = renderBlogCard(post);
  assert.doesNotMatch(card, /<script>/);
  assert.match(card, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
});

test('netlify.toml contains required security headers', () => {
  const netlifyConfigPath = join(process.cwd(), 'netlify.toml');
  assert(existsSync(netlifyConfigPath), 'netlify.toml should exist');

  const netlifyConfig = readFileSync(netlifyConfigPath, 'utf8');

  // Check for essential security headers
  assert(
    netlifyConfig.includes('X-Frame-Options = "DENY"'),
    'Should have X-Frame-Options set to DENY'
  );
  assert(
    netlifyConfig.includes('X-Content-Type-Options = "nosniff"'),
    'Should have X-Content-Type-Options set to nosniff'
  );
  assert(
    netlifyConfig.includes('X-XSS-Protection = "1; mode=block"'),
    'Should have X-XSS-Protection enabled'
  );
  assert(netlifyConfig.includes('Strict-Transport-Security'), 'Should have HSTS enabled');
  assert(netlifyConfig.includes('Content-Security-Policy'), 'Should have CSP enabled');
  assert(
    netlifyConfig.includes("form-action 'self'"),
    'CSP should restrict form actions to same origin'
  );
  assert(netlifyConfig.includes("frame-ancestors 'none'"), 'CSP should prevent clickjacking');
});

test('contact form includes honeypot fields', () => {
  const contactJsPath = join(process.cwd(), 'src', 'contact.js');
  assert(existsSync(contactJsPath), 'contact.js should exist');

  const contactJs = readFileSync(contactJsPath, 'utf8');

  // Check for honeypot implementation
  assert(
    contactJs.includes('netlify-honeypot="bot-field"'),
    'Should have Netlify honeypot enabled'
  );
  assert(contactJs.includes('name="bot-field"'), 'Should have bot-field honeypot input');
  assert(contactJs.includes('aria-hidden="true"'), 'Honeypot should be aria-hidden');
  assert(contactJs.includes('tabindex="-1"'), 'Honeypot should be removed from tab order');
});

test('contact form includes security enhancements', () => {
  const contactJsPath = join(process.cwd(), 'src', 'contact.js');
  const contactJs = readFileSync(contactJsPath, 'utf8');

  // Check for additional security fields
  assert(
    contactJs.includes('data-contact-timestamp'),
    'Should have timestamp field for timing analysis'
  );
  assert(
    contactJs.includes('data-contact-fingerprint'),
    'Should have fingerprint field for bot detection'
  );
  assert(contactJs.includes('name="timestamp"'), 'Should have hidden timestamp input');
  assert(contactJs.includes('name="form-fingerprint"'), 'Should have hidden fingerprint input');
});

test('analytics.js includes form security logic', () => {
  const analyticsJsPath = join(process.cwd(), 'assets', 'analytics.js');
  assert(existsSync(analyticsJsPath), 'analytics.js should exist');

  const analyticsJs = readFileSync(analyticsJsPath, 'utf8');

  // Check for form security features
  assert(
    analyticsJs.includes('generateFingerprint'),
    'Should have fingerprint generation function'
  );
  assert(analyticsJs.includes('enhanceContactForm'), 'Should have form enhancement function');
  assert(analyticsJs.includes('timeDiff < 3000'), 'Should validate minimum form fill time');
  assert(analyticsJs.includes('timeDiff > 3600000'), 'Should validate maximum form fill time');
  assert(analyticsJs.includes('canvas.toDataURL'), 'Should use canvas fingerprinting');
});

test('build script generates CSP nonces', () => {
  const buildScriptPath = join(process.cwd(), 'scripts', 'build.mjs');
  assert(existsSync(buildScriptPath), 'build.mjs should exist');

  const buildScript = readFileSync(buildScriptPath, 'utf8');

  // Check for nonce generation and usage
  assert(buildScript.includes('generateNonce'), 'Should have nonce generation function');
  assert(buildScript.includes('nonce="${nonce}"'), 'Should add nonce to inline scripts');
  assert(buildScript.includes("script-src 'self' 'nonce-"), 'CSP should include nonce policy');
});

test('security-check.mjs validates content patterns', () => {
  const securityCheckPath = join(process.cwd(), 'scripts', 'security-check.mjs');
  assert(existsSync(securityCheckPath), 'security-check.mjs should exist');

  const securityCheck = readFileSync(securityCheckPath, 'utf8');

  // Check for suspicious pattern detection
  assert(securityCheck.includes('<script'), 'Should detect script tags');
  assert(securityCheck.includes('javascript:'), 'Should detect javascript: URIs');
  assert(securityCheck.includes('on\\w+='), 'Should detect inline event handlers');
  assert(securityCheck.includes('suspiciousPatterns'), 'Should have pattern checking logic');
});
