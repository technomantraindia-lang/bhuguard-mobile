import axios from 'axios';

import { isNetworkError, isTimeoutError } from './apiError';

/**
 * True only for genuine transport/unreachable failures (no usable HTTP response).
 * HTTP 4xx/5xx with a response body must NOT be treated as offline.
 */
export function isTransportUnreachableError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    if (error.response != null) {
      return false;
    }

    return (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      isTimeoutError(error) ||
      isNetworkError(error)
    );
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('unreachable') ||
    message.includes('cannot reach api') ||
    message.includes('connection refused') ||
    message.includes('failed to fetch')
  );
}
