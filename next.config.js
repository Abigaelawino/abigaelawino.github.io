/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  outputFileTracingIncludes: {
    '/projects/[slug]': ['content/projects/**/*'],
    '/blog/[slug]': ['content/blog/**/*'],
    '/sitemap.xml': ['content/**/*'],
    '/robots.txt': ['content/**/*'],
  },
  redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/index.html',
        permanent: false,
      },
      {
        source: '/admin/',
        destination: '/admin/index.html',
        permanent: false,
      },
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
