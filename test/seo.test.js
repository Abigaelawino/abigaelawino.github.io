const test = require('node:test');
const assert = require('node:assert/strict');

const { buildRobotsTxt, buildSeoHead, buildSitemapXml, normalizeSiteUrl, resolveSiteUrl } = require('../src/seo.js');

test('resolveSiteUrl prefers configured env vars', () => {
  assert.equal(resolveSiteUrl({ SITE_URL: 'https://example.com/' }), 'https://example.com');
  assert.equal(resolveSiteUrl({ URL: 'https://netlify.app' }), 'https://netlify.app');
});

test('normalizeSiteUrl rejects non-string, empty, and unsupported URLs', () => {
  assert.equal(normalizeSiteUrl(123), null);
  assert.equal(normalizeSiteUrl('  '), null);
  assert.equal(normalizeSiteUrl('ftp://example.com'), null);
  assert.equal(normalizeSiteUrl('not-a-url'), null);
});

test('buildSeoHead includes canonical + social tags', () => {
  const head = buildSeoHead({
    siteUrl: 'https://example.com',
    siteName: 'Example Site',
    pathname: '/projects/',
    title: 'Projects · Example',
    description: 'Browse projects.',
    ogImagePath: '/assets/og.png',
    ogImageAlt: 'Example social card',
  });

  assert.match(head, /rel="canonical" href="https:\/\/example\.com\/projects\/"/);
  assert.match(head, /property="og:title" content="Projects · Example"/);
  assert.match(head, /property="og:image" content="https:\/\/example\.com\/assets\/og\.png"/);
  assert.match(head, /name="twitter:card" content="summary_large_image"/);
});

test('buildSitemapXml emits expected URL entries', () => {
  const xml = buildSitemapXml({
    siteUrl: 'https://example.com',
    paths: ['/', '/about/', '/contact/'],
    lastmod: '2026-02-09',
  });

  assert.match(xml, /<loc>https:\/\/example\.com\/<\/loc><lastmod>2026-02-09<\/lastmod>/);
  assert.match(xml, /<loc>https:\/\/example\.com\/about\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/example\.com\/contact\/<\/loc>/);
});

test('buildRobotsTxt references the sitemap', () => {
  const robots = buildRobotsTxt({ siteUrl: 'https://example.com' });
  assert.match(robots, /Sitemap: https:\/\/example\.com\/sitemap\.xml/);
});

test('resolveSiteUrl returns default when no env vars provided', () => {
  assert.equal(resolveSiteUrl({}), 'https://abigaelawino.github.io');
});

test('toAbsoluteUrl combines site URL and pathname', () => {
  const absolute = require('../src/seo.js').toAbsoluteUrl('https://example.com', 'projects/?utm=1');
  assert.equal(absolute, 'https://example.com/projects/');
});

test('buildRobotsTxt disallows when not allowing all', () => {
  const robots = buildRobotsTxt({ siteUrl: 'https://example.com', allowAll: false });
  assert.match(robots, /Disallow: \//);
});

test('buildSeoHead uses defaults for missing OG image', () => {
  const head = buildSeoHead({
    siteUrl: 'https://example.com',
    siteName: 'Example',
    pathname: '/',
    title: 'Home',
    description: 'Welcome.',
  });
  assert.match(head, /og:image" content="https:\/\/example\.com\/assets\/og\.png"/);
  assert.match(head, /twitter:image:alt/);
});
