/**
 * Safe NetInfo access for builds where the native module is not linked yet.
 *
 * IMPORTANT: Never import `@react-native-community/netinfo` unless
 * `NativeModules.RNCNetInfo` exists. Importing the package throws immediately
 * when the native module is null and can break navigator module evaluation.
 */

import { NativeModules } from 'react-native';

type NetInfoStateLike = {
  isConnected: boolean | null;
};

type NetInfoModule = {
  fetch: () => Promise<NetInfoStateLike>;
  addEventListener: (listener: (state: NetInfoStateLike) => void) => (() => void) | void;
};

let cachedModule: NetInfoModule | null | undefined;
let loadAttempted = false;

function isNetInfoNativeAvailable(): boolean {
  return Boolean(NativeModules.RNCNetInfo);
}

async function loadNetInfo(): Promise<NetInfoModule | null> {
  if (loadAttempted) {
    return cachedModule ?? null;
  }
  loadAttempted = true;

  if (!isNetInfoNativeAvailable()) {
    cachedModule = null;
    return null;
  }

  try {
    const mod = await import('@react-native-community/netinfo');
    const candidate = (mod.default ?? mod) as Partial<NetInfoModule>;
    if (typeof candidate.fetch === 'function' && typeof candidate.addEventListener === 'function') {
      cachedModule = candidate as NetInfoModule;
      return cachedModule;
    }
  } catch {
    cachedModule = null;
  }

  cachedModule = null;
  return null;
}

/** Returns connection state, or `true` when NetInfo is unavailable (optimistic). */
export async function safeNetInfoIsConnected(): Promise<boolean> {
  const netInfo = await loadNetInfo();
  if (!netInfo) {
    return true;
  }

  try {
    const state = await netInfo.fetch();
    return state.isConnected !== false;
  } catch {
    return true;
  }
}

/** Subscribe to reconnect events. No-op when NetInfo is unavailable. */
export async function safeNetInfoAddEventListener(
  listener: (isConnected: boolean) => void,
): Promise<() => void> {
  const netInfo = await loadNetInfo();
  if (!netInfo) {
    return () => undefined;
  }

  try {
    const unsubscribe = netInfo.addEventListener((state) => {
      listener(state.isConnected !== false);
    });
    return typeof unsubscribe === 'function' ? unsubscribe : () => undefined;
  } catch {
    return () => undefined;
  }
}
