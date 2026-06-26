import type { VerificationResult } from '../constants/feedstockVerificationChecklist';
import {
  EVIDENCE_COMPLETION_CHECKLIST,
  type EvidenceCompletionKey,
  type EvidenceReviewStatus,
} from '../constants/evidenceVerificationChecklist';
import { pickString, type ApiRecord } from './apiHelpers';

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export interface EvidencePhotoItem {
  id: string;
  url: string | null;
  uploadedBy?: string;
  uploadedLabel: string;
  batchId?: string;
  plotId?: string;
  phase?: string;
  label?: string;
  hasGps: boolean;
  status: EvidenceReviewStatus;
  remark: string;
}

export interface EvidenceGpsRecord {
  id: string;
  recordId: string;
  latitude: number;
  longitude: number;
  accuracyLabel: string;
  timestampLabel: string;
  distanceLabel: string;
  status: string;
  statusKey: string;
  remark: string;
}

export interface EvidenceDocumentItem {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  url: string | null;
  uploadedLabel: string;
  status: EvidenceReviewStatus;
  remark: string;
}

export interface EvidenceWeightSlip {
  id: string;
  fileName: string;
  fileType: string;
  url: string | null;
  uploadedLabel: string;
  quantityMentioned: string;
  farmerName: string;
  status: EvidenceReviewStatus;
  remark: string;
}

export interface EvidenceVerificationViewModel {
  assignmentId: number;
  verificationCode: string;
  visitId: string;
  farmerName: string;
  farmerId: string;
  farmName: string;
  farmId: string;
  projectName: string;
  officerName: string;
  statusLabel: string;
  statusKey: string;
  summary: Record<string, number>;
  feedstockPhotos: EvidencePhotoItem[];
  productionPhotos: EvidencePhotoItem[];
  applicationPhotos: EvidencePhotoItem[];
  gpsRecords: EvidenceGpsRecord[];
  weightSlip: EvidenceWeightSlip | null;
  documents: EvidenceDocumentItem[];
}

export interface EvidenceVerificationFormState {
  feedstockPhotoReviews: Record<string, { status: EvidenceReviewStatus; remark: string }>;
  productionPhotoReviews: Record<string, { status: EvidenceReviewStatus; remark: string }>;
  applicationPhotoReviews: Record<string, { status: EvidenceReviewStatus; remark: string }>;
  gpsRecordReviews: Record<string, { statusKey: string; status: string; remark: string }>;
  weightSlipReview: { status: EvidenceReviewStatus; remark: string } | null;
  documentReviews: Record<string, { status: EvidenceReviewStatus; remark: string }>;
  completionChecklist: Record<EvidenceCompletionKey, boolean>;
  verificationResult: VerificationResult | null;
  officerRemarks: string;
  finalRemarks: string;
  correctionReason: string;
  requiredEvidence: string;
  correctionDueDate: string;
  rejectionReason: string;
  evidenceNotes: string;
}

function mapPhotoItem(record: ApiRecord): EvidencePhotoItem {
  const statusRaw = pickString(record, 'status');
  const status: EvidenceReviewStatus =
    statusRaw === 'approved' || statusRaw === 'rejected' ? statusRaw : 'pending';

  return {
    id: pickString(record, 'id'),
    url: typeof record.url === 'string' ? record.url : null,
    uploadedBy: pickString(record, 'uploaded_by') !== '-' ? pickString(record, 'uploaded_by') : undefined,
    uploadedLabel: pickString(record, 'uploaded_label') !== '-' ? pickString(record, 'uploaded_label') : '—',
    batchId: pickString(record, 'batch_id') !== '-' ? pickString(record, 'batch_id') : undefined,
    plotId: pickString(record, 'plot_id') !== '-' ? pickString(record, 'plot_id') : undefined,
    phase: pickString(record, 'phase') !== '-' ? pickString(record, 'phase') : undefined,
    label: pickString(record, 'label') !== '-' ? pickString(record, 'label') : undefined,
    hasGps: record.has_gps === true,
    status,
    remark: typeof record.remark === 'string' ? record.remark : '',
  };
}

function mapGpsRecord(record: ApiRecord): EvidenceGpsRecord {
  return {
    id: pickString(record, 'id'),
    recordId: pickString(record, 'record_id') !== '-' ? pickString(record, 'record_id') : pickString(record, 'id'),
    latitude: readNumber(record.latitude) ?? 0,
    longitude: readNumber(record.longitude) ?? 0,
    accuracyLabel: record.accuracy_m != null ? `${record.accuracy_m} m` : '—',
    timestampLabel: pickString(record, 'timestamp_label') !== '-' ? pickString(record, 'timestamp_label') : '—',
    distanceLabel: pickString(record, 'distance_label') !== '-' ? pickString(record, 'distance_label') : '—',
    status: pickString(record, 'status') !== '-' ? pickString(record, 'status') : 'Needs Review',
    statusKey: pickString(record, 'status_key') !== '-' ? pickString(record, 'status_key') : 'needs_review',
    remark: typeof record.remark === 'string' ? record.remark : '',
  };
}

function mapDocument(record: ApiRecord): EvidenceDocumentItem {
  const statusRaw = pickString(record, 'status');
  const status: EvidenceReviewStatus =
    statusRaw === 'approved' || statusRaw === 'rejected' ? statusRaw : 'pending';

  return {
    id: pickString(record, 'id'),
    title: pickString(record, 'title') !== '-' ? pickString(record, 'title') : 'Document',
    fileName: pickString(record, 'file_name') !== '-' ? pickString(record, 'file_name') : 'document.pdf',
    fileType: pickString(record, 'file_type') !== '-' ? pickString(record, 'file_type') : 'PDF',
    url: typeof record.url === 'string' ? record.url : null,
    uploadedLabel: pickString(record, 'uploaded_label') !== '-' ? pickString(record, 'uploaded_label') : '—',
    status,
    remark: typeof record.remark === 'string' ? record.remark : '',
  };
}

export function mapEvidenceVerificationRecord(data: ApiRecord): EvidenceVerificationViewModel {
  const record = (data.evidence_verification ?? data) as ApiRecord;
  const summary = (record.summary ?? {}) as ApiRecord;

  const weightSlipRaw = record.weight_slip as ApiRecord | null | undefined;
  const weightSlip = weightSlipRaw
    ? {
        id: pickString(weightSlipRaw, 'id'),
        fileName: pickString(weightSlipRaw, 'file_name') !== '-' ? pickString(weightSlipRaw, 'file_name') : 'weight-slip.pdf',
        fileType: pickString(weightSlipRaw, 'file_type') !== '-' ? pickString(weightSlipRaw, 'file_type') : 'PDF',
        url: typeof weightSlipRaw.url === 'string' ? weightSlipRaw.url : null,
        uploadedLabel: pickString(weightSlipRaw, 'uploaded_label') !== '-' ? pickString(weightSlipRaw, 'uploaded_label') : '—',
        quantityMentioned: pickString(weightSlipRaw, 'quantity_mentioned') !== '-' ? pickString(weightSlipRaw, 'quantity_mentioned') : '—',
        farmerName: pickString(weightSlipRaw, 'farmer_name') !== '-' ? pickString(weightSlipRaw, 'farmer_name') : 'Farmer',
        status: (pickString(weightSlipRaw, 'status') === 'approved' || pickString(weightSlipRaw, 'status') === 'rejected'
          ? pickString(weightSlipRaw, 'status')
          : 'pending') as EvidenceReviewStatus,
        remark: typeof weightSlipRaw.remark === 'string' ? weightSlipRaw.remark : '',
      }
    : null;

  return {
    assignmentId: Number(record.assignment_id ?? 0),
    verificationCode: pickString(record, 'verification_code') !== '-' ? pickString(record, 'verification_code') : 'EVV-000001',
    visitId: pickString(record, 'visit_id') !== '-' ? pickString(record, 'visit_id') : '—',
    farmerName: pickString(record, 'farmer_name') !== '-' ? pickString(record, 'farmer_name') : 'Farmer',
    farmerId: pickString(record, 'farmer_id') !== '-' ? pickString(record, 'farmer_id') : '—',
    farmName: pickString(record, 'farm_name') !== '-' ? pickString(record, 'farm_name') : 'Farm',
    farmId: pickString(record, 'farm_id') !== '-' ? pickString(record, 'farm_id') : '—',
    projectName: pickString(record, 'project_name') !== '-' ? pickString(record, 'project_name') : 'Biochar',
    officerName: pickString(record, 'officer_name') !== '-' ? pickString(record, 'officer_name') : 'Field Officer',
    statusLabel: pickString(record, 'verification_status_label') !== '-' ? pickString(record, 'verification_status_label') : 'Pending Evidence Review',
    statusKey: pickString(record, 'verification_status') !== '-' ? pickString(record, 'verification_status') : 'pending_evidence_review',
    summary: {
      feedstock_photos: readNumber(summary.feedstock_photos) ?? 0,
      production_photos: readNumber(summary.production_photos) ?? 0,
      application_photos: readNumber(summary.application_photos) ?? 0,
      gps_records: readNumber(summary.gps_records) ?? 0,
      weight_slip: readNumber(summary.weight_slip) ?? 0,
      documents: readNumber(summary.documents) ?? 0,
    },
    feedstockPhotos: Array.isArray(record.feedstock_photos) ? record.feedstock_photos.map((item) => mapPhotoItem(item as ApiRecord)) : [],
    productionPhotos: Array.isArray(record.production_photos) ? record.production_photos.map((item) => mapPhotoItem(item as ApiRecord)) : [],
    applicationPhotos: Array.isArray(record.application_photos) ? record.application_photos.map((item) => mapPhotoItem(item as ApiRecord)) : [],
    gpsRecords: Array.isArray(record.gps_records) ? record.gps_records.map((item) => mapGpsRecord(item as ApiRecord)) : [],
    weightSlip,
    documents: Array.isArray(record.documents) ? record.documents.map((item) => mapDocument(item as ApiRecord)) : [],
  };
}

export function createDefaultEvidenceVerificationFormState(): EvidenceVerificationFormState {
  return {
    feedstockPhotoReviews: {},
    productionPhotoReviews: {},
    applicationPhotoReviews: {},
    gpsRecordReviews: {},
    weightSlipReview: null,
    documentReviews: {},
    completionChecklist: EVIDENCE_COMPLETION_CHECKLIST.reduce(
      (acc, item) => ({ ...acc, [item.key]: false }),
      {} as Record<EvidenceCompletionKey, boolean>,
    ),
    verificationResult: null,
    officerRemarks: '',
    finalRemarks: '',
    correctionReason: '',
    requiredEvidence: '',
    correctionDueDate: '',
    rejectionReason: '',
    evidenceNotes: '',
  };
}

function reviewsFromItems(
  items: Array<{ id: string; status: EvidenceReviewStatus; remark: string }>,
): Record<string, { status: EvidenceReviewStatus; remark: string }> {
  return items.reduce<Record<string, { status: EvidenceReviewStatus; remark: string }>>((acc, item) => {
    acc[item.id] = { status: item.status, remark: item.remark };
    return acc;
  }, {});
}

export function applyEvidenceVerificationData(
  viewModel: EvidenceVerificationViewModel,
  verificationData: ApiRecord | null,
  current: EvidenceVerificationFormState,
): EvidenceVerificationFormState {
  const base: EvidenceVerificationFormState = {
    ...current,
    feedstockPhotoReviews: reviewsFromItems(viewModel.feedstockPhotos),
    productionPhotoReviews: reviewsFromItems(viewModel.productionPhotos),
    applicationPhotoReviews: reviewsFromItems(viewModel.applicationPhotos),
    gpsRecordReviews: viewModel.gpsRecords.reduce((acc, item) => {
      acc[item.id] = { statusKey: item.statusKey, status: item.status, remark: item.remark };
      return acc;
    }, {} as EvidenceVerificationFormState['gpsRecordReviews']),
    weightSlipReview: viewModel.weightSlip
      ? { status: viewModel.weightSlip.status, remark: viewModel.weightSlip.remark }
      : null,
    documentReviews: reviewsFromItems(viewModel.documents),
  };

  if (!verificationData) {
    return base;
  }

  const completionRaw = (verificationData.completion_checklist ?? {}) as ApiRecord;

  return {
    ...base,
    feedstockPhotoReviews: mergeReviewMaps(base.feedstockPhotoReviews, verificationData.feedstock_photo_reviews),
    productionPhotoReviews: mergeReviewMaps(base.productionPhotoReviews, verificationData.production_photo_reviews),
    applicationPhotoReviews: mergeReviewMaps(base.applicationPhotoReviews, verificationData.application_photo_reviews),
    gpsRecordReviews: mergeGpsReviewMaps(base.gpsRecordReviews, verificationData.gps_record_reviews),
    weightSlipReview: mergeWeightSlipReview(base.weightSlipReview, verificationData.weight_slip_review),
    documentReviews: mergeReviewMaps(base.documentReviews, verificationData.document_reviews),
    completionChecklist: EVIDENCE_COMPLETION_CHECKLIST.reduce(
      (acc, item) => ({
        ...acc,
        [item.key]: completionRaw[item.key] === true || base.completionChecklist[item.key],
      }),
      {} as Record<EvidenceCompletionKey, boolean>,
    ),
    verificationResult:
      verificationData.verification_result === 'approved' ||
      verificationData.verification_result === 'approved_with_remarks' ||
      verificationData.verification_result === 'correction_required' ||
      verificationData.verification_result === 'rejected'
        ? verificationData.verification_result
        : null,
    officerRemarks: typeof verificationData.officer_remarks === 'string' ? verificationData.officer_remarks : '',
    finalRemarks: typeof verificationData.final_remarks === 'string' ? verificationData.final_remarks : '',
    correctionReason: typeof verificationData.correction_reason === 'string' ? verificationData.correction_reason : '',
    requiredEvidence: typeof verificationData.required_evidence === 'string' ? verificationData.required_evidence : '',
    correctionDueDate: typeof verificationData.correction_due_date === 'string' ? verificationData.correction_due_date : '',
    rejectionReason: typeof verificationData.rejection_reason === 'string' ? verificationData.rejection_reason : '',
    evidenceNotes: typeof verificationData.evidence_notes === 'string' ? verificationData.evidence_notes : '',
  };
}

function mergeReviewMaps(
  base: Record<string, { status: EvidenceReviewStatus; remark: string }>,
  raw: unknown,
): Record<string, { status: EvidenceReviewStatus; remark: string }> {
  if (!Array.isArray(raw)) {
    return base;
  }

  const merged = { ...base };
  raw.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return;
    }
    const record = item as ApiRecord;
    const id = pickString(record, 'id');
    if (!id || id === '-') {
      return;
    }
    const statusRaw = pickString(record, 'status');
    merged[id] = {
      status: statusRaw === 'approved' || statusRaw === 'rejected' ? statusRaw : merged[id]?.status ?? 'pending',
      remark: typeof record.remark === 'string' ? record.remark : merged[id]?.remark ?? '',
    };
  });

  return merged;
}

function mergeGpsReviewMaps(
  base: EvidenceVerificationFormState['gpsRecordReviews'],
  raw: unknown,
): EvidenceVerificationFormState['gpsRecordReviews'] {
  if (!Array.isArray(raw)) {
    return base;
  }

  const merged = { ...base };
  raw.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return;
    }
    const record = item as ApiRecord;
    const id = pickString(record, 'id');
    if (!id || id === '-') {
      return;
    }
    merged[id] = {
      statusKey: pickString(record, 'status_key') !== '-' ? pickString(record, 'status_key') : merged[id]?.statusKey ?? 'needs_review',
      status: pickString(record, 'status') !== '-' ? pickString(record, 'status') : merged[id]?.status ?? 'Needs Review',
      remark: typeof record.remark === 'string' ? record.remark : merged[id]?.remark ?? '',
    };
  });

  return merged;
}

function mergeWeightSlipReview(
  base: EvidenceVerificationFormState['weightSlipReview'],
  raw: unknown,
): EvidenceVerificationFormState['weightSlipReview'] {
  if (!base || !raw || typeof raw !== 'object') {
    return base;
  }
  const record = raw as ApiRecord;
  const statusRaw = pickString(record, 'status');
  return {
    status: statusRaw === 'approved' || statusRaw === 'rejected' ? statusRaw : base.status,
    remark: typeof record.remark === 'string' ? record.remark : base.remark,
  };
}

export function buildEvidenceVerificationPayload(state: EvidenceVerificationFormState): ApiRecord {
  return {
    verification_result: state.verificationResult,
    officer_remarks: state.officerRemarks || state.finalRemarks || null,
    final_remarks: state.finalRemarks || null,
    correction_reason: state.correctionReason || null,
    required_evidence: state.requiredEvidence || null,
    correction_due_date: state.correctionDueDate || null,
    rejection_reason: state.rejectionReason || null,
    evidence_notes: state.evidenceNotes || null,
    completion_checklist: state.completionChecklist,
    feedstock_photo_reviews: Object.entries(state.feedstockPhotoReviews).map(([id, review]) => ({
      id,
      status: review.status,
      remark: review.remark || null,
    })),
    production_photo_reviews: Object.entries(state.productionPhotoReviews).map(([id, review]) => ({
      id,
      status: review.status,
      remark: review.remark || null,
    })),
    application_photo_reviews: Object.entries(state.applicationPhotoReviews).map(([id, review]) => ({
      id,
      status: review.status,
      remark: review.remark || null,
    })),
    gps_record_reviews: Object.entries(state.gpsRecordReviews).map(([id, review]) => ({
      id,
      status: review.status,
      status_key: review.statusKey,
      remark: review.remark || null,
    })),
    weight_slip_review: state.weightSlipReview
      ? { status: state.weightSlipReview.status, remark: state.weightSlipReview.remark || null }
      : null,
    document_reviews: Object.entries(state.documentReviews).map(([id, review]) => ({
      id,
      status: review.status,
      remark: review.remark || null,
    })),
  };
}

function categoryReviewed(reviews: Record<string, { status: EvidenceReviewStatus }>, count: number): boolean {
  if (count === 0) {
    return true;
  }
  const values = Object.values(reviews);
  return values.length >= count && values.every((item) => item.status === 'approved' || item.status === 'rejected');
}

export function evidenceVerificationBlockers(
  state: EvidenceVerificationFormState,
  viewModel: EvidenceVerificationViewModel,
): string[] {
  const blockers: string[] = [];

  if (!categoryReviewed(state.feedstockPhotoReviews, viewModel.summary.feedstock_photos ?? 0)) {
    blockers.push('All feedstock photos must be reviewed');
  }

  if (!categoryReviewed(state.productionPhotoReviews, viewModel.summary.production_photos ?? 0)) {
    blockers.push('All production photos must be reviewed');
  }

  if (!categoryReviewed(state.applicationPhotoReviews, viewModel.summary.application_photos ?? 0)) {
    blockers.push('All application photos must be reviewed');
  }

  if (viewModel.weightSlip && state.weightSlipReview?.status !== 'approved' && state.weightSlipReview?.status !== 'rejected') {
    blockers.push('Weight slip must be reviewed');
  }

  if (!categoryReviewed(state.documentReviews, viewModel.summary.documents ?? 0)) {
    blockers.push('All required documents must be reviewed');
  }

  EVIDENCE_COMPLETION_CHECKLIST.forEach((item) => {
    if (!state.completionChecklist[item.key]) {
      blockers.push(`${item.label} must be checked`);
    }
  });

  if (!state.verificationResult) {
    blockers.push('Select final evidence result');
  }

  if (!state.officerRemarks.trim() && !state.finalRemarks.trim()) {
    blockers.push('Officer remarks are required');
  }

  return blockers;
}

export function canSubmitEvidenceVerification(
  state: EvidenceVerificationFormState,
  viewModel: EvidenceVerificationViewModel,
): boolean {
  return evidenceVerificationBlockers(state, viewModel).length === 0;
}

export function calculateEvidenceCompletionPercent(state: EvidenceVerificationFormState): number {
  const total = EVIDENCE_COMPLETION_CHECKLIST.length;
  const completed = EVIDENCE_COMPLETION_CHECKLIST.filter((item) => state.completionChecklist[item.key]).length;
  return Math.round((completed / total) * 100);
}

export function statusBadgeTone(status: EvidenceReviewStatus | string): 'approved' | 'rejected' | 'correction' | 'pending' | 'neutral' {
  if (status === 'approved' || status === 'Verified') {
    return 'approved';
  }
  if (status === 'rejected' || status === 'Rejected') {
    return 'rejected';
  }
  if (status === 'Needs Review' || status === 'needs_review' || status === 'Outside Radius') {
    return 'correction';
  }
  if (status === 'pending' || status === 'Pending') {
    return 'pending';
  }
  return 'neutral';
}
