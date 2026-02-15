/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
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
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
