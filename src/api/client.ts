import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '../config/apiConfig';
import { navigateToLogin, shouldForceLoginOnUnauthorized } from '../navigation/navigationRef';
import { getApiBaseUrl, getApiOrigin } from '../storage/apiConfigStorage';
import { getAuthStartupPhase } from '../auth/startup/AuthStartupController';
import {
  clearAuthStorage,
  getAuthSessionMeta,
  getAuthToken,
  getAuthUser,
  getAuthUserType,
} from '../utils/authStorage';
import {
  extractApiErrorMessage,
  formatApiUnreachableMessage,
  isNetworkError,
  isTimeoutError,
  logSafeApiFailure,
} from '../utils/apiError';
import { getCachedApiBaseUrl } from '../storage/apiConfigStorage';
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

const PROTECTED_BOOTSTRAP_PATH_PATTERNS = [
  /^\/notifications(?:\/|$)/i,
  /^\/dashboard(?:\/|$)/i,
  /^\/profile(?:\/|$)/i,
  /^\/assigned(?:\/|$)/i,
  /^\/farmer(?:\/|$)/i,
  /^\/farm(?:\/|$)/i,
  /^\/biochar(?:\/|$)/i,
];

/** Multipart farmer onboarding can exceed the default 30s on slower networks. */
export const ONBOARDING_MULTIPART_TIMEOUT_MS = 120000;
let handlingUnauthorized = false;

function isPublicAuthRequest(url?: string): boolean {
  if (!url) {
    return false;
  }

  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

function isProtectedBootstrapRequest(url?: string): boolean {
  if (!url) {
    return false;
  }
  return PROTECTED_BOOTSTRAP_PATH_PATTERNS.some((pattern) => pattern.test(url));
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
    config.headers.Accept = 'application/json';

    logDevRequest(config.method, requestUrl, config.baseURL);

    if (!isPublicAuthRequest(requestUrl)) {
      const [token, user, userType, sessionMeta] = await Promise.all([
        getAuthToken(),
        getAuthUser(),
        getAuthUserType(),
        getAuthSessionMeta(),
      ]);

      const currentOrigin = getApiOrigin(config.baseURL ?? API_BASE_URL);
      const sessionOrigin = sessionMeta?.apiOrigin?.trim();
      const sessionOriginMismatch = Boolean(sessionOrigin && sessionOrigin !== currentOrigin);

      if (sessionOriginMismatch) {
        await clearAuthStorage();
        throw new Error('Your saved login has expired. Please log in again.');
      }

      const hydrationDone = getAuthStartupPhase() !== 'loading';
      const hasIdentity = Boolean(user && (userType || user.user_type));

      if (isProtectedBootstrapRequest(requestUrl) && (!hydrationDone || !token || !hasIdentity)) {
        throw new Error('Your saved login has expired. Please log in again.');
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        handlingUnauthorized = false;
      } else if (isProtectedBootstrapRequest(requestUrl)) {
        throw new Error('Your saved login has expired. Please log in again.');
      }
    } else if (config.headers) {
      delete config.headers.Authorization;
    }

    if (config.data instanceof FormData) {
      // AxiosHeaders: bracket delete is unreliable — clear so RN sets boundary.
      const headers = config.headers as {
        delete?: (key: string) => void;
        set?: (key: string, value?: string) => void;
      } & Record<string, unknown>;

      if (typeof headers.delete === 'function') {
        headers.delete('Content-Type');
        headers.delete('content-type');
      } else {
        delete headers['Content-Type'];
        delete headers['content-type'];
      }

      if (typeof headers.set === 'function') {
        headers.set('Content-Type', undefined as unknown as string);
      }
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
    logSafeApiFailure(error);

    const rejectMapped = (message: string): Promise<never> =>
      Promise.reject(Object.assign(new Error(message), { cause: error }));

    if (error.response?.status === 401) {
      // Avoid racing navigation/storage clears while an intentional logout is in progress.
      if (!isLoggingOut()) {
        if (!handlingUnauthorized) {
          handlingUnauthorized = true;
          await clearAuthStorage();
          // Do not wipe OTP / mobile login while a stale /auth/me race returns 401.
          if (shouldForceLoginOnUnauthorized()) {
            navigateToLogin();
          }
        }
      }

      return rejectMapped(extractApiErrorMessage(error, 'Your saved login has expired. Please log in again.'));
    }

    // Timeouts must be classified before generic "no response" network handling.
    if (isTimeoutError(error)) {
      return rejectMapped(
        extractApiErrorMessage(error, 'Bhuguard server is temporarily unavailable.'),
      );
    }

    // Only true transport failures (no HTTP response) use the unreachable copy.
    if (error.response == null && isNetworkError(error)) {
      const baseUrl = error.config?.baseURL ?? getCachedApiBaseUrl();
      return rejectMapped(extractApiErrorMessage(error, formatApiUnreachableMessage(baseUrl)));
    }

    const requestUrl = typeof error.config?.url === 'string' ? error.config.url : '';
    const isArtisanCheckInRequest = /\/artisan\/(check-in|live-check-in)(\?|$)/i.test(requestUrl);
    const isOnboardingRegistrationRequest =
      /finalize-onboarding|farmer-onboarding|onboarding\/finalize/i.test(requestUrl);

    const serverFailureFallback = isArtisanCheckInRequest
      ? 'Check-in could not be completed. Please try again.'
      : isOnboardingRegistrationRequest
        ? 'Registration could not be completed. Please try again.'
        : 'Request could not be completed. Please try again.';

    if (error.response?.status === 403) {
      return rejectMapped(
        extractApiErrorMessage(
          error,
          isArtisanCheckInRequest
            ? 'You are outside your assigned working area.'
            : 'You are not authorized for this action.',
        ),
      );
    }

    if (error.response?.status === 404) {
      return rejectMapped(
        extractApiErrorMessage(
          error,
          isOnboardingRegistrationRequest
            ? 'The requested Bhuguard service is unavailable.'
            : 'The requested Bhuguard service is unavailable.',
        ),
      );
    }

    if (error.response?.status === 409) {
      return rejectMapped(
        extractApiErrorMessage(
          error,
          isArtisanCheckInRequest
            ? 'You already have an active work session.'
            : isOnboardingRegistrationRequest
              ? 'This Farmer registration has already been submitted.'
              : 'This request conflicts with an existing record.',
        ),
      );
    }

    if (error.response?.status === 422) {
      return rejectMapped(extractApiErrorMessage(error, 'Please review the highlighted required fields.'));
    }

    if (error.response?.status === 429) {
      return rejectMapped(extractApiErrorMessage(error, 'Too many requests. Please wait a moment and try again.'));
    }

    if ((error.response?.status ?? 0) >= 500) {
      return rejectMapped(extractApiErrorMessage(error, serverFailureFallback));
    }

    if (error.response?.status === 413) {
      return rejectMapped(
        extractApiErrorMessage(error, 'Upload is too large. Please retry with fewer or smaller photos.'),
      );
    }

    // Any other HTTP status still must not become "Unable to connect".
    if (error.response != null) {
      return rejectMapped(extractApiErrorMessage(error, serverFailureFallback));
    }

    return rejectMapped(extractApiErrorMessage(error));
  },
);

export { API_BASE_URL };

/** Call after saving server settings so axios defaults match the cached URL. */
export async function syncApiClientBaseUrl(): Promise<string> {
  const baseUrl = await getApiBaseUrl();
  apiClient.defaults.baseURL = baseUrl;
  return baseUrl;
}
