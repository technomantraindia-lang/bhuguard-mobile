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

export async function getFieldOfficerDashboard() {
  return fetchApiData<{ dashboard: Record<string, unknown> }>('/field-officer/dashboard');
}

export async function getVisitAssignments() {
  return fetchApiData('/field-officer/assignments');
}

export async function getFieldOfficerFarmers() {
  return fetchApiData('/field-officer/farmers');
}

export async function createFieldOfficerVisit(payload: ApiRecord) {
  return postApiData('/field-officer/visits', payload);
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

export async function getBiocharBatchPreviewCodes() {
  return fetchApiData('/field-officer/biochar/batches/next-codes');
}

export async function createOfficerBiocharBatch(payload: FormData) {
  return postApiData('/field-officer/biochar/batches', payload);
}

export async function getOfficerFarmerBiocharMixingRecords(farmerId: number | string) {
  return fetchApiData(`/field-officer/farmers/${farmerId}/biochar-mixing`);
}

export async function createOfficerFarmerBiocharMixing(farmerId: number | string, payload: FormData) {
  return postApiData(`/field-officer/farmers/${farmerId}/biochar-mixing`, payload);
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

export async function getBiocharInventoryOptions() {
  return fetchApiData('/field-officer/biochar/inventory-movements/options');
}

export async function getBiocharInventoryMovementPreviewCode() {
  return fetchApiData('/field-officer/biochar/inventory-movements/next-code');
}

export async function createOfficerInventoryMovement(payload: FormData) {
  return postApiData('/field-officer/biochar/inventory-movements', payload);
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

export async function createOfficerBiocharQualityTest(
  batchId: number | string,
  payload: ApiRecord | FormData,
) {
  return postApiData(`/field-officer/biochar/batches/${batchId}/quality-tests`, payload);
}

export async function createOfficerArtisan(payload: ApiRecord) {
  return postApiData('/field-officer/artisans', payload);
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
  return postApiData('/field-officer/check-out', payload);
}

export async function recordFarmerBiocharExplanation(farmerId: number | string, payload: ApiRecord) {
  return postApiData(`/field-officer/farmers/${farmerId}/biochar-explained`, payload);
}

export async function getFarmerBiocharActivitiesForOfficer(farmerId: number | string) {
  return fetchApiData(`/field-officer/farmers/${farmerId}/biochar-activities`);
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
