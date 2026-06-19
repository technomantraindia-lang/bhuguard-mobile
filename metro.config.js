const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Avoid Hermes "[runtime not ready]" crashes from package.json:exports resolving web builds.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
