/**
 * Probe Expo native modules before requiring JS packages that call
 * requireNativeModule() at import time (which RedBoxes on older APKs).
 */

import { requireOptionalNativeModule } from 'expo-modules-core';

const missingLogged = new Set<string>();

export function isExpoNativeModuleAvailable(nativeModuleName: string): boolean {
  try {
    return requireOptionalNativeModule(nativeModuleName) != null;
  } catch {
    return false;
  }
}

export function loadExpoJsModuleWhenNativeAvailable<T>(
  nativeModuleName: string,
  requireJs: () => T,
): T | null {
  if (!isExpoNativeModuleAvailable(nativeModuleName)) {
    if (__DEV__ && !missingLogged.has(nativeModuleName)) {
      missingLogged.add(nativeModuleName);
      console.warn(
        `[Bhuguard] Native module ${nativeModuleName} is missing. Feature degraded until you rebuild the app (` +
          '`npm run build:dev-client`).',
      );
    }
    return null;
  }

  try {
    return requireJs();
  } catch (error) {
    if (__DEV__ && !missingLogged.has(`${nativeModuleName}:require`)) {
      missingLogged.add(`${nativeModuleName}:require`);
      console.warn(`[Bhuguard] Failed to load JS for ${nativeModuleName}`, error);
    }
    return null;
  }
}
