import { FEEDSTOCK_QUANTITY_UNITS, FEEDSTOCK_TYPES } from './feedstockTypes';

export const BIOCHAR_OUTPUT_UNITS = [
  { value: 'kg', label: 'Kg' },
  { value: 'ton', label: 'Ton' },
] as const;

export type BiocharOutputUnit = (typeof BIOCHAR_OUTPUT_UNITS)[number]['value'];

export type BiocharVerificationResult = 'draft' | 'review' | 'completed' | 'correction';

export const BIOCHAR_VERIFICATION_OPTIONS: Array<{ value: BiocharVerificationResult; label: string }> = [
  { value: 'draft', label: 'Save as Draft' },
  { value: 'review', label: 'Submit for Review' },
  { value: 'completed', label: 'Mark as Completed' },
  { value: 'correction', label: 'Correction Required' },
];

export type BiocharEvidenceKey = 'kiln_setup' | 'production_video' | 'batch_output' | 'operator_photo';

export const BIOCHAR_EVIDENCE_SLOTS: Array<{ key: BiocharEvidenceKey; label: string; kind: 'photo' | 'video' }> = [
  { key: 'kiln_setup', label: 'Kiln Setup Photo', kind: 'photo' },
  { key: 'production_video', label: 'Production Video', kind: 'video' },
  { key: 'batch_output', label: 'Batch Output', kind: 'photo' },
  { key: 'operator_photo', label: 'Operator Photo', kind: 'photo' },
];

export { FEEDSTOCK_QUANTITY_UNITS, FEEDSTOCK_TYPES };
