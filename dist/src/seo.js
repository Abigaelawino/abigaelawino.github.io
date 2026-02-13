function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeSiteUrl(rawValue) {
  if (typeof rawValue !== 'string') {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.href.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function resolveSiteUrl(env = process.env) {
  return (
    normalizeSiteUrl(env.SITE_URL) ||
    normalizeSiteUrl(env.URL) ||
    normalizeSiteUrl(env.DEPLOY_PRIME_URL) ||
    normalizeSiteUrl(env.DEPLOY_URL) ||
    'https://abigaelawino.github.io'
  );
}

function normalizePathname(pathname) {
  const raw = typeof pathname === 'string' ? pathname.trim() : '';
  if (!raw) {
    return '/';
  }

  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  const withoutQuery = withSlash.split('?')[0].split('#')[0];
  return withoutQuery.length === 0 ? '/' : withoutQuery;
}

function toAbsoluteUrl(siteUrl, pathname) {
  const resolvedSiteUrl = resolveSiteUrl({ SITE_URL: siteUrl });
  const resolvedPathname = normalizePathname(pathname);
  return `${resolvedSiteUrl}${resolvedPathname}`;
}

function buildSeoHead({
  siteUrl,
  siteName,
  pathname,
  title,
  description,
  ogImagePath,
  ogImageAlt,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  locale = 'en_US',
  themeColor = '#0f172a',
  robots = 'index,follow',
}) {
  const resolvedSiteUrl = resolveSiteUrl({ SITE_URL: siteUrl });
  const resolvedTitle = escapeHtml(title);
  const resolvedDescription = escapeHtml(description);
  const resolvedSiteName = escapeHtml(siteName);
  const resolvedPathname = normalizePathname(pathname);
  const canonicalUrl = `${resolvedSiteUrl}${resolvedPathname}`;
  const resolvedOgImagePath = ogImagePath ? normalizePathname(ogImagePath) : '/assets/og.png';
  const resolvedOgImageUrl = `${resolvedSiteUrl}${resolvedOgImagePath}`;
  const resolvedOgImageAlt = escapeHtml(ogImageAlt || description || siteName);

  return `
    <meta name="description" content="${resolvedDescription}" />
    <meta name="robots" content="${escapeHtml(robots)}" />
    <meta name="theme-color" content="${escapeHtml(themeColor)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:site_name" content="${resolvedSiteName}" />
    <meta property="og:locale" content="${escapeHtml(locale)}" />
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:title" content="${resolvedTitle}" />
    <meta property="og:description" content="${resolvedDescription}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(resolvedOgImageUrl)}" />
    <meta property="og:image:alt" content="${resolvedOgImageAlt}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="${escapeHtml(twitterCard)}" />
    <meta name="twitter:title" content="${resolvedTitle}" />
    <meta name="twitter:description" content="${resolvedDescription}" />
    <meta name="twitter:image" content="${escapeHtml(resolvedOgImageUrl)}" />
    <meta name="twitter:image:alt" content="${resolvedOgImageAlt}" />
  `.trim();
}

function buildSitemapXml({ siteUrl, paths, lastmod }) {
  const resolvedSiteUrl = resolveSiteUrl({ SITE_URL: siteUrl });
  const resolvedPaths = Array.isArray(paths) ? paths : [];
  const resolvedLastmod = typeof lastmod === 'string' && lastmod.trim().length > 0 ? lastmod.trim() : null;

  const urls = resolvedPaths
    .map((pathname) => normalizePathname(pathname))
    .map((pathname) => {
      const loc = `${resolvedSiteUrl}${pathname}`;
      const lastmodTag = resolvedLastmod ? `<lastmod>${escapeHtml(resolvedLastmod)}</lastmod>` : '';
      return `<url><loc>${escapeHtml(loc)}</loc>${lastmodTag}</url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`;
}

function buildRobotsTxt({ siteUrl, allowAll = true, sitemapPath = '/sitemap.xml' } = {}) {
  const resolvedSiteUrl = resolveSiteUrl({ SITE_URL: siteUrl });
  const resolvedSitemapPath = normalizePathname(sitemapPath);
  const sitemapUrl = `${resolvedSiteUrl}${resolvedSitemapPath}`;

  if (!allowAll) {
    return `User-agent: *\nDisallow: /\nSitemap: ${sitemapUrl}\n`;
  }

  return `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`;
}

module.exports = {
  buildRobotsTxt,
  buildSeoHead,
  buildSitemapXml,
  resolveSiteUrl,
  toAbsoluteUrl,
  normalizeSiteUrl,
};
