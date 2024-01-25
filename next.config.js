const fs = require('fs')
const dotenvFlow = require('dotenv-flow')

// This module loads .env files from the config/ directory based the "app
// environment" that it is being built for or is running in (e.g. development,
// preview, staging, beta, canary, production, etc..). The "app environment"
// is determined by APP_ENV (if defined) or NODE_ENV. It exports a set of
// environment variables which should be passed to Next.js as the env config.
//
// We do not place .env files in the project root because Next.js loads those
// based on NODE_ENV and is limited to just "development", "production", and
// "test". By using a distinct environment variable we can more easily create
// a "production" build (minified JavaScript, etc...) that uses "development"
// or "staging" application settings. This solution was based on the "proposed
// workaround" described in the following Next.js RFC:
//  - https://github.com/vercel/next.js/discussions/25764

function throwErrorIfConflictingFilesDetected() {
  // we throw an exception if .env files are found in the project root since
  // they can conflict with ours. Someone probably just didn't realize we
  // store .env files in ./config
  const fileNames = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.development.local',
    '.env.production',
    '.env.production.local',
    '.env.test',
    '.env.test.local',
  ]
  fileNames.forEach((path) => {
    if (fs.existsSync(path)) {
      throw new Error(
        `env file detected in project root: ${path}. This project requires all .env files to be stored in ./config`
      )
    }
  })
}

function loadAppEnv() {
  throwErrorIfConflictingFilesDetected()
  dotenvFlow.config({
    path: 'config',
    node_env: process.env.APP_ENV || process.env.NODE_ENV || 'development',
  })
}

loadAppEnv()

console.log(`***** next.config.js process.env.NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`)

/** @type {import('next').NextConfig} */
module.exports = async (phase, {defaultConfig}) => {
  console.log(`***** next.config.js phase: ${phase}`)
  console.log(`***** next.config.js defaultConfig: ${defaultConfig}`)
  
  return {
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
}
// module.exports = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'avatars.githubusercontent.com',
//         port: '',
//         pathname: '**'
//       }
//     ]
//   },
//   webpack: (config, { dev }) => {
//     // Enable source maps in development mode
//     if (dev) {
//       config.devtool = 'source-map'
//     }
//     return config
//   }
// }
