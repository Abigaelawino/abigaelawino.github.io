/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {}, // Empty turbopack config to silence the warning
  // Keep the custom static generation working alongside Next.js
  webpack: (config, { isServer }) => {
    // Allow importing .js files without explicit extensions
    config.resolve.extensions = [...config.resolve.extensions, '.js', '.jsx', '.ts', '.tsx'];
    return config;
  },
};

module.exports = nextConfig;

module.exports = nextConfig;