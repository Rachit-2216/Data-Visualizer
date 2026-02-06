/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@datacanvas/types',
    '@react-three/fiber',
    '@react-three/drei',
    'three',
  ],
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader', 'glslify-loader'],
    });

    return config;
  },
};

export default nextConfig;
