import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { BUILD_API_BASE_URL } from '../config/apiDefaults';
import { navigateToLogin } from '../navigation/navigationRef';
import { clearAuthSession, getAuthToken } from '../storage/authStorage';
import { getApiBaseUrl, getCachedApiBaseUrl } from '../storage/apiConfigStorage';

if (__DEV__) {
  console.log('[Bhuguard API] Build default:', BUILD_API_BASE_URL);
}

export const apiClient = axios.create({
  baseURL: BUILD_API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.baseURL = await getApiBaseUrl();

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
      await clearAuthSession();
      navigateToLogin();
    }

    if (!error.response && error.message === 'Network Error') {
      const baseUrl = getCachedApiBaseUrl();
      return Promise.reject(
        new Error(
          `Cannot reach API at ${baseUrl || '(not set)'}. Open Server settings and paste your public https://... URL.`,
        ),
      );
    }

    return Promise.reject(error);
  },
);

/** @deprecated Use getApiBaseUrl() — kept for sync helpers that run after login. */
export const API_BASE_URL = BUILD_API_BASE_URL;
