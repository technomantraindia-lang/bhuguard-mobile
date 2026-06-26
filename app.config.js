const appJson = require('./app.json');

const appVariant = process.env.EXPO_PUBLIC_APP_VARIANT ?? 'development';
const isDevClient = appVariant === 'development';
const appScheme = appJson.expo.scheme ?? 'bhuguard';
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  (appVariant === 'demo' || appVariant === 'production'
    ? 'https://demo.bhuguard.com/api'
    : 'http://192.168.1.18:8000/api');
const usesHttpApi =
  apiUrl.startsWith('http://') || appVariant === 'development' || appVariant === 'demo';

const basePlugins = appJson.expo.plugins ?? [];
const plugins = basePlugins.filter((plugin) => {
  if (plugin === 'expo-dev-client') {
    return isDevClient;
  }
  return true;
});

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    scheme: appScheme,
    plugins,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#005129',
    },
    android: {
      ...appJson.expo.android,
      usesCleartextTraffic: usesHttpApi,
      intentFilters: [
        {
          action: 'VIEW',
          data: [{ scheme: appScheme }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      permissions: [
        ...(appJson.expo.android?.permissions ?? []),
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.USE_BIOMETRIC',
        'android.permission.USE_FINGERPRINT',
      ],
    },
    extra: {
      ...appJson.expo.extra,
      apiUrl,
      appVariant,
    },
  },
};