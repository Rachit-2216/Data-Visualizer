import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@datacanvas/types'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
