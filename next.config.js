/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**'
      }
    ]
  },
  webpack: (config, { dev }) => {
    // Enable source maps in development mode
    if (dev) {
      config.devtool = 'source-map'
    }
    return config
  }
}
