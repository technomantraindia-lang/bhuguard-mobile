import axios from 'axios';

import { API_BASE_URL } from '../config/apiConfig';
import { getApiBaseUrl, testApiConnection } from '../storage/apiConfigStorage';
import { getAuthToken } from '../utils/authStorage';

import { getCurrentUser } from './authApi';
import { apiClient } from './client';

export interface ApiHealthCheckResult {
  name: string;
  ok: boolean;
  status?: number;
  message: string;
}

async function probe(name: string, runner: () => Promise<unknown>): Promise<ApiHealthCheckResult> {
  try {
    await runner();
    return { name, ok: true, message: 'OK' };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        name,
        ok: false,
        status: error.response?.status,
        message: error.response?.data?.message ?? error.message,
      };
    }

    return {
      name,
      ok: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Developer utility — quick API connectivity check.
 * Does not auto-test login unless credentials are provided separately.
 */
export async function runApiHealthCheck(): Promise<ApiHealthCheckResult[]> {
  const baseUrl = (await getApiBaseUrl()) || API_BASE_URL;
  const token = await getAuthToken();
  const results: ApiHealthCheckResult[] = [];

  const connection = await testApiConnection(baseUrl.replace(/\/api\/?$/, ''));

  results.push({
    name: 'API base URL',
    ok: connection.ok,
    message: connection.ok ? baseUrl : connection.message ?? 'Unreachable',
  });

  results.push(
    await probe('GET /app/branding', () => apiClient.get('/app/branding')),
  );

  if (token) {
    results.push(await probe('GET /auth/me (current user)', () => getCurrentUser()));
  } else {
    results.push({
      name: 'GET /auth/me (current user)',
      ok: false,
      message: 'Skipped — no auth token in storage',
    });
  }

  return results;
}
