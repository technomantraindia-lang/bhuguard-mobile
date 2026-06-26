import type { VerificationResult } from './feedstockVerificationChecklist';

export interface FarmChecklistItemDef {
  key: string;
  label: string;
}

export const FARM_EXISTENCE_CHECKLIST: FarmChecklistItemDef[] = [
  { key: 'farm_exists_physically', label: 'Farm Exists Physically' },
  { key: 'farmer_present', label: 'Farmer Present' },
  { key: 'farm_accessible', label: 'Farm Accessible' },
  { key: 'farm_matches_address', label: 'Farm Matches Registered Address' },
];

export const FARM_BOUNDARY_CHECKLIST: FarmChecklistItemDef[] = [
  { key: 'boundary_matches_registration', label: 'Boundary Matches Registration' },
  { key: 'boundary_points_correct', label: 'Boundary Points Correct' },
  { key: 'encroachment_not_found', label: 'Encroachment Not Found' },
  { key: 'boundary_visible', label: 'Boundary Visible' },
];

export const FARM_LAND_AREA_CHECKLIST: FarmChecklistItemDef[] = [
  { key: 'land_area_matches', label: 'Land Area Matches' },
  { key: 'area_difference_within_limit', label: 'Area Difference Within Limit' },
  { key: 'farm_size_verified', label: 'Farm Size Verified' },
];

export const FARM_CROP_CHECKLIST: FarmChecklistItemDef[] = [
  { key: 'crop_type_correct', label: 'Crop Type Correct' },
  { key: 'crop_area_matches', label: 'Crop Area Matches' },
  { key: 'crop_stage_correct', label: 'Crop Stage Correct' },
  { key: 'farm_activity_ongoing', label: 'Farm Activity Ongoing' },
];

export const FARM_ACTIVE_STATUS_CHECKLIST: FarmChecklistItemDef[] = [
  { key: 'farm_currently_active', label: 'Farm Currently Active' },
  { key: 'agricultural_activity_present', label: 'Agricultural Activity Present' },
  { key: 'land_not_abandoned', label: 'Land Not Abandoned' },
  { key: 'land_not_converted', label: 'Land Not Converted' },
  { key: 'farmer_managing_farm', label: 'Farmer Managing Farm' },
];

export const FARM_VERIFICATION_PROGRESS_STEPS: Array<{ key: string; label: string }> = [
  { key: 'farm_exists', label: 'Farm Exists' },
  { key: 'boundary', label: 'Boundary' },
  { key: 'land_area', label: 'Land Area' },
  { key: 'crop', label: 'Crop' },
  { key: 'farm_active', label: 'Farm Active' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'signatures', label: 'Signatures' },
];

export const BOUNDARY_ISSUE_OPTIONS = [
  { value: 'boundary_expanded', label: 'Boundary Expanded' },
  { value: 'boundary_reduced', label: 'Boundary Reduced' },
  { value: 'mapping_error', label: 'Mapping Error' },
  { value: 'wrong_plot', label: 'Wrong Plot' },
  { value: 'other', label: 'Other' },
] as const;

export const CROP_CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'average', label: 'Average' },
  { value: 'poor', label: 'Poor' },
] as const;

export const FARM_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'partially_active', label: 'Partially Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export const FARM_VERIFICATION_RESULT_OPTIONS: Array<{ value: VerificationResult; label: string }> = [
  { value: 'approved', label: 'Approved' },
  { value: 'approved_with_remarks', label: 'Approved with Remarks' },
  { value: 'correction_required', label: 'Correction Required' },
  { value: 'rejected', label: 'Rejected' },
];

export type FarmPhotoKey =
  | 'farm_entrance'
  | 'farm_overview'
  | 'crop_photo_1'
  | 'crop_photo_2'
  | 'crop_closeup';

export const FARM_EXISTENCE_PHOTO_KEYS: FarmPhotoKey[] = ['farm_entrance', 'farm_overview'];

export const FARM_CROP_PHOTO_KEYS: FarmPhotoKey[] = ['crop_photo_1', 'crop_photo_2', 'crop_closeup'];

export const FARM_PHOTO_LABELS: Record<FarmPhotoKey, string> = {
  farm_entrance: 'Farm Entrance Photo',
  farm_overview: 'Farm Overview Photo',
  crop_photo_1: 'Crop Photo 1',
  crop_photo_2: 'Crop Photo 2',
  crop_closeup: 'Crop Close-up',
};

export type BoundaryIssueType = (typeof BOUNDARY_ISSUE_OPTIONS)[number]['value'];
export type CropCondition = (typeof CROP_CONDITION_OPTIONS)[number]['value'];
export type FarmActiveStatus = (typeof FARM_STATUS_OPTIONS)[number]['value'];

export function defaultChecklistItems(defs: FarmChecklistItemDef[]): Record<string, boolean> {
  return Object.fromEntries(defs.map((item) => [item.key, false]));
}

export function defaultFarmPhotos(): Record<FarmPhotoKey, string | null> {
  return {
    farm_entrance: null,
    farm_overview: null,
    crop_photo_1: null,
    crop_photo_2: null,
    crop_closeup: null,
  };
}
