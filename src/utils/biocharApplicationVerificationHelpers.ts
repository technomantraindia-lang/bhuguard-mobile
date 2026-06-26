import type { VerificationResult } from '../constants/feedstockVerificationChecklist';
import {
  BIOCHAR_APPLICATION_PROGRESS_STEPS,
  BIOCHAR_AFTER_PHOTO_CHECKLIST,
  BIOCHAR_BATCH_CHECKLIST,
  BIOCHAR_BEFORE_PHOTO_CHECKLIST,
  BIOCHAR_DATE_CHECKLIST,
  BIOCHAR_DURING_PHOTO_CHECKLIST,
  BIOCHAR_PLOT_CHECKLIST,
  BIOCHAR_QUANTITY_CHECKLIST,
  defaultBiocharSections,
  defaultSectionItems,
  type BiocharPhotoPhase,
  type BiocharPhotoReview,
  type BiocharSectionState,
  type SectionResult,
} from '../constants/biocharApplicationVerificationChecklist';
import { pickNestedString, pickString, type ApiRecord } from './apiHelpers';

export interface BiocharApplicationVerificationViewModel {
  id: number;
  verificationCode: string;
  visitId: string;
  farmerName: string;
  farmerId: string;
  farmName: string;
  farmId: string;
  projectName: string;
  village: string;
  taluka: string;
  district: string;
  officerName: string;
  statusLabel: string;
  statusKey: string;
  applicationRecordId: string;
  plotId: string;
  batchId: string;
  quantityAppliedLabel: string;
  quantityAppliedKg: number;
  applicationDateLabel: string;
  submittedDateLabel: string;
  submittedBy: string;
  recordStatusLabel: string;
  batchProductionDateLabel: string;
  batchSource: string;
  batchAvailableQuantityLabel: string;
  batchAvailableQuantityKg: number;
  batchStatusLabel: string;
  farmerSubmittedDate: string;
  evidenceTimestampLabel: string;
  officerVerifiedDateLabel: string;
  plotLatitude: number | null;
  plotLongitude: number | null;
  farmLatitude: number | null;
  farmLongitude: number | null;
  photos: Record<BiocharPhotoPhase, { url: string | null; uploaded: boolean }>;
}

export interface BiocharApplicationVerificationFormState {
  sections: ReturnType<typeof defaultBiocharSections>;
  officerObservedQuantity: string;
  photoReviews: BiocharPhotoReview[];
  additionalPhotos: string[];
  additionalDocuments: string[];
  inspectionNote: string;
  plotVerified: boolean;
  batchVerified: boolean;
  correctionReason: string;
  requiredAction: string;
  correctionDueDate: string;
  rejectionReason: string;
  evidenceNotes: string;
  officerRemarks: string;
  finalRemarks: string;
  verificationResult: VerificationResult;
}

function readNumber(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function readSection(raw: unknown, defs: typeof BIOCHAR_PLOT_CHECKLIST): BiocharSectionState {
  const record = raw && typeof raw === 'object' ? (raw as ApiRecord) : {};
  const itemsRaw = record.items && typeof record.items === 'object' ? (record.items as ApiRecord) : {};
  const defaults = defaultSectionItems(defs);
  const items = { ...defaults };

  for (const def of defs) {
    if (typeof itemsRaw[def.key] === 'boolean') {
      items[def.key] = itemsRaw[def.key] as boolean;
    }
  }

  const result = pickString(record, 'result');

  return {
    items,
    result: result === 'pass' || result === 'fail' || result === 'needs_correction' ? result : null,
    remarks: typeof record.remarks === 'string' ? record.remarks : '',
  };
}

export function mapBiocharApplicationRecord(data: ApiRecord): BiocharApplicationVerificationViewModel {
  const record = (data.biochar_application ?? data) as ApiRecord;
  const submitted = (record.record ?? {}) as ApiRecord;
  const batch = (record.batch ?? {}) as ApiRecord;
  const quantity = (record.quantity ?? {}) as ApiRecord;
  const dates = (record.dates ?? {}) as ApiRecord;
  const plot = (record.plot ?? {}) as ApiRecord;
  const photos = (record.photos ?? {}) as ApiRecord;

  const before = (photos.before ?? {}) as ApiRecord;
  const during = (photos.during ?? {}) as ApiRecord;
  const after = (photos.after ?? {}) as ApiRecord;

  return {
    id: Number(record.id),
    verificationCode: pickString(record, 'verification_code') !== '-' ? pickString(record, 'verification_code') : `BAV-${String(record.id).padStart(6, '0')}`,
    visitId: pickString(record, 'visit_id') !== '-' ? pickString(record, 'visit_id') : '—',
    farmerName: pickString(record, 'farmer_name') !== '-' ? pickString(record, 'farmer_name') : 'Farmer',
    farmerId: pickString(record, 'farmer_id') !== '-' ? pickString(record, 'farmer_id') : '—',
    farmName: pickString(record, 'farm_name') !== '-' ? pickString(record, 'farm_name') : 'Farm',
    farmId: pickString(record, 'farm_id') !== '-' ? pickString(record, 'farm_id') : '—',
    projectName: pickString(record, 'project_name') !== '-' ? pickString(record, 'project_name') : 'Biochar',
    village: pickString(record, 'village') !== '-' ? pickString(record, 'village') : '—',
    taluka: pickString(record, 'taluka') !== '-' ? pickString(record, 'taluka') : '—',
    district: pickString(record, 'district') !== '-' ? pickString(record, 'district') : '—',
    officerName: pickString(record, 'officer_name') !== '-' ? pickString(record, 'officer_name') : 'Field Officer',
    statusLabel: pickString(record, 'verification_status_label') !== '-' ? pickString(record, 'verification_status_label') : 'Pending Verification',
    statusKey: pickString(record, 'verification_status') !== '-' ? pickString(record, 'verification_status') : 'pending',
    applicationRecordId: pickString(submitted, 'application_record_id') !== '-' ? pickString(submitted, 'application_record_id') : pickString(record, 'application_code'),
    plotId: pickString(submitted, 'plot_id') !== '-' ? pickString(submitted, 'plot_id') : '—',
    batchId: pickString(submitted, 'batch_id') !== '-' ? pickString(submitted, 'batch_id') : '—',
    quantityAppliedLabel: pickString(submitted, 'quantity_label') !== '-' ? pickString(submitted, 'quantity_label') : `${pickString(submitted, 'quantity_applied')} Kg`,
    quantityAppliedKg: readNumber(submitted.quantity_applied) ?? readNumber(quantity.submitted_quantity_kg) ?? 0,
    applicationDateLabel: pickString(submitted, 'application_date_label') !== '-' ? pickString(submitted, 'application_date_label') : '—',
    submittedDateLabel: pickString(submitted, 'submitted_date_label') !== '-' ? pickString(submitted, 'submitted_date_label') : '—',
    submittedBy: pickString(submitted, 'submitted_by') !== '-' ? pickString(submitted, 'submitted_by') : 'Farmer',
    recordStatusLabel: pickString(submitted, 'status_label') !== '-' ? pickString(submitted, 'status_label') : 'Under Review',
    batchProductionDateLabel: pickString(batch, 'production_date_label') !== '-' ? pickString(batch, 'production_date_label') : '—',
    batchSource: pickString(batch, 'batch_source') !== '-' ? pickString(batch, 'batch_source') : '—',
    batchAvailableQuantityLabel: pickString(batch, 'available_quantity_label') !== '-' ? pickString(batch, 'available_quantity_label') : '—',
    batchAvailableQuantityKg: readNumber(batch.available_quantity_kg) ?? 0,
    batchStatusLabel: pickString(batch, 'status_label') !== '-' ? pickString(batch, 'status_label') : '—',
    farmerSubmittedDate: pickString(dates, 'farmer_submitted_date') !== '-' ? pickString(dates, 'farmer_submitted_date') : '—',
    evidenceTimestampLabel: pickString(dates, 'evidence_timestamp_label') !== '-' ? pickString(dates, 'evidence_timestamp_label') : '—',
    officerVerifiedDateLabel: pickString(dates, 'officer_verified_date') !== '-' ? pickString(dates, 'officer_verified_date') : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    plotLatitude: readNumber(plot.latitude),
    plotLongitude: readNumber(plot.longitude),
    farmLatitude: readNumber(plot.farm_latitude),
    farmLongitude: readNumber(plot.farm_longitude),
    photos: {
      before: { url: typeof before.url === 'string' ? before.url : null, uploaded: before.uploaded === true },
      during: { url: typeof during.url === 'string' ? during.url : null, uploaded: during.uploaded === true },
      after: { url: typeof after.url === 'string' ? after.url : null, uploaded: after.uploaded === true },
    },
  };
}

export function createDefaultBiocharApplicationFormState(
  viewModel?: BiocharApplicationVerificationViewModel,
): BiocharApplicationVerificationFormState {
  return {
    sections: defaultBiocharSections(),
    officerObservedQuantity: viewModel ? String(viewModel.quantityAppliedKg) : '',
    photoReviews: [
      { phase: 'before', approved: null, rejectionReason: '' },
      { phase: 'during', approved: null, rejectionReason: '' },
      { phase: 'after', approved: null, rejectionReason: '' },
    ],
    additionalPhotos: [],
    additionalDocuments: [],
    inspectionNote: '',
    plotVerified: false,
    batchVerified: false,
    correctionReason: '',
    requiredAction: '',
    correctionDueDate: '',
    rejectionReason: '',
    evidenceNotes: '',
    officerRemarks: '',
    finalRemarks: '',
    verificationResult: null,
  };
}

export function applyBiocharVerificationData(
  viewModel: BiocharApplicationVerificationViewModel,
  verificationData: ApiRecord | null,
  current: BiocharApplicationVerificationFormState,
): BiocharApplicationVerificationFormState {
  if (!verificationData) {
    return { ...current, officerObservedQuantity: String(viewModel.quantityAppliedKg) };
  }

  const sectionsRaw = (verificationData.sections ?? {}) as ApiRecord;
  const additionalEvidence = (verificationData.additional_evidence ?? {}) as ApiRecord;
  const photoReviewsRaw = Array.isArray(verificationData.photo_reviews) ? verificationData.photo_reviews : [];

  const photoReviews: BiocharPhotoReview[] = (['before', 'during', 'after'] as BiocharPhotoPhase[]).map((phase) => {
    const match = photoReviewsRaw.find(
      (item) => item && typeof item === 'object' && (item as ApiRecord).phase === phase,
    ) as ApiRecord | undefined;

    return {
      phase,
      approved: match?.approved === true ? true : match?.rejected === true ? false : null,
      rejectionReason: typeof match?.rejection_reason === 'string' ? match.rejection_reason : '',
    };
  });

  return {
    sections: {
      plot: readSection(sectionsRaw.plot, BIOCHAR_PLOT_CHECKLIST),
      batch: readSection(sectionsRaw.batch, BIOCHAR_BATCH_CHECKLIST),
      quantity: readSection(sectionsRaw.quantity, BIOCHAR_QUANTITY_CHECKLIST),
      applicationDate: readSection(sectionsRaw.application_date ?? sectionsRaw.applicationDate, BIOCHAR_DATE_CHECKLIST),
      beforePhoto: readSection(sectionsRaw.before_photo ?? sectionsRaw.beforePhoto, BIOCHAR_BEFORE_PHOTO_CHECKLIST),
      duringPhoto: readSection(sectionsRaw.during_photo ?? sectionsRaw.duringPhoto, BIOCHAR_DURING_PHOTO_CHECKLIST),
      afterPhoto: readSection(sectionsRaw.after_photo ?? sectionsRaw.afterPhoto, BIOCHAR_AFTER_PHOTO_CHECKLIST),
    },
    officerObservedQuantity:
      verificationData.officer_observed_quantity != null
        ? String(verificationData.officer_observed_quantity)
        : String(viewModel.quantityAppliedKg),
    photoReviews,
    additionalPhotos: Array.isArray(additionalEvidence.photos)
      ? (additionalEvidence.photos as string[])
      : [],
    additionalDocuments: Array.isArray(additionalEvidence.documents)
      ? (additionalEvidence.documents as string[])
      : [],
    inspectionNote:
      typeof additionalEvidence.inspection_note === 'string'
        ? additionalEvidence.inspection_note
        : '',
    plotVerified: verificationData.plot_verified === true,
    batchVerified: verificationData.batch_verified === true,
    correctionReason: typeof verificationData.correction_reason === 'string' ? verificationData.correction_reason : '',
    requiredAction: typeof verificationData.required_action === 'string' ? verificationData.required_action : '',
    correctionDueDate: typeof verificationData.correction_due_date === 'string' ? verificationData.correction_due_date : '',
    rejectionReason: typeof verificationData.rejection_reason === 'string' ? verificationData.rejection_reason : '',
    evidenceNotes: typeof verificationData.evidence_notes === 'string' ? verificationData.evidence_notes : '',
    officerRemarks: typeof verificationData.officer_remarks === 'string' ? verificationData.officer_remarks : '',
    finalRemarks: typeof verificationData.final_remarks === 'string' ? verificationData.final_remarks : '',
    verificationResult:
      verificationData.verification_result === 'approved' ||
      verificationData.verification_result === 'approved_with_remarks' ||
      verificationData.verification_result === 'correction_required' ||
      verificationData.verification_result === 'rejected'
        ? verificationData.verification_result
        : null,
  };
}

export function calculateQuantityDifference(
  submittedKg: number,
  observedKg: number | null,
): { differenceKg: number; remainingKg: number; availableKg: number } {
  const observed = observedKg ?? submittedKg;
  const differenceKg = Math.round((observed - submittedKg) * 100) / 100;

  return {
    differenceKg,
    remainingKg: 0,
    availableKg: 0,
  };
}

export function buildBiocharApplicationPayload(state: BiocharApplicationVerificationFormState): ApiRecord {
  return {
    verification_result: state.verificationResult,
    officer_remarks: state.officerRemarks || state.finalRemarks || null,
    final_remarks: state.finalRemarks || null,
    correction_reason: state.correctionReason || null,
    required_action: state.requiredAction || null,
    correction_due_date: state.correctionDueDate || null,
    rejection_reason: state.rejectionReason || null,
    evidence_notes: state.evidenceNotes || null,
    officer_observed_quantity: state.officerObservedQuantity ? Number(state.officerObservedQuantity) : null,
    plot_verified: state.plotVerified,
    batch_verified: state.batchVerified,
    sections: {
      plot: state.sections.plot,
      batch: state.sections.batch,
      quantity: state.sections.quantity,
      application_date: state.sections.applicationDate,
      before_photo: state.sections.beforePhoto,
      during_photo: state.sections.duringPhoto,
      after_photo: state.sections.afterPhoto,
    },
    photo_reviews: state.photoReviews.map((review) => ({
      phase: review.phase,
      approved: review.approved === true,
      rejected: review.approved === false,
      rejection_reason: review.rejectionReason || null,
    })),
    additional_evidence: {
      photos: state.additionalPhotos,
      documents: state.additionalDocuments,
      inspection_note: state.inspectionNote || null,
    },
  };
}

function sectionPassed(section: BiocharSectionState): boolean {
  return section.result === 'pass';
}

function photoApproved(reviews: BiocharPhotoReview[], phase: BiocharPhotoPhase): boolean {
  return reviews.find((item) => item.phase === phase)?.approved === true;
}

export function isBiocharProgressStepComplete(
  state: BiocharApplicationVerificationFormState,
  stepKey: string,
): boolean {
  switch (stepKey) {
    case 'plot_id':
      return state.plotVerified || sectionPassed(state.sections.plot);
    case 'batch_id':
      return state.batchVerified || sectionPassed(state.sections.batch);
    case 'quantity':
      return sectionPassed(state.sections.quantity);
    case 'application_date':
      return sectionPassed(state.sections.applicationDate);
    case 'before_photo':
      return photoApproved(state.photoReviews, 'before');
    case 'during_photo':
      return photoApproved(state.photoReviews, 'during');
    case 'after_photo':
      return photoApproved(state.photoReviews, 'after');
    default:
      return false;
  }
}

export function calculateBiocharCompletionPercent(state: BiocharApplicationVerificationFormState): number {
  const completed = BIOCHAR_APPLICATION_PROGRESS_STEPS.filter((step) =>
    isBiocharProgressStepComplete(state, step.key),
  ).length;

  return Math.round((completed / BIOCHAR_APPLICATION_PROGRESS_STEPS.length) * 100);
}

export function biocharApplicationVerificationBlockers(
  state: BiocharApplicationVerificationFormState,
): string[] {
  const blockers: string[] = [];

  if (!state.plotVerified && !sectionPassed(state.sections.plot)) {
    blockers.push('Plot ID must be verified');
  }

  if (!state.batchVerified && !sectionPassed(state.sections.batch)) {
    blockers.push('Batch ID must be verified');
  }

  if (!sectionPassed(state.sections.quantity)) {
    blockers.push('Quantity applied must be verified');
  }

  if (!sectionPassed(state.sections.applicationDate)) {
    blockers.push('Application date must be verified');
  }

  if (!photoApproved(state.photoReviews, 'before')) {
    blockers.push('Before photo must be approved');
  }

  if (!photoApproved(state.photoReviews, 'during')) {
    blockers.push('During photo must be approved');
  }

  if (!photoApproved(state.photoReviews, 'after')) {
    blockers.push('After photo must be approved');
  }

  if (!state.verificationResult) {
    blockers.push('Select final verification result');
  }

  if (!state.officerRemarks.trim() && !state.finalRemarks.trim()) {
    blockers.push('Officer remarks are required');
  }

  return blockers;
}

export function canSubmitBiocharApplicationVerification(state: BiocharApplicationVerificationFormState): boolean {
  return biocharApplicationVerificationBlockers(state).length === 0;
}

export function setSectionResult(
  section: BiocharSectionState,
  result: SectionResult,
): BiocharSectionState {
  return { ...section, result };
}
