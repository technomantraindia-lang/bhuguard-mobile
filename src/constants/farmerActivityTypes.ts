import type { BhuguardIconName } from '../components/shared/BhuguardMaterialIcon';

export interface FarmerActivityTypeOption {
  value: string;
  label: string;
  icon: BhuguardIconName;
}

/** Activity types farmers can record in the mobile app. */
export const FARMER_ACTIVITY_TYPES: FarmerActivityTypeOption[] = [
  { value: 'crop_sowing', label: 'Crop Sowing', icon: 'potted_plant' },
  { value: 'harvesting', label: 'Harvesting', icon: 'agriculture' },
  { value: 'fertilizer_use', label: 'Fertilizer Use', icon: 'eco' },
  { value: 'irrigation', label: 'Irrigation', icon: 'water_drop' },
  { value: 'biochar_application', label: 'Biochar Application', icon: 'co2' },
];

export const DEFAULT_ACTIVITY_TYPE = 'crop_sowing';

export function getFarmerActivityTypeOption(value: string): FarmerActivityTypeOption | undefined {
  return FARMER_ACTIVITY_TYPES.find((item) => item.value === value);
}

export function getFarmerActivityTypeLabel(value: string): string {
  const match = getFarmerActivityTypeOption(value);

  if (match) {
    return match.label;
  }

  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getFarmerActivityTypeIcon(value: string): BhuguardIconName {
  return getFarmerActivityTypeOption(value)?.icon ?? 'assignment';
}
