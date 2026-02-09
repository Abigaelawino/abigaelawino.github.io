import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST_DIR = 'dist';
const PORT = Number(process.env.PORT ?? 3000);

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.txt': 'text/plain; charset=utf-8',
};

function resolvePath(requestUrl) {
  const normalized = new URL(requestUrl, 'http://localhost').pathname;
  if (normalized.includes('..')) {
    return null;
  }
  const candidate = normalized === '/' ? join(DIST_DIR, 'index.html') : join(DIST_DIR, normalized);
  if (!existsSync(candidate)) {
    return null;
  }
  const stats = statSync(candidate);
  if (stats.isDirectory()) {
    const nested = join(candidate, 'index.html');
    if (existsSync(nested)) {
      return nested;
    }
    return null;
  }
  return candidate;
}

function isContactFormPost(req) {
  if (!req || req.method !== 'POST') {
    return false;
  }
  const pathname = new URL(req.url, 'http://localhost').pathname;
  return pathname === '/contact' || pathname === '/contact/';
}

function drainRequest(req) {
  return new Promise((resolve) => {
    req.on('error', () => resolve());
    req.on('data', () => {});
    req.on('end', () => resolve());
  });
}

const server = createServer((req, res) => {
  if (isContactFormPost(req)) {
    drainRequest(req).then(() => {
      res.writeHead(303, {
        Location: '/contact/thanks/',
        'Content-Type': 'text/plain; charset=utf-8',
      });
      res.end('Redirecting');
    });
    return;
  }

  const path = resolvePath(req.url);
  if (!path) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const contentType = MIME_MAP[extname(path)] ?? 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  const stream = createReadStream(path);
  stream.pipe(res);
});

server.on('listening', () => {
  console.log(`Dev server running at http://localhost:${PORT} serving ${DIST_DIR}/`);
});

server.listen(PORT);
