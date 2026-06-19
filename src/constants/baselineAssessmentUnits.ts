export const BASELINE_YIELD_UNITS = [
  { value: 'ton/acre', label: 'Ton / Acre' },
  { value: 'kg/hectare', label: 'Kg / Hectare' },
  { value: 'quintal/acre', label: 'Quintal / Acre' },
] as const;

export type BaselineYieldUnit = (typeof BASELINE_YIELD_UNITS)[number]['value'];

export const DEFAULT_BASELINE_YIELD_UNIT: BaselineYieldUnit = BASELINE_YIELD_UNITS[0].value;
