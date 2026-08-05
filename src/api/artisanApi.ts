/**
 * TODO(artisan-pro-split): All endpoints below are hardcoded to the shared `/artisan/*`
 * base path. The backend currently accepts both the `artisan` and `artisan_pro`
 * UserType roles on these routes, so both apps (ArtisanNavigator / ArtisanProNavigator)
 * can safely call this same module today. If the backend later splits Artisan Pro onto
 * its own `/artisan-pro/*` routes, switch the base path here based on the signed-in
 * user's exact role (`resolveUserRole(user) === 'artisan_pro'`) rather than changing
 * call sites individually.
 */
import type { ApiSuccessResponse, AuthUser } from '../types/auth';
import type { ArtisanAllocatedVillage, ArtisanFarmSearchRecord } from '../types/artisanFarmSearch';
import type { AssignedLocationsPayload } from '../types/assignedLocations';
import { resolveUserRole } from '../utils/authRole';
import {
  defaultAssignedArea,
  fetchApiData,
  normalizeAssignedArea,
  type ApiRecord,
} from '../utils/apiHelpers';

import { apiClient } from './client';
import { postApiData, putApiData, putFormData } from './postHelpers';

export { defaultAssignedArea, normalizeAssignedArea };

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

/** Safe empty dashboard used when the API omits or mis-shapes the payload. */
export const defaultArtisanDashboard: ApiRecord = {
  artisan_name: null,
  artisan_code: null,
  artisan_display_id: null,
  release_mode: 'biochar_production_only',
  draft_production_count: 0,
  submitted_production_count: 0,
  assigned_kiln_count: 0,
  assigned_kilns: [],
  recent_batches: [],
  has_assignment: false,
  live_checkin: {
    status: 'not_checked_in',
    village: null,
    latitude: null,
    longitude: null,
    gps_accuracy: null,
    last_update: null,
    duration: null,
    activity: null,
    check_in_time: null,
    check_out_time: null,
  },
  stats: {
    farmers: 0,
    farms: 0,
    biochar_production: 0,
    biochar_mixing: 0,
    biochar_application: 0,
    pending: 0,
    completed: 0,
  },
  modules: [],
  notifications: [],
  assigned_area: { ...defaultAssignedArea },
};

function isPlainObject(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function looksLikeArtisanDashboard(value: ApiRecord): boolean {
  return (
    typeof value.submitted_production_count !== 'undefined' ||
    typeof value.draft_production_count !== 'undefined' ||
    typeof value.artisan_name !== 'undefined' ||
    typeof value.artisan_code !== 'undefined' ||
    typeof value.release_mode !== 'undefined' ||
    typeof value.live_checkin !== 'undefined' ||
    typeof value.liveCheckin !== 'undefined' ||
    typeof value.assigned_area !== 'undefined' ||
    typeof value.assignedArea !== 'undefined' ||
    typeof value.has_assignment !== 'undefined' ||
    typeof value.stats !== 'undefined'
  );
}

/** Pull the raw dashboard object from any known API envelope, or null if missing. */
export function extractArtisanDashboardPayload(response: unknown): ApiRecord | null {
  if (!isPlainObject(response)) {
    return null;
  }

  const root = response;
  const data = isPlainObject(root.data) ? (root.data as ApiRecord) : null;

  if (data && isPlainObject(data.dashboard)) {
    return data.dashboard as ApiRecord;
  }

  if (isPlainObject(root.dashboard)) {
    return root.dashboard as ApiRecord;
  }

  if (data && isPlainObject((data.data as ApiRecord | undefined)?.dashboard)) {
    return (data.data as ApiRecord).dashboard as ApiRecord;
  }

  if (data && looksLikeArtisanDashboard(data)) {
    return data;
  }

  if (looksLikeArtisanDashboard(root)) {
    return root;
  }

  return null;
}

/**
 * Normalize artisan dashboard payloads across envelope shapes:
 * - { success, data: { dashboard } }
 * - { dashboard }
 * - dashboard fields inside data / root
 */
export function normalizeArtisanDashboardResponse(response: unknown): ApiRecord {
  const candidate = extractArtisanDashboardPayload(response);

  if (!candidate) {
    return { ...defaultArtisanDashboard };
  }

  const liveRaw = (isPlainObject(candidate.live_checkin)
    ? candidate.live_checkin
    : isPlainObject(candidate.liveCheckin)
      ? candidate.liveCheckin
      : {}) as ApiRecord;

  const assigned = normalizeAssignedArea({
    assigned_area: {
      ...(defaultArtisanDashboard.assigned_area as ApiRecord),
      ...(isPlainObject(candidate.assigned_area) ? candidate.assigned_area : {}),
      ...(isPlainObject(candidate.assignedArea) ? candidate.assignedArea : {}),
    },
  });

  const hasAssignment =
    typeof candidate.has_assignment === 'boolean'
      ? candidate.has_assignment
      : assigned.has_assignment === true ||
        assigned.villages.length > 0 ||
        assigned.talukas.length > 0 ||
        assigned.districts.length > 0;

  return {
    ...defaultArtisanDashboard,
    ...candidate,
    stats: {
      ...(defaultArtisanDashboard.stats as ApiRecord),
      ...(isPlainObject(candidate.stats) ? candidate.stats : {}),
    },
    assigned_area: assigned,
    has_assignment: hasAssignment,
    live_checkin: {
      status: (liveRaw.status as string | undefined) ?? 'not_checked_in',
      status_label: liveRaw.status_label ?? null,
      is_checked_in: Boolean(liveRaw.is_checked_in),
      village: liveRaw.village ?? null,
      taluka: liveRaw.taluka ?? null,
      district: liveRaw.district ?? null,
      latitude: liveRaw.latitude ?? null,
      longitude: liveRaw.longitude ?? null,
      gps_accuracy: liveRaw.gps_accuracy ?? null,
      last_update: liveRaw.last_update ?? null,
      duration: liveRaw.duration ?? null,
      activity: liveRaw.activity ?? null,
      check_in_time: liveRaw.check_in_time ?? null,
      check_out_time: liveRaw.check_out_time ?? null,
    },
    modules: Array.isArray(candidate.modules) ? candidate.modules : [],
    notifications: Array.isArray(candidate.notifications) ? candidate.notifications : [],
  };
}

export async function getArtisanDashboard(): Promise<{ dashboard: ApiRecord; hasData: boolean }> {
  const response = await apiClient.get('/artisan/dashboard');
  const body = response?.data ?? response ?? {};
  const raw = extractArtisanDashboardPayload(body);

  return {
    dashboard: normalizeArtisanDashboardResponse(body),
    hasData: raw !== null,
  };
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

export interface ArtisanFarmSearchParams {
  q?: string;
  farm_id?: string;
  farmer_name?: string;
  village?: string;
  taluka?: string;
  page?: number;
  limit?: number;
}

export async function getArtisanAllocatedLocations(): Promise<AssignedLocationsPayload> {
  const response = await apiClient.get('/artisan/allocated-locations');
  const body = (response?.data ?? response ?? {}) as Record<string, unknown>;
  const payload = (
    body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : body
  ) as Record<string, unknown>;

  return normalizeAssignedArea({
    ...payload,
    assigned_area: payload.assigned_area ?? payload.assignedArea ?? payload,
    has_assignment: payload.has_assignment,
    work_village_ids: payload.work_village_ids,
    work_taluka_ids: payload.work_taluka_ids,
    work_district_ids: payload.work_district_ids,
    linked_field_officer: payload.linked_field_officer,
  });
}

export async function searchArtisanFarms(params: ArtisanFarmSearchParams = {}) {
  const response = await apiClient.get<{
    success: boolean;
    message: string;
    data: ArtisanFarmSearchRecord[];
    pagination?: { page: number; limit: number; total: number };
  }>('/artisan/farms/search', { params });

  return response.data;
}

export async function getArtisanBiocharProductionRecords(status?: 'draft' | 'submitted') {
  return fetchApiData('/artisan/biochar-production', status ? { status } : undefined);
}

export async function getArtisanBiocharApplicationEligibleBatches(
  farmId: number,
  mixingId?: number,
) {
  return fetchApiData<{ batches: ApiRecord[]; farm_id?: number }>('/artisan/biochar-applications/eligible-batches', {
    farm_id: farmId,
    mixing_id: mixingId,
  });
}

export async function submitArtisanBiocharApplication(payload: FormData) {
  return postApiData<{ record: ApiRecord }>('/artisan/biochar-applications', payload);
}

export async function getArtisanBiocharApplication(id: number | string) {
  return fetchApiData<{ record: ApiRecord }>(`/artisan/biochar-applications/${id}`);
}

export async function getArtisanBiocharBatchPreviewCodes(params?: Record<string, string | number | undefined>) {
  return fetchApiData('/artisan/biochar-production/next-codes', params);
}

export async function getArtisanBiocharProductionUnits() {
  return fetchApiData('/artisan/biochar-production/production-units');
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

export async function submitArtisanBiocharProduction(
  id: number | string,
  options?: { idempotencyKey?: string },
) {
  return postApiData(`/artisan/biochar-production/${id}/submit`, {
    idempotency_key: options?.idempotencyKey,
  });
}

export async function submitArtisanBiocharOfflinePackage(payload: FormData) {
  return postApiData('/artisan/biochar-production/offline-submit', payload);
}

export async function uploadArtisanBiocharProcessEvidence(id: number | string, payload: FormData) {
  return postApiData(`/artisan/biochar-process/${id}/evidence`, payload);
}

export async function uploadArtisanBiocharMoistureReading(id: number | string, payload: FormData) {
  return postApiData(`/artisan/biochar-process/${id}/moisture-readings`, payload);
}

export async function startArtisanBiocharPyrolysis(id: number | string) {
  return postApiData(`/artisan/biochar-production/${id}/start-pyrolysis`, {});
}

export async function finishArtisanBiocharPyrolysis(id: number | string) {
  return postApiData(`/artisan/biochar-production/${id}/finish-pyrolysis`, {});
}

export async function startArtisanBiocharQuenching(id: number | string) {
  return postApiData(`/artisan/biochar-production/${id}/start-quenching`, {});
}

export async function getArtisanBiocharMixingRecords(status?: 'draft' | 'submitted') {
  return fetchApiData('/artisan/biochar-mixing', status ? { status } : undefined);
}

export async function getArtisanBiocharMixingEligibleBatches(params: {
  farm_id?: number | string;
  farm_code?: string;
}) {
  return fetchApiData('/artisan/biochar-mixing/eligible-batches', params);
}

export async function getArtisanBiocharMixing(id: number | string) {
  return fetchApiData(`/artisan/biochar-mixing/${id}`);
}

export async function createArtisanBiocharMixing(payload: FormData) {
  return postApiData('/artisan/biochar-mixing', payload);
}

export async function completeArtisanBiocharMixing(payload: FormData) {
  return postApiData('/artisan/biochar-mixing/complete', payload);
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

export type ArtisanWorkCheckInPayload = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  gps_accuracy?: number | null;
  district_id: number;
  taluka_id: number;
  village_id: number;
  district_name?: string | null;
  taluka_name?: string | null;
  village_name?: string | null;
  state_id?: number | null;
  state_name?: string | null;
  farmer_id?: number | null;
  farm_id?: number | null;
  activity_context?: string | null;
  device_timestamp?: string | null;
  device_utc?: string | null;
  server_utc?: string | null;
  clock_skew_ms?: number | null;
  device_time_suspicious?: boolean | null;
  time_sync_source?: string | null;
  time_detection_at?: string | null;
  app_version?: string | null;
  battery_level?: number | null;
  notes?: string | null;
  user_id?: number | null;
  user_role?: string | null;
};

export type ArtisanWorkLiveLocationPayload = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  gps_accuracy?: number | null;
  activity_stage?: string | null;
  farmer_id?: number | null;
  farm_id?: number | null;
  batch_id?: number | null;
  source_screen?: string | null;
  district_id?: number | null;
  taluka_id?: number | null;
  village_id?: number | null;
  village_name?: string | null;
  district_name?: string | null;
  taluka_name?: string | null;
  state_name?: string | null;
  captured_at?: string | null;
};

export type ArtisanWorkCheckOutPayload = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  gps_accuracy?: number | null;
  notes?: string | null;
  device_timestamp?: string | null;
  device_utc?: string | null;
  server_utc?: string | null;
  clock_skew_ms?: number | null;
  device_time_suspicious?: boolean | null;
  time_sync_source?: string | null;
  time_detection_at?: string | null;
  activity_context?: string | null;
  user_id?: number | null;
  user_role?: string | null;
};

export async function getArtisanActiveCheckIn() {
  return fetchApiData<{ check_in_status: ApiRecord }>('/artisan/active-check-in');
}

export async function artisanWorkCheckIn(payload: ArtisanWorkCheckInPayload) {
  return postApiData<{ check_in: ApiRecord; resumed?: boolean }>('/artisan/check-in', payload);
}

export async function artisanWorkLiveLocation(payload: ArtisanWorkLiveLocationPayload) {
  return postApiData<{ check_in: ApiRecord; appended?: boolean }>('/artisan/live-location', payload);
}

export async function artisanWorkCheckOut(payload: ArtisanWorkCheckOutPayload) {
  return postApiData<{ check_in: ApiRecord | null; already_checked_out?: boolean }>(
    '/artisan/check-out',
    payload,
  );
}

export async function artisanWorkSessionBackground(payload: {
  app_state: 'background' | 'inactive';
}): Promise<void> {
  await postApiData('/artisan/session/background', payload);
}

export async function artisanWorkSessionExpire(payload: {
  checkout_reason: 'app_background' | 'app_closed' | 'stale_session_cleanup' | 'server_expiry';
}): Promise<{ check_in_status?: ApiRecord; check_in?: ApiRecord | null }> {
  return postApiData('/artisan/session/expire', payload);
}
