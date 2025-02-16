/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  experimental: {
    // Enable modern build optimizations
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  // Configure SWC
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
    // Enable proper TypeScript handling
    styledComponents: true,
  },
  typescript: {
    // Handle TypeScript errors as warnings during development
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
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

    // Handle non-standard packages
    config.module.rules.push({
      test: /\.(mp3|wav|ogg)$/,
      type: 'asset/resource',
    });

    // Null loader for packages that cause issues
    config.module.rules.push({
      test: /\.wasm$/,
      loader: 'null-loader',
    });

    return config;
  },
  // Increase serverless function timeout
  serverRuntimeConfig: {
    timeoutInSeconds: 60
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'substackcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'substack-post-media.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'bucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com',
      },
    ],
  },
}

module.exports = nextConfig 