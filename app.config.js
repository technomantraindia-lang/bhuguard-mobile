const appJson = require('./app.json');

const PRODUCTION_API_URL = 'https://yourdomain.com/api';
const DEMO_API_URL = 'https://demo.bhuguard.com/api';
const appVariant = process.env.EXPO_PUBLIC_APP_VARIANT ?? 'production';
const isDevClient = appVariant === 'development';
const appScheme = appJson.expo.scheme ?? 'bhuguard';
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || PRODUCTION_API_URL;
const apiUrl = rawApiUrl.includes('yourdomain.com') ? DEMO_API_URL : rawApiUrl;
const usesHttpApi = apiUrl.startsWith('http://');

const IOS_CAMERA_PERMISSION =
  'Bhuguard uses camera to capture Biochar activity, farm, feedstock, moisture, production, and evidence images.';
const IOS_LOCATION_PERMISSION =
  'Bhuguard uses location to verify farm location, Biochar activity location, GPS evidence, Field Officer check-in, and Artisan production location.';
const IOS_PHOTOS_PERMISSION =
  'Bhuguard uses photo library to select and upload evidence images when required.';
const IOS_MICROPHONE_PERMISSION =
  'Bhuguard uses microphone when recording Biochar process videos.';

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
    ios: {
      ...appJson.expo.ios,
      infoPlist: {
        ...appJson.expo.ios?.infoPlist,
        NSCameraUsageDescription: IOS_CAMERA_PERMISSION,
        NSLocationWhenInUseUsageDescription: IOS_LOCATION_PERMISSION,
        NSPhotoLibraryUsageDescription: IOS_PHOTOS_PERMISSION,
        NSMicrophoneUsageDescription: IOS_MICROPHONE_PERMISSION,
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      ...appJson.expo.android,
      package: appJson.expo.android?.package ?? 'com.bhuguard.app',
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
        'android.permission.READ_MEDIA_VIDEO',
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
