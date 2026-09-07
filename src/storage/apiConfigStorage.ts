import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { APP_URL, API_BASE_URL } from '../config/env';

const API_BASE_URL_KEY = 'bhuguard_api_base_url';
const SERVER_STORAGE_KEYS = [
  API_BASE_URL_KEY,
  'serverUrl',
  'apiUrl',
  'appUrl',
  'apiBaseUrl',
  'customServer',
  'selectedServer',
  'savedServer',
  'backendUrl',
  'serverOrigin',
  'tunnelUrl',
];

let cachedApiBaseUrl: string | null = null;

function canonicalApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getDefaultApiBaseUrl(): string {
  return canonicalApiBaseUrl();
}

export function normalizeApiBaseUrl(_input: string): string {
  return canonicalApiBaseUrl();
}

export function getCachedApiBaseUrl(): string {
  return cachedApiBaseUrl ?? canonicalApiBaseUrl();
}

export function setCachedApiBaseUrl(_url: string): void {
  cachedApiBaseUrl = canonicalApiBaseUrl();
}

export function getApiOrigin(apiBaseUrl = getCachedApiBaseUrl()): string {
  return apiBaseUrl.replace(/\/api\/?$/, '');
}

async function purgeStaleServerStorage(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const additional = allKeys.filter((key) => {
    const normalized = key.toLowerCase();
    return (
      (normalized.includes('server') || normalized.includes('api')) &&
      (normalized.includes('url') || normalized.includes('origin') || normalized.includes('base'))
    );
  });
  const purgeKeys = Array.from(new Set([...SERVER_STORAGE_KEYS, ...additional]));
  if (purgeKeys.length > 0) {
    await AsyncStorage.multiRemove(purgeKeys);
  }
}

async function enforceCanonicalStorage(): Promise<string> {
  const canonical = canonicalApiBaseUrl();
  cachedApiBaseUrl = canonical;
  await purgeStaleServerStorage();
  await AsyncStorage.setItem(API_BASE_URL_KEY, canonical);
  return canonical;
}

export async function getApiBaseUrl(): Promise<string> {
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }
  return enforceCanonicalStorage();
}

/** Runtime server override is disabled in production lock mode. */
export async function saveApiBaseUrl(_input: string): Promise<string> {
  return enforceCanonicalStorage();
}

export async function clearApiBaseUrlOverride(): Promise<void> {
  await enforceCanonicalStorage();
}

export async function testApiConnection(_apiBaseUrl: string): Promise<{ ok: boolean; message: string }> {
  const origin = APP_URL;
  try {
    const response = await axios.get(`${origin}/up`, {
      timeout: 15000,
      headers: { Accept: 'application/json' },
      validateStatus: (status) => status >= 200 && status < 500,
    });
    if (response.status >= 200 && response.status < 300) {
      return { ok: true, message: `Connected to ${API_BASE_URL}` };
    }
    return { ok: false, message: 'Bhuguard server is temporarily unavailable.' };
  } catch {
    return { ok: false, message: 'Bhuguard server is temporarily unavailable.' };
  }
}

/** Startup migration to enforce live ERP URL without touching offline drafts/evidence. */
export async function bootstrapApiBaseUrl(): Promise<string> {
  if (__DEV__) {
    console.log('[BhuGuard API] variant:', process.env.EXPO_PUBLIC_APP_VARIANT ?? 'production');
    console.log('[BhuGuard API] base URL:', canonicalApiBaseUrl());
  }
  return enforceCanonicalStorage();
}
