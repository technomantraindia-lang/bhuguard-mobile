import axios, { type AxiosError } from 'axios';

import { apiClient } from '../api/client';
import type { FileAsset, OnboardingDraft } from '../context/OnboardingContext';
import {
  auditOnboardingDraftFiles,
  formatMissingOnboardingFilesMessage,
} from './onboardingFilePersistence';
import {
  extractApiErrorMessage,
  isForbiddenError,
  isNetworkError,
  isServerError,
  isTimeoutError,
  isUnauthorizedError,
  isValidationError,
  LOCAL_DEV_TRANSPORT_MESSAGE,
} from './apiError';
import {
  buildOnboardingSubmitRequestUrl,
  isDevelopmentBuild,
  isLocalLanApiUrl,
  usesLocalDevelopmentApi,
} from './localApiNetwork';

export type OnboardingSubmitErrorCategory =
  | 'no_network'
  | 'local_api_unreachable'
  | 'api_unreachable'
  | 'validation'
  | 'server'
  | 'auth'
  | 'forbidden'
  | 'upload'
  | 'timeout'
  | 'unknown';

export interface OnboardingSubmitDiagnosticsInput {
  apiBaseUrl: string;
  farmerId: number | null;
  preparedDraft: boolean;
}

export interface FinalSubmitRequestLog {
  apiBaseUrl: string;
  endpoint: string;
  method: string;
}

export interface FinalSubmitErrorContext {
  apiProbeOk?: boolean;
  isMultipartSubmit?: boolean;
}

const ONBOARDING_UPLOAD_TIMEOUT_MESSAGE = 'The registration upload timed out. Please retry.';
const ONBOARDING_UPLOAD_READ_MESSAGE =
  'One or more documents or photos could not be read for upload. Re-capture the missing files and retry.';

function resolveSubmitAxiosError(error: unknown): AxiosError | null {
  if (axios.isAxiosError(error)) {
    return error;
  }

  if (error instanceof Error && axios.isAxiosError(error.cause)) {
    return error.cause;
  }

  return null;
}

export function buildFullSubmitUrl(apiBaseUrl: string, endpoint: string): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

function isTransportFailure(error: unknown): boolean {
  const axiosError = resolveSubmitAxiosError(error);
  if (axiosError) {
    if (axiosError.response != null) {
      return false;
    }
    return isNetworkError(axiosError);
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /unable to reach local development server|unable to connect to the local development server|network request failed|failed to fetch|connection refused|enotfound|econnrefused|no internet connection/i.test(
    error.message,
  );
}

/** Returns labeled audit items and a user-facing missing-files message when needed. */
export async function validateOnboardingSubmitAttachments(
  draft: OnboardingDraft,
  preparedDraft: boolean,
): Promise<{ ok: boolean; missingFields: string[]; items: Awaited<ReturnType<typeof auditOnboardingDraftFiles>>; message: string }> {
  const items = await auditOnboardingDraftFiles(draft, preparedDraft);
  const missing = items.filter((item) => item.required && item.status === 'missing');
  const missingFields = missing.map((item) => item.id);
  const message = formatMissingOnboardingFilesMessage(items);

  if (__DEV__) {
    console.log('[FINAL SUBMIT] attachment audit:', items.map((item) => `${item.label}:${item.status}`).join(', '));
    console.log('[FINAL SUBMIT] missing attachment fields:', missingFields.length ? missingFields : 'none');
  }

  return {
    ok: missing.length === 0,
    missingFields,
    items,
    message,
  };
}

export function logFinalSubmitRequest(input: FinalSubmitRequestLog): void {
  if (!__DEV__) {
    return;
  }

  const fullURL = buildFullSubmitUrl(input.apiBaseUrl, input.endpoint);
  console.log('[FINAL SUBMIT] baseURL:', input.apiBaseUrl);
  console.log('[FINAL SUBMIT] endpoint:', input.endpoint);
  console.log('[FINAL SUBMIT] fullURL:', fullURL);
  console.log('[FINAL SUBMIT] method:', input.method);
  console.log('[FINAL SUBMIT] request started');
}

export function logFinalSubmitResponse(status: number | null): void {
  if (!__DEV__) {
    return;
  }

  console.log('[FINAL SUBMIT] response status:', status);
}

export function logFinalSubmitError(error: unknown): void {
  if (!__DEV__) {
    return;
  }

  const axiosError = resolveSubmitAxiosError(error);
  console.log('[FINAL SUBMIT] error.message:', error instanceof Error ? error.message : String(error));
  console.log('[FINAL SUBMIT] error.code:', axiosError?.code ?? null);
  console.log('[FINAL SUBMIT] error.response?.status:', axiosError?.response?.status ?? null);
  console.log('[FINAL SUBMIT] hasResponse:', Boolean(axiosError?.response));
}

/**
 * Development-only GET through the same apiClient as registration.
 * Informational only — never blocks submit.
 */
export async function probeDevelopmentApiViaClient(
  apiBaseUrl = '',
): Promise<{ ok: boolean; status: number | null; axiosCode: string | null }> {
  if (!__DEV__ || !usesLocalDevelopmentApi(apiBaseUrl)) {
    return { ok: false, status: null, axiosCode: null };
  }

  const probeUrl = buildFullSubmitUrl(apiBaseUrl, '');
  console.log('[FINAL SUBMIT] probe GET:', probeUrl);

  try {
    const response = await apiClient.get('', {
      timeout: 8000,
      validateStatus: () => true,
    });
    const ok = response.status >= 200 && response.status < 300;
    console.log('[FINAL SUBMIT] probe status:', response.status);
    console.log('[FINAL SUBMIT] probe ok:', ok);
    return { ok, status: response.status, axiosCode: null };
  } catch (error) {
    const axiosError = resolveSubmitAxiosError(error);
    const status = axiosError?.response?.status ?? null;
    const code = axiosError?.code ?? null;
    console.log('[FINAL SUBMIT] probe failed code:', code);
    console.log('[FINAL SUBMIT] probe failed status:', status);
    console.log('[FINAL SUBMIT] probe hasResponse:', Boolean(axiosError?.response));

    if (code === 'ERR_NETWORK' && isLocalLanApiUrl(apiBaseUrl)) {
      console.warn(
        '[FINAL SUBMIT] ERR_NETWORK on LAN HTTP GET — Android cleartext HTTP may be blocked in this APK. '
        + 'Phone browser can still reach the API while React Native axios cannot.',
      );
    }

    return { ok: false, status, axiosCode: code };
  }
}

export async function logFinalSubmitDiagnostics(
  input: OnboardingSubmitDiagnosticsInput,
): Promise<{ apiProbeOk: boolean }> {
  if (!__DEV__) {
    return { apiProbeOk: false };
  }

  const fullURL = buildOnboardingSubmitRequestUrl(
    input.apiBaseUrl,
    input.farmerId,
    input.preparedDraft,
  );

  console.log('[FINAL SUBMIT] variant:', process.env.EXPO_PUBLIC_APP_VARIANT ?? 'production');
  console.log('[FINAL SUBMIT] baseURL:', input.apiBaseUrl);
  console.log('[FINAL SUBMIT] fullURL:', fullURL);

  if (isDevelopmentBuild() && !isLocalLanApiUrl(input.apiBaseUrl)) {
    console.warn(
      '[FINAL SUBMIT] development build is not targeting a LAN API URL. '
      + 'Set EXPO_PUBLIC_API_URL=http://192.168.1.15:8000/api in .env and restart Metro.',
    );
  }

  const probe = await probeDevelopmentApiViaClient(input.apiBaseUrl);
  return { apiProbeOk: probe.ok };
}

export function classifyOnboardingSubmitError(
  error: unknown,
  apiBaseUrl: string,
  context: FinalSubmitErrorContext = {},
): { category: OnboardingSubmitErrorCategory; message: string } {
  const localDevApi = usesLocalDevelopmentApi(apiBaseUrl);
  const axiosError = resolveSubmitAxiosError(error);

  if (axiosError?.response != null) {
    const status = axiosError.response.status;

    if (status === 401) {
      return {
        category: 'auth',
        message: extractApiErrorMessage(
          error,
          'Your session has expired. Please log in again and retry registration.',
        ),
      };
    }

    if (status === 403) {
      return {
        category: 'forbidden',
        message: extractApiErrorMessage(
          error,
          'You are not authorized to complete this registration.',
        ),
      };
    }

    if (status === 422) {
      return {
        category: 'validation',
        message: extractApiErrorMessage(error, 'Please review the highlighted required fields.'),
      };
    }

    if (status >= 500) {
      return {
        category: 'server',
        message: extractApiErrorMessage(
          error,
          'Registration could not be completed due to a local backend server error. Please try again.',
        ),
      };
    }
  }

  if (isUnauthorizedError(error)) {
    return {
      category: 'auth',
      message: extractApiErrorMessage(
        error,
        'Your session has expired. Please log in again and retry registration.',
      ),
    };
  }

  if (isForbiddenError(error)) {
    return {
      category: 'forbidden',
      message: extractApiErrorMessage(
        error,
        'You are not authorized to complete this registration.',
      ),
    };
  }

  if (isValidationError(error)) {
    return {
      category: 'validation',
      message: extractApiErrorMessage(error, 'Please review the highlighted required fields.'),
    };
  }

  if (isServerError(error)) {
    return {
      category: 'server',
      message: extractApiErrorMessage(
        error,
        'Registration could not be completed due to a local backend server error. Please try again.',
      ),
    };
  }

  if (isTimeoutError(error)) {
    return {
      category: 'timeout',
      message: ONBOARDING_UPLOAD_TIMEOUT_MESSAGE,
    };
  }

  if (isTransportFailure(error)) {
    if (context.apiProbeOk && context.isMultipartSubmit) {
      return {
        category: 'upload',
        message: ONBOARDING_UPLOAD_READ_MESSAGE,
      };
    }

    if (localDevApi) {
      return {
        category: 'local_api_unreachable',
        message: LOCAL_DEV_TRANSPORT_MESSAGE,
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

  const fallback = extractApiErrorMessage(error, 'Onboarding failed. Check required fields and try again.');

  if (
    localDevApi
    && /no internet connection|cannot reach the development api|cannot reach your development api/i.test(fallback)
  ) {
    return {
      category: 'local_api_unreachable',
      message: LOCAL_DEV_TRANSPORT_MESSAGE,
    };
  }

  if (isDevelopmentBuild() && /bhuguard uses the live erp server only/i.test(fallback)) {
    return {
      category: 'unknown',
      message: extractApiErrorMessage(error, 'Onboarding failed. Check required fields and try again.'),
    };
  }

  return {
    category: 'unknown',
    message: fallback,
  };
}

export function resolveFinalRegistrationResponseStatus(error: unknown): number | null {
  const axiosError = resolveSubmitAxiosError(error);
  return axiosError?.response?.status ?? null;
}

/** @deprecated Use logFinalSubmitRequest */
export const logFinalRegistrationStart = logFinalSubmitRequest;
/** @deprecated Use logFinalSubmitResponse */
export const logFinalRegistrationResponse = logFinalSubmitResponse;
