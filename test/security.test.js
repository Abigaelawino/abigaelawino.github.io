const test = require('node:test');
const assert = require('node:assert/strict');

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
