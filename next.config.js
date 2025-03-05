/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'i.pravatar.cc', 
      'lh3.googleusercontent.com',
      'images.unsplash.com',
      'substackcdn.com',
      'substack-post-media.s3.amazonaws.com',
      'bucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com'
    ],
  },
  experimental: {
    serverActions: true,
  },
  // Disable static generation for dashboard and login pages
  unstable_excludeFiles: ['**/dashboard/**/*', '**/login/**/*'],
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
  },
}

module.exports = nextConfig 