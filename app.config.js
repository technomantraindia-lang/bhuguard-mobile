const appJson = require('./app.json');

const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
const usesHttpApi = apiUrl.startsWith('http://');

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      usesCleartextTraffic: usesHttpApi,
    },
    extra: {
      ...appJson.expo.extra,
      apiUrl,
    },
  },
};
