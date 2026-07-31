export type InventoryUtilizationType = 'applied_to_farm' | 'sold' | 'kept_in_stock' | 'wasted';

export const INVENTORY_UTILIZATION_OPTIONS: Array<{ value: InventoryUtilizationType; label: string }> = [
  { value: 'applied_to_farm', label: 'Applied to Farm' },
  { value: 'sold', label: 'Sold' },
  { value: 'kept_in_stock', label: 'Kept in Stock' },
  { value: 'wasted', label: 'Wasted / Disposed' },
];
