/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'], // Cloudinaryのドメインとlocalhostを追加
  },
  async rewrites() {
    return [
      {
        source: '/api/((?!auth).*)',
        destination: 'http://localhost:8000/api/$1',
      },
    ];
  },
}

export default nextConfig;
