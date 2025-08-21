const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Enable the new resolver for better performance
    unstable_enableSymlinks: true,
    // Enable package exports support
    unstable_enablePackageExports: true,
  },
  transformer: {
    // Enable the new transformer for better performance
    unstable_allowRequireContext: true,
    // Disable Hermes to avoid sandbox issues
    hermesParser: false,
  },
  // Reduce verbose output and Unicode characters
  reporter: {
    update: () => {},
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
