import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  env: {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'vsnry-labs-b4d4f',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'vsnry-labs-b4d4f.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'vsnry-labs-b4d4f.firebasestorage.app',
    NEXT_PUBLIC_CLOUD_RUN_REGION: process.env.NEXT_PUBLIC_CLOUD_RUN_REGION || 'us-east1',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'vsnry-labs-b4d4f',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.firebasestorage.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.appspot.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.run.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
