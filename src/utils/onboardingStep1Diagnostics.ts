import axios, { type AxiosError } from 'axios';

import {
  extractApiErrorMessage,
  extractValidationFieldKeys,
  isForbiddenError,
  isNetworkError,
  isServerError,
  isTimeoutError,
  isUnauthorizedError,
  isValidationError,
  LOCAL_DEV_TRANSPORT_MESSAGE,
} from './apiError';
import { buildFullSubmitUrl } from './onboardingSubmitDiagnostics';
import { getCachedApiBaseUrl } from '../storage/apiConfigStorage';
import { usesLocalDevelopmentApi } from './localApiNetwork';

export const ONBOARDING_STEP1_ENDPOINT_TEMPLATE = '/field-officer/farmers/{farmerId}';

export function buildOnboardingStep1Endpoint(farmerId: number | string): string {
  return `/field-officer/farmers/${farmerId}`;
}

function resolveAxiosError(error: unknown): AxiosError | null {
  if (axios.isAxiosError(error)) {
    return error;
  }

  if (error instanceof Error && axios.isAxiosError(error.cause)) {
    return error.cause;
  }

  return null;
}

export function logOnboardingStep1Request(farmerId: number | string): void {
  if (!__DEV__) {
    return;
  }

  const apiBaseUrl = getCachedApiBaseUrl();
  const endpoint = buildOnboardingStep1Endpoint(farmerId);
  const fullURL = buildFullSubmitUrl(apiBaseUrl, endpoint);

  console.log('[ONBOARDING STEP 1] baseURL:', apiBaseUrl);
  console.log('[ONBOARDING STEP 1] endpoint:', endpoint);
  console.log('[ONBOARDING STEP 1] fullURL:', fullURL);
  console.log('[ONBOARDING STEP 1] method:', 'POST');
  console.log('[ONBOARDING STEP 1] transport:', 'multipart/form-data (_method=PUT)');
  console.log('[ONBOARDING STEP 1] photo field:', 'farmer_photo');
}

export function logOnboardingStep1PhotoAttached(hasPhoto: boolean): void {
  if (!__DEV__) {
    return;
  }

  console.log('[ONBOARDING STEP 1] has photo:', hasPhoto);
}

export function logOnboardingStep1Response(status: number | null): void {
  if (!__DEV__) {
    return;
  }

  console.log('[ONBOARDING STEP 1] response status:', status);
}

export function logOnboardingStep1Error(error: unknown): void {
  if (!__DEV__) {
    return;
  }

  const axiosError = resolveAxiosError(error);
  const validationKeys = extractValidationFieldKeys(error);

  console.log('[ONBOARDING STEP 1] error.message:', error instanceof Error ? error.message : String(error));
  console.log('[ONBOARDING STEP 1] error code:', axiosError?.code ?? null);
  console.log('[ONBOARDING STEP 1] response status:', axiosError?.response?.status ?? null);
  console.log('[ONBOARDING STEP 1] hasResponse:', Boolean(axiosError?.response));
  console.log('[ONBOARDING STEP 1] validation keys:', validationKeys.length ? validationKeys : 'none');
}

export function resolveOnboardingStep1ResponseStatus(error: unknown): number | null {
  const axiosError = resolveAxiosError(error);
  return axiosError?.response?.status ?? null;
}

export function classifyOnboardingStep1SaveError(
  error: unknown,
  apiBaseUrl = getCachedApiBaseUrl(),
): string {
  const axiosError = resolveAxiosError(error);
  const localDevApi = usesLocalDevelopmentApi(apiBaseUrl);

  if (axiosError?.response != null) {
    const status = axiosError.response.status;

    if (status === 401) {
      return extractApiErrorMessage(
        error,
        'Your session has expired. Please log in again and retry.',
      );
    }

    if (status === 403) {
      return extractApiErrorMessage(
        error,
        'You are not authorized to update this farmer profile.',
      );
    }

    if (status === 409) {
      return extractApiErrorMessage(
        error,
        'This farmer profile conflicts with an existing record.',
      );
    }

    if (status === 422) {
      return extractApiErrorMessage(error, 'Please review the highlighted required fields.');
    }

    if (status >= 500) {
      return extractApiErrorMessage(
        error,
        'The server could not save the farmer profile. Please try again.',
      );
    }

    return extractApiErrorMessage(error, 'Unable to save farmer profile.');
  }

  if (isUnauthorizedError(error)) {
    return extractApiErrorMessage(
      error,
      'Your session has expired. Please log in again and retry.',
    );
  }

  if (isForbiddenError(error)) {
    return extractApiErrorMessage(
      error,
      'You are not authorized to update this farmer profile.',
    );
  }

  if (isValidationError(error)) {
    return extractApiErrorMessage(error, 'Please review the highlighted required fields.');
  }

  if (isServerError(error)) {
    return extractApiErrorMessage(
      error,
      'The server could not save the farmer profile. Please try again.',
    );
  }

  if (isTimeoutError(error)) {
    return 'The profile photo upload timed out. Please retry.';
  }

  if (axiosError?.response == null && isNetworkError(axiosError)) {
    if (localDevApi) {
      return LOCAL_DEV_TRANSPORT_MESSAGE;
    }

    return extractApiErrorMessage(error, 'Unable to connect to Bhuguard. Check connectivity and retry.');
  }

  const fallback = extractApiErrorMessage(error, 'Unable to save farmer profile.');

  if (
    localDevApi
    && /no internet connection|unable to reach local development server|unable to connect to the local development server/i.test(
      fallback,
    )
  ) {
    return LOCAL_DEV_TRANSPORT_MESSAGE;
  }

  return fallback;
}
