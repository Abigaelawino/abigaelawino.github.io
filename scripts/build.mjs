import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const { generateContentIndexes } = require('../src/content.js');
const { getSiteTitle } = require('../src/index.js');
const { buildRobotsTxt, buildSeoHead, buildSitemapXml, resolveSiteUrl } = require('../src/seo.js');
const { DEFAULT_RESUME_ASSET_PATH, renderResumePage } = require('../src/resume.js');
const { renderHomePage } = require('../src/home.js');
const { renderAboutPage } = require('../src/about.js');
const { renderContactPage, renderContactThanksPage } = require('../src/contact.js');
const { renderProjectsPage } = require('../src/projects.js');
const { renderBlogIndexPage } = require('../src/blog.js');

const contentIndexes = generateContentIndexes({ outputDir: 'src/generated' });
const { projects, blog } = contentIndexes;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeScriptString(value) {
  return JSON.stringify(value).replaceAll('</script>', '<\\/script>');
}

const SHELL_CSS = `
:root { color-scheme: light; }
body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; color: #0f172a; background: #ffffff; }
a { color: inherit; }
:focus-visible { outline: 3px solid #60a5fa; outline-offset: 3px; }
.shell { max-width: 64rem; margin: 0 auto; padding: 1.25rem; }
.shell__skip-link {
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.shell__skip-link:focus,
.shell__skip-link:focus-visible {
  position: static;
  width: auto;
  height: auto;
  display: inline-block;
  margin: 0.75rem 0;
  padding: 0.55rem 0.85rem;
  border: 2px solid #0f172a;
  border-radius: 0.6rem;
  background: #ffffff;
  text-decoration: none;
  font-weight: 700;
}
.shell__nav { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.shell__brand { font-weight: 700; text-decoration: none; }
.shell__links { display: flex; gap: 0.75rem; flex-wrap: wrap; list-style: none; margin: 0; padding: 0; }
.shell__link { text-decoration: none; border: 1px solid #e5e7eb; border-radius: 999px; padding: 0.35rem 0.65rem; }

/* shadcn/ui base styles */
:root {
  --background: 0 0% 100%;
  --foreground: 15 23% 17%;
  --card: 0 0% 100%;
  --card-foreground: 15 23% 17%;
  --popover: 0 0% 100%;
  --popover-foreground: 15 23% 17%;
  --primary: 211 70% 55%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 211 70% 55%;
  --radius: 0.6rem;
}

/* Tailwind utilities equivalent */
.container { max-width: 1280px; margin: 0 auto; padding-left: 1rem; padding-right: 1rem; }
@media (min-width: 640px) { .container { padding-left: 1.5rem; padding-right: 1.5rem; } }
@media (min-width: 1024px) { .container { padding-left: 2rem; padding-right: 2rem; } }

/* Card component styles */
.card { border-radius: var(--radius); border: 1px solid hsl(var(--border)); background-color: hsl(var(--card)); color: hsl(var(--card-foreground)); box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
.card-header { display: flex; flex-direction: column; space-y: 1.5rem; padding: 1.5rem; }
.card-title { font-size: 1.5rem; line-height: 2rem; font-weight: 600; }
.card-description { font-size: 0.875rem; color: hsl(var(--muted-foreground)); }
.card-content { padding: 1.5rem; padding-top: 0; }
.card-footer { display: flex; align-items: center; padding: 1.5rem; padding-top: 0; }

/* Button component styles */
.button { display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; rounded-md var(--radius); font-size: 0.875rem; font-weight: 500; transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.button:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 2px; }
.button:disabled { pointer-events: none; opacity: 0.5; }
.button-primary { background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
.button-primary:hover { background-color: hsl(var(--primary) / 0.9); }
.button-secondary { background-color: hsl(var(--secondary)); color: hsl(var(--secondary-foreground)); }
.button-secondary:hover { background-color: hsl(var(--secondary) / 0.8); }
.button-outline { border: 1px solid hsl(var(--border)); background-color: transparent; color: hsl(var(--foreground)); }
.button-outline:hover { background-color: hsl(var(--accent)); }
.button-ghost { background-color: transparent; color: hsl(var(--foreground)); }
.button-ghost:hover { background-color: hsl(var(--accent)); }
.button-destructive { background-color: hsl(var(--destructive)); color: hsl(var(--destructive-foreground)); }
.button-destructive:hover { background-color: hsl(var(--destructive) / 0.9); }
.button-link { color: hsl(var(--primary)); text-decoration: underline; }
.button-link:hover { text-decoration: none; }
.button-sm { height: 2.25rem; padding-left: 0.75rem; padding-right: 0.75rem; }
.button-lg { height: 2.75rem; padding-left: 1rem; padding-right: 1rem; }
.button-icon { height: 2.25rem; width: 2.25rem; padding: 0; }

/* Badge component styles */
.badge { display: inline-flex; align-items: center; rounded-md border var(--radius); padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 500; transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.badge-default { border-color: hsl(var(--border)); background-color: hsl(var(--background)); color: hsl(var(--foreground)); }
.badge-secondary { border-color: hsl(var(--border)); background-color: hsl(var(--secondary)); color: hsl(var(--secondary-foreground)); }
.badge-outline { border-color: hsl(var(--border)); background-color: transparent; color: hsl(var(--foreground)); }

/* Layout utilities */
.space-y-12 > :not([hidden]) ~ :not([hidden]) { margin-top: 3rem; }
.space-y-8 > :not([hidden]) ~ :not([hidden]) { margin-top: 2rem; }
.space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.5rem; }
.space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }
.space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.75rem; }
.space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem; }
.space-x-2 > :not([hidden]) ~ :not([hidden]) { margin-left: 0.5rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.text-center { text-align: center; }
.w-full { width: 100%; }
.h-4 { height: 1rem; }
.w-4 { width: 1rem; }
.min-h-screen { min-height: 100vh; }
.rounded-lg { border-radius: var(--radius); }
.border { border-width: 1px; }
.border-b { border-bottom-width: 1px; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.pt-6 { padding-top: 1.5rem; }
.mt-16 { margin-top: 4rem; }
.max-w-2xl { max-width: 42rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.tracking-tight { letter-spacing: -0.025em; }
.bg-background { background-color: hsl(var(--background)); }
.text-foreground { color: hsl(var(--foreground)); }
.text-muted-foreground { color: hsl(var(--muted-foreground)); }
.text-primary { color: hsl(var(--primary)); }

/* Responsive grid */
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
@media (min-width: 768px) {
  .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .md\\:text-6xl { font-size: 3.75rem; line-height: 1; }
}
@media (min-width: 1024px) {
  .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .lg\\:col-span-2 { grid-column: span 2 / span 2; }
}

/* Transitions */
* { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }

/* Card hover effects */
.card-hover { transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.card-hover:hover { transform: scale(1.02); box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05); }
`.trim();

const ANALYTICS_DOMAIN =
  (process.env.ANALYTICS_DOMAIN || '').trim() || (process.env.NODE_ENV === 'production' ? 'abigaelawino.github.io' : '');
const ANALYTICS_HOST = (process.env.ANALYTICS_HOST || '').trim() || 'https://plausible.io';

function crc32(buffer) {
  const table = crc32.table || (crc32.table = buildCrc32Table());
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function buildCrc32Table() {
  const table = new Uint32Array(256);

  for (let i = 0; i < table.length; i += 1) {
    let value = i;
    for (let j = 0; j < 8; j += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }

  return table;
}

function buildPngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const resolvedData = data ? Buffer.from(data) : Buffer.alloc(0);
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(resolvedData.length, 0);

  const crcBuffer = Buffer.alloc(4);
  const crcValue = crc32(Buffer.concat([typeBuffer, resolvedData]));
  crcBuffer.writeUInt32BE(crcValue, 0);

  return Buffer.concat([lengthBuffer, typeBuffer, resolvedData, crcBuffer]);
}

function buildDefaultOgPng({ width = 1200, height = 630 } = {}) {
  const resolvedWidth = Math.max(1, Number(width) || 1200);
  const resolvedHeight = Math.max(1, Number(height) || 630);
  const rowStride = 1 + resolvedWidth * 4;
  const raw = Buffer.alloc(rowStride * resolvedHeight);

  const background = [0x0f, 0x17, 0x2a, 0xff];
  const accent = [0x60, 0xa5, 0xfa, 0xff];
  const highlight = [0xf9, 0xfa, 0xfb, 0xff];

  for (let y = 0; y < resolvedHeight; y += 1) {
    const rowStart = y * rowStride;
    raw[rowStart] = 0; // filter: none

    for (let x = 0; x < resolvedWidth; x += 1) {
      const offset = rowStart + 1 + x * 4;
      let color = background;

      const diagonal = x - y * 0.9;
      if (diagonal < resolvedWidth * 0.18) {
        color = accent;
      }

      if (x > resolvedWidth * 0.72 && y < resolvedHeight * 0.22) {
        color = highlight;
      }

      raw[offset] = color[0];
      raw[offset + 1] = color[1];
      raw[offset + 2] = color[2];
      raw[offset + 3] = color[3];
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(resolvedWidth, 0);
  ihdr.writeUInt32BE(resolvedHeight, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const compressed = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    buildPngChunk('IHDR', ihdr),
    buildPngChunk('IDAT', compressed),
    buildPngChunk('IEND', null),
  ]);
}

function generateNonce() {
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Buffer.from(array).toString('base64');
}

function buildHtmlDocument({ title, description, body, pathname = '/', robots }) {
  const resolvedTitle = escapeHtml(title);
  const siteTitle = getSiteTitle();
  const nonce = generateNonce();
  const seoHead = buildSeoHead({
    siteUrl: resolveSiteUrl(process.env),
    siteName: siteTitle,
    pathname,
    title,
    description,
    ogImagePath: '/assets/og.png',
    ogImageAlt: `${siteTitle} — ${description}`,
    ...(robots ? { robots } : {}),
  });
  const analyticsSnippet = ANALYTICS_DOMAIN
    ? `
    <script nonce="${nonce}">
      (function () {
        var plausibleDomain = ${escapeScriptString(ANALYTICS_DOMAIN)};
        var plausibleHost = ${escapeScriptString(ANALYTICS_HOST)};

        var dntValues = [
          navigator.doNotTrack,
          window.doNotTrack,
          navigator.msDoNotTrack,
          document.doNotTrack,
        ]
          .map(function (value) {
            return value == null ? '' : String(value);
          })
          .map(function (value) {
            return value.trim();
          });

        if (dntValues.includes('1') || dntValues.includes('yes')) {
          return;
        }

        var hostname = String((window.location && window.location.hostname) || '')
          .trim()
          .toLowerCase();
        if (
          hostname === '' ||
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname === '0.0.0.0' ||
          hostname.endsWith('.local')
        ) {
          return;
        }

        window.plausible =
          window.plausible ||
          function () {
            (window.plausible.q = window.plausible.q || []).push(arguments);
          };

        var script = document.createElement('script');
        script.defer = true;
        script.setAttribute('data-domain', plausibleDomain);
        script.setAttribute('nonce', '${nonce}');
        script.src = plausibleHost.replace(/\\/$/, '') + '/js/script.js';
        document.head.appendChild(script);
      })();
    </script>
    `.trim()
    : '';

  const cspMetaTag = ANALYTICS_DOMAIN
    ? `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'nonce-${nonce}' https://plausible.io; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://plausible.io; frame-ancestors 'none'; form-action 'self';">`
    : `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self';">`;

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${resolvedTitle}</title>
    ${seoHead}
    ${cspMetaTag}
    <link rel="preload" href="/assets/shell.css" as="style" />
    <link rel="stylesheet" href="/assets/shell.css" />
    ${analyticsSnippet}
    <script src="/assets/analytics.js" defer nonce="${nonce}"></script>
  </head>
  <body>
    <div class="shell">
      <a class="shell__skip-link" href="#main-content">Skip to content</a>
      <header>
        <nav class="shell__nav" aria-label="Site navigation">
          <a class="shell__brand" href="/" data-analytics-event="nav_home">${escapeHtml(getSiteTitle())}</a>
          <ul class="shell__links">
            <li><a class="shell__link" href="/projects" data-analytics-event="nav_projects">Projects</a></li>
            <li><a class="shell__link" href="/about" data-analytics-event="nav_about">About</a></li>
            <li><a class="shell__link" href="/contact" data-analytics-event="nav_contact">Contact</a></li>
          </ul>
        </nav>
      </header>
      <main id="main-content" tabindex="-1">
        ${body}
      </main>
    </div>
  </body>
</html>
`.trimStart();
}

function pdfEscape(text) {
  return String(text).replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function buildSimplePdf(lines) {
  const resolvedLines = Array.isArray(lines) ? lines : [];
  const fontSize = 14;
  const leading = 18;
  const startX = 72;
  const startY = 720;
  const ops = [];

  ops.push('BT');
  ops.push(`/F1 ${fontSize} Tf`);
  ops.push(`${startX} ${startY} Td`);

  resolvedLines.forEach((line, index) => {
    if (index > 0) {
      ops.push(`0 -${leading} Td`);
    }
    ops.push(`(${pdfEscape(line)}) Tj`);
  });

  ops.push('ET');
  const streamContent = `${ops.join('\n')}\n`;
  const streamLength = Buffer.byteLength(streamContent, 'utf8');

  const chunks = [];
  const offsets = [];

  function push(text) {
    chunks.push(Buffer.from(text, 'utf8'));
  }

  const header = Buffer.from('%PDF-1.4\n', 'utf8');
  chunks.push(header);

  function startObject() {
    const currentOffset = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    offsets.push(currentOffset);
  }

  startObject();
  push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  startObject();
  push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  startObject();
  push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
  );
  startObject();
  push(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}endstream\nendobj\n`);
  startObject();
  push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  const xrefOffset = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  push('xref\n');
  push(`0 ${offsets.length + 1}\n`);
  push('0000000000 65535 f \n');
  offsets.forEach((offset) => {
    push(`${String(offset).padStart(10, '0')} 00000 n \n`);
  });
  push(`trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\n`);
  push(`startxref\n${xrefOffset}\n%%EOF\n`);

  return Buffer.concat(chunks);
}

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
mkdirSync(join('dist', 'assets'), { recursive: true });
  cpSync('assets', join('dist', 'assets'), { recursive: true });
  try {
    cpSync('images', join('dist', 'images'), { recursive: true });
  } catch {
    // Optional images directory.
  }
  writeFileSync(join('dist', 'assets', 'og.png'), buildDefaultOgPng());
  writeFileSync(join('dist', 'assets', 'shell.css'), `${SHELL_CSS}\n`);

  const siteTitle = getSiteTitle();
  const featuredProject = projects[0] ?? null;
  const siteUrl = resolveSiteUrl(process.env);
  const sitemapLastmod = new Date().toISOString().slice(0, 10);

  function routePathnameForOutput(relativePath) {
    const normalized = String(relativePath).replaceAll('\\', '/');
    if (normalized === 'index.html') {
      return '/';
    }
    if (normalized.endsWith('/index.html')) {
      return `/${normalized.slice(0, -'/index.html'.length)}/`;
    }
    return `/${normalized}`;
  }

  function writePage(relativePath, { title, description, body, robots }) {
    const pathname = routePathnameForOutput(relativePath);
    const document = buildHtmlDocument({ title, description, body, pathname, robots });
    const outputPath = join('dist', relativePath);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${document}\n`);
  }

  const staticPages = [
    {
      path: 'index.html',
      title: `${siteTitle} · Home`,
      description: 'Data science solutions bridging exploratory analysis to production-ready outcomes.',
      body: renderHomePage(featuredProject),
    },
    {
      path: join('about', 'index.html'),
      title: `${siteTitle} · About`,
      description: 'Learn about Abigael Awino, her strengths, and her toolkit.',
      body: renderAboutPage(),
    },
    {
      path: join('contact', 'index.html'),
      title: `${siteTitle} · Contact`,
      description: 'Reach out via the secure contact form or connect on LinkedIn/GitHub.',
      body: renderContactPage(),
    },
    {
      path: join('contact', 'thanks', 'index.html'),
      title: `${siteTitle} · Message sent`,
      description: 'Thanks for reaching out — your message has been sent.',
      body: renderContactThanksPage(),
      robots: 'noindex,follow',
    },
    {
      path: join('projects', 'index.html'),
      title: `${siteTitle} · Projects`,
      description: 'Explore project case studies in ML, analytics, and production data systems.',
      body: renderProjectsPage(projects),
    },
    {
      path: join('blog', 'index.html'),
      title: `${siteTitle} · Blog`,
      description: 'Read notes on model monitoring, analytics implementation, and production workflows.',
      body: renderBlogIndexPage(blog),
    },
  ];

  staticPages.forEach((page) => writePage(page.path, page));

mkdirSync(join('dist', 'resume'), { recursive: true });
writeFileSync(
  join('dist', 'resume', 'index.html'),
  buildHtmlDocument({
    title: `Resume · ${getSiteTitle()}`,
    description: 'Download a PDF resume and view a concise web summary.',
    body: renderResumePage(),
    pathname: '/resume/',
  }),
);

const pdfBuffer = buildSimplePdf([
  'Abigael Awino — Resume',
  'Web summary: /resume/',
  `PDF download path: ${DEFAULT_RESUME_ASSET_PATH}`,
  'This PDF is auto-generated. Replace with a full resume as needed.',
]);
writeFileSync(join('dist', 'resume', 'abigael-awino-resume.pdf'), pdfBuffer);

const sitemapPaths = [
  '/',
  '/about/',
  '/contact/',
  '/projects/',
  '/blog/',
  '/resume/',
];
writeFileSync(join('dist', 'sitemap.xml'), buildSitemapXml({ siteUrl, paths: sitemapPaths, lastmod: sitemapLastmod }));
writeFileSync(join('dist', 'robots.txt'), buildRobotsTxt({ siteUrl, allowAll: true }));

console.log('Build complete: generated indexes, rendered static pages, and wrote resume outputs');
