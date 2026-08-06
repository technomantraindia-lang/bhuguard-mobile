import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

import { safeNetInfoIsConnected } from '../utils/safeNetInfo';

export type AppUpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'applying'
  | 'unavailable'
  | 'failed';

export interface AppUpdateState {
  status: AppUpdateStatus;
  updateId: string | null;
  message: string | null;
  lastCheckedAt: number | null;
  dismissal: { updateId: string | null; dismissedAt: number | null };
}

const DISMISSED_UPDATE_KEY = '@bhuguard/update-dismissed-v1';
const DEFAULT_REPROMPT_MS = 6 * 60 * 60 * 1000;

const initialState: AppUpdateState = {
  status: 'idle',
  updateId: null,
  message: null,
  lastCheckedAt: null,
  dismissal: { updateId: null, dismissedAt: null },
};

let state: AppUpdateState = { ...initialState };
let listeners = new Set<(next: AppUpdateState) => void>();
let checkingPromise: Promise<AppUpdateState> | null = null;
let downloadingPromise: Promise<AppUpdateState> | null = null;

function emit() {
  for (const listener of listeners) {
    listener(state);
  }
}

function patch(next: Partial<AppUpdateState>) {
  state = { ...state, ...next };
  emit();
}

function asUpdateId(value: unknown): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function loadDismissalState(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_UPDATE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw) as { updateId?: string; dismissedAt?: number };
    state = {
      ...state,
      dismissal: {
        updateId: asUpdateId(parsed?.updateId),
        dismissedAt: typeof parsed?.dismissedAt === 'number' ? parsed.dismissedAt : null,
      },
    };
  } catch {
    // Ignore corrupted dismissal cache.
  }
}

async function saveDismissal(updateId: string): Promise<void> {
  const dismissal = { updateId, dismissedAt: Date.now() };
  try {
    await AsyncStorage.setItem(DISMISSED_UPDATE_KEY, JSON.stringify(dismissal));
  } catch {
    // Non-fatal if persistence fails.
  }
  patch({ dismissal });
}

function isUpdateEnabledRuntime(): boolean {
  if (!Updates.isEnabled) {
    return false;
  }
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return false;
  }
  return true;
}

function shouldSuppressUpdate(updateId: string, repromptMs = DEFAULT_REPROMPT_MS): boolean {
  if (state.dismissal.updateId !== updateId || state.dismissal.dismissedAt == null) {
    return false;
  }
  return Date.now() - state.dismissal.dismissedAt < repromptMs;
}

export const appUpdateService = {
  async bootstrap(): Promise<void> {
    await loadDismissalState();
    emit();
  },

  subscribe(listener: (next: AppUpdateState) => void): () => void {
    listeners.add(listener);
    listener(state);
    return () => {
      listeners.delete(listener);
    };
  },

  getState(): AppUpdateState {
    return state;
  },

  isEnabled(): boolean {
    return isUpdateEnabledRuntime();
  },

  async checkForUpdate(options?: { force?: boolean; repromptMs?: number }): Promise<AppUpdateState> {
    if (!isUpdateEnabledRuntime()) {
      patch({ status: 'unavailable', message: null });
      return state;
    }

    if (checkingPromise) {
      return checkingPromise;
    }

    checkingPromise = (async () => {
      try {
        if (!(await safeNetInfoIsConnected())) {
          if (options?.force) {
            patch({ status: 'failed', message: 'No internet connection. Connect to the internet to check for updates.' });
          }
          return state;
        }

        patch({ status: 'checking', message: options?.force ? 'Checking for updates…' : null });
        const result = await Updates.checkForUpdateAsync();
        const updateId = asUpdateId((result as { manifest?: { id?: string } }).manifest?.id);
        const now = Date.now();

        if (result.isAvailable && updateId) {
          if (!options?.force && shouldSuppressUpdate(updateId, options?.repromptMs)) {
            patch({ status: 'idle', updateId, message: null, lastCheckedAt: now });
            return state;
          }
          patch({ status: 'available', updateId, message: null, lastCheckedAt: now });
          return state;
        }

        patch({
          status: 'unavailable',
          updateId: null,
          message: options?.force ? 'Your Bhuguard app is up to date.' : null,
          lastCheckedAt: now,
        });
        return state;
      } catch (error) {
        if (__DEV__) {
          console.warn('[Bhuguard] update check failed', error);
        }
        patch({ status: 'failed', message: null });
        return state;
      } finally {
        checkingPromise = null;
      }
    })();

    return checkingPromise;
  },

  async dismissAvailableUpdate(): Promise<void> {
    const updateId = state.updateId;
    if (!updateId) {
      patch({ status: 'idle' });
      return;
    }
    await saveDismissal(updateId);
    patch({ status: 'idle' });
  },

  async downloadUpdate(): Promise<AppUpdateState> {
    if (!isUpdateEnabledRuntime()) {
      patch({ status: 'unavailable', message: null });
      return state;
    }
    if (state.status !== 'available' && state.status !== 'failed') {
      return state;
    }
    if (downloadingPromise) {
      return downloadingPromise;
    }

    downloadingPromise = (async () => {
      try {
        if (!(await safeNetInfoIsConnected())) {
          patch({ status: 'failed', message: 'No internet connection. Connect to the internet to check for updates.' });
          return state;
        }
        patch({ status: 'downloading', message: 'Please wait while the latest update is downloaded.' });
        const result = await Updates.fetchUpdateAsync();
        if (result.isNew) {
          patch({ status: 'downloaded', message: 'Update downloaded. Restarting Bhuguard…' });
          return state;
        }
        patch({ status: 'unavailable', message: 'Your Bhuguard app is up to date.' });
        return state;
      } catch (error) {
        if (__DEV__) {
          console.warn('[Bhuguard] update download failed', error);
        }
        patch({ status: 'failed', message: 'Update could not be downloaded. Please try again later.' });
        return state;
      } finally {
        downloadingPromise = null;
      }
    })();

    return downloadingPromise;
  },

  async applyUpdateNow(): Promise<AppUpdateState> {
    if (!isUpdateEnabledRuntime()) {
      patch({ status: 'unavailable' });
      return state;
    }
    try {
      patch({ status: 'applying', message: 'Update downloaded. Restarting Bhuguard…' });
      await Updates.reloadAsync();
      return state;
    } catch (error) {
      if (__DEV__) {
        console.warn('[Bhuguard] update reload failed', error);
      }
      patch({ status: 'failed', message: 'Update is downloaded but could not be applied. Please restart the app.' });
      return state;
    }
  },
};
