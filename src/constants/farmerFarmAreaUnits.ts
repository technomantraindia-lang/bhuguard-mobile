export type FarmerFarmAreaUnit = 'acres' | 'bigha' | 'hectare';

export interface FarmerFarmAreaUnitOption {
  value: FarmerFarmAreaUnit;
  label: string;
}

export const FARMER_FARM_AREA_UNITS: FarmerFarmAreaUnitOption[] = [
  { value: 'acres', label: 'Acres' },
  { value: 'bigha', label: 'Bigha' },
  { value: 'hectare', label: 'Hectare' },
];

export const DEFAULT_FARM_AREA_UNIT: FarmerFarmAreaUnit = 'acres';

export function mapFarmAreaUnitToApi(unit: FarmerFarmAreaUnit): string {
  return unit;
}
