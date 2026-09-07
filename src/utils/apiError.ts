import axios, { type AxiosError } from 'axios';

import type { ApiErrorResponse } from '../types/auth';
import { isDevelopmentBuild, usesLocalDevelopmentApi } from './localApiNetwork';

function looksLikeHtml(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html');
}

export function isApiNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

/**
 * True only for real transport failures with no HTTP response:
 * DNS failure, connection refused, offline, ERR_NETWORK without a response.
 * Timeouts are handled separately.
 */
export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    // Any HTTP response means the server was reachable — never call this a network outage.
    if (error.response != null) {
      return false;
    }

    if (isTimeoutError(error)) {
      return false;
    }

    const code = error.code ?? '';
    return (
      code === 'ERR_NETWORK'
      || code === 'ENOTFOUND'
      || code === 'ECONNREFUSED'
      || code === 'EAI_AGAIN'
      || error.response == null
    );
  }

  if (!(error instanceof Error)) {
    return false;
  }

  // Plain Error already mapped by the client interceptor — detect prior unreachable copy only.
  if (error.message === NETWORK_UNREACHABLE_MESSAGE) {
    return true;
  }

  return /network request failed|failed to fetch|net::err_|could not resolve host|connection refused|enotfound|econnrefused/i.test(
    error.message,
  );
}

export function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function isForbiddenError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403;
}

export function isValidationError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 422;
}

export function isServerError(error: unknown): boolean {
  return axios.isAxiosError(error) && (error.response?.status ?? 0) >= 500;
}

export function isTimeoutError(error: unknown): boolean {
  return axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || /timeout/i.test(error.message));
}

function firstValidationFieldNames(errors: Record<string, string[] | string> | undefined): string[] {
  if (!errors) {
    return [];
  }

  return Object.keys(errors).slice(0, 12);
}

export function extractValidationFieldKeys(error: unknown): string[] {
  const axiosError = axios.isAxiosError(error)
    ? error
    : error instanceof Error && axios.isAxiosError(error.cause)
      ? error.cause
      : null;

  if (!axiosError) {
    return [];
  }

  const data = axiosError.response?.data as ApiErrorResponse | undefined;
  return firstValidationFieldNames(data?.errors as Record<string, string[] | string> | undefined);
}

export function logSafeApiFailure(error: unknown, context?: string): void {
  const axiosError = axios.isAxiosError(error)
    ? error
    : error instanceof Error && axios.isAxiosError((error as Error & { cause?: unknown }).cause)
      ? ((error as Error & { cause: AxiosError }).cause)
      : null;

  if (!axiosError) {
    if (__DEV__ && error instanceof Error) {
      console.log('[API failure]', {
        context: context ?? null,
        statusCode: null,
        responseBody: null,
        responseHeaders: null,
        errorBody: error.message,
      });
    }
    return;
  }

  const data = axiosError.response?.data as ApiErrorResponse | unknown;
  const fieldNames = firstValidationFieldNames(
    (data as ApiErrorResponse | undefined)?.errors as Record<string, string[] | string> | undefined,
  );
  const safeMessage =
    typeof (data as ApiErrorResponse | undefined)?.message === 'string'
    && !looksLikeHtml((data as ApiErrorResponse).message)
      ? (data as ApiErrorResponse).message
      : undefined;

  const isFinalize =
    typeof axiosError.config?.url === 'string'
    && axiosError.config.url.includes('finalize-onboarding');

  if (__DEV__ || isFinalize) {
    let responseBody: unknown = data ?? null;
    try {
      if (typeof data === 'string' && data.length > 2000) {
        responseBody = `${data.slice(0, 2000)}…`;
      } else if (data && typeof data === 'object') {
        responseBody = JSON.parse(JSON.stringify(data));
      }
    } catch {
      responseBody = '[unserializable]';
    }

    console.log('[API failure debug]', {
      context: context ?? null,
      statusCode: axiosError.response?.status ?? null,
      responseBody,
      responseHeaders: axiosError.response?.headers ?? null,
      errorBody: axiosError.message ?? null,
      code: axiosError.code ?? null,
      endpoint: axiosError.config?.url ?? null,
      method: axiosError.config?.method?.toUpperCase() ?? null,
      message: safeMessage ?? null,
      validation_fields: fieldNames,
    });
  }
}

function firstValidationMessage(errors: ApiErrorResponse['errors'] | undefined): string | null {
  if (!errors) {
    return null;
  }

  const firstError = Object.values(errors).flat()[0];
  return typeof firstError === 'string' && firstError.trim() ? firstError : null;
}

export function extractApiErrorMessage(error: unknown, fallback = 'Request failed.'): string {
  // Prefer original Axios error when the interceptor wrapped it as Error(message, { cause }).
  const axiosError = axios.isAxiosError(error)
    ? error
    : error instanceof Error && axios.isAxiosError((error as Error & { cause?: unknown }).cause)
      ? ((error as Error & { cause: AxiosError<ApiErrorResponse> }).cause)
      : null;

  if (axiosError) {
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    if (status === 401) {
      return 'Your saved login has expired. Please log in again.';
    }

    if (status === 403) {
      if (typeof data?.message === 'string' && data.message.trim() && !looksLikeHtml(data.message)) {
        return data.message;
      }
      return fallback === 'Request failed.'
        ? 'You are outside your assigned working area.'
        : fallback;
    }

    if (status === 404) {
      return fallback === 'Request failed.'
        ? 'The requested Bhuguard service is unavailable.'
        : fallback;
    }

    if (status === 409) {
      if (typeof data?.message === 'string' && data.message.trim() && !looksLikeHtml(data.message)) {
        return data.message;
      }
      return fallback === 'Request failed.'
        ? 'You already have an active work session.'
        : fallback;
    }

    if (status === 422) {
      const fieldMessage = firstValidationMessage(data?.errors);
      if (fieldMessage) {
        return fieldMessage;
      }
      if (typeof data?.message === 'string' && data.message.trim() && !looksLikeHtml(data.message)) {
        return data.message;
      }
      return 'Please review the highlighted required fields.';
    }

    if (status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    if ((status ?? 0) >= 500) {
      return fallback === 'Request failed.'
        ? 'Request could not be completed. Please try again.'
        : fallback;
    }

    if (status === 413) {
      return 'Upload is too large. Please retry with fewer or smaller photos.';
    }

    if (looksLikeHtml(data)) {
      return fallback === 'Request failed.'
        ? 'Request could not be completed. Please try again.'
        : fallback;
    }

    if (data?.message && !looksLikeHtml(data.message)) {
      return data.message;
    }

    if (data?.errors) {
      const fieldMessage = firstValidationMessage(data.errors);
      if (fieldMessage) {
        return fieldMessage;
      }
    }

    if (isTimeoutError(axiosError)) {
      return 'Bhuguard server is temporarily unavailable.';
    }

    // HTTP response present but unmapped — never fall through to "Unable to connect".
    if (status != null) {
      return fallback;
    }

    if (isNetworkError(axiosError)) {
      const baseUrl = axiosError.config?.baseURL ?? '';
      if (usesLocalDevelopmentApi(baseUrl)) {
        return LOCAL_DEV_TRANSPORT_MESSAGE;
      }
      return NETWORK_UNREACHABLE_MESSAGE;
    }

    if (
      axiosError.message
      && !looksLikeHtml(axiosError.message)
      && !/request failed with status code/i.test(axiosError.message)
    ) {
      return axiosError.message;
    }
  }

  if (error instanceof Error && error.message && !looksLikeHtml(error.message)) {
    // Interceptor may have already mapped HTTP → plain Error(message).
    return error.message;
  }

  return fallback;
}

export const PENDING_API_MESSAGE =
  'This module is ready in mobile. Backend API is pending or no records exist yet.';

export const NETWORK_ERROR_MESSAGE = 'No internet connection.';

export const NETWORK_UNREACHABLE_MESSAGE = 'No internet connection.';

export const LOCAL_DEV_TRANSPORT_MESSAGE = 'Unable to reach local development server.';

/** @deprecated Use LOCAL_DEV_TRANSPORT_MESSAGE — kept for imports that expect the old name. */
export const LOCAL_API_UNREACHABLE_MESSAGE = LOCAL_DEV_TRANSPORT_MESSAGE;

export function formatApiUnreachableMessage(baseUrl: string): string {
  if (usesLocalDevelopmentApi(baseUrl)) {
    return LOCAL_DEV_TRANSPORT_MESSAGE;
  }

  if (isDevelopmentBuild()) {
    return `${NETWORK_UNREACHABLE_MESSAGE}\n\nAPI: ${baseUrl}`;
  }

  return NETWORK_UNREACHABLE_MESSAGE;
}

export const EMPTY_DATA_MESSAGE =
  'No records found yet. Data will appear after backend entries are added.';

export const REPORT_DOWNLOAD_UNAVAILABLE_MESSAGE =
  'Report download is not available yet.';

/** @deprecated Use extractApiErrorMessage — kept for internal client interceptor use. */
export type { AxiosError };
