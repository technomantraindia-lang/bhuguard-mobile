import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo-modules-core';

const TOKEN_KEY = 'bhuguard_secure_token';
const DEVICE_UUID_KEY = 'bhuguard_secure_device_uuid';
const BIOMETRIC_KEY = 'bhuguard_secure_biometric_enabled';
const LEGACY_TOKEN_KEY = 'bhuguard_token';
const LEGACY_DEVICE_UUID_KEY = '@bhuguard/device_uuid';
const LEGACY_BIOMETRIC_KEY = '@bhuguard/biometric_login_enabled';

/** Used when the installed native app does not yet include ExpoSecureStore. */
const FALLBACK_TOKEN_KEY = '@bhuguard/fallback_secure_token';
const FALLBACK_DEVICE_UUID_KEY = '@bhuguard/fallback_secure_device_uuid';
const FALLBACK_BIOMETRIC_KEY = '@bhuguard/fallback_secure_biometric_enabled';

type SecureStoreModule = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

let secureStoreModule: SecureStoreModule | null | undefined;
let secureStoreLoadFailed = false;

/**
 * Lazy-load SecureStore only when the native module exists.
 * Older APKs without ExpoSecureStore fall back to AsyncStorage (no RedBox).
 */
function resolveSecureStore(): SecureStoreModule | null {
  if (secureStoreLoadFailed) {
    return null;
  }

  if (secureStoreModule !== undefined) {
    return secureStoreModule;
  }

  // Probe first — requiring expo-secure-store calls requireNativeModule and RedBoxes if missing.
  if (requireOptionalNativeModule('ExpoSecureStore') == null) {
    secureStoreLoadFailed = true;
    secureStoreModule = null;

    if (__DEV__) {
      console.warn(
        '[Bhuguard] ExpoSecureStore native module missing. Using AsyncStorage fallback. Rebuild the dev client (`npm run build:dev-client`) to enable SecureStore.',
      );
    }

    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('expo-secure-store') as SecureStoreModule;
    secureStoreModule = loaded;
    return loaded;
  } catch (error) {
    secureStoreLoadFailed = true;
    secureStoreModule = null;

    if (__DEV__) {
      console.warn(
        '[Bhuguard] expo-secure-store failed to load. Using AsyncStorage fallback.',
        error,
      );
    }

    return null;
  }
}

async function secureGet(key: string, fallbackKey: string): Promise<string | null> {
  const store = resolveSecureStore();

  if (store) {
    try {
      const value = await store.getItemAsync(key);

      if (value != null) {
        return value;
      }
    } catch {
      // Fall through to AsyncStorage.
    }
  }

  return AsyncStorage.getItem(fallbackKey);
}

async function secureSet(key: string, fallbackKey: string, value: string): Promise<void> {
  const store = resolveSecureStore();

  if (store) {
    try {
      await store.setItemAsync(key, value);
      await AsyncStorage.removeItem(fallbackKey);
      return;
    } catch {
      // Fall through to AsyncStorage.
    }
  }

  await AsyncStorage.setItem(fallbackKey, value);
}

async function secureDelete(key: string, fallbackKey: string): Promise<void> {
  const store = resolveSecureStore();

  if (store) {
    try {
      await store.deleteItemAsync(key);
    } catch {
      // ignore
    }
  }

  await AsyncStorage.removeItem(fallbackKey);
}

export async function getSecureAuthToken(): Promise<string | null> {
  const secure = await secureGet(TOKEN_KEY, FALLBACK_TOKEN_KEY);

  if (secure) {
    return secure;
  }

  const legacy = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);

  if (legacy) {
    await secureSet(TOKEN_KEY, FALLBACK_TOKEN_KEY, legacy);
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
    return legacy;
  }

  return null;
}

export async function setSecureAuthToken(token: string): Promise<void> {
  await secureSet(TOKEN_KEY, FALLBACK_TOKEN_KEY, token);
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
}

export async function clearSecureAuthToken(): Promise<void> {
  await secureDelete(TOKEN_KEY, FALLBACK_TOKEN_KEY);
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
}

export async function getOrCreateSecureDeviceUuid(): Promise<string> {
  const secure = await secureGet(DEVICE_UUID_KEY, FALLBACK_DEVICE_UUID_KEY);

  if (secure) {
    return secure;
  }

  const legacy = await AsyncStorage.getItem(LEGACY_DEVICE_UUID_KEY);

  if (legacy) {
    await secureSet(DEVICE_UUID_KEY, FALLBACK_DEVICE_UUID_KEY, legacy);
    return legacy;
  }

  const generated =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `bhuguard-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

  await secureSet(DEVICE_UUID_KEY, FALLBACK_DEVICE_UUID_KEY, generated);
  await AsyncStorage.setItem(LEGACY_DEVICE_UUID_KEY, generated);

  return generated;
}

export async function getSecureBiometricEnabled(): Promise<boolean> {
  const secure = await secureGet(BIOMETRIC_KEY, FALLBACK_BIOMETRIC_KEY);

  if (secure === '1' || secure === '0') {
    return secure === '1';
  }

  const legacy = await AsyncStorage.getItem(LEGACY_BIOMETRIC_KEY);

  if (legacy === '1' || legacy === '0') {
    await secureSet(BIOMETRIC_KEY, FALLBACK_BIOMETRIC_KEY, legacy);
    return legacy === '1';
  }

  return false;
}

export async function setSecureBiometricEnabled(enabled: boolean): Promise<void> {
  const value = enabled ? '1' : '0';
  await secureSet(BIOMETRIC_KEY, FALLBACK_BIOMETRIC_KEY, value);
  await AsyncStorage.setItem(LEGACY_BIOMETRIC_KEY, value);
}

export function isNativeSecureStoreAvailable(): boolean {
  return resolveSecureStore() != null;
}
