export const FEEDSTOCK_TYPES = [
  { value: 'cotton_stalk', label: 'Cotton Stalk' },
  { value: 'sugarcane_trash', label: 'Sugarcane Trash' },
  { value: 'castor_stalk', label: 'Castor Stalk' },
  { value: 'maize_residue', label: 'Maize Residue' },
  { value: 'tuver_residue', label: 'Tuver Residue' },
  { value: 'other', label: 'Other' },
] as const;

export type FeedstockTypeValue = (typeof FEEDSTOCK_TYPES)[number]['value'];

export const DEFAULT_FEEDSTOCK_TYPE: FeedstockTypeValue = FEEDSTOCK_TYPES[0].value;

export const FEEDSTOCK_QUANTITY_UNITS = [
  { value: 'kg', label: 'Kg' },
  { value: 'quintal', label: 'Quintal' },
  { value: 'ton', label: 'Ton' },
] as const;

export type FeedstockQuantityUnit = (typeof FEEDSTOCK_QUANTITY_UNITS)[number]['value'];

export const DEFAULT_FEEDSTOCK_QUANTITY_UNIT: FeedstockQuantityUnit = FEEDSTOCK_QUANTITY_UNITS[0].value;
