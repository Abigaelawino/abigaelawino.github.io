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

test('normalizePathname handles pathname without leading slash', () => {
  const { toAbsoluteUrl } = require('../src/seo.js');
  const absolute = toAbsoluteUrl('https://example.com', 'about');
  assert.equal(absolute, 'https://example.com/about');
});

test('normalizePathname returns slash for empty or non-string input', () => {
  const { toAbsoluteUrl } = require('../src/seo.js');
  assert.equal(toAbsoluteUrl('https://example.com', ''), 'https://example.com/');
  assert.equal(toAbsoluteUrl('https://example.com', null), 'https://example.com/');
  assert.equal(toAbsoluteUrl('https://example.com', undefined), 'https://example.com/');
});

test('normalizePathname handles path already starting with slash', () => {
  const { toAbsoluteUrl } = require('../src/seo.js');
  assert.equal(toAbsoluteUrl('https://example.com', '/about'), 'https://example.com/about');
});

test('normalizePathname strips query and hash from path', () => {
  const { toAbsoluteUrl } = require('../src/seo.js');
  assert.equal(toAbsoluteUrl('https://example.com', '/path?foo=bar'), 'https://example.com/path');
  assert.equal(toAbsoluteUrl('https://example.com', '/path#section'), 'https://example.com/path');
});

test('buildSitemapXml handles non-array paths', () => {
  const xml = buildSitemapXml({ siteUrl: 'https://example.com', paths: null, lastmod: '2026-02-09' });
  assert.match(xml, /<urlset/);
  assert.doesNotMatch(xml, /<loc>/);
});

test('buildSitemapXml handles missing lastmod', () => {
  const xml = buildSitemapXml({ siteUrl: 'https://example.com', paths: ['/'] });
  assert.match(xml, /<loc>https:\/\/example\.com\/<\/loc><\/url>/);
  assert.doesNotMatch(xml, /<lastmod>/);
});

test('resolveSiteUrl falls back through env vars', () => {
  assert.equal(
    resolveSiteUrl({ URL: 'https://fallback.com', DEPLOY_PRIME_URL: 'https://deploy.com' }),
    'https://fallback.com',
  );
  assert.equal(
    resolveSiteUrl({ DEPLOY_PRIME_URL: 'https://deploy.com' }),
    'https://deploy.com',
  );
  assert.equal(
    resolveSiteUrl({ DEPLOY_URL: 'https://deploy-url.com/' }),
    'https://deploy-url.com',
  );
});
