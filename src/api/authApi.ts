import axios from 'axios';

import type { ApiErrorResponse, ApiSuccessResponse, LoginPasswordResult } from '../types/auth';

import { apiClient } from './client';

interface LoginPasswordPayload {
  login: string;
  password: string;
  device_name: string;
}

interface LoginPasswordData {
  token: string;
  token_type: string;
  user: LoginPasswordResult['user'];
}

const DEVICE_NAME = 'expo-mobile';

export async function loginPassword(login: string, password: string): Promise<LoginPasswordResult> {
  const payload: LoginPasswordPayload = {
    login: login.trim(),
    password,
    device_name: DEVICE_NAME,
  };

  const response = await apiClient.post<ApiSuccessResponse<LoginPasswordData>>('/auth/login/password', payload);
  const { token, user } = response.data.data;

  if (__DEV__) {
    console.log('[Bhuguard Auth] Login success user_type:', user.user_type);
  }

  return { token, user, user_type: user.user_type };
}

export async function loginMpin(mobile: string, mpin: string): Promise<LoginPasswordResult> {
  const response = await apiClient.post<ApiSuccessResponse<LoginPasswordData>>('/auth/login/mpin', {
    mobile: mobile.trim(),
    mpin,
    device_name: DEVICE_NAME,
  });
  const { token, user } = response.data.data;

  return { token, user, user_type: user.user_type };
}

export async function getAuthMe() {
  const response = await apiClient.get<ApiSuccessResponse<{ user: LoginPasswordResult['user'] }>>('/auth/me');
  return response.data.data;
}

export async function requestForgotPasswordOtp(mobile: string) {
  const response = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(
    '/auth/forgot-password/request-otp',
    { mobile: mobile.trim() },
  );
  return response.data.data;
}

export async function verifyForgotPasswordOtp(mobile: string, otp: string) {
  const response = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(
    '/auth/forgot-password/verify-otp',
    { mobile: mobile.trim(), otp: otp.trim() },
  );
  return response.data.data;
}

export async function resetPassword(mobile: string, password: string) {
  const response = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(
    '/auth/forgot-password/reset',
    { mobile: mobile.trim(), password },
  );
  return response.data.data;
}

export async function requestForgotMpinOtp(mobile: string) {
  const response = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(
    '/auth/forgot-mpin/request-otp',
    { mobile: mobile.trim() },
  );
  return response.data.data;
}

export async function verifyForgotMpinOtp(mobile: string, otp: string) {
  const response = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(
    '/auth/forgot-mpin/verify-otp',
    { mobile: mobile.trim(), otp: otp.trim() },
  );
  return response.data.data;
}

export async function resetMpin(mobile: string, mpin: string) {
  const response = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(
    '/auth/forgot-mpin/reset',
    { mobile: mobile.trim(), mpin },
  );
  return response.data.data;
}

export function getApiErrorMessage(error: unknown, fallback = 'Login failed. Please try again.'): string {
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

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
