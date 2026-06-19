import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { BUILD_API_BASE_URL } from '../config/apiDefaults';

const API_BASE_URL_KEY = 'bhuguard_api_base_url';

let cachedApiBaseUrl: string | null = null;

export function normalizeApiBaseUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');

  if (!trimmed) {
    return BUILD_API_BASE_URL;
  }

  if (trimmed.endsWith('/api')) {
    return trimmed;
  }

  return `${trimmed}/api`;
}

/** Example URLs from help text — not real servers. */
export function isPlaceholderApiUrl(url: string): boolean {
  const host = getUrlHostname(url)?.toLowerCase() ?? '';

  if (!host) {
    return true;
  }

  const placeholders = [
    'something-random.trycloudflare.com',
    'abcd-xyz.trycloudflare.com',
    'your-tunnel.trycloudflare.com',
    'example.com',
    'your-domain.com',
  ];

  return placeholders.some((placeholder) => host === placeholder || host.includes('your-tunnel'));
}

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

function shouldReplaceStoredWithBuild(stored: string, build: string): boolean {
  if (stored === build) {
    return false;
  }

  // Drop stale LAN overrides when the app ships a public HTTPS API.
  if (isLocalNetworkApiUrl(stored) && build.startsWith('https://')) {
    return true;
  }

  return stored.startsWith('http://') && build.startsWith('https://');
}

export function getCachedApiBaseUrl(): string {
  return cachedApiBaseUrl ?? BUILD_API_BASE_URL;
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
    const normalized = normalizeApiBaseUrl(stored);

    if (shouldReplaceStoredWithBuild(normalized, BUILD_API_BASE_URL)) {
      cachedApiBaseUrl = BUILD_API_BASE_URL;
      await AsyncStorage.setItem(API_BASE_URL_KEY, BUILD_API_BASE_URL);
      return BUILD_API_BASE_URL;
    }

    cachedApiBaseUrl = normalized;
    return normalized;
  }

  cachedApiBaseUrl = BUILD_API_BASE_URL;
  return BUILD_API_BASE_URL;
}

export async function saveApiBaseUrl(input: string): Promise<string> {
  const normalized = normalizeApiBaseUrl(input);
  cachedApiBaseUrl = normalized;
  await AsyncStorage.setItem(API_BASE_URL_KEY, normalized);
  return normalized;
}

export async function clearApiBaseUrlOverride(): Promise<void> {
  cachedApiBaseUrl = BUILD_API_BASE_URL;
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
        'That is the example URL, not your real server. Copy the https://....trycloudflare.com link from Git Bash after running the tunnel script.',
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
    const isTunnel = normalized.includes('trycloudflare.com');

    if (isTunnel) {
      return {
        ok: false,
        message:
          `Cannot reach ${normalized}. This tunnel URL has expired — close is NOT enough. On your PC, run the tunnel script again in Git Bash, copy the NEW https://....trycloudflare.com URL, and paste it here. Keep that Git Bash window open.`,
      };
    }

    return {
      ok: false,
      message: `Cannot reach ${normalized}. Check that Laravel is running and the server URL is correct.`,
    };
  }
}

/** Load saved API URL on launch — no network test (keeps app startup fast). */
export async function bootstrapApiBaseUrl(): Promise<string> {
  const stored = await AsyncStorage.getItem(API_BASE_URL_KEY);
  const buildUrl = BUILD_API_BASE_URL;

  if (stored) {
    const normalized = normalizeApiBaseUrl(stored);

    if (isPlaceholderApiUrl(normalized)) {
      await AsyncStorage.removeItem(API_BASE_URL_KEY);
      cachedApiBaseUrl = buildUrl || null;
      return buildUrl;
    }

    if (shouldReplaceStoredWithBuild(normalized, buildUrl)) {
      if (buildUrl) {
        cachedApiBaseUrl = buildUrl;
        await AsyncStorage.setItem(API_BASE_URL_KEY, buildUrl);
        return buildUrl;
      }

      await AsyncStorage.removeItem(API_BASE_URL_KEY);
      cachedApiBaseUrl = null;
      return buildUrl;
    }

    cachedApiBaseUrl = normalized;
    return normalized;
  }

  cachedApiBaseUrl = buildUrl || null;
  return buildUrl;
}
