import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // Default: self-contained Node server for the Docker image.
  // STATIC_EXPORT=true: plain HTML/JS/CSS in out/ for static hosting (Cloudflare).
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : 'standalone',
  // Trace files from the monorepo root so workspace packages are included.
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  // calc-core is consumed as TypeScript source from the workspace.
  transpilePackages: ['@cctv/calc-core'],
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
};

export default nextConfig;
