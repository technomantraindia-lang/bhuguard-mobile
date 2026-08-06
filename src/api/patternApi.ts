import axios from 'axios';

import { apiClient } from './client';
import { saveAuthSession } from '../storage/authStorage';
import type { UserType } from '../types/auth';
import { saveAuthUser } from '../utils/authStorage';
import { resolveUserRole } from '../utils/authRole';
import type { AuthUser, LoginPasswordResult } from '../types/auth';

export type PatternCapability = {
  pattern_supported: boolean;
  has_pattern: boolean;
  pattern_setup_required: boolean;
};

export class PatternUnsupportedError extends Error {
  readonly code = 'pattern_unsupported' as const;

  constructor(message = 'Pattern authentication is not available on this server.') {
    super(message);
    this.name = 'PatternUnsupportedError';
  }
}

export class PatternLockedError extends Error {
  readonly code = 'pattern_locked' as const;
  readonly retryAfterSeconds?: number;

  constructor(message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'PatternLockedError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function isUnsupportedStatus(status?: number): boolean {
  return status === 404 || status === 405 || status === 501;
}

function throwMappedPatternError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (isUnsupportedStatus(status)) {
      throw new PatternUnsupportedError();
    }

    const data = error.response?.data as
      | { message?: string; retry_after_seconds?: number; locked_until?: string }
      | undefined;
    const message =
      typeof data?.message === 'string' && data.message.trim()
        ? data.message
        : 'Pattern verification failed.';

    if (status === 429 || /lock|too many|rate/i.test(message)) {
      throw new PatternLockedError(message, data?.retry_after_seconds);
    }

    throw new Error(message);
  }

  throw error instanceof Error ? error : new Error('Pattern request failed.');
}

/**
 * Probe whether the live API exposes Pattern endpoints.
 * Never treats missing endpoints as success.
 */
export async function probePatternCapability(): Promise<boolean> {
  try {
    await apiClient.get('/auth/pattern/capability');
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && isUnsupportedStatus(error.response?.status)) {
      return false;
    }
    // Other errors (401/network) do not prove support.
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Endpoint exists but requires auth — treat as supported.
      return true;
    }
    return false;
  }
}

export function capabilityFromAuthPayload(payload: unknown): PatternCapability {
  const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const data =
    root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root;
  const user =
    data.user && typeof data.user === 'object' ? (data.user as Record<string, unknown>) : data;

  const patternSupported = Boolean(
    data.pattern_supported === true
      || user.pattern_supported === true
      || typeof user.pattern_hash === 'string'
      || typeof user.has_pattern === 'boolean'
      || typeof data.has_pattern === 'boolean'
      || typeof data.pattern_setup_required === 'boolean',
  );

  const hasPattern = Boolean(user.has_pattern === true || data.has_pattern === true);
  const setupRequired = Boolean(
    data.pattern_setup_required === true || user.pattern_setup_required === true,
  );

  return {
    pattern_supported: patternSupported,
    has_pattern: hasPattern,
    pattern_setup_required: setupRequired || (patternSupported && !hasPattern),
  };
}

export async function setupPattern(patternSequence: string): Promise<AuthUser> {
  try {
    const response = await apiClient.post('/auth/pattern/setup', {
      pattern_sequence: patternSequence,
    });
    const body = response.data as { data?: { user?: AuthUser }; user?: AuthUser };
    const user = body?.data?.user ?? body?.user;
    if (!user) {
      throw new Error('Invalid pattern setup response.');
    }
    await saveAuthUser({ ...user, has_pattern: true, pattern_setup_required: false });
    return user;
  } catch (error) {
    throwMappedPatternError(error);
  }
}

export async function verifyPattern(mobile: string, patternSequence: string): Promise<LoginPasswordResult> {
  try {
    const response = await apiClient.post('/auth/pattern/verify', {
      mobile: mobile.trim(),
      pattern_sequence: patternSequence,
    });
    const body = response.data as {
      data?: { token?: string; user?: AuthUser };
      token?: string;
      user?: AuthUser;
    };
    const token = body?.data?.token ?? body?.token;
    const user = body?.data?.user ?? body?.user;
    if (!token || !user) {
      throw new Error('Invalid pattern verify response.');
    }
    const role = (resolveUserRole(user) ?? user.user_type) as UserType;
    await saveAuthSession(token, user, role);
    return {
      token,
      user,
      user_type: resolveUserRole(user) ?? user.user_type,
    };
  } catch (error) {
    throwMappedPatternError(error);
  }
}

export async function changePattern(oldPattern: string, newPattern: string): Promise<void> {
  try {
    await apiClient.post('/auth/pattern/change', {
      old_pattern: oldPattern,
      new_pattern: newPattern,
    });
  } catch (error) {
    throwMappedPatternError(error);
  }
}

export async function resetPattern(mobile: string, patternSequence: string): Promise<void> {
  try {
    await apiClient.post('/auth/pattern/reset', {
      mobile: mobile.trim(),
      pattern_sequence: patternSequence,
    });
  } catch (error) {
    throwMappedPatternError(error);
  }
}
