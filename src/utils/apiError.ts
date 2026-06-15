import axios from 'axios';

export function isApiNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return !error.response || error.code === 'ERR_NETWORK';
  }

  return error instanceof Error && /network/i.test(error.message);
}

export const PENDING_API_MESSAGE =
  'This module is ready in mobile. Backend API is pending or no records exist yet.';

export const NETWORK_ERROR_MESSAGE =
  'Unable to connect to server. Please check backend and Wi-Fi.';

export const EMPTY_DATA_MESSAGE =
  'No records found yet. Data will appear after backend entries are added.';
