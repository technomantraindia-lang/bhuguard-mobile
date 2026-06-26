import type { VerificationResult } from '../constants/feedstockVerificationChecklist';
import {
  defaultSectionItems,
  MRV_APPLICATION_CHECKLIST,
  MRV_FARM_CHECKLIST,
  MRV_FEEDSTOCK_CHECKLIST,
  MRV_INVENTORY_CHECKLIST,
  MRV_PRODUCTION_CHECKLIST,
  MRV_PROGRESS_STEPS,
  type EvidenceReviewStatus,
  type GpsVerificationStatus,
  type MrvSectionKey,
} from '../constants/mrvVerificationChecklist';
import { haversineMeters } from './boundaryGeometry';
import { extractList, pickNestedString, pickString, type ApiRecord } from './apiHelpers';
import { buildVisitDetailModel } from './visitDetailModel';

export interface MrvSectionState {
  items: Record<string, boolean>;
  remarks: string;
}

export interface MrvEvidenceSummary {
  feedstockPhotos: number;
  productionPhotos: number;
  applicationPhotos: number;
  gpsRecords: number;
  documents: number;
  status: EvidenceReviewStatus;
}

export interface MrvGpsState {
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  distanceFromFarmKm: number | null;
  checkInTime: string | null;
  status: GpsVerificationStatus;
}

export interface MrvVerificationState {
  gps: MrvGpsState;
  farm: MrvSectionState;
  feedstock: MrvSectionState;
  production: MrvSectionState;
  application: MrvSectionState;
  inventory: MrvSectionState;
  evidence: MrvEvidenceSummary;
  signatures: {
    farmerCaptured: boolean;
    officerCaptured: boolean;
    farmerSignatureUrl: string | null;
    officerSignatureUrl: string | null;
  };
  verificationResult: VerificationResult;
  finalRemarks: string;
  mrvReportGenerated: boolean;
}

export interface MrvVerificationViewModel {
  visitId: string;
  verificationId: string;
  farmerName: string;
  farmerId: string;
  farmName: string;
  projectName: string;
  verificationDateLabel: string;
  officerName: string;
  statusLabel: string;
  statusKey: string;
  farmLatitude: number | null;
  farmLongitude: number | null;
}

const SECTION_DEFS: Record<MrvSectionKey, typeof MRV_FARM_CHECKLIST> = {
  farm: MRV_FARM_CHECKLIST,
  feedstock: MRV_FEEDSTOCK_CHECKLIST,
  production: MRV_PRODUCTION_CHECKLIST,
  application: MRV_APPLICATION_CHECKLIST,
  inventory: MRV_INVENTORY_CHECKLIST,
};

function readNumber(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function readSection(raw: unknown, defs: typeof MRV_FARM_CHECKLIST): MrvSectionState {
  const record = raw && typeof raw === 'object' ? (raw as ApiRecord) : {};
  const itemsRaw = record.items && typeof record.items === 'object' ? (record.items as ApiRecord) : {};
  const defaults = defaultSectionItems(defs);
  const items = { ...defaults };

  for (const def of defs) {
    if (typeof itemsRaw[def.key] === 'boolean') {
      items[def.key] = itemsRaw[def.key] as boolean;
    }
  }

  return {
    items,
    remarks: typeof record.remarks === 'string' ? record.remarks : '',
  };
}

function countEvidenceByCategory(evidence: ApiRecord[], matchers: string[]): number {
  return evidence.filter((item) => {
    const category = pickString(item, 'category', 'evidence_category', 'type').toLowerCase();

    return matchers.some((matcher) => category.includes(matcher));
  }).length;
}

export function summarizeEvidenceFromAssignment(assignment: ApiRecord): MrvEvidenceSummary {
  const evidence = extractList(assignment, ['evidence_uploads', 'evidenceUploads']);
  const gpsRecords = evidence.filter(
    (item) => readNumber(item.latitude) != null && readNumber(item.longitude) != null,
  ).length;

  return {
    feedstockPhotos: countEvidenceByCategory(evidence, ['feedstock', 'collection']),
    productionPhotos: countEvidenceByCategory(evidence, ['production', 'biochar', 'kiln']),
    applicationPhotos: countEvidenceByCategory(evidence, ['application', 'plot', 'before', 'after']),
    gpsRecords: gpsRecords || (readNumber(assignment.check_in_latitude) != null ? 1 : 0),
    documents: countEvidenceByCategory(evidence, ['document', 'slip', 'pdf']),
    status: 'pending',
  };
}

export function createDefaultMrvState(assignment: ApiRecord): MrvVerificationState {
  const checkInLat = readNumber(assignment.check_in_latitude);
  const checkInLng = readNumber(assignment.check_in_longitude);
  const farmLat = readNumber(pickNestedString(assignment, 'farm.latitude'));
  const farmLng = readNumber(pickNestedString(assignment, 'farm.longitude'));

  let distanceFromFarmKm: number | null = null;

  if (checkInLat != null && checkInLng != null && farmLat != null && farmLng != null) {
    distanceFromFarmKm = haversineMeters(checkInLat, checkInLng, farmLat, farmLng) / 1000;
  }

  const checkedIn = checkInLat != null && checkInLng != null;
  const checkInTime =
    pickString(assignment, 'checked_in_at', 'check_in_at') !== '-'
      ? pickString(assignment, 'checked_in_at', 'check_in_at')
      : null;

  return {
    gps: {
      latitude: checkInLat,
      longitude: checkInLng,
      accuracyM: null,
      distanceFromFarmKm,
      checkInTime,
      status: checkedIn ? 'verified' : 'pending',
    },
    farm: { items: defaultSectionItems(MRV_FARM_CHECKLIST), remarks: '' },
    feedstock: { items: defaultSectionItems(MRV_FEEDSTOCK_CHECKLIST), remarks: '' },
    production: { items: defaultSectionItems(MRV_PRODUCTION_CHECKLIST), remarks: '' },
    application: { items: defaultSectionItems(MRV_APPLICATION_CHECKLIST), remarks: '' },
    inventory: { items: defaultSectionItems(MRV_INVENTORY_CHECKLIST), remarks: '' },
    evidence: summarizeEvidenceFromAssignment(assignment),
    signatures: { farmerCaptured: false, officerCaptured: false, farmerSignatureUrl: null, officerSignatureUrl: null },
    verificationResult: null,
    finalRemarks: '',
    mrvReportGenerated: false,
  };
}

export function parseMrvVerificationState(
  assignment: ApiRecord,
  checklist: ApiRecord | null,
): MrvVerificationState {
  const defaults = createDefaultMrvState(assignment);
  const observed =
    checklist?.observed_values && typeof checklist.observed_values === 'object'
      ? (checklist.observed_values as ApiRecord)
      : null;

  if (!observed) {
    if (checklist) {
      const checklistData =
        checklist.checklist_data && typeof checklist.checklist_data === 'object'
          ? (checklist.checklist_data as ApiRecord)
          : ({} as ApiRecord);
      defaults.farm.items.farm_exists = checklistData.farm_location_verified === true;
      defaults.farm.items.land_area_verified = checklistData.farm_area_verified === true;
      defaults.signatures.farmerCaptured = checklist.farmer_confirmation === true;
      defaults.finalRemarks = typeof checklist.officer_notes === 'string' ? checklist.officer_notes : '';
    }

    return defaults;
  }

  const farmVerification =
    observed.farm_verification && typeof observed.farm_verification === 'object'
      ? (observed.farm_verification as ApiRecord)
      : null;

  if (farmVerification) {
    const existence =
      farmVerification.existence && typeof farmVerification.existence === 'object'
        ? (farmVerification.existence as ApiRecord)
        : null;
    const landArea =
      farmVerification.land_area && typeof farmVerification.land_area === 'object'
        ? (farmVerification.land_area as ApiRecord)
        : null;
    const crop =
      farmVerification.crop && typeof farmVerification.crop === 'object'
        ? (farmVerification.crop as ApiRecord)
        : null;

    if (existence?.items && typeof existence.items === 'object') {
      const items = existence.items as ApiRecord;
      defaults.farm.items.farm_exists = items.farm_exists_physically === true;
    }

    if (landArea?.items && typeof landArea.items === 'object') {
      const items = landArea.items as ApiRecord;
      defaults.farm.items.land_area_verified = items.land_area_matches === true;
    }

    if (crop?.items && typeof crop.items === 'object') {
      const items = crop.items as ApiRecord;
      defaults.farm.items.crop_details_verified = items.crop_type_correct === true;
    }
  }

  const gps = observed.gps && typeof observed.gps === 'object' ? (observed.gps as ApiRecord) : {};
  const evidence =
    observed.evidence && typeof observed.evidence === 'object' ? (observed.evidence as ApiRecord) : {};
  const signatures =
    observed.signatures && typeof observed.signatures === 'object' ? (observed.signatures as ApiRecord) : {};

  return {
    gps: {
      latitude: readNumber(gps.latitude) ?? defaults.gps.latitude,
      longitude: readNumber(gps.longitude) ?? defaults.gps.longitude,
      accuracyM: readNumber(gps.accuracy_m ?? gps.accuracyM),
      distanceFromFarmKm: readNumber(gps.distance_from_farm_km ?? gps.distanceFromFarmKm) ?? defaults.gps.distanceFromFarmKm,
      checkInTime:
        typeof gps.check_in_time === 'string'
          ? gps.check_in_time
          : typeof gps.checkInTime === 'string'
            ? gps.checkInTime
            : defaults.gps.checkInTime,
      status:
        gps.status === 'verified' || gps.status === 'failed' || gps.status === 'pending'
          ? gps.status
          : defaults.gps.status,
    },
    farm: readSection(observed.farm, MRV_FARM_CHECKLIST),
    feedstock: readSection(observed.feedstock, MRV_FEEDSTOCK_CHECKLIST),
    production: readSection(observed.production, MRV_PRODUCTION_CHECKLIST),
    application: readSection(observed.application, MRV_APPLICATION_CHECKLIST),
    inventory: readSection(observed.inventory, MRV_INVENTORY_CHECKLIST),
    evidence: {
      feedstockPhotos: readNumber(evidence.feedstock_photos ?? evidence.feedstockPhotos) ?? defaults.evidence.feedstockPhotos,
      productionPhotos: readNumber(evidence.production_photos ?? evidence.productionPhotos) ?? defaults.evidence.productionPhotos,
      applicationPhotos: readNumber(evidence.application_photos ?? evidence.applicationPhotos) ?? defaults.evidence.applicationPhotos,
      gpsRecords: readNumber(evidence.gps_records ?? evidence.gpsRecords) ?? defaults.evidence.gpsRecords,
      documents: readNumber(evidence.documents) ?? defaults.evidence.documents,
      status:
        evidence.status === 'approved' || evidence.status === 'rejected' || evidence.status === 'pending'
          ? evidence.status
          : defaults.evidence.status,
    },
    signatures: {
      farmerCaptured: signatures.farmer_captured === true || signatures.farmerCaptured === true,
      officerCaptured: signatures.officer_captured === true || signatures.officerCaptured === true,
      farmerSignatureUrl:
        typeof signatures.farmer_signature_url === 'string'
          ? signatures.farmer_signature_url
          : typeof signatures.farmerSignatureUrl === 'string'
            ? signatures.farmerSignatureUrl
            : null,
      officerSignatureUrl:
        typeof signatures.officer_signature_url === 'string'
          ? signatures.officer_signature_url
          : typeof signatures.officerSignatureUrl === 'string'
            ? signatures.officerSignatureUrl
            : null,
    },
    verificationResult:
      observed.verification_result === 'approved' ||
      observed.verification_result === 'approved_with_remarks' ||
      observed.verification_result === 'correction_required' ||
      observed.verification_result === 'rejected'
        ? observed.verification_result
        : observed.verificationResult === 'approved' ||
            observed.verificationResult === 'approved_with_remarks' ||
            observed.verificationResult === 'correction_required' ||
            observed.verificationResult === 'rejected'
          ? observed.verificationResult
          : null,
    finalRemarks:
      typeof observed.final_remarks === 'string'
        ? observed.final_remarks
        : typeof observed.finalRemarks === 'string'
          ? observed.finalRemarks
          : typeof checklist?.officer_notes === 'string'
            ? checklist.officer_notes
            : '',
    mrvReportGenerated: observed.mrv_report_generated === true || observed.mrvReportGenerated === true,
  };
}

export function buildMrvViewModel(
  assignment: ApiRecord,
  assignmentId: number,
  officerName: string,
): MrvVerificationViewModel {
  const detail = buildVisitDetailModel(assignment, assignmentId);
  const checklist = assignment.verification_checklist ?? assignment.checklist;
  const checklistId =
    checklist && typeof checklist === 'object' ? pickString(checklist as ApiRecord, 'id') : '-';

  const status = pickString(assignment, 'assignment_status', 'status').toLowerCase();
  const statusKey =
    status === 'verification_in_progress' || status === 'checked_in' ? 'pending' : status || 'pending';

  return {
    visitId: detail.assignmentCode,
    verificationId:
      checklistId !== '-'
        ? `BHG-VRF-${String(checklistId).padStart(6, '0')}`
        : `BHG-VRF-${String(assignmentId).padStart(6, '0')}`,
    farmerName: detail.farmerName,
    farmerId: detail.farmerId,
    farmName: detail.farmName,
    projectName: detail.projectName.includes('Biochar') ? detail.projectName : 'Biochar',
    verificationDateLabel: detail.scheduledLabel,
    officerName,
    statusLabel: statusKey === 'pending' ? 'Pending Verification' : detail.statusBadge,
    statusKey,
    farmLatitude: readNumber(pickNestedString(assignment, 'farm.latitude')),
    farmLongitude: readNumber(pickNestedString(assignment, 'farm.longitude')),
  };
}

export function enrichMrvStateFromAssignmentEvidence(
  state: MrvVerificationState,
  assignment: ApiRecord,
): MrvVerificationState {
  const evidence = extractList(assignment, ['evidence_uploads', 'evidenceUploads']);
  let farmerCaptured = state.signatures.farmerCaptured;
  let officerCaptured = state.signatures.officerCaptured;
  let farmerSignatureUrl = state.signatures.farmerSignatureUrl;
  let officerSignatureUrl = state.signatures.officerSignatureUrl;

  for (const item of evidence) {
    const category = pickString(item, 'category', 'evidence_category', 'type').toLowerCase();
    const fileUrl = pickString(item, 'file_url', 'url', 'download_url');

    if (category.includes('farmer_signature')) {
      farmerCaptured = true;

      if (fileUrl !== '-') {
        farmerSignatureUrl = fileUrl;
      }
    }

    if (category.includes('officer_signature')) {
      officerCaptured = true;

      if (fileUrl !== '-') {
        officerSignatureUrl = fileUrl;
      }
    }
  }

  return {
    ...state,
    signatures: {
      farmerCaptured,
      officerCaptured,
      farmerSignatureUrl,
      officerSignatureUrl,
    },
  };
}

function isSectionComplete(section: MrvSectionState, key: MrvSectionKey): boolean {
  return SECTION_DEFS[key].every((item) => section.items[item.key] === true);
}

export function isMrvProgressStepComplete(state: MrvVerificationState, stepKey: string): boolean {
  switch (stepKey) {
    case 'gps_check_in':
      return state.gps.status === 'verified';
    case 'farm_verification':
      return isSectionComplete(state.farm, 'farm');
    case 'feedstock_verification':
      return isSectionComplete(state.feedstock, 'feedstock');
    case 'production_verification':
      return isSectionComplete(state.production, 'production');
    case 'application_verification':
      return isSectionComplete(state.application, 'application');
    case 'inventory_verification':
      return isSectionComplete(state.inventory, 'inventory');
    case 'evidence_verification':
      return state.evidence.status === 'approved';
    case 'signatures':
      return state.signatures.farmerCaptured && state.signatures.officerCaptured;
    default:
      return false;
  }
}

export function calculateMrvCompletionPercent(state: MrvVerificationState): number {
  const completed = MRV_PROGRESS_STEPS.filter((step) => isMrvProgressStepComplete(state, step.key)).length;

  return Math.round((completed / MRV_PROGRESS_STEPS.length) * 100);
}

export function canGenerateMrvReport(state: MrvVerificationState): boolean {
  return (
    state.gps.status === 'verified' &&
    isSectionComplete(state.farm, 'farm') &&
    isSectionComplete(state.feedstock, 'feedstock') &&
    state.evidence.status === 'approved' &&
    state.signatures.farmerCaptured &&
    state.signatures.officerCaptured
  );
}

export function mrvReportBlockers(state: MrvVerificationState): string[] {
  const blockers: string[] = [];

  if (state.gps.status !== 'verified') {
    blockers.push('GPS check-in must be verified');
  }

  if (!isSectionComplete(state.farm, 'farm')) {
    blockers.push('Farm verification checklist must be complete');
  }

  if (!isSectionComplete(state.feedstock, 'feedstock')) {
    blockers.push('Feedstock verification checklist must be complete');
  }

  if (state.evidence.status !== 'approved') {
    blockers.push('Evidence must be approved');
  }

  if (!state.signatures.farmerCaptured) {
    blockers.push('Farmer signature is required');
  }

  if (!state.signatures.officerCaptured) {
    blockers.push('Officer signature is required');
  }

  return blockers;
}

export function canSubmitForApproval(state: MrvVerificationState): boolean {
  return state.mrvReportGenerated;
}

export function buildMrvChecklistPayload(state: MrvVerificationState, submit: boolean): ApiRecord {
  const correctionRequired = state.verificationResult === 'correction_required';

  return {
    farm_location_verified: state.gps.status === 'verified' && state.farm.items.farm_exists === true,
    farm_area_verified: state.farm.items.land_area_verified === true,
    weekly_activity_evidence_checked: state.evidence.status === 'approved',
    farmer_confirmation: state.signatures.farmerCaptured,
    site_location_verified: null,
    site_activity_verified: null,
    waste_processing_verified: null,
    industrial_data_checked: null,
    biochar_batch_verified: state.production.items.batch_id_verified === true,
    correction_required: correctionRequired,
    correction_notes: correctionRequired ? state.finalRemarks || 'Correction required during MRV verification.' : null,
    officer_notes: state.finalRemarks || null,
    observed_values: {
      gps: {
        latitude: state.gps.latitude,
        longitude: state.gps.longitude,
        accuracy_m: state.gps.accuracyM,
        distance_from_farm_km: state.gps.distanceFromFarmKm,
        check_in_time: state.gps.checkInTime,
        status: state.gps.status,
      },
      farm: state.farm,
      feedstock: state.feedstock,
      production: state.production,
      application: state.application,
      inventory: state.inventory,
      evidence: {
        feedstock_photos: state.evidence.feedstockPhotos,
        production_photos: state.evidence.productionPhotos,
        application_photos: state.evidence.applicationPhotos,
        gps_records: state.evidence.gpsRecords,
        documents: state.evidence.documents,
        status: state.evidence.status,
      },
      signatures: {
        farmer_captured: state.signatures.farmerCaptured,
        officer_captured: state.signatures.officerCaptured,
        farmer_signature_url: state.signatures.farmerSignatureUrl,
        officer_signature_url: state.signatures.officerSignatureUrl,
      },
      verification_result: state.verificationResult,
      final_remarks: state.finalRemarks,
      mrv_report_generated: state.mrvReportGenerated,
      completion_percent: calculateMrvCompletionPercent(state),
    },
    submit,
  };
}

export function statusBadgeTone(
  status: string,
): 'approved' | 'rejected' | 'correction' | 'pending' | 'neutral' {
  if (status === 'verified' || status === 'approved') {
    return 'approved';
  }

  if (status === 'failed' || status === 'rejected') {
    return 'rejected';
  }

  if (status === 'correction_required' || status === 'correction') {
    return 'correction';
  }

  if (status === 'pending') {
    return 'pending';
  }

  return 'neutral';
}

export function formatCoordinate(value: number | null): string {
  return value != null ? value.toFixed(6) : '—';
}

export function formatDistanceKm(value: number | null): string {
  if (value == null) {
    return '—';
  }

  return `${value.toFixed(2)} km`;
}

export function formatCheckInTime(value: string | null): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
