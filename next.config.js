/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle source map files
    config.module.rules.push({
      test: /\.js\.map$/,
      use: 'null-loader'
    });

    // Ignore source map warnings
    config.ignoreWarnings = [
      { module: /node_modules\/chrome-aws-lambda/ }
    ];

    return config;
  },
  // Increase serverless function timeout
  serverRuntimeConfig: {
    timeoutInSeconds: 60
  }
}

module.exports = nextConfig 