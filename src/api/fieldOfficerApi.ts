import type { AssignedFarmSearchRecord, AssignedLocationsPayload } from '../types/assignedLocations';
import type { ApiSuccessResponse } from '../types/auth';
import { fetchApiData, type ApiRecord } from '../utils/apiHelpers';

import { apiClient } from './client';
import { postApiData, putApiData, putFormData, deleteApiData } from './postHelpers';

export { getNotifications as getFieldOfficerNotifications, markNotificationRead, markAllNotificationsRead } from './notificationsApi';

export async function getFieldOfficerProfile() {
  return fetchApiData<{ user: Record<string, unknown> }>('/field-officer/profile');
}

export async function updateFieldOfficerProfilePhoto(formData: FormData) {
  return postApiData('/field-officer/profile/photo', formData);
}

export async function removeFieldOfficerProfilePhoto() {
  return putApiData('/field-officer/profile/photo', { remove: true });
}

export async function updateFieldOfficerProfileMpin(payload: {
  current_mpin: string;
  mpin: string;
  mpin_confirmation: string;
}) {
  return putApiData('/field-officer/profile/mpin', payload);
}

export async function getFieldOfficerDashboard(from?: string, to?: string) {
  return fetchApiData<{ dashboard: Record<string, unknown> }>('/field-officer/dashboard', {
    from,
    to,
  });
}

export async function getVisitCalendar(params?: {
  from?: string;
  to?: string;
  status?: 'upcoming' | 'completed' | 'cancelled' | 'all';
}) {
  return fetchApiData<{ visits: ApiRecord[] }>('/field-officer/visits/calendar', params);
}

export async function getVisitAssignments() {
  return fetchApiData('/field-officer/assignments');
}

export async function getFieldOfficerAllocatedLocations() {
  return fetchApiData<AssignedLocationsPayload>('/field-officer/allocated-locations');
}

export async function searchFieldOfficerFarms(params?: Record<string, string | number | undefined>) {
  const response = await apiClient.get<{
    success: boolean;
    message: string;
    data: AssignedFarmSearchRecord[];
    pagination: { page: number; limit: number; total: number };
  }>('/field-officer/farms/search', { params });

  return response.data;
}

export async function lookupFieldOfficerFarm(farmId: string | number) {
  return postApiData<{ farm: AssignedFarmSearchRecord }>('/field-officer/farm/lookup', {
    farm_id: String(farmId),
  });
}

export async function getFieldOfficerFarmers() {
  return fetchApiData('/field-officer/farmers');
}

export async function getFieldOfficerBiocharActivityDues(status: 'due' | 'overdue' | 'all' = 'all') {
  return fetchApiData<{
    counts: { due: number; overdue: number };
    items: ApiRecord[];
  }>('/field-officer/biochar-activity-dues', { status });
}

export async function getFieldOfficerFarmActivityDues(
  status: 'due' | 'overdue' | 'due_today' | 'due_soon' | 'in_progress' | 'all' = 'all',
) {
  return fetchApiData<{
    items: ApiRecord[];
    counts: {
      overdue: number;
      due_today: number;
      due_soon: number;
      in_progress: number;
      completed_today: number;
      total_actionable: number;
    };
    cycle_days: number;
    due_soon_days: number;
  }>('/field-officer/farm-activities/dues', { status });
}

export async function getFieldOfficerFarmActivityHistory(farmId: number | string) {
  return fetchApiData<{
    summary: ApiRecord;
    history: ApiRecord[];
  }>(`/field-officer/farms/${farmId}/farm-activities`);
}

export async function createFieldOfficerVisit(payload: ApiRecord) {
  return postApiData('/field-officer/visits', payload);
}

export async function updateVisit(assignmentId: number | string, payload: ApiRecord) {
  return putApiData(`/field-officer/visits/${assignmentId}`, payload);
}

export async function rescheduleVisit(assignmentId: number | string, payload: ApiRecord) {
  return postApiData(`/field-officer/visits/${assignmentId}/reschedule`, payload);
}

export async function cancelVisit(assignmentId: number | string, payload?: ApiRecord) {
  return postApiData(`/field-officer/visits/${assignmentId}/cancel`, payload ?? {});
}

export async function getBiocharReports(params?: Record<string, string | number | undefined>) {
  return fetchApiData<{ reports: ApiRecord[] }>('/field-officer/biochar-reports', params);
}

export async function getBiocharReport(reportId: number | string) {
  return fetchApiData<{ report: ApiRecord }>(`/field-officer/biochar-reports/${reportId}`);
}

export async function downloadBiocharReport(
  reportId: number | string,
  format: 'pdf' | 'csv' = 'pdf',
): Promise<ArrayBuffer> {
  const response = await apiClient.get<ArrayBuffer>(`/field-officer/biochar-reports/${reportId}/download`, {
    params: { format },
    responseType: 'arraybuffer',
  });

  return response.data;
}

export async function trackFieldOfficerActivity(payload: ApiRecord) {
  return postApiData('/field-officer/activity-tracks', payload);
}

export async function createFieldOfficerFarmerBiocharUpdate(payload: ApiRecord) {
  return postApiData('/field-officer/biochar-updates', payload);
}

export async function getFieldOfficerBiocharBatches(params?: Record<string, string | number | undefined>) {
  return fetchApiData('/field-officer/biochar/batches', params);
}

export async function getFieldOfficerBiocharBatch(id: number | string) {
  return fetchApiData(`/field-officer/biochar/batches/${id}`);
}

export async function updateFieldOfficerBiocharBatch(id: number | string, payload: ApiRecord | FormData) {
  if (payload instanceof FormData) {
    return putFormData(`/field-officer/biochar/batches/${id}`, payload);
  }

  return putApiData(`/field-officer/biochar/batches/${id}`, payload);
}

export async function saveFieldOfficerBiocharBatchDraft(id: number | string, payload: ApiRecord | FormData) {
  return postApiData(`/field-officer/biochar/batches/${id}/save-draft`, payload);
}

export async function submitFieldOfficerBiocharBatch(id: number | string) {
  return postApiData(`/field-officer/biochar/batches/${id}/submit`, {});
}

export async function getVisitAssignmentDetail(id: number | string) {
  return fetchApiData(`/field-officer/assignments/${id}`);
}

export async function acceptVisit(id: number | string) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/assignments/${id}/accept`,
  );
  return response.data.data;
}

export async function startVisit(id: number | string) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/assignments/${id}/start`,
  );
  return response.data.data;
}

export async function checkInVisit(id: number | string, payload: ApiRecord) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/assignments/${id}/check-in`,
    payload,
  );
  return response.data.data;
}

export async function getVisitGpsData(id: number | string) {
  return fetchApiData<ApiRecord>(`/field-officer/assignments/${id}/gps-data`);
}

/** @deprecated Use submitVisitCheckIn from checkInApi instead. */
export async function submitVisitGpsCheckIn(
  id: number | string,
  payload: ApiRecord,
  overridePhotoUri?: string,
) {
  const { submitVisitCheckIn, requestOutsideRadiusCheckIn } = await import('./checkInApi');

  const basePayload = {
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    accuracy: Number(payload.accuracy),
    captured_at: String(payload.gps_captured_at ?? payload.captured_at ?? new Date().toISOString()),
    distance_from_target: Number(payload.distance_from_target ?? payload.distance_from_farm_meter ?? 0),
    allowed_radius: Number(payload.allowed_radius ?? payload.allowed_radius_meter ?? 100),
  };

  const isOverride =
    payload.location_status === 'override_requested' ||
    payload.checkin_status === 'outside_radius_pending';

  if (isOverride) {
    return requestOutsideRadiusCheckIn(
      id,
      {
        ...basePayload,
        outside_radius_reason: String(
          payload.outside_radius_reason ?? payload.override_reason ?? 'Outside radius request',
        ),
      },
      overridePhotoUri,
    );
  }

  return submitVisitCheckIn(id, basePayload);
}

export async function startVerification(id: number | string) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/assignments/${id}/start-verification`,
  );
  return response.data.data;
}

export async function completeVisit(id: number | string) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/assignments/${id}/complete`,
  );
  return response.data.data;
}

export async function submitChecklist(id: number | string, payload: ApiRecord) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/assignments/${id}/checklist`,
    payload,
  );
  return response.data.data;
}

export {
  getAssignmentEvidence,
  uploadVisitEvidence,
  uploadVerificationEvidence,
} from './evidenceApi';

export async function submitVisitReport(id: number | string, payload: ApiRecord) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/assignments/${id}/submit-report`,
    payload,
  );
  return response.data.data;
}

export async function getFieldOfficerFarmerDetail(id: number | string) {
  return fetchApiData<{ farmer: ApiRecord }>(`/field-officer/farmers/${id}`);
}

export type FieldOfficerFarmerFarmOption = {
  id: number;
  farm_code?: string | null;
  village?: string | null;
  location_name?: string | null;
  mapping_status?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export async function getFieldOfficerFarmerFarms(farmerId: number | string) {
  return fetchApiData<FieldOfficerFarmerFarmOption[]>(`/field-officer/farmers/${farmerId}/farms`);
}

export async function getAssignmentChecklist(id: number | string) {
  return fetchApiData(`/field-officer/assignments/${id}/checklist`);
}

export async function getAssignmentReport(id: number | string) {
  return fetchApiData(`/field-officer/assignments/${id}/report`);
}

export async function getFieldOfficerReports() {
  return fetchApiData('/field-officer/reports');
}

export async function getFieldOfficerReportDetail(id: number | string) {
  return fetchApiData(`/field-officer/reports/${id}`);
}

export async function deleteFieldOfficerReportDraft(id: number | string) {
  const response = await apiClient.delete<ApiSuccessResponse<ApiRecord>>(`/field-officer/reports/${id}`);
  return response.data.data;
}

export async function getVerificationReports() {
  return getFieldOfficerReports();
}

export async function getVerificationReportDetail(id: number | string) {
  return getFieldOfficerReportDetail(id);
}

export async function getSoilSamples() {
  return fetchApiData('/field-officer/soil-samples');
}

export async function getBaselineAssessments() {
  return fetchApiData('/field-officer/baseline-assessments');
}

export async function getActivityLogs() {
  return fetchApiData('/field-officer/activity-logs');
}

export async function getMonitoringReports() {
  return fetchApiData('/field-officer/monitoring-reports');
}

export async function saveFieldOfficerFarmMapping(
  farmerId: number | string,
  farmId: number | string,
  payload: ApiRecord,
) {
  return postApiData(`/field-officer/farmers/${farmerId}/farms/${farmId}/mapping`, payload);
}

export async function getFieldOfficerFarmMapping(farmerId: number | string, farmId: number | string) {
  return fetchApiData(`/field-officer/farmers/${farmerId}/farms/${farmId}/mapping`);
}

export async function createFarmerOnboarding(formData: FormData): Promise<ApiRecord> {
  const response = await apiClient.post<ApiSuccessResponse<{ farmer: ApiRecord }>>(
    '/field-officer/farmers',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return response.data.data?.farmer ?? (response.data.data as unknown as ApiRecord);
}

/** Update FO-editable farmer profile fields when farmer_id already exists (Phase 10.11). */
export async function updateFieldOfficerFarmer(
  farmerId: number | string,
  payload: ApiRecord | FormData,
): Promise<ApiRecord> {
  if (payload instanceof FormData) {
    // Multipart PUT is unreliable in PHP; method-spoof via POST so files parse correctly.
    payload.append('_method', 'PUT');
    const response = await apiClient.post<ApiSuccessResponse<{ farmer: ApiRecord }>>(
      `/field-officer/farmers/${farmerId}`,
      payload,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data.data?.farmer ?? (response.data.data as unknown as ApiRecord);
  }

  const response = await putApiData<{ farmer: ApiRecord }>(
    `/field-officer/farmers/${farmerId}`,
    payload,
  );
  return response?.farmer ?? (response as unknown as ApiRecord);
}

/** Create an additional Farm for an existing Farmer (Phase 10.11). Does not create a Farmer. */
export async function createFieldOfficerFarmerFarm(
  farmerId: number | string,
  payload: ApiRecord,
): Promise<ApiRecord> {
  const response = await apiClient.post<ApiSuccessResponse<{ farm: ApiRecord }>>(
    `/field-officer/farmers/${farmerId}/farms`,
    payload,
  );

  return response.data.data?.farm ?? (response.data.data as unknown as ApiRecord);
}

export async function createFarmerPlot(farmerId: number | string, payload: ApiRecord) {
  return postApiData(`/field-officer/farmers/${farmerId}/plots`, payload);
}

export async function createOfficerActivityLog(payload: ApiRecord) {
  return postApiData('/field-officer/farmer-activity-logs', payload);
}

export async function createOfficerBaselineAssessment(payload: ApiRecord) {
  return postApiData('/field-officer/baseline-assessments', payload);
}

export async function createOfficerSoilSample(payload: ApiRecord) {
  return postApiData('/field-officer/soil-samples', payload);
}

export async function createOfficerMonitoringReport(payload: ApiRecord) {
  return postApiData('/field-officer/monitoring-reports', payload);
}

export async function getFeedstockVerifications() {
  return fetchApiData('/field-officer/feedstock-verifications');
}

export async function getFeedstockVerificationDetail(id: number | string) {
  return fetchApiData(`/field-officer/feedstock-verifications/${id}`);
}

export async function saveFeedstockVerificationDraft(id: number | string, payload: ApiRecord) {
  return postApiData(`/field-officer/feedstock-verifications/${id}/draft`, payload);
}

export async function submitFeedstockVerification(id: number | string, payload: ApiRecord) {
  return postApiData(`/field-officer/feedstock-verifications/${id}/submit`, payload);
}

export async function getBiocharProductionUnits() {
  return fetchApiData('/field-officer/biochar/production-units');
}

export async function getBiocharBatchPreviewCodes(params?: Record<string, string | number | undefined>) {
  return fetchApiData('/field-officer/biochar/batches/next-codes', params);
}

export async function createOfficerBiocharBatch(payload: FormData) {
  return postApiData('/field-officer/biochar/batches', payload);
}

export async function getOfficerFarmerBiocharMixingRecords(farmerId: number | string) {
  return fetchApiData(`/field-officer/farmers/${farmerId}/biochar-mixing`);
}

export async function getOfficerFarmerBiocharMixingEligibleBatches(
  farmerId: number | string,
  params: { farm_id?: number | string; farm_code?: string },
) {
  return fetchApiData(`/field-officer/farmers/${farmerId}/biochar-mixing/eligible-batches`, params);
}

export async function createOfficerFarmerBiocharMixing(farmerId: number | string, payload: FormData) {
  return postApiData(`/field-officer/farmers/${farmerId}/biochar-mixing`, payload);
}

export async function completeOfficerFarmerBiocharMixing(farmerId: number | string, payload: FormData) {
  return postApiData(`/field-officer/farmers/${farmerId}/biochar-mixing/complete`, payload);
}

export async function getOfficerBiocharMixing(id: number | string) {
  return fetchApiData(`/field-officer/biochar-mixing/${id}`);
}

export async function saveOfficerBiocharMixingDraft(id: number | string, payload: FormData) {
  return postApiData(`/field-officer/biochar-mixing/${id}/save-draft`, payload);
}

export async function submitOfficerBiocharMixing(id: number | string) {
  return postApiData(`/field-officer/biochar-mixing/${id}/submit`, {});
}

export async function getBiocharInventoryOptions(params?: {
  farm_id?: number | string;
  farmer_id?: number | string;
}) {
  return fetchApiData('/field-officer/biochar/inventory-movements/options', params);
}

export async function getBiocharInventoryMovementPreviewCode() {
  return fetchApiData('/field-officer/biochar/inventory-movements/next-code');
}

export async function createOfficerInventoryMovement(payload: FormData) {
  return postApiData('/field-officer/biochar/inventory-movements', payload);
}

export async function createOfficerInventoryUtilization(payload: FormData) {
  return postApiData('/field-officer/biochar/inventory-utilization', payload);
}

export async function getBiocharApplications(farmerId?: number) {
  return fetchApiData('/field-officer/biochar/applications', farmerId ? { farmer_id: farmerId } : undefined);
}

export async function getBiocharApplicationDetail(applicationId: number | string) {
  return fetchApiData(`/field-officer/biochar/applications/${applicationId}`);
}

export async function getBiocharApplicationForAssignment(assignmentId: number | string) {
  return fetchApiData(`/field-officer/assignments/${assignmentId}/biochar-application`);
}

export async function saveBiocharApplicationVerificationDraft(applicationId: number | string, payload: ApiRecord) {
  return postApiData(`/field-officer/biochar/applications/${applicationId}/verification/draft`, payload);
}

export async function submitBiocharApplicationVerification(applicationId: number | string, payload: ApiRecord) {
  return postApiData(`/field-officer/biochar/applications/${applicationId}/verification/submit`, payload);
}

export async function getEvidenceVerification(assignmentId: number | string) {
  return fetchApiData(`/field-officer/assignments/${assignmentId}/evidence-verification`);
}

export async function saveEvidenceVerificationDraft(assignmentId: number | string, payload: ApiRecord) {
  return postApiData(`/field-officer/assignments/${assignmentId}/evidence-verification/draft`, payload);
}

export async function submitEvidenceVerification(assignmentId: number | string, payload: ApiRecord) {
  return postApiData(`/field-officer/assignments/${assignmentId}/evidence-verification/submit`, payload);
}

export async function getInventoryVerificationTasks() {
  return fetchApiData('/field-officer/inventory-tasks');
}

export async function getInventoryVerificationTaskDetail(id: number | string) {
  return fetchApiData(`/field-officer/inventory-tasks/${id}`);
}

export async function saveInventoryStockVerification(id: number | string, payload: ApiRecord | FormData) {
  return postApiData(`/field-officer/inventory-tasks/${id}/stock-verification`, payload);
}

export async function saveInventoryStorageVerification(id: number | string, payload: ApiRecord | FormData) {
  return postApiData(`/field-officer/inventory-tasks/${id}/storage-verification`, payload);
}

export async function saveInventoryFarmDeliveryVerification(id: number | string, payload: ApiRecord | FormData) {
  return postApiData(`/field-officer/inventory-tasks/${id}/farm-delivery-verification`, payload);
}

export async function saveInventoryMovementVerification(id: number | string, payload: ApiRecord | FormData) {
  return postApiData(`/field-officer/inventory-tasks/${id}/movement-verification`, payload);
}

export async function uploadInventoryVerificationEvidence(id: number | string, formData: FormData) {
  return postApiData(`/field-officer/inventory-tasks/${id}/upload-evidence`, formData);
}

export async function submitInventoryVerificationReport(id: number | string, payload: ApiRecord) {
  return postApiData(`/field-officer/inventory-tasks/${id}/submit-report`, payload);
}

export async function getFieldOfficerProfilePhotoUrl(): Promise<string> {
  const base = apiClient.defaults.baseURL ?? '';
  return `${base}/field-officer/profile/photo`;
}

export async function getFieldOfficerGovernmentIdDocumentUrl(): Promise<string> {
  const base = apiClient.defaults.baseURL ?? '';
  return `${base}/field-officer/profile/documents/government-id`;
}

export async function getFieldOfficerAppointmentLetterDownloadUrl(): Promise<string> {
  const base = apiClient.defaults.baseURL ?? '';
  return `${base}/field-officer/profile/documents/appointment-letter/download`;
}

export async function getFieldOfficerFarmerPhotoUrl(farmerId: number | string): Promise<string> {
  const base = apiClient.defaults.baseURL ?? '';
  return `${base}/field-officer/farmers/${farmerId}/photo`;
}

export async function updateFieldOfficerFarmMapping(
  farmerId: number | string,
  farmId: number | string,
  payload: ApiRecord,
) {
  return putApiData(`/field-officer/farmers/${farmerId}/farms/${farmId}/mapping`, payload);
}

export async function saveFieldOfficerFarmMappingCameraCapture(
  farmerId: number | string,
  farmId: number | string,
  formData: FormData,
) {
  return postApiData(
    `/field-officer/farmers/${farmerId}/farms/${farmId}/mapping/camera-capture`,
    formData,
  );
}

export async function deleteFieldOfficerFarmMappingPoint(
  farmerId: number | string,
  farmId: number | string,
  pointId: number | string,
) {
  return deleteApiData(
    `/field-officer/farmers/${farmerId}/farms/${farmId}/mapping/point/${pointId}`,
  );
}

export async function createOfficerBiocharApplication(payload: ApiRecord | FormData) {
  return postApiData('/field-officer/biochar/applications', payload);
}

export async function searchOfficerBiocharApplicationFarms(query: string) {
  return fetchApiData('/field-officer/biochar-applications/search', { q: query });
}

export async function getOfficerBiocharApplicationEligibleBatches(
  farmId: number | string,
  mixingId?: number | string,
) {
  return fetchApiData('/field-officer/biochar-applications/eligible-batches', {
    farm_id: farmId,
    mixing_id: mixingId,
  });
}

export async function submitOfficerBiocharApplication(payload: FormData) {
  return postApiData('/field-officer/biochar-applications', payload);
}

export async function createOfficerBiocharQualityTest(
  batchId: number | string,
  payload: ApiRecord | FormData,
) {
  return postApiData(`/field-officer/biochar/batches/${batchId}/quality-tests`, payload);
}

export async function getOfficerArtisans(params?: {
  search?: string;
  status?: 'pending_approval' | 'active' | 'rejected' | 'inactive';
  per_page?: number;
}) {
  return fetchApiData<{ artisans: ApiRecord[]; meta?: ApiRecord }>('/field-officer/artisans', params);
}

export async function getOfficerArtisan(id: number | string) {
  return fetchApiData<{ artisan: ApiRecord }>(`/field-officer/artisans/${id}`);
}

export async function createOfficerArtisan(payload: FormData | ApiRecord) {
  return postApiData<{ artisan: ApiRecord }>('/field-officer/artisans', payload);
}

export async function updateOfficerArtisanWorkingVillages(
  artisanId: number | string,
  payload: { working_village_ids: number[]; working_taluka_id?: number },
) {
  return putApiData<{ artisan: ApiRecord }>(`/field-officer/artisans/${artisanId}/working-villages`, payload);
}

export async function getOfficerArtisanBiocharBatches(params?: {
  from_date?: string;
  to_date?: string;
  from?: string;
  to?: string;
  search?: string;
  /** @deprecated Status filter removed from FO Artisan Biochar Batches UI. Optional for older callers. */
  status?: string;
  statuses?: string[];
}) {
  return fetchApiData<{ batches: ApiRecord[]; meta?: ApiRecord }>('/field-officer/artisan-biochar-batches', params);
}

export async function createOfficerRegenerativePractice(payload: ApiRecord | FormData) {
  return postApiData('/field-officer/regenerative-practices', payload);
}

export async function createOfficerFeedstockCollection(payload: ApiRecord | FormData) {
  return postApiData('/field-officer/feedstock-collections', payload);
}

export async function createOfficerAgroforestryPlantation(payload: ApiRecord | FormData) {
  return postApiData('/field-officer/agroforestry/plantations', payload);
}

export async function createOfficerAgroforestryMonitoring(payload: ApiRecord | FormData) {
  return postApiData('/field-officer/agroforestry/monitoring', payload);
}

export async function getFeedstockVerificationsList() {
  return getFeedstockVerifications();
}

export async function getFieldOfficerCheckInStatus() {
  return fetchApiData('/field-officer/check-in/status');
}

export async function fieldOfficerLiveCheckIn(payload: ApiRecord) {
  return postApiData('/field-officer/check-in', payload);
}

export async function fieldOfficerLiveCheckOut(payload: ApiRecord) {
  return postApiData('/field-officer/live-check-out', payload);
}

export async function startVisitRecord(payload: ApiRecord) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>('/field-officer/visits/start', payload);
  return response.data.data?.visit ?? response.data.data;
}

export async function visitRecordCheckIn(payload: ApiRecord) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>('/field-officer/visits/check-in', payload);
  return response.data.data?.visit ?? response.data.data;
}

export async function saveVisitFarmerDetails(payload: ApiRecord) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    '/field-officer/visits/farmer-details',
    payload,
  );
  return response.data.data?.visit ?? response.data.data;
}

export async function saveVisitMobileNetworkVerification(payload: ApiRecord) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    '/field-officer/visits/mobile-network-verification',
    payload,
  );
  return response.data.data?.visit ?? response.data.data;
}

export async function visitRecordReview(assignmentId: number | string) {
  return fetchApiData(`/field-officer/visits/${assignmentId}/review`);
}

export async function submitVisitVerification(assignmentId: number | string) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/visits/${assignmentId}/submit-verification`,
    {},
  );
  return response.data.data?.visit ?? response.data.data;
}

export async function approveVisitVerification(assignmentId: number | string, payload: ApiRecord = {}) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/visits/${assignmentId}/approve`,
    payload,
  );
  return response.data.data?.visit ?? response.data.data;
}

export async function sendOnboardingAgreementOtp(mobile: string) {
  return postApiData<{
    mobile: string;
    masked_mobile: string;
    message: string;
    resend_after_seconds: number;
    dev_otp?: string | null;
  }>('/field-officer/onboard-farmer/agreement-otp/send', { mobile });
}

export async function verifyOnboardingAgreementOtp(mobile: string, otp: string) {
  return postApiData<{
    verified: boolean;
    agreement_verification_token: string;
    verified_mobile: string;
    masked_mobile: string;
    verified_at: string;
  }>('/field-officer/onboard-farmer/agreement-otp/verify', { mobile, otp });
}

export async function saveOnboardingBasicDetails(payload: ApiRecord) {
  return postApiData('/field-officer/onboard-farmer/basic-details', payload);
}

export async function saveOnboardingLocationData(payload: ApiRecord) {
  return postApiData('/field-officer/onboard-farmer/location-data', payload);
}

export async function getOnboardingConsentLegal() {
  return fetchApiData('/field-officer/onboard-farmer/consent-legal');
}

export async function acceptOnboardingConsent(payload: ApiRecord) {
  return postApiData('/field-officer/onboard-farmer/consent-accept', payload);
}

export async function saveOnboardingLandRegistration(payload: ApiRecord) {
  return postApiData('/field-officer/onboard-farmer/land-registration', payload);
}

export async function saveOnboardingLandBoundary(payload: ApiRecord) {
  return postApiData('/field-officer/onboard-farmer/land-boundary', payload);
}

export async function saveOnboardingDocuments(payload: ApiRecord) {
  return postApiData('/field-officer/onboard-farmer/documents', payload);
}

export async function getOnboardingReview(onboardingId: number | string) {
  return fetchApiData(`/field-officer/onboard-farmer/${onboardingId}/review`);
}

export async function submitOnboardingForApproval(onboardingId: number | string) {
  return postApiData(`/field-officer/onboard-farmer/${onboardingId}/submit`, {});
}

export async function recordFarmerBiocharExplanation(farmerId: number | string, payload: ApiRecord) {
  return postApiData(`/field-officer/farmers/${farmerId}/biochar-explained`, payload);
}

export async function getFarmerBiocharActivitiesForOfficer(farmerId: number | string) {
  return fetchApiData(`/field-officer/farmers/${farmerId}/biochar-activities`);
}

export async function startFarmVerificationActivity(payload: ApiRecord) {
  return postApiData('/field-officer/farm-verification-activities/start', payload);
}

export async function checkInFarmVerificationActivity(activityId: number | string, payload: ApiRecord) {
  return postApiData(`/field-officer/farm-verification-activities/${activityId}/check-in`, payload);
}

export async function validateFarmVerificationFarmId(activityId: number | string, farmCode: string) {
  return postApiData(`/field-officer/farm-verification-activities/${activityId}/validate-farm-id`, { farm_code: farmCode });
}

export async function verifyFarmVerificationActivity(activityId: number | string, formData: FormData) {
  return postApiData(`/field-officer/farm-verification-activities/${activityId}/verify-farm`, formData);
}

export async function uploadFarmVerificationEvidence(activityId: number | string, formData: FormData) {
  return postApiData(`/field-officer/farm-verification-activities/${activityId}/evidence`, formData);
}

export async function submitFarmVerificationActivity(activityId: number | string) {
  return postApiData(`/field-officer/farm-verification-activities/${activityId}/submit`, {});
}

export async function getFarmVerificationActivity(activityId: number | string) {
  return fetchApiData(`/field-officer/farm-verification-activities/${activityId}`);
}

export async function startBiocharFarmActivity(payload: ApiRecord) {
  return postApiData('/field-officer/biochar-farm-activities/start', payload);
}

export async function checkInBiocharFarmActivity(activityId: number | string, payload: ApiRecord) {
  return postApiData(`/field-officer/biochar-farm-activities/${activityId}/check-in`, payload);
}

export async function verifyBiocharFarmActivity(activityId: number | string, formData: FormData) {
  return postApiData(`/field-officer/biochar-farm-activities/${activityId}/verify-farm`, formData);
}

export async function uploadBiocharFarmActivityEvidence(activityId: number | string, formData: FormData) {
  return postApiData(`/field-officer/biochar-farm-activities/${activityId}/evidence`, formData);
}

export async function submitBiocharFarmActivity(activityId: number | string) {
  return postApiData(`/field-officer/biochar-farm-activities/${activityId}/submit`, {});
}

export async function getBiocharFarmActivity(activityId: number | string) {
  return fetchApiData(`/field-officer/biochar-farm-activities/${activityId}`);
}

/** Task-spec aliases */
export const getOfficerDashboard = getFieldOfficerDashboard;
export const getAssignedVisits = getVisitAssignments;
export const getVisitDetail = getVisitAssignmentDetail;
export const getVerificationChecklist = getAssignmentChecklist;
export const submitVerificationChecklist = submitChecklist;
export const submitVerificationReport = submitVisitReport;
export const getOfficerReports = getFieldOfficerReports;
export const getOfficerProfile = getFieldOfficerProfile;
