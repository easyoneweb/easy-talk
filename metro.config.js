const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Provide empty stubs for native-only modules that don't support web.
// Metro resolves all require() calls regardless of runtime Platform checks,
// so these modules fail on web even inside `if (Platform.OS === 'ios')` guards.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    (moduleName === '@react-native-community/blur' ||
      moduleName === '@callstack/liquid-glass' ||
      moduleName === 'react-native-image-keyboard')
  ) {
    return {
      type: 'empty',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
