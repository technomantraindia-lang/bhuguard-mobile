import axios from 'axios';

import {
  extractApiErrorMessage,
  isNetworkError,
  isServerError,
  isTimeoutError,
  isValidationError,
  NETWORK_UNREACHABLE_MESSAGE,
} from './apiError';
import { getCachedApiBaseUrl } from '../storage/apiConfigStorage';
import { usesLocalDevelopmentApi } from './localApiNetwork';
import { describeNetInfoState, fetchNetInfoSnapshot } from './safeNetInfo';

export type CheckInErrorCategory =
  | 'no_network'
  | 'local_api_unreachable'
  | 'api_unreachable'
  | 'gps'
  | 'validation'
  | 'server'
  | 'generic';

export function shouldSkipCheckInConnectivityGate(apiBaseUrl = getCachedApiBaseUrl()): boolean {
  return usesLocalDevelopmentApi(apiBaseUrl);
}

export function buildCheckInRequestUrl(
  apiBaseUrl: string,
  endpointPath: string,
): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  const path = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  return `${base}${path}`;
}

export async function probeConfiguredApiHealth(apiBaseUrl = getCachedApiBaseUrl()): Promise<boolean> {
  const url = apiBaseUrl.replace(/\/$/, '');
  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: { Accept: 'application/json' },
      validateStatus: (status) => status >= 200 && status < 500,
    });
    return response.status >= 200 && response.status < 300;
  } catch {
    return false;
  }
}

export async function logCheckInDiagnostics(endpointPath: string): Promise<void> {
  if (!__DEV__) {
    return;
  }

  const apiBase = getCachedApiBaseUrl();
  const snapshot = await fetchNetInfoSnapshot();
  const healthReachable = await probeConfiguredApiHealth(apiBase);

  console.log('[CHECK-IN] variant:', process.env.EXPO_PUBLIC_APP_VARIANT ?? 'production');
  console.log('[CHECK-IN] API base:', apiBase);
  console.log('[CHECK-IN] request URL:', buildCheckInRequestUrl(apiBase, endpointPath));
  console.log('[CHECK-IN] NetInfo connected:', snapshot.isConnected);
  console.log('[CHECK-IN] internetReachable:', snapshot.isInternetReachable);
  console.log('[CHECK-IN] health reachable:', healthReachable);
  console.log('[CHECK-IN] network state:', await describeNetInfoState());
}

export function mapCheckInTransportMessage(apiBaseUrl = getCachedApiBaseUrl()): string {
  if (usesLocalDevelopmentApi(apiBaseUrl)) {
    return (
      'Local development server is unavailable. '
      + 'Confirm Laravel is running and EXPO_PUBLIC_API_URL matches the URL that works in your phone browser.'
    );
  }
  return NETWORK_UNREACHABLE_MESSAGE;
}

export function mapCheckInError(
  error: unknown,
  options?: { hasDeviceNetwork?: boolean; apiBaseUrl?: string },
): { category: CheckInErrorCategory; message: string } {
  const apiBaseUrl = options?.apiBaseUrl ?? getCachedApiBaseUrl();
  const hasDeviceNetwork = options?.hasDeviceNetwork ?? true;
  const localDevApi = usesLocalDevelopmentApi(apiBaseUrl);

  if (error instanceof Error) {
    const lower = error.message.toLowerCase();
    if (
      /location permission|permission to access location|location service|gps unavailable|enable location/i.test(
        lower,
      )
    ) {
      return { category: 'gps', message: error.message };
    }
  }

  if (isValidationError(error)) {
    return {
      category: 'validation',
      message: extractApiErrorMessage(error, 'Check-in validation failed. Review the details and retry.'),
    };
  }

  if (isServerError(error) || isTimeoutError(error)) {
    return {
      category: 'server',
      message: extractApiErrorMessage(error, 'Check-in could not be completed. Please try again.'),
    };
  }

  const transportFailure =
    (axios.isAxiosError(error) && error.response == null && isNetworkError(error))
    || (error instanceof Error
      && (error.message === NETWORK_UNREACHABLE_MESSAGE
        || /no internet connection|network request failed|failed to fetch|connection refused|enotfound|econnrefused/i.test(
          error.message,
        )));

  if (transportFailure) {
    if (!hasDeviceNetwork) {
      return {
        category: 'no_network',
        message: 'No network connection on this device. Connect to Wi‑Fi or mobile data, then retry.',
      };
    }

    if (localDevApi) {
      return {
        category: 'local_api_unreachable',
        message: mapCheckInTransportMessage(apiBaseUrl),
      };
    }

    return {
      category: 'api_unreachable',
      message: extractApiErrorMessage(
        error,
        `Unable to connect to Bhuguard at ${apiBaseUrl}. Check connectivity and retry.`,
      ),
    };
  }

  if (axios.isAxiosError(error) && error.response != null) {
    const status = error.response.status;
    if (status === 422) {
      return {
        category: 'validation',
        message: extractApiErrorMessage(error, 'Check-in validation failed. Review the details and retry.'),
      };
    }
    if (status >= 500) {
      return {
        category: 'server',
        message: extractApiErrorMessage(error, 'Check-in could not be completed. Please try again.'),
      };
    }
  }

  const message =
    error instanceof Error ? error.message : 'Unable to complete check-in. Please try again.';

  if (message === NETWORK_UNREACHABLE_MESSAGE && localDevApi) {
    return {
      category: 'local_api_unreachable',
      message: mapCheckInTransportMessage(apiBaseUrl),
    };
  }

  return { category: 'generic', message };
}

export function mergeCheckInDisplayError(
  statusMessage: string | null,
  submitMessage: string | null,
  includeStatusMessage: boolean,
): string | null {
  const parts: string[] = [];
  if (includeStatusMessage && statusMessage?.trim()) {
    parts.push(statusMessage.trim());
  }
  if (submitMessage?.trim()) {
    parts.push(submitMessage.trim());
  }

  const unique = Array.from(new Set(parts));
  return unique.length > 0 ? unique.join('\n\n') : null;
}
