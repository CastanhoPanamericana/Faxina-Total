
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rodrigocastanho.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'bufalloinox.com.br',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http', // Added for bombril images
        hostname: 'incentivobombril.com.br',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
