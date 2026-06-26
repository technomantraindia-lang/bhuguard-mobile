import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '../config/apiConfig';
import { navigateToLogin } from '../navigation/navigationRef';
import { getApiBaseUrl, getCachedApiBaseUrl } from '../storage/apiConfigStorage';
import { clearAuthStorage, getAuthToken } from '../utils/authStorage';
import { extractApiErrorMessage, formatApiUnreachableMessage, isNetworkError, isTimeoutError } from '../utils/apiError';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const baseUrl = await getApiBaseUrl();
    config.baseURL = baseUrl || API_BASE_URL;

    const token = await getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await clearAuthStorage();
      navigateToLogin();
      return Promise.reject(new Error(extractApiErrorMessage(error, 'Session expired. Please log in again.')));
    }

    if (isNetworkError(error)) {
      const baseUrl = getCachedApiBaseUrl() || API_BASE_URL;
      return Promise.reject(new Error(formatApiUnreachableMessage(baseUrl)));
    }

    if (isTimeoutError(error)) {
      return Promise.reject(new Error(extractApiErrorMessage(error, 'Request timed out.')));
    }

    if (error.response?.status === 403) {
      return Promise.reject(new Error(extractApiErrorMessage(error, 'You do not have permission to perform this action.')));
    }

    if (error.response?.status === 422) {
      return Promise.reject(new Error(extractApiErrorMessage(error, 'Validation failed.')));
    }

    if ((error.response?.status ?? 0) >= 500) {
      return Promise.reject(new Error(extractApiErrorMessage(error, 'Server error. Please try again.')));
    }

    return Promise.reject(new Error(extractApiErrorMessage(error)));
  },
);

export { API_BASE_URL };

/** Call after saving server settings so axios defaults match the cached URL. */
export async function syncApiClientBaseUrl(): Promise<string> {
  const baseUrl = await getApiBaseUrl();
  apiClient.defaults.baseURL = baseUrl;
  return baseUrl;
}
