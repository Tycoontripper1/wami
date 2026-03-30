const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize bundle size
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    compress: {
      // Remove all console.* statements in production
      drop_console: true,
    },
  },
};

// Enable compact output
config.serializer = {
  ...config.serializer,
  customSerializer: undefined,
};

// Optimize asset resolution
config.resolver = {
  ...config.resolver,
  assetExts: [
    ...config.resolver.assetExts,
    'webp', // Add WebP support
  ],
};

module.exports = config;
