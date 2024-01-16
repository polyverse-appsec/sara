/** @type {import('next').NextConfig} */
module.exports = {
  // `standalone` output added to support Docker builds. See the following:
  // https://nextjs.org/docs/pages/building-your-application/deploying#docker-image
  // https://github.com/vercel/next.js/tree/canary/examples/with-docker
  output: "standalone",
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
