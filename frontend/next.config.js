/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed static export to support dynamic routes
  // Cloudflare Pages supports SSR with @cloudflare/next-on-pages
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
};

module.exports = nextConfig;
