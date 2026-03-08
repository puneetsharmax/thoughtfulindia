import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'thoughtfulindia.com',
        pathname: '**',
      },
      {
        protocol: 'http',
        hostname: 'thoughtfulindia.com',
        pathname: '**',
      },
    ],
  },
}

export default nextConfig
