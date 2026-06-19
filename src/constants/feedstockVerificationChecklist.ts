export type ChecklistResult = 'pass' | 'fail' | null;

export type VerificationResult =
  | 'approved'
  | 'approved_with_remarks'
  | 'correction_required'
  | 'rejected'
  | null;

export interface FeedstockChecklistItem {
  key: string;
  label: string;
  result: ChecklistResult;
  remarks: string;
}

export interface FeedstockPhotoReview {
  photoId: number;
  approved: boolean | null;
  rejected: boolean | null;
}

export const FEEDSTOCK_VERIFICATION_CHECKLIST: Array<{ key: string; label: string }> = [
  { key: 'feedstock_type_matches', label: 'Feedstock Type Matches' },
  { key: 'quantity_correct', label: 'Quantity Appears Correct' },
  { key: 'collection_date_correct', label: 'Collection Date Correct' },
  { key: 'material_quality_acceptable', label: 'Material Quality Acceptable' },
  { key: 'not_previously_verified', label: 'Feedstock Not Previously Verified' },
  { key: 'gps_location_valid', label: 'GPS Location Valid' },
];

export const VERIFICATION_RESULT_OPTIONS: Array<{ value: VerificationResult; label: string }> = [
  { value: 'approved', label: 'Approved' },
  { value: 'approved_with_remarks', label: 'Approved with Remarks' },
  { value: 'correction_required', label: 'Correction Required' },
  { value: 'rejected', label: 'Rejected' },
];

export function defaultChecklistItems(): FeedstockChecklistItem[] {
  return FEEDSTOCK_VERIFICATION_CHECKLIST.map((item) => ({
    key: item.key,
    label: item.label,
    result: null,
    remarks: '',
  }));
}
