export interface FarmerActivityUnitOption {
  value: string;
  label: string;
}

export const FARMER_ACTIVITY_UNITS: FarmerActivityUnitOption[] = [
  { value: 'kg', label: 'Kg' },
  { value: 'ton', label: 'Ton' },
  { value: 'liter', label: 'Liter' },
  { value: 'bags', label: 'Bags' },
  { value: 'acres', label: 'Acres' },
];

export const DEFAULT_ACTIVITY_UNIT = 'kg';
