import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { navigateToLogin } from '../navigation/navigationRef';
import { clearAuthSession, getAuthToken } from '../storage/authStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.18:8000/api';

if (__DEV__) {
  console.log('[Bhuguard API] Base URL:', API_BASE_URL);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
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
      return Promise.reject(
        new Error(
          'Network error. Check that your phone can reach the API server and EXPO_PUBLIC_API_URL is correct.',
        ),
      );
    }

    return Promise.reject(error);
  },
);

export { API_BASE_URL };
