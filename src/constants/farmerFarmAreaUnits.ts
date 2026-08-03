// Bigha is intentionally excluded from the Farmer-facing area unit — client
// requires Farmer farms UI to only ever expose Acre / Hectare.
export type FarmerFarmAreaUnit = 'acres' | 'hectare';

export interface FarmerFarmAreaUnitOption {
  value: FarmerFarmAreaUnit;
  label: string;
}

export const FARMER_FARM_AREA_UNITS: FarmerFarmAreaUnitOption[] = [
  { value: 'acres', label: 'Acres' },
  { value: 'hectare', label: 'Hectare' },
];

export const DEFAULT_FARM_AREA_UNIT: FarmerFarmAreaUnit = 'acres';

export function mapFarmAreaUnitToApi(unit: FarmerFarmAreaUnit): string {
  return unit;
}

export function mapFarmAreaUnitFromApi(value: string): FarmerFarmAreaUnit {
  if (value === 'hectare') {
    return value;
  }

  return 'acres';
}
