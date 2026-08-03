const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const metroTmp = path.join(projectRoot, '.metro-tmp');

// Windows EPERM on C:\WINDOWS\TEMP blocks bundling; keep TMP inside the project.
if (!fs.existsSync(metroTmp)) {
  fs.mkdirSync(metroTmp, { recursive: true });
}

process.env.TMPDIR = metroTmp;
process.env.TEMP = metroTmp;
process.env.TMP = metroTmp;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.resolver.unstable_enablePackageExports = false;

module.exports = config;
