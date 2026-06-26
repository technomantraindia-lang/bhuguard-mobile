const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');

const projectRoot = __dirname;
const metroTmp = path.join(projectRoot, '.metro-tmp');

// Windows EPERM on C:\WINDOWS\TEMP\metro-cache blocks bundling and leaves the dev client on "Reloading...".
process.env.TMPDIR = metroTmp;
process.env.TEMP = metroTmp;
process.env.TMP = metroTmp;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Avoid Hermes "[runtime not ready]" crashes from package.json:exports resolving web builds.
config.resolver.unstable_enablePackageExports = false;

config.cacheStores = [
  new FileStore({
    root: path.join(projectRoot, 'node_modules', '.cache', 'metro'),
  }),
];

module.exports = config;