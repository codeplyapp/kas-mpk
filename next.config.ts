import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: ['**/node_modules/**', '**/.git/**', '**/Data MPK 2627 FIX.docx', '**/logo.png', '**/prisma/dev.db*'],
      };
    }
    return config;
  },
};

export default nextConfig;
