import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  // ESLint remains available through the dedicated lint script; legacy lint findings
  // must not prevent the production bundle from being generated.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
