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

export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return !error.response || error.code === 'ERR_NETWORK';
  }

  return error instanceof Error && /network/i.test(error.message);
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

export function extractApiErrorMessage(error: unknown, fallback = 'Request failed.'): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;

    if (looksLikeHtml(data)) {
      return fallback === 'Request failed.'
        ? 'Unable to connect to the Bhuguard server.'
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

    if (error.response?.status === 401) {
      return 'Your session has expired. Please log in again.';
    }

    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (error.response?.status === 404) {
      return 'The requested service is temporarily unavailable.';
    }

    if (error.response?.status === 422) {
      return 'Please check the entered information.';
    }

    if (error.response?.status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    if ((error.response?.status ?? 0) >= 500) {
      return 'The requested service is temporarily unavailable.';
    }

    if (isTimeoutError(error)) {
      return 'Unable to connect to the Bhuguard server. Please try again.';
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
