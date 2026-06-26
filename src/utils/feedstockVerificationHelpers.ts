import { extractList, pickString, type ApiRecord } from './apiHelpers';
import {
  defaultChecklistItems,
  defaultFeedstockVerificationSections,
  FEEDSTOCK_COLLECTION_DATE_CHECKLIST,
  FEEDSTOCK_GPS_CHECKLIST,
  FEEDSTOCK_PHOTOS_CHECKLIST,
  FEEDSTOCK_QUANTITY_CHECKLIST,
  FEEDSTOCK_TYPE_CHECKLIST,
  FEEDSTOCK_VERIFICATION_PROGRESS_STEPS,
  FEEDSTOCK_WEIGHT_SLIP_CHECKLIST,
  type FeedstockChecklistItem,
  type FeedstockPhotoReview,
  type FeedstockSectionState,
  type SectionResult,
  type VerificationResult,
} from '../constants/feedstockVerificationChecklist';

export interface FeedstockVerificationViewModel {
  id: number;
  verificationCode: string;
  visitId: string;
  priority: string;
  verificationStatus: string;
  verificationStatusLabel: string;
  verificationDateLabel: string;
  farmerName: string;
  farmerCode: string;
  farmName: string;
  farmId: string;
  village: string;
  taluka: string;
  district: string;
  projectName: string;
  officerName: string;
  feedstockCode: string;
  feedstockTypeLabel: string;
  quantityLabel: string;
  quantityValue: number | null;
  quantityUnit: string;
  collectionDateLabel: string;
  submittedDateLabel: string;
  submittedBy: string;
  recordStatusLabel: string;
  collectionMethod: string;
  recordSubmittedLabel: string;
  weightSlipQuantityLabel: string;
  officerVerifiedDateLabel: string;
  timeWindowStatus: string;
  gps: {
    latitude: number | null;
    longitude: number | null;
    accuracyM: number | null;
    distanceFromFarmKm: number | null;
    distanceFromFarmM: number | null;
    farmLatitude: number | null;
    farmLongitude: number | null;
    locationStatus: string;
    allowedRadiusM: number;
  };
  photos: Array<{
    id: number;
    url: string;
    uploadedAt: string | null;
    approved: boolean | null;
    rejected: boolean | null;
  }>;
  photosCount: number;
  weightSlip: {
    available: boolean;
    url: string | null;
    fileType: string;
    uploadedLabel: string;
    farmerName: string;
    quantityMentioned: string;
    approved: boolean | null;
  };
  checklist: FeedstockChecklistItem[];
  officerRemarks: string;
  correctionNotes: string;
  requiredChanges: string;
  rejectionReason: string;
  verificationResult: VerificationResult;
}

export interface FeedstockVerificationFormState {
  sections: ReturnType<typeof defaultFeedstockVerificationSections>;
  officerObservedQuantity: string;
  weightSlipApproved: boolean | null;
  weightSlipRejectionReason: string;
  gpsVerified: boolean | null;
  gpsFlagged: boolean;
  gpsOverrideReason: string;
  gpsOverridePhotoUri: string | null;
  photoReviews: FeedstockPhotoReview[];
  officerEvidencePhotos: string[];
  officerEvidenceDocuments: string[];
  correctionDueDate: string;
  evidenceNotes: string;
  officerRemarks: string;
  correctionNotes: string;
  requiredChanges: string;
  rejectionReason: string;
  verificationResult: VerificationResult;
}

function inferFileType(url: string | null): string {
  if (!url) {
    return '—';
  }

  const lower = url.toLowerCase();

  if (lower.includes('.pdf')) {
    return 'PDF';
  }

  if (lower.includes('.png')) {
    return 'PNG';
  }

  if (lower.includes('.jpg') || lower.includes('.jpeg')) {
    return 'JPG';
  }

  return 'PDF/JPG/PNG';
}

function readChecklist(record: ApiRecord): FeedstockChecklistItem[] {
  const defaults = defaultChecklistItems();
  const items = extractList(record, ['checklist']);

  if (items.length === 0) {
    return defaults;
  }

  return defaults.map((defaultItem) => {
    const match = items.find((item) => pickString(item, 'key') === defaultItem.key);

    if (!match) {
      return defaultItem;
    }

    const result = pickString(match, 'result');

    return {
      ...defaultItem,
      label: pickString(match, 'label') !== '-' ? pickString(match, 'label') : defaultItem.label,
      result: result === 'pass' || result === 'fail' ? result : null,
      remarks: pickString(match, 'remarks') !== '-' ? pickString(match, 'remarks') : '',
    };
  });
}

function readPhotos(record: ApiRecord): FeedstockVerificationViewModel['photos'] {
  return extractList(record, ['photos'])
    .map((photo, index) => ({
      id: Number(photo.id ?? index),
      url: pickString(photo, 'url'),
      uploadedAt: pickString(photo, 'uploaded_at') !== '-' ? pickString(photo, 'uploaded_at') : null,
      approved: typeof photo.approved === 'boolean' ? photo.approved : null,
      rejected: typeof photo.rejected === 'boolean' ? photo.rejected : null,
    }))
    .filter((photo) => photo.url && photo.url !== '-');
}

export function createDefaultFeedstockFormState(): FeedstockVerificationFormState {
  return {
    sections: defaultFeedstockVerificationSections(),
    officerObservedQuantity: '',
    weightSlipApproved: null,
    weightSlipRejectionReason: '',
    gpsVerified: null,
    gpsFlagged: false,
    gpsOverrideReason: '',
    gpsOverridePhotoUri: null,
    photoReviews: [],
    officerEvidencePhotos: [],
    officerEvidenceDocuments: [],
    correctionDueDate: '',
    evidenceNotes: '',
    officerRemarks: '',
    correctionNotes: '',
    requiredChanges: '',
    rejectionReason: '',
    verificationResult: null,
  };
}

export function mapFeedstockVerificationRecord(
  record: ApiRecord,
  officerName = 'Field Officer',
): FeedstockVerificationViewModel {
  const collection = (record.collection ?? {}) as ApiRecord;
  const gps = (record.gps ?? {}) as ApiRecord;
  const weightSlip = (record.weight_slip ?? {}) as ApiRecord;
  const result = pickString(record, 'verification_result');
  const distanceKm = gps.distance_from_farm_km != null ? Number(gps.distance_from_farm_km) : null;
  const quantity = collection.quantity != null ? Number(collection.quantity) : null;
  const quantityUnit = pickString(collection, 'quantity_unit') !== '-' ? pickString(collection, 'quantity_unit') : 'kg';

  return {
    id: Number(record.id),
    verificationCode: pickString(record, 'verification_code'),
    visitId: pickString(record, 'visit_id') !== '-' ? pickString(record, 'visit_id') : '—',
    priority: pickString(record, 'priority') !== '-' ? pickString(record, 'priority') : 'normal',
    verificationStatus: pickString(record, 'verification_status'),
    verificationStatusLabel:
      pickString(record, 'verification_status_label') !== '-'
        ? pickString(record, 'verification_status_label')
        : 'Pending Verification',
    verificationDateLabel:
      pickString(record, 'verification_date_label') !== '-'
        ? pickString(record, 'verification_date_label')
        : 'Today',
    farmerName: pickString(record, 'farmer_name') !== '-' ? pickString(record, 'farmer_name') : 'Farmer',
    farmerCode: pickString(record, 'farmer_code') !== '-' ? pickString(record, 'farmer_code') : '—',
    farmName: pickString(record, 'farm_name') !== '-' ? pickString(record, 'farm_name') : '—',
    farmId: pickString(record, 'farm_id') !== '-' ? pickString(record, 'farm_id') : '—',
    village: pickString(record, 'village') !== '-' ? pickString(record, 'village') : '—',
    taluka: pickString(record, 'taluka') !== '-' ? pickString(record, 'taluka') : '—',
    district: pickString(record, 'district') !== '-' ? pickString(record, 'district') : '—',
    projectName: pickString(record, 'project_name') !== '-' ? pickString(record, 'project_name') : 'Biochar',
    officerName,
    feedstockCode:
      pickString(collection, 'feedstock_code') !== '-'
        ? pickString(collection, 'feedstock_code')
        : pickString(collection, 'id') !== '-'
          ? `FS-${pickString(collection, 'id')}`
          : '—',
    feedstockTypeLabel:
      pickString(collection, 'feedstock_type_label') !== '-'
        ? pickString(collection, 'feedstock_type_label')
        : pickString(collection, 'feedstock_type'),
    quantityLabel:
      pickString(collection, 'quantity_label') !== '-'
        ? pickString(collection, 'quantity_label')
        : quantity != null
          ? `${quantity} ${quantityUnit}`
          : '—',
    quantityValue: quantity,
    quantityUnit,
    collectionDateLabel:
      pickString(collection, 'collection_date_label') !== '-'
        ? pickString(collection, 'collection_date_label')
        : '—',
    submittedDateLabel:
      pickString(collection, 'record_submitted_label') !== '-'
        ? pickString(collection, 'record_submitted_label')
        : '—',
    submittedBy: 'Farmer',
    recordStatusLabel: 'Under Review',
    collectionMethod:
      pickString(collection, 'collection_method') !== '-'
        ? pickString(collection, 'collection_method')
        : 'Manual Collection',
    recordSubmittedLabel:
      pickString(collection, 'record_submitted_label') !== '-'
        ? pickString(collection, 'record_submitted_label')
        : '—',
    weightSlipQuantityLabel:
      pickString(weightSlip, 'quantity_mentioned') !== '-'
        ? pickString(weightSlip, 'quantity_mentioned')
        : pickString(collection, 'quantity_label') !== '-'
          ? pickString(collection, 'quantity_label')
          : '—',
    officerVerifiedDateLabel: pickString(record, 'verification_date_label') !== '-' ? pickString(record, 'verification_date_label') : 'Today',
    timeWindowStatus: 'Within Allowed Window',
    gps: {
      latitude: gps.latitude != null ? Number(gps.latitude) : null,
      longitude: gps.longitude != null ? Number(gps.longitude) : null,
      accuracyM: gps.accuracy_m != null ? Number(gps.accuracy_m) : null,
      distanceFromFarmKm: distanceKm,
      distanceFromFarmM: distanceKm != null ? Math.round(distanceKm * 1000) : null,
      farmLatitude: gps.farm_latitude != null ? Number(gps.farm_latitude) : null,
      farmLongitude: gps.farm_longitude != null ? Number(gps.farm_longitude) : null,
      locationStatus:
        distanceKm != null && distanceKm <= 0.1
          ? 'Within Allowed Radius'
          : distanceKm != null
            ? 'Outside Allowed Radius'
            : 'Pending Verification',
      allowedRadiusM: 100,
    },
    photos: readPhotos(record),
    photosCount: Number(record.photos_count ?? readPhotos(record).length),
    weightSlip: {
      available: Boolean(weightSlip.available),
      url: pickString(weightSlip, 'url') !== '-' ? pickString(weightSlip, 'url') : null,
      fileType: inferFileType(pickString(weightSlip, 'url') !== '-' ? pickString(weightSlip, 'url') : null),
      uploadedLabel: pickString(weightSlip, 'uploaded_label') !== '-' ? pickString(weightSlip, 'uploaded_label') : '—',
      farmerName: pickString(weightSlip, 'farmer_name') !== '-' ? pickString(weightSlip, 'farmer_name') : '—',
      quantityMentioned:
        pickString(weightSlip, 'quantity_mentioned') !== '-'
          ? pickString(weightSlip, 'quantity_mentioned')
          : '—',
      approved: typeof weightSlip.approved === 'boolean' ? weightSlip.approved : null,
    },
    checklist: readChecklist(record),
    officerRemarks: pickString(record, 'officer_remarks') !== '-' ? pickString(record, 'officer_remarks') : '',
    correctionNotes: pickString(record, 'correction_notes') !== '-' ? pickString(record, 'correction_notes') : '',
    requiredChanges: pickString(record, 'required_changes') !== '-' ? pickString(record, 'required_changes') : '',
    rejectionReason: pickString(record, 'rejection_reason') !== '-' ? pickString(record, 'rejection_reason') : '',
    verificationResult:
      result === 'approved' ||
      result === 'approved_with_remarks' ||
      result === 'correction_required' ||
      result === 'rejected'
        ? result
        : null,
  };
}

export function applyRecordToFormState(
  record: FeedstockVerificationViewModel,
  existing?: FeedstockVerificationFormState,
): FeedstockVerificationFormState {
  const base = existing ?? createDefaultFeedstockFormState();

  return {
    ...base,
    officerObservedQuantity:
      base.officerObservedQuantity ||
      (record.quantityValue != null ? String(record.quantityValue) : ''),
    weightSlipApproved: record.weightSlip.approved ?? base.weightSlipApproved,
    photoReviews: record.photos.map((photo) => {
      const existingReview = base.photoReviews.find((item) => item.photoId === photo.id);

      return {
        photoId: photo.id,
        approved: photo.approved ?? existingReview?.approved ?? null,
        rejected: photo.rejected ?? existingReview?.rejected ?? null,
        remark: existingReview?.remark ?? '',
        rejectionReason: existingReview?.rejectionReason ?? '',
      };
    }),
    officerRemarks: record.officerRemarks || base.officerRemarks,
    correctionNotes: record.correctionNotes || base.correctionNotes,
    requiredChanges: record.requiredChanges || base.requiredChanges,
    rejectionReason: record.rejectionReason || base.rejectionReason,
    verificationResult: record.verificationResult ?? base.verificationResult,
  };
}

function sectionItemsComplete(section: FeedstockSectionState, defs: Array<{ key: string }>): boolean {
  return defs.every((item) => section.items[item.key] === true);
}

function sectionResultComplete(result: SectionResult): boolean {
  return result === 'pass' || result === 'fail' || result === 'needs_correction';
}

export function isFeedstockProgressStepComplete(
  state: FeedstockVerificationFormState,
  key: string,
  data: FeedstockVerificationViewModel,
): boolean {
  switch (key) {
    case 'feedstock_type':
      return (
        sectionResultComplete(state.sections.typeVerification.result) &&
        sectionItemsComplete(state.sections.typeVerification, FEEDSTOCK_TYPE_CHECKLIST)
      );
    case 'quantity':
      return (
        sectionResultComplete(state.sections.quantityVerification.result) &&
        sectionItemsComplete(state.sections.quantityVerification, FEEDSTOCK_QUANTITY_CHECKLIST) &&
        state.officerObservedQuantity.trim().length > 0
      );
    case 'collection_date':
      return (
        sectionResultComplete(state.sections.collectionDateVerification.result) &&
        sectionItemsComplete(state.sections.collectionDateVerification, FEEDSTOCK_COLLECTION_DATE_CHECKLIST)
      );
    case 'weight_slip':
      return (
        sectionResultComplete(state.sections.weightSlipVerification.result) &&
        sectionItemsComplete(state.sections.weightSlipVerification, FEEDSTOCK_WEIGHT_SLIP_CHECKLIST) &&
        (state.weightSlipApproved === true ||
          (state.weightSlipApproved === false && state.weightSlipRejectionReason.trim().length > 0))
      );
    case 'gps':
      return (
        sectionResultComplete(state.sections.gpsVerification.result) &&
        sectionItemsComplete(state.sections.gpsVerification, FEEDSTOCK_GPS_CHECKLIST) &&
        (state.gpsVerified === true ||
          (state.gpsFlagged && state.gpsOverrideReason.trim().length > 0 && state.gpsOverridePhotoUri != null))
      );
    case 'photos':
      return (
        sectionResultComplete(state.sections.photosVerification.result) &&
        sectionItemsComplete(state.sections.photosVerification, FEEDSTOCK_PHOTOS_CHECKLIST) &&
        (data.photos.length === 0 ||
          state.photoReviews.every(
            (review) => review.approved === true || (review.rejected === true && review.rejectionReason.trim().length > 0),
          ))
      );
    default:
      return false;
  }
}

export function calculateFeedstockCompletionPercent(
  state: FeedstockVerificationFormState,
  data: FeedstockVerificationViewModel,
): number {
  const completed = FEEDSTOCK_VERIFICATION_PROGRESS_STEPS.filter((step) =>
    isFeedstockProgressStepComplete(state, step.key, data),
  ).length;

  return Math.round((completed / FEEDSTOCK_VERIFICATION_PROGRESS_STEPS.length) * 100);
}

function mapSectionResultToBackend(result: SectionResult): 'pass' | 'fail' | null {
  if (result === 'pass') {
    return 'pass';
  }

  if (result === 'fail' || result === 'needs_correction') {
    return 'fail';
  }

  return null;
}

export function compileBackendChecklist(state: FeedstockVerificationFormState): FeedstockChecklistItem[] {
  const typeResult = mapSectionResultToBackend(state.sections.typeVerification.result);
  const quantityResult = mapSectionResultToBackend(state.sections.quantityVerification.result);
  const dateResult = mapSectionResultToBackend(state.sections.collectionDateVerification.result);
  const gpsResult =
    state.gpsVerified === true
      ? 'pass'
      : state.gpsFlagged && state.gpsOverrideReason.trim()
        ? 'fail'
        : mapSectionResultToBackend(state.sections.gpsVerification.result);

  return defaultChecklistItems().map((item) => {
    switch (item.key) {
      case 'feedstock_type_matches':
        return { ...item, result: typeResult, remarks: state.sections.typeVerification.remarks };
      case 'material_quality_acceptable':
        return { ...item, result: typeResult, remarks: state.sections.typeVerification.remarks };
      case 'quantity_correct':
        return { ...item, result: quantityResult, remarks: state.sections.quantityVerification.remarks };
      case 'collection_date_correct':
        return { ...item, result: dateResult, remarks: state.sections.collectionDateVerification.remarks };
      case 'not_previously_verified':
        return { ...item, result: dateResult, remarks: state.sections.collectionDateVerification.remarks };
      case 'gps_location_valid':
        return { ...item, result: gpsResult, remarks: state.sections.gpsVerification.remarks };
      default:
        return item;
    }
  });
}

export function feedstockVerificationBlockers(
  state: FeedstockVerificationFormState,
  data: FeedstockVerificationViewModel,
): string[] {
  const blockers: string[] = [];

  if (!sectionResultComplete(state.sections.typeVerification.result)) {
    blockers.push('Complete feedstock type verification.');
  }

  if (!sectionResultComplete(state.sections.quantityVerification.result) || !state.officerObservedQuantity.trim()) {
    blockers.push('Complete quantity verification and enter officer observed quantity.');
  }

  if (!sectionResultComplete(state.sections.collectionDateVerification.result)) {
    blockers.push('Complete collection date verification.');
  }

  if (state.weightSlipApproved == null) {
    blockers.push('Approve or reject the weight slip.');
  }

  if (state.weightSlipApproved === false && !state.weightSlipRejectionReason.trim()) {
    blockers.push('Add a weight slip rejection reason.');
  }

  if (state.gpsVerified !== true && !(state.gpsFlagged && state.gpsOverrideReason.trim() && state.gpsOverridePhotoUri)) {
    blockers.push('Verify GPS or provide override reason with proof photo.');
  }

  if (
    data.photos.length > 0 &&
    !state.photoReviews.every(
      (review) => review.approved === true || (review.rejected === true && review.rejectionReason.trim().length > 0),
    )
  ) {
    blockers.push('Review all feedstock photos.');
  }

  if (!state.verificationResult) {
    blockers.push('Select a final verification result.');
  }

  if (!state.officerRemarks.trim()) {
    blockers.push('Add officer remarks.');
  }

  if (state.verificationResult === 'correction_required') {
    if (!state.correctionNotes.trim()) {
      blockers.push('Add correction reason.');
    }

    if (!state.requiredChanges.trim()) {
      blockers.push('Add required action from farmer.');
    }
  }

  if (state.verificationResult === 'rejected' && !state.rejectionReason.trim()) {
    blockers.push('Add rejection reason.');
  }

  return blockers;
}

export function canSubmitFeedstockVerification(
  state: FeedstockVerificationFormState,
  data: FeedstockVerificationViewModel,
): boolean {
  return feedstockVerificationBlockers(state, data).length === 0;
}

export function buildVerificationPayload(input: {
  checklist: FeedstockChecklistItem[];
  photoReviews: FeedstockPhotoReview[];
  weightSlipApproved: boolean | null;
  gpsVerified: boolean | null;
  gpsFlagged: boolean;
  officerRemarks: string;
  correctionNotes: string;
  requiredChanges: string;
  rejectionReason: string;
  verificationResult: VerificationResult;
}): ApiRecord {
  return {
    checklist: input.checklist.map((item) => ({
      key: item.key,
      result: item.result,
      remarks: item.remarks.trim() || null,
    })),
    photo_reviews: input.photoReviews.map((review) => ({
      photo_id: review.photoId,
      approved: review.approved,
      rejected: review.rejected,
    })),
    weight_slip_approved: input.weightSlipApproved,
    gps_verified: input.gpsVerified,
    gps_flagged: input.gpsFlagged,
    officer_remarks: input.officerRemarks.trim() || null,
    correction_notes: input.correctionNotes.trim() || null,
    required_changes: input.requiredChanges.trim() || null,
    rejection_reason: input.rejectionReason.trim() || null,
    verification_result: input.verificationResult,
  };
}

export function buildFeedstockFormPayload(state: FeedstockVerificationFormState): ApiRecord {
  return buildVerificationPayload({
    checklist: compileBackendChecklist(state),
    photoReviews: state.photoReviews,
    weightSlipApproved: state.weightSlipApproved,
    gpsVerified: state.gpsVerified,
    gpsFlagged: state.gpsFlagged,
    officerRemarks: state.officerRemarks,
    correctionNotes: state.correctionNotes,
    requiredChanges: state.requiredChanges,
    rejectionReason: state.rejectionReason,
    verificationResult: state.verificationResult,
  });
}

export function parseQuantityDifference(submitted: number | null, observed: string): string {
  const observedValue = Number.parseFloat(observed);

  if (submitted == null || !Number.isFinite(observedValue)) {
    return '—';
  }

  const diff = observedValue - submitted;
  const prefix = diff > 0 ? '+' : '';

  return `${prefix}${diff.toFixed(2)}`;
}

export function statusBadgeTone(status: string): 'pending' | 'approved' | 'rejected' | 'correction' | 'neutral' {
  const normalized = status.toLowerCase();

  if (normalized.includes('reject')) {
    return 'rejected';
  }

  if (normalized.includes('correction')) {
    return 'correction';
  }

  if (normalized.includes('approv') || normalized.includes('verified') || normalized.includes('within')) {
    return 'approved';
  }

  if (normalized.includes('pending') || normalized.includes('review')) {
    return 'pending';
  }

  return 'neutral';
}

export function sectionResultBadgeTone(result: SectionResult): 'approved' | 'rejected' | 'correction' | 'neutral' {
  if (result === 'pass') {
    return 'approved';
  }

  if (result === 'fail') {
    return 'rejected';
  }

  if (result === 'needs_correction') {
    return 'correction';
  }

  return 'neutral';
}
