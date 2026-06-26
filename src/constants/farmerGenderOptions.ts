export const FARMER_GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

export type FarmerGenderValue = (typeof FARMER_GENDER_OPTIONS)[number]['value'];

export function genderLabel(value: string): string {
  return FARMER_GENDER_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
