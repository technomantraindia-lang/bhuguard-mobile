const appJson = require('./app.json');

const PRODUCTION_API_URL = 'https://erp.bhuguard.com/api';
const PRODUCTION_APP_URL = 'https://erp.bhuguard.com';
const EAS_PROJECT_ID = '63730ff7-1af6-4886-89f1-7f1e54e9b64c';
const appVariant = process.env.EXPO_PUBLIC_APP_VARIANT ?? 'production';
const isDevClient = appVariant === 'development';
const appScheme = appJson.expo?.scheme ?? 'bhuguard';
const apiUrl = PRODUCTION_API_URL;
const appUrl = PRODUCTION_APP_URL;
const mapTilerApiKey = process.env.EXPO_PUBLIC_MAPTILER_API_KEY?.trim() || '';
const mapTilerKeyLooksReal =
  mapTilerApiKey.length >= 16
  && !/your_|paste_|placeholder|maptiler_key|undefined|null/i.test(mapTilerApiKey);

if (!mapTilerKeyLooksReal) {
  console.warn(
    '[Bhuguard] MapTiler API key is missing or a placeholder. Set EXPO_PUBLIC_MAPTILER_API_KEY in .env for Field Officer Farm Boundary Hybrid maps.',
  );
}

const IOS_CAMERA_PERMISSION =
  'Bhuguard uses camera to capture Biochar activity, farm, feedstock, moisture, production, and evidence images.';
const IOS_LOCATION_PERMISSION =
  'Bhuguard uses location to verify farm location, Biochar activity location, GPS evidence, Field Officer check-in, and Artisan production location.';
const IOS_PHOTOS_PERMISSION =
  'Bhuguard uses photo library to select and upload evidence images when required.';
const IOS_MICROPHONE_PERMISSION =
  'Bhuguard uses microphone when recording Biochar process videos.';

/** Solid native splash only — animated logo runs in JS (AnimatedLogoSplash). */
const SPLASH_PLUGIN_CONFIG = {
  backgroundColor: '#03150D',
  image: './assets/splash-native-blank.png',
  imageWidth: 1,
  resizeMode: 'contain',
};

function getPluginName(plugin) {
  return Array.isArray(plugin) ? plugin[0] : plugin;
}

function mergeRequiredPlugins(basePlugins) {
  const plugins = [];
  const seen = new Set();

  for (const plugin of basePlugins) {
    const name = getPluginName(plugin);

    if (seen.has(name)) {
      continue;
    }

    seen.add(name);

    if (name === 'expo-dev-client' && !isDevClient) {
      continue;
    }

    plugins.push(plugin);
  }

  const ensurePlugin = (name, pluginConfig) => {
    const index = plugins.findIndex((plugin) => getPluginName(plugin) === name);

    if (index === -1) {
      plugins.push(pluginConfig ? [name, pluginConfig] : name);
      return;
    }

    if (pluginConfig) {
      plugins[index] = [name, pluginConfig];
    }
  };

  ensurePlugin('expo-splash-screen', SPLASH_PLUGIN_CONFIG);
  ensurePlugin('expo-sharing');
  ensurePlugin('expo-system-ui');
  ensurePlugin('expo-secure-store');
  // expo-sqlite requires a native rebuild; offline queue uses AsyncStorage until then.
  ensurePlugin('@maplibre/maplibre-react-native');

  return plugins;
}

/**
 * app.config.js is the single effective dynamic Expo config.
 * Values from app.json are imported and merged with Expo's loaded `config`.
 * HTTP cleartext for LAN Laravel APIs is handled in android/app/src/debug*
 * AndroidManifest.xml (not in Expo schema).
 *
 * @param {{ config: import('expo/config').ExpoConfig }} param0
 * @returns {import('expo/config').ExpoConfig}
 */
module.exports = ({ config }) => {
  const fromAppJson = appJson.expo ?? {};
  const base = {
    ...fromAppJson,
    ...config,
  };

  // SDK 56 schema rejects top-level splash / newArchEnabled / android.usesCleartextTraffic.
  const {
    splash: _ignoredSplash,
    newArchEnabled: _ignoredNewArch,
    ...baseWithoutInvalid
  } = base;

  const {
    usesCleartextTraffic: _ignoredCleartext,
    ...androidWithoutCleartext
  } = baseWithoutInvalid.android ?? {};

  const plugins = mergeRequiredPlugins(baseWithoutInvalid.plugins ?? []);

  return {
    ...baseWithoutInvalid,
    scheme: appScheme,
    plugins,
    ios: {
      ...baseWithoutInvalid.ios,
      infoPlist: {
        ...baseWithoutInvalid.ios?.infoPlist,
        NSCameraUsageDescription: IOS_CAMERA_PERMISSION,
        NSLocationWhenInUseUsageDescription: IOS_LOCATION_PERMISSION,
        NSPhotoLibraryUsageDescription: IOS_PHOTOS_PERMISSION,
        NSMicrophoneUsageDescription: IOS_MICROPHONE_PERMISSION,
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      ...androidWithoutCleartext,
      package: androidWithoutCleartext.package ?? 'com.bhuguard.app',
      config: androidWithoutCleartext.config,
      intentFilters: [
        {
          action: 'VIEW',
          data: [{ scheme: appScheme }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      permissions: Array.from(
        new Set([
          ...(androidWithoutCleartext.permissions ?? []),
          'android.permission.INTERNET',
          'android.permission.ACCESS_NETWORK_STATE',
          'android.permission.ACCESS_COARSE_LOCATION',
          'android.permission.ACCESS_FINE_LOCATION',
          'android.permission.READ_MEDIA_IMAGES',
          'android.permission.READ_MEDIA_VIDEO',
          'android.permission.READ_EXTERNAL_STORAGE',
          'android.permission.USE_BIOMETRIC',
          'android.permission.USE_FINGERPRINT',
        ]),
      ),
    },
    extra: {
      ...baseWithoutInvalid.extra,
      eas: {
        ...(baseWithoutInvalid.extra?.eas ?? {}),
        projectId: EAS_PROJECT_ID,
      },
      apiUrl,
      appUrl,
      appVariant,
      useNativeMaps: false,
      googleMapsApiKeyConfigured: false,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      ...(baseWithoutInvalid.updates ?? {}),
      enabled: true,
      checkAutomatically: 'NEVER',
      fallbackToCacheTimeout: 0,
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    },
  };
};
