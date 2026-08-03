/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/admin-api/:path*',
        destination: 'http://memcore-api.dev-memcore.svc.cluster.local:3000/admin/:path*',
      },
    ]
  },
}

module.exports = nextConfig
