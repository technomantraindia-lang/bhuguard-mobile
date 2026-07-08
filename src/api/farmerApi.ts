import { fetchApiData, type ApiRecord } from '../utils/apiHelpers';

import { apiClient } from './client';
import { postApiData, putApiData, deleteApiData } from './postHelpers';

export { getNotifications as getFarmerNotifications, markNotificationRead, markAllNotificationsRead } from './notificationsApi';

export async function getFarmerProfile() {
  return fetchApiData<{ profile: Record<string, unknown> }>('/farmer/profile');
}

export async function updateFarmerProfile(payload: ApiRecord) {
  return putApiData('/farmer/profile', payload);
}

export async function updateFarmerProfilePhoto(formData: FormData) {
  return postApiData('/farmer/profile/photo', formData);
}

export async function removeFarmerProfilePhoto() {
  return putApiData('/farmer/profile/photo', { remove: true });
}

export async function updateFarmerProfilePassword(payload: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) {
  return putApiData('/farmer/profile/password', payload);
}

export async function updateFarmerProfileMpin(payload: {
  current_mpin: string;
  mpin: string;
  mpin_confirmation: string;
}) {
  return putApiData('/farmer/profile/mpin', payload);
}

export async function getFarmerDashboard() {
  return fetchApiData('/farmer/dashboard');
}

export async function getFarmerMyFarms() {
  return fetchApiData<{ farms: ApiRecord[] }>('/farmer/my-farms');
}

export async function getFarmerFarmActivities(status?: 'draft' | 'submitted') {
  return fetchApiData<{ farm_activities: ApiRecord[] }>('/farmer/farm-activities', status ? { status } : undefined);
}

export async function getFarmerFarmActivity(id: number | string) {
  return fetchApiData<{ farm_activity: ApiRecord }>(`/farmer/farm-activities/${id}`);
}

export async function saveFarmerFarmActivityDraft(formData: FormData) {
  return postApiData<{ farm_activity: ApiRecord }>('/farmer/farm-activities/save-draft', formData);
}

export async function submitFarmerFarmActivity(formData: FormData) {
  return postApiData<{ farm_activity: ApiRecord }>('/farmer/farm-activities/submit', formData);
}

export async function getFarmerFarms() {
  return fetchApiData('/farmer/farms');
}

export async function getFarmerFarmDetail(id: number | string) {
  return fetchApiData(`/farmer/farms/${id}`);
}

export async function createFarmerFarm(payload: ApiRecord) {
  return postApiData('/farmer/farms', payload);
}

export async function updateFarmerFarm(id: number | string, payload: ApiRecord) {
  return putApiData(`/farmer/farms/${id}`, payload);
}

export async function getFarmerFarmBoundary(id: number | string) {
  return fetchApiData(`/farmer/farms/${id}/boundary`);
}

export async function saveFarmerFarmMapping(id: number | string, payload: ApiRecord) {
  return postApiData(`/farmer/farms/${id}/mapping`, payload);
}

export async function getFarmerFarmMapping(id: number | string) {
  return fetchApiData(`/farmer/farms/${id}/mapping`);
}

export async function saveFarmerFarmBoundary(id: number | string, payload: ApiRecord) {
  return postApiData(`/farmer/farms/${id}/boundary`, payload);
}

export async function saveFarmerFarmBoundaryCameraCapture(id: number | string, formData: FormData) {
  return postApiData(`/farmer/farms/${id}/boundary/camera-capture`, formData);
}

export async function updateFarmerFarmBoundary(id: number | string, payload: ApiRecord) {
  return putApiData(`/farmer/farms/${id}/boundary`, payload);
}

export async function deleteFarmerFarmBoundaryPoint(farmId: number | string, pointId: number | string) {
  const response = await apiClient.delete(`/farmer/farms/${farmId}/boundary-point/${pointId}`);
  return response.data.data;
}

export async function getFarmerPlots() {
  return fetchApiData('/farmer/plots');
}

export async function getFarmerPlotDetail(id: number | string) {
  return fetchApiData(`/farmer/plots/${id}`);
}

export async function getFarmerWeeklyUpdates() {
  return fetchApiData('/farmer/weekly-updates');
}

export async function getFarmerWeeklyUpdateDetail(id: number | string) {
  return fetchApiData(`/farmer/weekly-updates/${id}`);
}

export async function createFarmerWeeklyUpdate(payload: ApiRecord) {
  return postApiData('/farmer/weekly-updates', payload);
}

export async function getFarmerServices() {
  return fetchApiData('/farmer/services');
}

export async function getFarmerServiceSubmissions() {
  return fetchApiData('/farmer/service-submissions');
}

export async function getFarmerServiceDetail(id: number | string) {
  return fetchApiData(`/farmer/services/${id}`);
}

export { getFarmerEvidence, uploadFarmerEvidence } from './evidenceApi';

export async function getFarmerActivityLogs(biocharOnly = true) {
  return fetchApiData('/farmer/activity-logs', { biochar_only: biocharOnly ? 1 : 0 });
}

export async function getFarmerActivityLogDetail(id: number | string) {
  return fetchApiData(`/farmer/activity-logs/${id}`);
}

export async function createFarmerActivityLog(payload: ApiRecord | FormData) {
  return postApiData('/farmer/activity-logs', payload);
}

export async function getFarmerBaselineAssessments() {
  return fetchApiData('/farmer/baseline-assessments');
}

export async function createFarmerBaselineAssessment(payload: ApiRecord) {
  return postApiData('/farmer/baseline-assessments', payload);
}

export async function getFarmerBaselineAssessmentDetail(id: number | string) {
  return fetchApiData(`/farmer/baseline-assessments/${id}`);
}

export async function getFarmerSoilSamples() {
  return fetchApiData('/farmer/soil-samples');
}

export async function getFarmerSoilSampleDetail(id: number | string) {
  return fetchApiData(`/farmer/soil-samples/${id}`);
}

export async function getFarmerVerificationStatus() {
  return fetchApiData('/farmer/verification-status');
}

export async function requestFarmerBaselineCorrection(payload: ApiRecord) {
  return postApiData('/farmer/baseline-correction-request', payload);
}

export async function getFarmerCarbonCalculations() {
  return fetchApiData('/farmer/carbon-calculations');
}

export async function getFarmerCarbonCalculationDetail(id: number | string) {
  return fetchApiData(`/farmer/carbon-calculations/${id}`);
}

export async function getFarmerFinalReports() {
  return fetchApiData('/farmer/final-reports');
}

export async function getFarmerFinalReportDetail(id: number | string) {
  return fetchApiData(`/farmer/final-reports/${id}`);
}

export async function downloadFarmerFinalReportFile(id: number | string) {
  return apiClient.get(`/farmer/final-reports/${id}/download`, {
    responseType: 'blob',
  });
}

export async function getFarmerRegenerativePractices() {
  return fetchApiData('/farmer/regenerative-practices');
}

export async function createFarmerRegenerativePractice(payload: ApiRecord) {
  return postApiData('/farmer/regenerative-practices', payload);
}

export async function getFarmerFeedstockCollections() {
  return fetchApiData('/farmer/feedstock-collections');
}

export async function createFarmerFeedstockCollection(payload: ApiRecord | FormData) {
  return postApiData('/farmer/feedstock-collections', payload);
}

export async function getFarmerBiocharFeedstock() {
  return fetchApiData('/farmer/biochar/feedstock');
}

export async function getFarmerBiocharBatches() {
  return fetchApiData('/farmer/biochar/batches');
}

export async function createFarmerBiocharBatch(payload: ApiRecord) {
  return postApiData('/farmer/biochar/batches', payload);
}

export async function getFarmerBiocharApplications() {
  return fetchApiData('/farmer/biochar/applications');
}

export async function createFarmerBiocharApplication(payload: ApiRecord) {
  return postApiData('/farmer/biochar/applications', payload);
}

export async function getFarmerAgroforestryPlantations() {
  return fetchApiData('/farmer/agroforestry/plantations');
}

export async function createFarmerAgroforestryPlantation(payload: ApiRecord) {
  return postApiData('/farmer/agroforestry/plantations', payload);
}

export async function getFarmerAgroforestryMonitoring() {
  return fetchApiData('/farmer/agroforestry/monitoring');
}

export async function createFarmerAgroforestryMonitoring(payload: ApiRecord) {
  return postApiData('/farmer/agroforestry/monitoring', payload);
}

export async function createFarmerCarbonEstimate(payload: ApiRecord) {
  return postApiData('/farmer/carbon-estimates', payload);
}

export async function getFarmerRegistryExports() {
  return fetchApiData('/farmer/registry-exports');
}

export async function createFarmerRegistryExport(payload: ApiRecord) {
  return postApiData('/farmer/registry-exports', payload);
}

export async function getFarmerSocialProfile() {
  return fetchApiData('/farmer/social-profile');
}

export async function updateFarmerSocialProfile(payload: ApiRecord) {
  return putApiData('/farmer/social-profile', payload);
}

export async function updateFarmerWeeklyUpdate(id: number | string, payload: ApiRecord) {
  return putApiData(`/farmer/weekly-updates/${id}`, payload);
}

export async function getFarmerBiocharUpdates() {
  return fetchApiData('/farmer/biochar-updates');
}

export async function createFarmerBiocharUpdate(payload: ApiRecord) {
  return postApiData('/farmer/biochar-updates', payload);
}

export async function getFarmerBiocharActivities(params?: Record<string, string | number | undefined>) {
  return fetchApiData('/farmer/biochar-activities', params);
}

export async function getFarmerBiocharBatchPreviewCodes() {
  return fetchApiData('/farmer/biochar/batches/next-codes');
}

export async function getFarmerBiocharActivity(id: number | string) {
  return fetchApiData(`/farmer/biochar-activities/${id}`);
}

export async function createFarmerBiocharActivity(payload: FormData) {
  return postApiData('/farmer/biochar-activities', payload);
}

export async function saveFarmerBiocharActivityDraft(id: number | string, payload: FormData) {
  return postApiData(`/farmer/biochar-activities/${id}/save-draft`, payload);
}

export async function submitFarmerBiocharActivity(id: number | string) {
  return postApiData(`/farmer/biochar-activities/${id}/submit`, {});
}

export async function getFarmerBiocharMixingRecords(params?: Record<string, string | number | undefined>) {
  return fetchApiData('/farmer/biochar-mixing', params);
}

export async function getFarmerBiocharMixing(id: number | string) {
  return fetchApiData(`/farmer/biochar-mixing/${id}`);
}

export async function createFarmerBiocharMixing(payload: FormData) {
  return postApiData('/farmer/biochar-mixing', payload);
}

export async function saveFarmerBiocharMixingDraft(id: number | string, payload: FormData) {
  return postApiData(`/farmer/biochar-mixing/${id}/save-draft`, payload);
}

export async function submitFarmerBiocharMixing(id: number | string) {
  return postApiData(`/farmer/biochar-mixing/${id}/submit`, {});
}

export async function getFarmerWallet() {
  return fetchApiData('/farmer/wallet');
}

export async function getFarmerWalletTransactions() {
  return fetchApiData('/farmer/wallet/transactions');
}

export async function getFarmerBankDetails() {
  return fetchApiData('/farmer/bank-details');
}

export async function saveFarmerBankDetails(payload: ApiRecord) {
  return postApiData('/farmer/bank-details', payload);
}

export async function createFarmerBiocharFeedstock(payload: ApiRecord | FormData) {
  return postApiData('/farmer/biochar/feedstock', payload);
}

export async function updateFarmerFarmMapping(id: number | string, payload: ApiRecord) {
  return putApiData(`/farmer/farms/${id}/mapping`, payload);
}

export async function saveFarmerFarmMappingCameraCapture(id: number | string, formData: FormData) {
  return postApiData(`/farmer/farms/${id}/mapping/camera-capture`, formData);
}

export async function deleteFarmerFarmMappingPoint(
  farmId: number | string,
  pointId: number | string,
) {
  return deleteApiData(`/farmer/farms/${farmId}/mapping/point/${pointId}`);
}

export async function getFarmerProfilePhotoUrl(): Promise<string> {
  const base = apiClient.defaults.baseURL ?? '';
  return `${base}/farmer/profile/photo`;
}

/** Task-spec aliases (prompt API names) */
export const getFarms = getFarmerFarms;
export const getFarmDetail = getFarmerFarmDetail;
export const createFarm = createFarmerFarm;
export const updateFarm = updateFarmerFarm;
export const getWeeklyUpdates = getFarmerWeeklyUpdates;
export const createWeeklyUpdate = createFarmerWeeklyUpdate;
export const getWeeklyUpdateDetail = getFarmerWeeklyUpdateDetail;
export const getFarmerReports = getFarmerFinalReports;

export async function getFarmerProfileDocuments() {
  return fetchApiData('/farmer/profile/documents');
}

export async function getFarmerSupportInfo() {
  return fetchApiData('/farmer/support');
}

export async function createFarmerServiceSubmission(payload: ApiRecord) {
  return postApiData('/farmer/service-submissions', payload);
}
