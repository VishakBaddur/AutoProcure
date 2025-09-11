import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Do not block production builds on ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Do not block production builds on type errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
