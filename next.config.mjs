/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      // Supabase Storage (thumbnails + user-uploaded images)
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Shotstack render CDN (S3-backed)
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      // Shotstack CDN direct delivery domain
      {
        protocol: 'https',
        hostname: '**.shotstack.io',
      },
    ],
  },
};

export default nextConfig;
