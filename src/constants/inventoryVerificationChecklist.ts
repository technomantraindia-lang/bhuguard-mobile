export type InventoryVerificationResult = 'verified' | 'correction_required' | 'rejected';

export type InventoryMatchStatus = 'matched' | 'mismatch' | 'pending';

export type InventoryEvidenceCategory =
  | 'stock_photo'
  | 'storage_location_photo'
  | 'delivery_proof_photo'
  | 'receiver_confirmation_photo'
  | 'weight_slip_photo';

export interface InventoryChecklistItemDef {
  key: string;
  label: string;
}

export const INVENTORY_VERIFICATION_CHECKLIST: InventoryChecklistItemDef[] = [
  { key: 'stock_quantity_correct', label: 'Stock Quantity Correct' },
  { key: 'storage_location_correct', label: 'Storage Location Correct' },
  { key: 'farm_delivery_completed', label: 'Farm Delivery Completed' },
  { key: 'inventory_movement_matched', label: 'Inventory Movement Matched' },
  { key: 'gps_location_captured', label: 'GPS Location Captured' },
  { key: 'proof_photo_uploaded', label: 'Proof Photo Uploaded' },
  { key: 'receiver_confirmation_taken', label: 'Receiver Confirmation Taken' },
  { key: 'remarks_added', label: 'Remarks Added' },
];

export const INVENTORY_EVIDENCE_CATEGORIES: Array<{ key: InventoryEvidenceCategory; label: string }> = [
  { key: 'stock_photo', label: 'Stock Photo' },
  { key: 'storage_location_photo', label: 'Storage Location Photo' },
  { key: 'delivery_proof_photo', label: 'Delivery Proof Photo' },
  { key: 'receiver_confirmation_photo', label: 'Receiver Confirmation Photo' },
  { key: 'weight_slip_photo', label: 'Weight Slip Photo' },
];

export const INVENTORY_VERIFICATION_RESULT_OPTIONS: Array<{
  value: InventoryVerificationResult;
  label: string;
  description: string;
}> = [
  {
    value: 'verified',
    label: 'Verified',
    description: 'All checks passed. Submit report to admin for final approval.',
  },
  {
    value: 'correction_required',
    label: 'Correction Required',
    description: 'Issues found that require admin or company follow-up.',
  },
  {
    value: 'rejected',
    label: 'Rejected',
    description: 'Verification failed. Admin will review rejection reason.',
  },
];

export function defaultInventoryChecklistState(): Record<string, boolean> {
  return Object.fromEntries(INVENTORY_VERIFICATION_CHECKLIST.map((item) => [item.key, false]));
}
