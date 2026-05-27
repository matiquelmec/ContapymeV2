import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Permitir subida de imágenes hasta 10MB
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mofkjgfrpfmtnktaepqi.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
