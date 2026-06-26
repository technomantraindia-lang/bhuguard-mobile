export type ChecklistResult = 'pass' | 'fail' | null;

export type SectionResult = 'pass' | 'fail' | 'needs_correction' | null;

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
  remark: string;
  rejectionReason: string;
}

export interface FeedstockSectionChecklistDef {
  key: string;
  label: string;
}

export interface FeedstockSectionState {
  items: Record<string, boolean>;
  result: SectionResult;
  remarks: string;
}

export const FEEDSTOCK_TYPE_CHECKLIST: FeedstockSectionChecklistDef[] = [
  { key: 'type_matches_record', label: 'Feedstock type matches submitted record' },
  { key: 'allowed_for_project', label: 'Feedstock is allowed for project' },
  { key: 'crop_residue_based', label: 'Feedstock appears crop-residue based' },
  { key: 'no_prohibited_material', label: 'No prohibited material found' },
];

export const FEEDSTOCK_QUANTITY_CHECKLIST: FeedstockSectionChecklistDef[] = [
  { key: 'quantity_appears_correct', label: 'Quantity appears correct' },
  { key: 'matches_weight_slip', label: 'Quantity matches weight slip' },
  { key: 'within_acceptable_difference', label: 'Quantity within acceptable difference' },
  { key: 'unit_correct', label: 'Unit is correct' },
];

export const FEEDSTOCK_COLLECTION_DATE_CHECKLIST: FeedstockSectionChecklistDef[] = [
  { key: 'collection_date_valid', label: 'Collection date is valid' },
  { key: 'date_matches_evidence', label: 'Collection date matches evidence' },
  { key: 'submitted_within_time', label: 'Record submitted within allowed time' },
  { key: 'no_duplicate_record', label: 'No duplicate collection record found' },
];

export const FEEDSTOCK_WEIGHT_SLIP_CHECKLIST: FeedstockSectionChecklistDef[] = [
  { key: 'weight_slip_uploaded', label: 'Weight slip uploaded' },
  { key: 'weight_slip_readable', label: 'Weight slip is readable' },
  { key: 'quantity_matches_record', label: 'Quantity matches record' },
  { key: 'date_matches_collection', label: 'Date matches collection date' },
  { key: 'farmer_details_match', label: 'Farmer / supplier details match' },
];

export const FEEDSTOCK_GPS_CHECKLIST: FeedstockSectionChecklistDef[] = [
  { key: 'gps_location_captured', label: 'GPS location captured' },
  { key: 'gps_accuracy_acceptable', label: 'GPS accuracy acceptable' },
  { key: 'within_allowed_radius', label: 'Collection point within allowed radius' },
  { key: 'gps_timestamp_matches', label: 'GPS timestamp matches collection date' },
];

export const FEEDSTOCK_PHOTOS_CHECKLIST: FeedstockSectionChecklistDef[] = [
  { key: 'minimum_photos_uploaded', label: 'Minimum required photos uploaded' },
  { key: 'photos_clear', label: 'Photos are clear' },
  { key: 'photos_show_feedstock', label: 'Photos show actual feedstock' },
  { key: 'photos_match_location', label: 'Photos match collection location' },
  { key: 'photos_not_duplicate', label: 'Photos are not duplicate' },
];

export const FEEDSTOCK_VERIFICATION_PROGRESS_STEPS: Array<{ key: string; label: string }> = [
  { key: 'feedstock_type', label: 'Feedstock Type' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'collection_date', label: 'Collection Date' },
  { key: 'weight_slip', label: 'Weight Slip' },
  { key: 'gps', label: 'GPS' },
  { key: 'photos', label: 'Photos' },
];

/** Backend API checklist keys — compiled from section state on save/submit. */
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

export function defaultSectionState(defs: FeedstockSectionChecklistDef[]): FeedstockSectionState {
  return {
    items: Object.fromEntries(defs.map((item) => [item.key, false])),
    result: null,
    remarks: '',
  };
}

export function defaultFeedstockVerificationSections(): {
  typeVerification: FeedstockSectionState;
  quantityVerification: FeedstockSectionState;
  collectionDateVerification: FeedstockSectionState;
  weightSlipVerification: FeedstockSectionState;
  gpsVerification: FeedstockSectionState;
  photosVerification: FeedstockSectionState;
} {
  return {
    typeVerification: defaultSectionState(FEEDSTOCK_TYPE_CHECKLIST),
    quantityVerification: defaultSectionState(FEEDSTOCK_QUANTITY_CHECKLIST),
    collectionDateVerification: defaultSectionState(FEEDSTOCK_COLLECTION_DATE_CHECKLIST),
    weightSlipVerification: defaultSectionState(FEEDSTOCK_WEIGHT_SLIP_CHECKLIST),
    gpsVerification: defaultSectionState(FEEDSTOCK_GPS_CHECKLIST),
    photosVerification: defaultSectionState(FEEDSTOCK_PHOTOS_CHECKLIST),
  };
}
