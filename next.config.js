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

    // Prevent bundling of chrome-aws-lambda and puppeteer-core on server
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'chrome-aws-lambda': 'commonjs chrome-aws-lambda',
        'puppeteer-core': 'commonjs puppeteer-core'
      });
    }

    return config;
  },
  // Increase serverless function timeout
  serverRuntimeConfig: {
    timeoutInSeconds: 60
  }
}

module.exports = nextConfig 