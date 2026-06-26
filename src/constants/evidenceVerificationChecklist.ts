import type { VerificationResult } from './feedstockVerificationChecklist';

export type EvidenceReviewStatus = 'pending' | 'approved' | 'rejected';

export const EVIDENCE_SUMMARY_CARDS = [
  { key: 'feedstock_photos', label: 'Feedstock Photos' },
  { key: 'production_photos', label: 'Production Photos' },
  { key: 'application_photos', label: 'Application Photos' },
  { key: 'gps_records', label: 'GPS Records' },
  { key: 'weight_slip', label: 'Weight Slip' },
  { key: 'documents', label: 'Documents' },
] as const;

export const EVIDENCE_COMPLETION_CHECKLIST = [
  { key: 'feedstock_photos_verified', label: 'Feedstock Photos Verified' },
  { key: 'production_photos_verified', label: 'Production Photos Verified' },
  { key: 'application_photos_verified', label: 'Application Photos Verified' },
  { key: 'gps_records_verified', label: 'GPS Records Verified' },
  { key: 'weight_slip_verified', label: 'Weight Slip Verified' },
  { key: 'documents_verified', label: 'Documents Verified' },
] as const;

export const EVIDENCE_RESULT_OPTIONS: Array<{ value: VerificationResult; label: string }> = [
  { value: 'approved', label: 'Evidence Approved' },
  { value: 'approved_with_remarks', label: 'Approved with Remarks' },
  { value: 'correction_required', label: 'Correction Required' },
  { value: 'rejected', label: 'Rejected' },
];

export type EvidenceCompletionKey = (typeof EVIDENCE_COMPLETION_CHECKLIST)[number]['key'];
export type EvidenceSummaryKey = (typeof EVIDENCE_SUMMARY_CARDS)[number]['key'];
