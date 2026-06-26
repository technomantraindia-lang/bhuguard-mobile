import type { VerificationResult } from '../constants/feedstockVerificationChecklist';
import {
  defaultChecklistItems,
  defaultFarmPhotos,
  FARM_ACTIVE_STATUS_CHECKLIST,
  FARM_BOUNDARY_CHECKLIST,
  FARM_CROP_CHECKLIST,
  FARM_EXISTENCE_CHECKLIST,
  FARM_LAND_AREA_CHECKLIST,
  FARM_VERIFICATION_PROGRESS_STEPS,
  type BoundaryIssueType,
  type CropCondition,
  type FarmActiveStatus,
  type FarmPhotoKey,
} from '../constants/farmVerificationChecklist';
import { calculateBoundaryMetrics, type BoundaryMetrics } from './boundaryGeometry';
import { extractList, pickNestedString, pickString, type ApiRecord } from './apiHelpers';
import { buildVisitDetailModel } from './visitDetailModel';

export interface FarmSectionState {
  items: Record<string, boolean>;
  remarks: string;
}

export interface FarmAreaDisplay {
  acres: number;
  hectares: number;
  bigha: number;
  label: string;
}

export interface FarmVerificationState {
  existence: FarmSectionState;
  boundary: FarmSectionState & {
    boundaryVerified: boolean;
    boundaryIssueType: BoundaryIssueType | null;
    correctionNotes: string;
  };
  landArea: FarmSectionState & {
    registeredMetrics: FarmAreaDisplay;
    currentMetrics: FarmAreaDisplay;
    differencePercent: number | null;
  };
  crop: FarmSectionState & {
    cropCondition: CropCondition | null;
  };
  activeStatus: FarmSectionState & {
    farmStatus: FarmActiveStatus | null;
  };
  photos: Record<FarmPhotoKey, string | null>;
  evidence: {
    gpsCaptured: boolean;
    boundaryVerified: boolean;
    photosUploaded: number;
    documentsReviewed: boolean;
  };
  signatures: {
    farmerCaptured: boolean;
    officerCaptured: boolean;
    farmerSignatureUrl: string | null;
    officerSignatureUrl: string | null;
  };
  verificationResult: VerificationResult;
  finalRemarks: string;
  submitted: boolean;
}

export interface FarmVerificationViewModel {
  visitId: string;
  verificationId: string;
  farmerName: string;
  farmerId: string;
  farmName: string;
  farmId: string;
  projectName: string;
  projectType: string;
  village: string;
  taluka: string;
  district: string;
  verificationDateLabel: string;
  officerName: string;
  statusLabel: string;
  statusKey: string;
  registeredCrop: string;
  cropSeason: string;
  plantationDate: string;
  registeredAreaLabel: string;
  registeredMetrics: FarmAreaDisplay;
  farmLatitude: number | null;
  farmLongitude: number | null;
  currentGpsLabel: string;
  hasBoundaryPolygon: boolean;
  gpsAvailable: boolean;
}

function readNumber(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function readSection(raw: unknown, defs: typeof FARM_EXISTENCE_CHECKLIST): FarmSectionState {
  const record = raw && typeof raw === 'object' ? (raw as ApiRecord) : {};
  const itemsRaw = record.items && typeof record.items === 'object' ? (record.items as ApiRecord) : {};
  const defaults = defaultChecklistItems(defs);
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

function parsePolygon(raw: unknown): Array<{ latitude: number; longitude: number }> {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((point) => {
      if (!point || typeof point !== 'object') {
        return null;
      }

      const p = point as ApiRecord;
      const latitude = readNumber(p.latitude ?? p.lat);
      const longitude = readNumber(p.longitude ?? p.lng);

      if (latitude == null || longitude == null) {
        return null;
      }

      return { latitude, longitude };
    })
    .filter((point): point is { latitude: number; longitude: number } => point != null);
}

export function metricsFromHectares(hectares: number): FarmAreaDisplay {
  const acres = round(hectares * 2.47105, 2);
  const bigha = round(acres * 1.613, 2);

  return {
    hectares: round(hectares, 2),
    acres,
    bigha,
    label: `${acres} Acres · ${round(hectares, 2)} Hectares · ${bigha} Bigha`,
  };
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;

  return Math.round(value * factor) / factor;
}

function resolveRegisteredHectares(assignment: ApiRecord): number {
  const hectares = readNumber(pickNestedString(assignment, 'farm.area_hectares'));

  if (hectares != null) {
    return hectares;
  }

  const acres = readNumber(pickNestedString(assignment, 'farm.area_acres'));

  if (acres != null) {
    return acres / 2.47105;
  }

  const landArea = readNumber(pickNestedString(assignment, 'farm.land_area'));

  return landArea ?? 0;
}

function resolveCurrentHectares(assignment: ApiRecord, registeredHa: number): number {
  const farm = (assignment.farm ?? {}) as ApiRecord;
  const polygon = parsePolygon(farm.gps_polygon ?? farm.boundary_polygon);

  if (polygon.length >= 3) {
    const metrics = calculateBoundaryMetrics(polygon);

    return metrics.areaHectare;
  }

  return registeredHa;
}

function resolveProjectType(projectName: string, serviceCode: string): string {
  const normalized = `${projectName} ${serviceCode}`.toLowerCase();

  if (normalized.includes('agroforestry')) {
    return 'Agroforestry';
  }

  if (normalized.includes('regenerative') || normalized.includes('agriculture')) {
    return 'Regenerative Agriculture';
  }

  return 'Biochar';
}

function countPhotos(photos: Record<FarmPhotoKey, string | null>): number {
  return Object.values(photos).filter(Boolean).length;
}

function hasGpsCapture(assignment: ApiRecord): boolean {
  if (readNumber(assignment.check_in_latitude) != null && readNumber(assignment.check_in_longitude) != null) {
    return true;
  }

  const latestCheckin = assignment.latest_gps_checkin ?? assignment.latestGpsCheckin;

  if (latestCheckin && typeof latestCheckin === 'object') {
    return readNumber((latestCheckin as ApiRecord).latitude) != null;
  }

  return false;
}

export function createDefaultFarmVerificationState(assignment: ApiRecord): FarmVerificationState {
  const registeredHa = resolveRegisteredHectares(assignment);
  const currentHa = resolveCurrentHectares(assignment, registeredHa);
  const registeredMetrics = metricsFromHectares(registeredHa);
  const currentMetrics = metricsFromHectares(currentHa);
  const differencePercent =
    registeredHa > 0 ? round(Math.abs((currentHa - registeredHa) / registeredHa) * 100, 1) : null;

  const photoCount = countPhotos(defaultFarmPhotos());

  return {
    existence: { items: defaultChecklistItems(FARM_EXISTENCE_CHECKLIST), remarks: '' },
    boundary: {
      items: defaultChecklistItems(FARM_BOUNDARY_CHECKLIST),
      remarks: '',
      boundaryVerified: false,
      boundaryIssueType: null,
      correctionNotes: '',
    },
    landArea: {
      items: defaultChecklistItems(FARM_LAND_AREA_CHECKLIST),
      remarks: '',
      registeredMetrics,
      currentMetrics,
      differencePercent,
    },
    crop: {
      items: defaultChecklistItems(FARM_CROP_CHECKLIST),
      remarks: '',
      cropCondition: null,
    },
    activeStatus: {
      items: defaultChecklistItems(FARM_ACTIVE_STATUS_CHECKLIST),
      remarks: '',
      farmStatus: null,
    },
    photos: defaultFarmPhotos(),
    evidence: {
      gpsCaptured: hasGpsCapture(assignment),
      boundaryVerified: false,
      photosUploaded: photoCount,
      documentsReviewed: false,
    },
    signatures: { farmerCaptured: false, officerCaptured: false, farmerSignatureUrl: null, officerSignatureUrl: null },
    verificationResult: null,
    finalRemarks: '',
    submitted: false,
  };
}

export function parseFarmVerificationState(
  assignment: ApiRecord,
  checklist: ApiRecord | null,
): FarmVerificationState {
  const defaults = createDefaultFarmVerificationState(assignment);
  const observed =
    checklist?.observed_values && typeof checklist.observed_values === 'object'
      ? (checklist.observed_values as ApiRecord)
      : null;

  const raw =
    observed?.farm_verification && typeof observed.farm_verification === 'object'
      ? (observed.farm_verification as ApiRecord)
      : observed?.farm && typeof observed.farm === 'object'
        ? (observed.farm as ApiRecord)
        : null;

  if (!raw) {
    if (checklist) {
      const checklistData =
        checklist.checklist_data && typeof checklist.checklist_data === 'object'
          ? (checklist.checklist_data as ApiRecord)
          : ({} as ApiRecord);

      defaults.existence.items.farm_exists_physically = checklistData.farm_location_verified === true;
      defaults.landArea.items.land_area_matches = checklistData.farm_area_verified === true;
      defaults.crop.items.crop_type_correct = checklistData.crop_practice_observed === true;
      defaults.signatures.farmerCaptured = checklist.farmer_confirmation === true;
      defaults.finalRemarks = typeof checklist.officer_notes === 'string' ? checklist.officer_notes : '';
    }

    return defaults;
  }

  const boundaryRaw = raw.boundary && typeof raw.boundary === 'object' ? (raw.boundary as ApiRecord) : raw;
  const landAreaRaw = raw.land_area && typeof raw.land_area === 'object' ? (raw.land_area as ApiRecord) : raw;
  const cropRaw = raw.crop && typeof raw.crop === 'object' ? (raw.crop as ApiRecord) : raw;
  const activeRaw = raw.active_status && typeof raw.active_status === 'object' ? (raw.active_status as ApiRecord) : raw;
  const photosRaw = raw.photos && typeof raw.photos === 'object' ? (raw.photos as ApiRecord) : {};
  const evidenceRaw = raw.evidence && typeof raw.evidence === 'object' ? (raw.evidence as ApiRecord) : {};
  const signaturesRaw = raw.signatures && typeof raw.signatures === 'object' ? (raw.signatures as ApiRecord) : {};

  const photos = defaultFarmPhotos();

  for (const key of Object.keys(photos) as FarmPhotoKey[]) {
    const uri = photosRaw[key];

    if (typeof uri === 'string' && uri.trim()) {
      photos[key] = uri;
    }
  }

  return {
    existence: readSection(raw.existence ?? raw, FARM_EXISTENCE_CHECKLIST),
    boundary: {
      ...readSection(boundaryRaw, FARM_BOUNDARY_CHECKLIST),
      boundaryVerified: boundaryRaw.boundary_verified === true || boundaryRaw.boundaryVerified === true,
      boundaryIssueType:
        typeof boundaryRaw.boundary_issue_type === 'string'
          ? (boundaryRaw.boundary_issue_type as BoundaryIssueType)
          : typeof boundaryRaw.boundaryIssueType === 'string'
            ? (boundaryRaw.boundaryIssueType as BoundaryIssueType)
            : null,
      correctionNotes:
        typeof boundaryRaw.correction_notes === 'string'
          ? boundaryRaw.correction_notes
          : typeof boundaryRaw.correctionNotes === 'string'
            ? boundaryRaw.correctionNotes
            : '',
    },
    landArea: {
      ...readSection(landAreaRaw, FARM_LAND_AREA_CHECKLIST),
      registeredMetrics: defaults.landArea.registeredMetrics,
      currentMetrics: defaults.landArea.currentMetrics,
      differencePercent: defaults.landArea.differencePercent,
    },
    crop: {
      ...readSection(cropRaw, FARM_CROP_CHECKLIST),
      cropCondition:
        typeof cropRaw.crop_condition === 'string'
          ? (cropRaw.crop_condition as CropCondition)
          : typeof cropRaw.cropCondition === 'string'
            ? (cropRaw.cropCondition as CropCondition)
            : null,
    },
    activeStatus: {
      ...readSection(activeRaw, FARM_ACTIVE_STATUS_CHECKLIST),
      farmStatus:
        typeof activeRaw.farm_status === 'string'
          ? (activeRaw.farm_status as FarmActiveStatus)
          : typeof activeRaw.farmStatus === 'string'
            ? (activeRaw.farmStatus as FarmActiveStatus)
            : null,
    },
    photos,
    evidence: {
      gpsCaptured: evidenceRaw.gps_captured === true || evidenceRaw.gpsCaptured === true || defaults.evidence.gpsCaptured,
      boundaryVerified:
        evidenceRaw.boundary_verified === true || evidenceRaw.boundaryVerified === true || boundaryRaw.boundary_verified === true,
      photosUploaded: countPhotos(photos),
      documentsReviewed: evidenceRaw.documents_reviewed === true || evidenceRaw.documentsReviewed === true,
    },
    signatures: {
      farmerCaptured: signaturesRaw.farmer_captured === true || signaturesRaw.farmerCaptured === true,
      officerCaptured: signaturesRaw.officer_captured === true || signaturesRaw.officerCaptured === true,
      farmerSignatureUrl:
        typeof signaturesRaw.farmer_signature_url === 'string'
          ? signaturesRaw.farmer_signature_url
          : typeof signaturesRaw.farmerSignatureUrl === 'string'
            ? signaturesRaw.farmerSignatureUrl
            : null,
      officerSignatureUrl:
        typeof signaturesRaw.officer_signature_url === 'string'
          ? signaturesRaw.officer_signature_url
          : typeof signaturesRaw.officerSignatureUrl === 'string'
            ? signaturesRaw.officerSignatureUrl
            : null,
    },
    verificationResult:
      raw.verification_result === 'approved' ||
      raw.verification_result === 'approved_with_remarks' ||
      raw.verification_result === 'correction_required' ||
      raw.verification_result === 'rejected'
        ? raw.verification_result
        : raw.verificationResult === 'approved' ||
            raw.verificationResult === 'approved_with_remarks' ||
            raw.verificationResult === 'correction_required' ||
            raw.verificationResult === 'rejected'
          ? raw.verificationResult
          : null,
    finalRemarks:
      typeof raw.final_remarks === 'string'
        ? raw.final_remarks
        : typeof raw.finalRemarks === 'string'
          ? raw.finalRemarks
          : typeof checklist?.officer_notes === 'string'
            ? checklist.officer_notes
            : '',
    submitted: raw.submitted === true,
  };
}

export function buildFarmVerificationViewModel(
  assignment: ApiRecord,
  assignmentId: number,
  officerName: string,
): FarmVerificationViewModel {
  const detail = buildVisitDetailModel(assignment, assignmentId);
  const farm = (assignment.farm ?? {}) as ApiRecord;
  const registeredHa = resolveRegisteredHectares(assignment);
  const registeredMetrics = metricsFromHectares(registeredHa);
  const polygon = parsePolygon(farm.gps_polygon ?? farm.boundary_polygon);
  const checklist = assignment.verification_checklist ?? assignment.checklist;
  const checklistId =
    checklist && typeof checklist === 'object' ? pickString(checklist as ApiRecord, 'id') : '-';

  const checkInLat = readNumber(assignment.check_in_latitude);
  const checkInLng = readNumber(assignment.check_in_longitude);
  const farmLat = readNumber(farm.latitude);
  const farmLng = readNumber(farm.longitude);

  const currentGpsLabel =
    checkInLat != null && checkInLng != null
      ? `${checkInLat.toFixed(6)}, ${checkInLng.toFixed(6)}`
      : '—';

  const serviceCode = pickNestedString(assignment, 'service.code');

  return {
    visitId: detail.assignmentCode,
    verificationId:
      checklistId !== '-'
        ? `BHG-FVR-${String(checklistId).padStart(6, '0')}`
        : `BHG-FVR-${String(assignmentId).padStart(6, '0')}`,
    farmerName: detail.farmerName,
    farmerId: detail.farmerId,
    farmName: detail.farmName,
    farmId: detail.farmId,
    projectName: detail.projectName,
    projectType: resolveProjectType(detail.projectName, serviceCode),
    village: pickNestedString(assignment, 'farm.village') !== '-' ? pickNestedString(assignment, 'farm.village') : '—',
    taluka: pickNestedString(assignment, 'farm.taluka') !== '-' ? pickNestedString(assignment, 'farm.taluka') : '—',
    district: pickNestedString(assignment, 'farm.district') !== '-' ? pickNestedString(assignment, 'farm.district') : '—',
    verificationDateLabel: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    officerName,
    statusLabel: 'Pending Verification',
    statusKey: 'pending',
    registeredCrop: pickNestedString(assignment, 'farm.crop_type') !== '-' ? pickNestedString(assignment, 'farm.crop_type') : detail.cropType,
    cropSeason: pickNestedString(assignment, 'farm.crop_season') !== '-' ? pickNestedString(assignment, 'farm.crop_season') : '—',
    plantationDate:
      pickNestedString(assignment, 'farm.plantation_date') !== '-'
        ? pickNestedString(assignment, 'farm.plantation_date')
        : '—',
    registeredAreaLabel: registeredMetrics.label,
    registeredMetrics,
    farmLatitude: farmLat,
    farmLongitude: farmLng,
    currentGpsLabel,
    hasBoundaryPolygon: polygon.length >= 3,
    gpsAvailable: hasGpsCapture(assignment),
  };
}

function isSectionComplete(items: Record<string, boolean>, defs: typeof FARM_EXISTENCE_CHECKLIST): boolean {
  return defs.every((item) => items[item.key] === true);
}

export function isFarmProgressStepComplete(state: FarmVerificationState, stepKey: string): boolean {
  switch (stepKey) {
    case 'farm_exists':
      return state.existence.items.farm_exists_physically === true;
    case 'boundary':
      return (
        state.boundary.boundaryVerified ||
        isSectionComplete(state.boundary.items, FARM_BOUNDARY_CHECKLIST)
      );
    case 'land_area':
      return isSectionComplete(state.landArea.items, FARM_LAND_AREA_CHECKLIST);
    case 'crop':
      return isSectionComplete(state.crop.items, FARM_CROP_CHECKLIST) && state.crop.cropCondition != null;
    case 'farm_active':
      return state.activeStatus.farmStatus != null;
    case 'evidence':
      return state.evidence.gpsCaptured && state.evidence.photosUploaded >= 3;
    case 'signatures':
      return state.signatures.farmerCaptured && state.signatures.officerCaptured;
    default:
      return false;
  }
}

export function calculateFarmCompletionPercent(state: FarmVerificationState): number {
  const completed = FARM_VERIFICATION_PROGRESS_STEPS.filter((step) =>
    isFarmProgressStepComplete(state, step.key),
  ).length;

  return Math.round((completed / FARM_VERIFICATION_PROGRESS_STEPS.length) * 100);
}

export function farmVerificationBlockers(state: FarmVerificationState): string[] {
  const blockers: string[] = [];

  if (state.existence.items.farm_exists_physically !== true) {
    blockers.push('Confirm that the farm exists physically');
  }

  if (!state.boundary.boundaryVerified && state.boundary.items.boundary_matches_registration !== true) {
    blockers.push('Boundary verification is required');
  }

  if (state.landArea.items.land_area_matches !== true) {
    blockers.push('Land area verification is required');
  }

  if (state.crop.items.crop_type_correct !== true) {
    blockers.push('Crop details verification is required');
  }

  if (state.activeStatus.farmStatus == null) {
    blockers.push('Select farm active status');
  }

  if (state.evidence.photosUploaded < 3) {
    blockers.push('Upload at least 3 farm photos');
  }

  if (!state.evidence.gpsCaptured) {
    blockers.push('GPS check-in is required before submission');
  }

  if (!state.signatures.farmerCaptured) {
    blockers.push('Farmer signature is required');
  }

  if (!state.signatures.officerCaptured) {
    blockers.push('Officer signature is required');
  }

  if (!state.verificationResult) {
    blockers.push('Select a verification result');
  }

  return blockers;
}

export function canSubmitFarmVerification(state: FarmVerificationState): boolean {
  return farmVerificationBlockers(state).length === 0;
}

export function areaDifferenceTone(differencePercent: number | null): 'success' | 'warning' {
  if (differencePercent == null) {
    return 'warning';
  }

  return differencePercent <= 5 ? 'success' : 'warning';
}

export function buildFarmVerificationPayload(
  state: FarmVerificationState,
  submit: boolean,
  existingObserved: ApiRecord | null,
): ApiRecord {
  const correctionRequired = state.verificationResult === 'correction_required';
  const photoCount = countPhotos(state.photos);

  const farmVerification = {
    existence: state.existence,
    boundary: {
      items: state.boundary.items,
      remarks: state.boundary.remarks,
      boundary_verified: state.boundary.boundaryVerified,
      boundary_issue_type: state.boundary.boundaryIssueType,
      correction_notes: state.boundary.correctionNotes,
    },
    land_area: {
      items: state.landArea.items,
      remarks: state.landArea.remarks,
      registered_metrics: state.landArea.registeredMetrics,
      current_metrics: state.landArea.currentMetrics,
      difference_percent: state.landArea.differencePercent,
    },
    crop: {
      items: state.crop.items,
      remarks: state.crop.remarks,
      crop_condition: state.crop.cropCondition,
    },
    active_status: {
      items: state.activeStatus.items,
      remarks: state.activeStatus.remarks,
      farm_status: state.activeStatus.farmStatus,
    },
    photos: state.photos,
    evidence: {
      ...state.evidence,
      photos_uploaded: photoCount,
    },
    signatures: {
      farmer_captured: state.signatures.farmerCaptured,
      officer_captured: state.signatures.officerCaptured,
      farmer_signature_url: state.signatures.farmerSignatureUrl,
      officer_signature_url: state.signatures.officerSignatureUrl,
    },
    verification_result: state.verificationResult,
    final_remarks: state.finalRemarks,
    completion_percent: calculateFarmCompletionPercent(state),
    submitted: submit,
  };

  const observedValues: ApiRecord = {
    ...(existingObserved ?? {}),
    farm_verification: farmVerification,
    farm: {
      items: {
        farm_exists: state.existence.items.farm_exists_physically === true,
        boundary_matches_mapping: state.boundary.items.boundary_matches_registration === true,
        land_area_verified: state.landArea.items.land_area_matches === true,
        crop_details_verified: state.crop.items.crop_type_correct === true,
        farm_active: state.activeStatus.farmStatus === 'active' || state.activeStatus.farmStatus === 'seasonal',
      },
      remarks: state.finalRemarks,
    },
  };

  return {
    farm_location_verified:
      state.evidence.gpsCaptured && state.existence.items.farm_exists_physically === true,
    farm_area_verified: state.landArea.items.land_area_matches === true,
    crop_practice_observed: state.crop.items.crop_type_correct === true,
    weekly_activity_evidence_checked: photoCount >= 3,
    farmer_confirmation: state.signatures.farmerCaptured,
    correction_required: correctionRequired,
    correction_notes: correctionRequired ? state.finalRemarks || 'Correction required during farm verification.' : null,
    officer_notes: state.finalRemarks || null,
    observed_values: observedValues,
    submit,
  };
}

export function summarizeEvidenceDocuments(assignment: ApiRecord): number {
  const evidence = extractList(assignment, ['evidence_uploads', 'evidenceUploads']);

  return evidence.filter((item) => {
    const category = pickString(item, 'category', 'evidence_category', 'type').toLowerCase();

    return category.includes('document') || category.includes('slip') || category.includes('pdf');
  }).length;
}

export type { BoundaryMetrics };
