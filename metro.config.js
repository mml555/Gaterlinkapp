const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Disable symlinks to avoid pnpm issues
    unstable_enableSymlinks: false,
    // Enable package exports support
    unstable_enablePackageExports: true,
    // Add node_modules resolution for pnpm
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
    ],
    // Handle .flow files properly
    sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx', 'flow'],
    // Exclude problematic files
    blockList: [
      /.*\/node_modules\/.*\/node_modules\/react-native\/.*\.flow$/,
    ],
  },
  transformer: {
    // Enable the new transformer for better performance
    unstable_allowRequireContext: true,
    // Use Babel transformer for Flow files
    babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
    // Disable Hermes to avoid sandbox issues
    hermesParser: false,
  },
  // Reduce verbose output and Unicode characters
  reporter: {
    update: () => {},
  },
  // Add watchman configuration
  watchFolders: [
    path.resolve(__dirname, 'node_modules'),
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
