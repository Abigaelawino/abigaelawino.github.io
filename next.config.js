/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  outputFileTracingIncludes: {
    '/app/projects/[slug]/page': ['content/projects/**/*'],
    '/app/blog/[slug]/page': ['content/blog/**/*'],
    '/app/sitemap': ['content/**/*'],
    '/app/robots': ['content/**/*'],
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
