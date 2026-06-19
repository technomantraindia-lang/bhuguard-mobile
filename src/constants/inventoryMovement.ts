export type InventoryMovementType =
  | 'storage_to_farm'
  | 'farm_to_storage'
  | 'storage_to_storage';

export type InventoryMovementStatus = 'draft' | 'submitted';

export type InventoryEvidenceKey =
  | 'stock_loading'
  | 'transport_vehicle'
  | 'delivery_location'
  | 'stock_receipt';

export const INVENTORY_MOVEMENT_TYPE_OPTIONS: Array<{ value: InventoryMovementType; label: string }> = [
  { value: 'storage_to_farm', label: 'Storage → Farm' },
  { value: 'farm_to_storage', label: 'Farm → Storage' },
  { value: 'storage_to_storage', label: 'Storage → Storage' },
];

export const INVENTORY_EVIDENCE_SLOTS: Array<{ key: InventoryEvidenceKey; label: string; icon: string }> = [
  { key: 'stock_loading', label: 'Stock Loading', icon: 'inventory_2' },
  { key: 'transport_vehicle', label: 'Transport Vehicle', icon: 'local_shipping' },
  { key: 'delivery_location', label: 'Delivery Location', icon: 'place' },
  { key: 'stock_receipt', label: 'Stock Receipt', icon: 'receipt_long' },
];
