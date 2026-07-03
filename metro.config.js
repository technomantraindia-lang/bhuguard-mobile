const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');

const projectRoot = __dirname;
const metroTmp = path.join(projectRoot, '.metro-tmp');
const metroCacheRoot = path.join(projectRoot, 'node_modules', '.cache', 'metro');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Windows EPERM on C:\WINDOWS\TEMP\metro-cache blocks bundling and leaves the dev client on "Reloading...".
ensureDir(metroTmp);
ensureDir(metroCacheRoot);

process.env.TMPDIR = metroTmp;
process.env.TEMP = metroTmp;
process.env.TMP = metroTmp;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Avoid Hermes "[runtime not ready]" crashes from package.json:exports resolving web builds.
config.resolver.unstable_enablePackageExports = false;

config.cacheStores = [
  new FileStore({
    root: metroCacheRoot,
  }),
];

module.exports = config;
