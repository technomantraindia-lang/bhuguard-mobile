import axios, { type AxiosError } from 'axios';

import type { ApiErrorResponse } from '../types/auth';

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

    if (data?.message) {
      return data.message;
    }

    if (data?.errors) {
      const firstError = Object.values(data.errors).flat()[0];
      if (firstError) {
        return firstError;
      }
    }

    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (error.response?.status === 422) {
      return 'Validation failed. Please check your input.';
    }

    if ((error.response?.status ?? 0) >= 500) {
      return 'Server error. Please try again later.';
    }

    if (isTimeoutError(error)) {
      return 'Request timed out. Check your connection and try again.';
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export const PENDING_API_MESSAGE =
  'This module is ready in mobile. Backend API is pending or no records exist yet.';

export const NETWORK_ERROR_MESSAGE =
  'Unable to connect to server. Please check backend and Wi-Fi.';

export function formatApiUnreachableMessage(baseUrl: string): string {
  return `Cannot reach API at ${baseUrl}. Please check server settings and network.`;
}

export const EMPTY_DATA_MESSAGE =
  'No records found yet. Data will appear after backend entries are added.';

export const REPORT_DOWNLOAD_UNAVAILABLE_MESSAGE =
  'Report download is not available yet.';

/** @deprecated Use extractApiErrorMessage — kept for internal client interceptor use. */
export type { AxiosError };
