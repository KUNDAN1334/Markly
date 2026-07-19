import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
  turbopack: {},
  allowedDevOrigins: ['172.29.64.1'],

  // The PDF export route reads font files off disk with fs.readFile. Vercel only
  // ships files it can statically trace, and a runtime path.join() isn't
  // traceable — without this, font embedding silently falls back to Helvetica
  // in production while working fine locally.
  outputFileTracingIncludes: {
    '/api/export': ['./public/fonts/**'],
  },
};

export default nextConfig;
