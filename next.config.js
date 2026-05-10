/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/products',
        permanent: false,
      },
    ];
  },
};
module.exports = nextConfig;
