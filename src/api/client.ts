import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '../config/apiConfig';
import { navigateToLogin, shouldForceLoginOnUnauthorized } from '../navigation/navigationRef';
import { getApiBaseUrl, getCachedApiBaseUrl } from '../storage/apiConfigStorage';
import { clearAuthStorage, getAuthToken } from '../utils/authStorage';
import {
  extractApiErrorMessage,
  formatApiUnreachableMessage,
  isNetworkError,
  isTimeoutError,
} from '../utils/apiError';
import { isLoggingOut } from '../utils/logoutGuard';

/** Public auth endpoints that must not send a stale bearer token. */
const PUBLIC_AUTH_PATHS = [
  '/auth/login/request-otp',
  '/auth/login/verify-otp',
  '/auth/forgot-password/request-otp',
  '/auth/forgot-password/verify-otp',
  '/auth/forgot-mpin/request-otp',
  '/auth/forgot-mpin/verify-otp',
  '/auth/register/request-otp',
];

function isPublicAuthRequest(url?: string): boolean {
  if (!url) {
    return false;
  }

  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

function logDevRequest(method: string | undefined, url: string | undefined, baseURL: string | undefined): void {
  if (!__DEV__) {
    return;
  }

  console.log('API Base URL:', baseURL || API_BASE_URL);
  console.log('Request:', method?.toUpperCase() ?? 'GET', url ?? '');
}

function logDevResponse(status: number | undefined, url: string | undefined): void {
  if (!__DEV__) {
    return;
  }

  console.log('Response status:', status ?? 'n/a', url ?? '');
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

if (__DEV__) {
  console.log('API Base URL:', API_BASE_URL);
}

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const baseUrl = await getApiBaseUrl();
    config.baseURL = baseUrl || API_BASE_URL;

    const requestUrl = String(config.url ?? '');

    logDevRequest(config.method, requestUrl, config.baseURL);

    if (!isPublicAuthRequest(requestUrl)) {
      const token = await getAuthToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else if (config.headers) {
      delete config.headers.Authorization;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    logDevResponse(response.status, response.config.url);
    return response;
  },
  async (error: AxiosError) => {
    logDevResponse(error.response?.status, error.config?.url);

    if (error.response?.status === 401) {
      // Avoid racing navigation/storage clears while an intentional logout is in progress.
      if (!isLoggingOut()) {
        await clearAuthStorage();
        // Do not wipe OTP / mobile login while a stale /auth/me race returns 401.
        if (shouldForceLoginOnUnauthorized()) {
          navigateToLogin();
        }
      }

      return Promise.reject(new Error(extractApiErrorMessage(error, 'Your session has expired. Please log in again.')));
    }

    if (isNetworkError(error)) {
      const baseUrl = getCachedApiBaseUrl() || API_BASE_URL;
      return Promise.reject(new Error(formatApiUnreachableMessage(baseUrl)));
    }

    if (isTimeoutError(error)) {
      return Promise.reject(
        new Error(extractApiErrorMessage(error, 'Unable to connect to the Bhuguard server. Please try again.')),
      );
    }

    if (error.response?.status === 403) {
      return Promise.reject(new Error(extractApiErrorMessage(error, 'You do not have permission to perform this action.')));
    }

    if (error.response?.status === 404) {
      return Promise.reject(new Error(extractApiErrorMessage(error, 'The requested service is temporarily unavailable.')));
    }

    if (error.response?.status === 422) {
      return Promise.reject(new Error(extractApiErrorMessage(error, 'Please check the entered information.')));
    }

    if (error.response?.status === 429) {
      return Promise.reject(new Error(extractApiErrorMessage(error, 'Too many requests. Please wait a moment and try again.')));
    }

    if ((error.response?.status ?? 0) >= 500) {
      return Promise.reject(
        new Error(extractApiErrorMessage(error, 'The requested service is temporarily unavailable.')),
      );
    }

    return Promise.reject(new Error(extractApiErrorMessage(error)));
  },
);

export { API_BASE_URL };

/** Call after saving server settings so axios defaults match the cached URL. */
export async function syncApiClientBaseUrl(): Promise<string> {
  const baseUrl = await getApiBaseUrl();
  apiClient.defaults.baseURL = baseUrl;
  return baseUrl;
}
