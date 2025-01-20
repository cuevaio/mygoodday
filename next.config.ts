import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nix-tag-images.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'd2eawub7utcl6.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
};

export default nextConfig;
