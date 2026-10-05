const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .sql files (for Drizzle migrations)
config.resolver.sourceExts.push('sql');

// Allow Metro to bundle expo-sqlite's web .wasm binary (required for `expo export --platform web`)
config.resolver.assetExts.push('wasm');

module.exports = config;
