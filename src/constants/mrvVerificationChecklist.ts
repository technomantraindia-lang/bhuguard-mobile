import type { VerificationResult } from './feedstockVerificationChecklist';

export type GpsVerificationStatus = 'pending' | 'verified' | 'failed';
export type EvidenceReviewStatus = 'pending' | 'approved' | 'rejected';

export interface MrvChecklistItemDef {
  key: string;
  label: string;
}

export const MRV_FARM_CHECKLIST: MrvChecklistItemDef[] = [
  { key: 'farm_exists', label: 'Farm Exists' },
  { key: 'boundary_matches_mapping', label: 'Boundary Matches Mapping' },
  { key: 'land_area_verified', label: 'Land Area Verified' },
  { key: 'crop_details_verified', label: 'Crop Details Verified' },
  { key: 'farm_active', label: 'Farm Active' },
];

export const MRV_FEEDSTOCK_CHECKLIST: MrvChecklistItemDef[] = [
  { key: 'feedstock_type_matches', label: 'Feedstock Type Matches' },
  { key: 'quantity_verified', label: 'Quantity Verified' },
  { key: 'collection_date_verified', label: 'Collection Date Verified' },
  { key: 'weight_slip_verified', label: 'Weight Slip Verified' },
  { key: 'gps_verified', label: 'GPS Verified' },
  { key: 'photos_verified', label: 'Photos Verified' },
];

export const MRV_PRODUCTION_CHECKLIST: MrvChecklistItemDef[] = [
  { key: 'batch_id_verified', label: 'Batch ID Verified' },
  { key: 'kiln_id_verified', label: 'Kiln ID Verified' },
  { key: 'operator_verified', label: 'Operator Verified' },
  { key: 'temperature_recorded', label: 'Temperature Recorded' },
  { key: 'yield_recorded', label: 'Yield Recorded' },
  { key: 'production_evidence_verified', label: 'Production Evidence Verified' },
];

export const MRV_APPLICATION_CHECKLIST: MrvChecklistItemDef[] = [
  { key: 'plot_id_verified', label: 'Plot ID Verified' },
  { key: 'batch_id_verified', label: 'Batch ID Verified' },
  { key: 'quantity_applied_verified', label: 'Quantity Applied Verified' },
  { key: 'application_date_verified', label: 'Application Date Verified' },
  { key: 'before_photo_verified', label: 'Before Photo Verified' },
  { key: 'during_photo_verified', label: 'During Photo Verified' },
  { key: 'after_photo_verified', label: 'After Photo Verified' },
];

export const MRV_INVENTORY_CHECKLIST: MrvChecklistItemDef[] = [
  { key: 'inventory_movement_verified', label: 'Inventory Movement Verified' },
  { key: 'quantity_matches', label: 'Quantity Matches' },
  { key: 'storage_record_matches', label: 'Storage Record Matches' },
  { key: 'farm_delivery_verified', label: 'Farm Delivery Verified' },
];

export const MRV_PROGRESS_STEPS: Array<{ key: string; label: string }> = [
  { key: 'gps_check_in', label: 'GPS Check-In' },
  { key: 'farm_verification', label: 'Farm Verification' },
  { key: 'feedstock_verification', label: 'Feedstock Verification' },
  { key: 'production_verification', label: 'Production Verification' },
  { key: 'application_verification', label: 'Application Verification' },
  { key: 'inventory_verification', label: 'Inventory Verification' },
  { key: 'evidence_verification', label: 'Evidence Verification' },
  { key: 'signatures', label: 'Signatures' },
];

export const MRV_VERIFICATION_RESULT_OPTIONS: Array<{ value: VerificationResult; label: string }> = [
  { value: 'approved', label: 'Approved' },
  { value: 'approved_with_remarks', label: 'Approved with Remarks' },
  { value: 'correction_required', label: 'Correction Required' },
  { value: 'rejected', label: 'Rejected' },
];

export type MrvSectionKey = 'farm' | 'feedstock' | 'production' | 'application' | 'inventory';

export function defaultSectionItems(defs: MrvChecklistItemDef[]): Record<string, boolean> {
  return Object.fromEntries(defs.map((item) => [item.key, false]));
}
