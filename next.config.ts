import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
  turbopack: {},
  allowedDevOrigins: ['172.29.64.1'],
};

export default nextConfig;