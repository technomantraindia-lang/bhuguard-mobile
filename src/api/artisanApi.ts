import type { ApiSuccessResponse, AuthUser } from '../types/auth';
import { resolveUserRole } from '../utils/authRole';
import { fetchApiData, type ApiRecord } from '../utils/apiHelpers';

import { apiClient } from './client';
import { postApiData, putApiData, putFormData } from './postHelpers';

const DEVICE_NAME = 'expo-mobile';

function extractToken(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const root = body as Record<string, unknown>;

  if (typeof root.token === 'string') {
    return root.token;
  }

  const data = root.data;

  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>;

    if (typeof nested.token === 'string') {
      return nested.token;
    }
  }

  return null;
}

function extractUser(body: unknown): AuthUser | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const root = body as Record<string, unknown>;
  const data = root.data;

  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>;

    if (nested.user && typeof nested.user === 'object') {
      return nested.user as AuthUser;
    }
  }

  if (root.user && typeof root.user === 'object') {
    return root.user as AuthUser;
  }

  return null;
}

export async function loginArtisan(login: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const response = await apiClient.post<ApiSuccessResponse<{ token: string; user: AuthUser }>>('/artisan/login', {
    login: login.trim(),
    password,
    device_name: DEVICE_NAME,
  });

  const token = extractToken(response.data);
  const user = extractUser(response.data);

  if (!token || !user) {
    throw new Error('Invalid artisan login response from server.');
  }

  const role = resolveUserRole(user);

  if (role) {
    user.user_type = role;
  }

  return { token, user };
}

export async function getArtisanDashboard() {
  return fetchApiData<{ dashboard: ApiRecord }>('/artisan/dashboard');
}

export async function getArtisanProfile() {
  return fetchApiData<{ artisan: ApiRecord; user: ApiRecord }>('/artisan/profile');
}

export async function updateArtisanProfileMpin(payload: {
  current_mpin: string;
  mpin: string;
  mpin_confirmation: string;
}) {
  return putApiData('/artisan/profile/mpin', payload);
}

export async function lookupArtisanFarm(farmId: string | number) {
  return postApiData('/artisan/farm/lookup', { farm_id: farmId });
}

export async function getArtisanBiocharProductionRecords(status?: 'draft' | 'submitted') {
  return fetchApiData('/artisan/biochar-production', status ? { status } : undefined);
}

export async function createArtisanBiocharProduction(farmId: number) {
  return postApiData('/artisan/biochar-production', { farm_id: farmId });
}

export async function getArtisanBiocharProduction(id: number | string) {
  return fetchApiData(`/artisan/biochar-production/${id}`);
}

export async function updateArtisanBiocharProduction(id: number | string, payload: FormData) {
  return putFormData(`/artisan/biochar-production/${id}`, payload);
}

export async function saveArtisanBiocharProductionDraft(id: number | string, payload: FormData) {
  return postApiData(`/artisan/biochar-production/${id}/save-draft`, payload);
}

export async function submitArtisanBiocharProduction(id: number | string) {
  return postApiData(`/artisan/biochar-production/${id}/submit`, {});
}

export async function getArtisanBiocharMixingRecords() {
  return fetchApiData('/artisan/biochar-mixing');
}

export async function getArtisanBiocharMixing(id: number | string) {
  return fetchApiData(`/artisan/biochar-mixing/${id}`);
}

export async function createArtisanBiocharMixing(payload: FormData) {
  return postApiData('/artisan/biochar-mixing', payload);
}

export async function saveArtisanBiocharMixingDraft(id: number | string, payload: FormData) {
  return postApiData(`/artisan/biochar-mixing/${id}/save-draft`, payload);
}

export async function submitArtisanBiocharMixing(id: number | string) {
  return postApiData(`/artisan/biochar-mixing/${id}/submit`, {});
}

export type ArtisanGpsLogPayload = {
  farm_id?: number | null;
  biochar_production_id?: number | null;
  activity_stage: string;
  latitude: number;
  longitude: number;
  gps_accuracy?: number | null;
  captured_at: string;
  notes?: string | null;
};

export async function logArtisanGps(payload: ArtisanGpsLogPayload) {
  return postApiData('/artisan/gps-log', payload);
}
