import type { ApiSuccessResponse, AuthUser, LoginPasswordResult } from '../types/auth';
import { resolveUserRole } from '../utils/authRole';
import { Platform } from 'react-native';

import { clearAuthStorage, saveAuthToken, saveAuthUser } from '../utils/authStorage';
import { getOrCreateDeviceUuid } from '../utils/biometricLogin';
import { extractApiErrorMessage } from '../utils/apiError';

import { apiClient } from './client';

const DEVICE_NAME = 'expo-mobile';

async function devicePayload() {
  return {
    device_name: DEVICE_NAME,
    device_uuid: await getOrCreateDeviceUuid(),
    platform: Platform.OS,
  };
}

export interface LoginPayload {
  mobile?: string;
  email?: string;
  password: string;
}

export interface NormalizedAuthResponse {
  token: string;
  user: AuthUser;
}

function extractToken(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const root = body as Record<string, unknown>;

  if (typeof root.token === 'string') {
    return root.token;
  }

  if (typeof root.access_token === 'string') {
    return root.access_token;
  }

  const data = root.data;

  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>;

    if (typeof nested.token === 'string') {
      return nested.token;
    }

    if (typeof nested.access_token === 'string') {
      return nested.access_token;
    }
  }

  return null;
}

function extractUser(body: unknown): AuthUser | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const root = body as Record<string, unknown>;

  if (root.user && typeof root.user === 'object') {
    return root.user as AuthUser;
  }

  const data = root.data;

  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>;

    if (nested.user && typeof nested.user === 'object') {
      return nested.user as AuthUser;
    }
  }

  return null;
}

function normalizeAuthResponse(body: unknown): NormalizedAuthResponse {
  const token = extractToken(body);
  const user = extractUser(body);

  if (!token || !user) {
    throw new Error('Invalid login response from server.');
  }

  const role = resolveUserRole(user);

  if (role) {
    user.user_type = role;
  }

  return { token, user };
}

/**
 * Password login — Bhuguard backend: POST /auth/login/password
 * Accepts mobile or email as login identifier.
 */
export async function login(payload: LoginPayload): Promise<NormalizedAuthResponse> {
  const loginId = payload.mobile?.trim() || payload.email?.trim();

  if (!loginId || !payload.password) {
    throw new Error('Mobile/email and password are required.');
  }

  const device = await devicePayload();
  const response = await apiClient.post('/auth/login/password', {
    login: loginId,
    password: payload.password,
    ...device,
  });

  return normalizeAuthResponse(response.data);
}

/** Current authenticated user — Bhuguard backend: GET /auth/me */
export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get('/auth/me');
  const user = extractUser(response.data);

  if (!user) {
    throw new Error('Invalid user response from server.');
  }

  const role = resolveUserRole(user);

  if (role) {
    user.user_type = role;
  }

  return user;
}

/** Logout — Bhuguard backend: POST /auth/logout. Always clears local storage. */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // Local session is always cleared even if server logout fails.
  } finally {
    try {
      await clearAuthStorage();
    } catch {
      // Never block logout navigation on storage cleanup failures.
    }
  }
}

export async function persistAuthSession(token: string, user: AuthUser): Promise<void> {
  await saveAuthToken(token);
  await saveAuthUser(user);
}

export async function loginPassword(loginId: string, password: string): Promise<LoginPasswordResult> {
  const { token, user } = await login({ mobile: loginId, password });
  const user_type = resolveUserRole(user) ?? user.user_type;

  if (__DEV__) {
    console.log('[Bhuguard Auth] Login success user_type:', user_type);
  }

  return { token, user, user_type };
}

export async function loginMpin(mobile: string, mpin: string): Promise<LoginPasswordResult> {
  const device = await devicePayload();
  const response = await apiClient.post<ApiSuccessResponse<{ token: string; user: AuthUser }>>('/auth/login/mpin', {
    mobile: mobile.trim(),
    mpin,
    ...device,
  });

  const { token, user } = normalizeAuthResponse(response.data);

  return { token, user, user_type: resolveUserRole(user) ?? user.user_type };
}

export async function loginBiometricToken(payload: {
  mobile: string;
  device_uuid: string;
  device_name?: string;
  platform?: string;
}): Promise<LoginPasswordResult> {
  const response = await apiClient.post('/auth/login/biometric-token', {
    mobile: payload.mobile.trim(),
    device_uuid: payload.device_uuid,
    device_name: payload.device_name ?? DEVICE_NAME,
    platform: payload.platform,
  });

  const { token, user } = normalizeAuthResponse(response.data);

  return { token, user, user_type: resolveUserRole(user) ?? user.user_type };
}

export async function resolveLoginRoute(mobile: string): Promise<{
  user_exists: boolean;
  pattern_configured: boolean;
  next_step: 'pattern_login' | 'otp_then_pattern_setup' | string;
  role?: string;
  name?: string;
  mobile?: string;
  biometric_available?: boolean;
  has_pattern?: boolean;
  pattern_setup_required?: boolean;
}> {
  const device = await devicePayload();
  const response = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(
    '/auth/login/resolve',
    {
      mobile: mobile.trim(),
      device_uuid: device.device_uuid,
      platform: device.platform,
    },
  );

  const data = response.data.data ?? {};

  return {
    user_exists: Boolean(data.user_exists),
    pattern_configured: Boolean(data.pattern_configured ?? data.has_pattern),
    next_step: String(data.next_step ?? 'otp_then_pattern_setup'),
    role: data.role ? String(data.role) : undefined,
    name: data.name ? String(data.name) : undefined,
    mobile: data.mobile ? String(data.mobile) : mobile.trim(),
    biometric_available: Boolean(data.biometric_available),
    has_pattern: Boolean(data.has_pattern ?? data.pattern_configured),
    pattern_setup_required: Boolean(data.pattern_setup_required),
  };
}

export async function requestLoginOtp(mobile: string) {
  const response = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(
    '/auth/login/request-otp',
    { mobile: mobile.trim() },
  );

  return response.data.data;
}

export async function verifyLoginOtp(mobile: string, otp: string): Promise<LoginPasswordResult> {
  const device = await devicePayload();
  const response = await apiClient.post('/auth/login/verify-otp', {
    mobile: mobile.trim(),
    // Always send a string — numeric JSON OTPs fail Laravel `string` validation.
    otp: String(otp ?? '').trim(),
    ...device,
  });

  const { token, user } = normalizeAuthResponse(response.data);
  const { capabilityFromAuthPayload } = await import('./patternApi');
  const capability = capabilityFromAuthPayload(response.data);

  if (capability.pattern_supported) {
    user.pattern_supported = true;
    user.has_pattern = capability.has_pattern;
    user.pattern_setup_required = capability.pattern_setup_required;
  }

  return { token, user, user_type: resolveUserRole(user) ?? user.user_type };
}

export async function setupMpin(mpin: string): Promise<AuthUser> {
  const response = await apiClient.post('/auth/mpin/setup', {
    mpin,
    mpin_confirmation: mpin,
  });
  const user = extractUser(response.data);

  if (!user) {
    throw new Error('Invalid MPIN setup response.');
  }

  await saveAuthUser(user);

  return user;
}

export async function enableDeviceBiometric(): Promise<void> {
  const device = await devicePayload();
  await apiClient.post('/auth/devices/biometric', device);
}

/** @deprecated Use getCurrentUser */
export const getAuthMe = async () => {
  const user = await getCurrentUser();
  return { user };
};

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
  return extractApiErrorMessage(error, fallback);
}

/** @deprecated Use logout() */
export async function logoutApi() {
  await logout();
  return { success: true, message: 'Logged out' };
}

export async function logoutAllApi() {
  try {
    await apiClient.post('/auth/logout-all');
  } finally {
    await clearAuthStorage();
  }
}
