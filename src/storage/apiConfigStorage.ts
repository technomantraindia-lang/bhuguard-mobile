import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { BUILD_API_BASE_URL } from '../config/apiDefaults';
import {
  isDevelopmentApiVariant,
  LOCAL_API_BASE_URL,
  PRODUCTION_API_BASE_URL,
} from '../config/env';
import {
  isDemoApiUrl,
  isLiveProductionApiUrl,
  isPlaceholderApiUrl,
  isTryCloudflareTunnelUrl,
} from '../config/apiUrlValidation';
import { formatApiUnreachableMessage } from '../utils/apiError';

const API_BASE_URL_KEY = 'bhuguard_api_base_url';

let cachedApiBaseUrl: string | null = null;

function withApiSuffix(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');

  if (!trimmed) {
    return '';
  }

  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export function getDefaultApiBaseUrl(): string {
  const built = withApiSuffix(BUILD_API_BASE_URL || LOCAL_API_BASE_URL);

  if (isDevelopmentApiVariant()) {
    if (
      built &&
      !isPlaceholderApiUrl(built) &&
      !isTryCloudflareTunnelUrl(built)
    ) {
      return built;
    }

    return withApiSuffix(LOCAL_API_BASE_URL) || 'http://192.168.1.11:8000/api';
  }

  if (!built || isPlaceholderApiUrl(built) || !isLiveProductionApiUrl(built)) {
    return PRODUCTION_API_BASE_URL;
  }

  return built;
}

export function normalizeApiBaseUrl(input: string): string {
  const normalized = withApiSuffix(input);

  if (!normalized) {
    return getDefaultApiBaseUrl();
  }

  return normalized;
}

/** Example URLs from help text — not real servers. */
export { isPlaceholderApiUrl } from '../config/apiUrlValidation';

function getUrlHostname(url: string): string | null {
  try {
    return new URL(url.replace(/\/api\/?$/, '') || url).hostname;
  } catch {
    return null;
  }
}

/** LAN / loopback URLs fail on mobile data or when the phone is not on the dev PC's Wi-Fi. */
export function isLocalNetworkApiUrl(url: string): boolean {
  const host = getUrlHostname(url);

  if (!host) {
    return false;
  }

  if (host === 'localhost' || host === '127.0.0.1') {
    return true;
  }

  if (/^192\.168\./.test(host)) {
    return true;
  }

  if (/^10\./.test(host)) {
    return true;
  }

  return /^172\.(1[6-9]|2\d|3[01])\./.test(host);
}

function shouldMigrateStoredApiUrl(stored: string): boolean {
  if (!stored) {
    return false;
  }

  if (isDevelopmentApiVariant()) {
    // Keep intentional LAN overrides. Drop placeholders/tunnels and stale production
    // values left over from when development incorrectly forced live ERP.
    if (isPlaceholderApiUrl(stored) || isTryCloudflareTunnelUrl(stored)) {
      return true;
    }

    const built = getDefaultApiBaseUrl();

    return isLiveProductionApiUrl(stored) && isLocalNetworkApiUrl(built);
  }

  // Drop placeholders, tunnels, LAN, demo, and any non-live ERP override.
  return (
    isPlaceholderApiUrl(stored) ||
    isTryCloudflareTunnelUrl(stored) ||
    isLocalNetworkApiUrl(stored) ||
    isDemoApiUrl(stored) ||
    !isLiveProductionApiUrl(stored)
  );
}

async function applyStoredApiUrl(stored: string): Promise<string> {
  const normalized = normalizeApiBaseUrl(stored);

  if (shouldMigrateStoredApiUrl(normalized)) {
    const fallback = getDefaultApiBaseUrl();
    cachedApiBaseUrl = fallback;
    await AsyncStorage.setItem(API_BASE_URL_KEY, fallback);
    return fallback;
  }

  cachedApiBaseUrl = normalized;
  return normalized;
}

export function getCachedApiBaseUrl(): string {
  return cachedApiBaseUrl ?? getDefaultApiBaseUrl();
}

export function setCachedApiBaseUrl(url: string): void {
  cachedApiBaseUrl = normalizeApiBaseUrl(url);
}

export async function getApiBaseUrl(): Promise<string> {
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  const stored = await AsyncStorage.getItem(API_BASE_URL_KEY);

  if (stored) {
    return applyStoredApiUrl(stored);
  }

  cachedApiBaseUrl = getDefaultApiBaseUrl();
  return cachedApiBaseUrl;
}

export async function saveApiBaseUrl(input: string): Promise<string> {
  const normalized = normalizeApiBaseUrl(input);
  cachedApiBaseUrl = normalized;
  await AsyncStorage.setItem(API_BASE_URL_KEY, normalized);
  return normalized;
}

export async function clearApiBaseUrlOverride(): Promise<void> {
  cachedApiBaseUrl = getDefaultApiBaseUrl();
  await AsyncStorage.removeItem(API_BASE_URL_KEY);
}

export function getApiOrigin(apiBaseUrl = getCachedApiBaseUrl()): string {
  return apiBaseUrl.replace(/\/api\/?$/, '');
}

export async function testApiConnection(apiBaseUrl: string): Promise<{ ok: boolean; message: string }> {
  const normalized = normalizeApiBaseUrl(apiBaseUrl);

  if (!normalized) {
    return { ok: false, message: 'No API URL configured. Add your server URL first.' };
  }

  if (isPlaceholderApiUrl(normalized)) {
    return {
      ok: false,
      message:
        'That is an example URL, not a real server. Use https://erp.bhuguard.com for the live Bhuguard API.',
    };
  }

  const origin = getApiOrigin(normalized);

  try {
    const response = await axios.get(`${origin}/up`, {
      timeout: 15000,
      headers: { Accept: 'application/json' },
      validateStatus: (status) => status >= 200 && status < 500,
    });

    if (response.status >= 200 && response.status < 300) {
      return { ok: true, message: `Connected to ${normalized}` };
    }

    return { ok: false, message: `Server responded with status ${response.status}` };
  } catch {
    if (isTryCloudflareTunnelUrl(normalized) || isLocalNetworkApiUrl(normalized) || isDemoApiUrl(normalized)) {
      return {
        ok: false,
        message: `${formatApiUnreachableMessage(normalized)} Use the live server at ${getApiOrigin(PRODUCTION_API_BASE_URL)}.`,
      };
    }

    return {
      ok: false,
      message: formatApiUnreachableMessage(normalized),
    };
  }
}

/** Load saved API URL on launch — no network test (keeps app startup fast). */
export async function bootstrapApiBaseUrl(): Promise<string> {
  const stored = await AsyncStorage.getItem(API_BASE_URL_KEY);
  const defaultUrl = getDefaultApiBaseUrl();

  if (stored) {
    return applyStoredApiUrl(stored);
  }

  cachedApiBaseUrl = defaultUrl;
  return defaultUrl;
}
