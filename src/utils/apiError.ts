import axios, { type AxiosError } from 'axios';

import type { ApiErrorResponse } from '../types/auth';

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
 * True only for real transport failures (no HTTP response).
 * Timeouts are handled separately — they must not use the "unable to connect" copy.
 */
export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    if (isTimeoutError(error)) {
      return false;
    }

    return error.code === 'ERR_NETWORK' || (error.response == null && error.code !== 'ECONNABORTED');
  }

  return error instanceof Error && /network request failed|failed to fetch|net::err_/i.test(error.message);
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

export function logSafeApiFailure(error: unknown, context?: string): void {
  if (!__DEV__ || !axios.isAxiosError(error)) {
    return;
  }

  const data = error.response?.data as ApiErrorResponse | undefined;
  const fieldNames = firstValidationFieldNames(data?.errors as Record<string, string[] | string> | undefined);
  const safeMessage =
    typeof data?.message === 'string' && !looksLikeHtml(data.message) ? data.message : undefined;

  console.log('[API failure]', {
    context: context ?? null,
    endpoint: error.config?.url ?? null,
    method: error.config?.method?.toUpperCase() ?? null,
    status: error.response?.status ?? null,
    code: error.code ?? null,
    message: safeMessage ?? null,
    validation_fields: fieldNames,
  });
}

export function extractApiErrorMessage(error: unknown, fallback = 'Request failed.'): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      return 'Your session has expired. Please log in again.';
    }

    if (status === 403) {
      if (typeof data?.message === 'string' && data.message.trim() && !looksLikeHtml(data.message)) {
        return data.message;
      }
      return 'You do not have permission to perform this action.';
    }

    if (status === 404) {
      return 'The requested registration service was not found. Please try again later.';
    }

    if (status === 409) {
      if (typeof data?.message === 'string' && data.message.trim() && !looksLikeHtml(data.message)) {
        return data.message;
      }
      return 'This Farmer registration has already been submitted.';
    }

    if (status === 422) {
      if (data?.errors) {
        const firstError = Object.values(data.errors).flat()[0];
        if (typeof firstError === 'string' && firstError.trim()) {
          return firstError;
        }
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
      return 'Registration could not be completed. Please try again.';
    }

    if (looksLikeHtml(data)) {
      return fallback === 'Request failed.'
        ? 'Registration could not be completed. Please try again.'
        : fallback;
    }

    if (data?.message && !looksLikeHtml(data.message)) {
      return data.message;
    }

    if (data?.errors) {
      const firstError = Object.values(data.errors).flat()[0];
      if (firstError) {
        return firstError;
      }
    }

    if (isTimeoutError(error)) {
      return 'The request took too long. Please try again with a stronger connection.';
    }

    if (error.message && !looksLikeHtml(error.message) && !/request failed with status code/i.test(error.message)) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message && !looksLikeHtml(error.message)) {
    return error.message;
  }

  return fallback;
}

export const PENDING_API_MESSAGE =
  'This module is ready in mobile. Backend API is pending or no records exist yet.';

export const NETWORK_ERROR_MESSAGE = 'Internet connection is unavailable.';

export function formatApiUnreachableMessage(_baseUrl: string): string {
  return 'Unable to connect to the Bhuguard server.';
}

export const EMPTY_DATA_MESSAGE =
  'No records found yet. Data will appear after backend entries are added.';

export const REPORT_DOWNLOAD_UNAVAILABLE_MESSAGE =
  'Report download is not available yet.';

/** @deprecated Use extractApiErrorMessage — kept for internal client interceptor use. */
export type { AxiosError };
