export interface FarmerActivityTypeOption {
  value: string;
  label: string;
}

export const FARMER_ACTIVITY_TYPES: FarmerActivityTypeOption[] = [
  { value: 'crop_sowing', label: 'Crop Sowing' },
  { value: 'fertilizer_use', label: 'Fertilizer' },
  { value: 'biochar_application', label: 'Biochar' },
  { value: 'composting', label: 'Composting' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'cover_crop', label: 'Cover Crop' },
  { value: 'residue_management', label: 'Residue Management' },
  { value: 'harvesting', label: 'Harvesting' },
  { value: 'soil_testing', label: 'Soil Testing' },
  { value: 'other', label: 'Other' },
];

export const DEFAULT_ACTIVITY_TYPE = 'fertilizer_use';
