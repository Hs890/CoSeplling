const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .sql files (for Drizzle migrations)
config.resolver.sourceExts.push('sql');

// Add support for .wasm files (required by expo-sqlite on web)
config.resolver.assetExts.push('wasm');

module.exports = config;
