export const FIELD_OFFICER_SERVICE_INTEREST_OPTIONS = [
  { label: 'Biochar', value: 'Biochar' },
] as const;

export const DEFAULT_FIELD_OFFICER_SERVICE_INTERESTS = FIELD_OFFICER_SERVICE_INTEREST_OPTIONS.map(
  (option) => option.value,
);

export function formatServiceInterestLabel(value: string): string {
  const match = FIELD_OFFICER_SERVICE_INTEREST_OPTIONS.find((option) => option.value === value);
  return match?.label ?? value;
}

export function normalizeServiceInterests(values: string[]): string[] {
  const allowed = new Set<string>(DEFAULT_FIELD_OFFICER_SERVICE_INTERESTS);
  const normalized = values.filter((value) => allowed.has(value));
  return normalized.length > 0 ? normalized : [...DEFAULT_FIELD_OFFICER_SERVICE_INTERESTS];
}
