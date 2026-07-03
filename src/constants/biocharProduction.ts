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

export type BiocharEvidenceKey =
  | 'feedstock_photo'
  | 'starting_pyrolysis_photo'
  | 'mid_stage_photo'
  | 'end_stage_before_quenching_photo'
  | 'quenching_photo'
  | 'biochar_unloaded_photo'
  | 'biochar_mixing_photo'
  | 'feedstock_image'
  | 'moisture_image'
  | 'process_image'
  | 'process_video'
  | 'batch_finish'
  | 'operator_with_biochar';

export type BiocharEvidenceSlot = {
  key: BiocharEvidenceKey;
  title: string;
  description: string;
  kind: 'photo' | 'video';
};

export const BIOCHAR_BATCH_EVIDENCE_SLOT: BiocharEvidenceSlot = {
  key: 'feedstock_photo',
  title: 'Feedstock Photo',
  description: 'Capture live photo of feedstock used for this biochar process.',
  kind: 'photo',
};

export const BIOCHAR_PROCESS_EVIDENCE_SLOTS: BiocharEvidenceSlot[] = [
  {
    key: 'starting_pyrolysis_photo',
    title: 'Starting of Pyrolysis Photo',
    description: 'Capture live photo at the start of pyrolysis.',
    kind: 'photo',
  },
  {
    key: 'mid_stage_photo',
    title: 'Mid Stage Photo',
    description: 'Capture live photo during the middle of pyrolysis.',
    kind: 'photo',
  },
  {
    key: 'end_stage_before_quenching_photo',
    title: 'End Stage Photo Before Quenching',
    description: 'Capture live photo just before quenching.',
    kind: 'photo',
  },
  {
    key: 'quenching_photo',
    title: 'Quenching Photo',
    description: 'Capture live photo of the quenching stage.',
    kind: 'photo',
  },
  {
    key: 'biochar_unloaded_photo',
    title: 'Biochar Unloaded Photo',
    description: 'Capture live photo of biochar unloading.',
    kind: 'photo',
  },
  {
    key: 'biochar_mixing_photo',
    title: 'Biochar Mixing Photo',
    description: 'Capture live photo of biochar mixing.',
    kind: 'photo',
  },
];

export const BIOCHAR_EVIDENCE_API_FIELD: Record<BiocharEvidenceKey, string> = {
  feedstock_photo: 'feedstock_photo',
  starting_pyrolysis_photo: 'starting_pyrolysis_photo',
  mid_stage_photo: 'mid_stage_photo',
  end_stage_before_quenching_photo: 'end_stage_before_quenching_photo',
  quenching_photo: 'quenching_photo',
  biochar_unloaded_photo: 'biochar_unloaded_photo',
  biochar_mixing_photo: 'biochar_mixing_photo',
  feedstock_image: 'feedstock_photo',
  moisture_image: 'moisture_photo',
  process_image: 'starting_pyrolysis_photo',
  process_video: 'mid_stage_photo',
  batch_finish: 'biochar_unloaded_photo',
  operator_with_biochar: 'biochar_mixing_photo',
};

export const BIOCHAR_MOISTURE_EVIDENCE_SLOT: BiocharEvidenceSlot = {
  key: 'moisture_image',
  title: 'Moisture Photo of Feedstock',
  description: 'Capture live photo of moisture reading or sample.',
  kind: 'photo',
};

export const BIOCHAR_OUTPUT_EVIDENCE_SLOT: BiocharEvidenceSlot = {
  key: 'batch_finish',
  title: 'Biochar Unloaded Photo',
  description: 'Capture live photo of finished biochar output after unloading.',
  kind: 'photo',
};

export const BIOCHAR_OPERATOR_EVIDENCE_SLOT: BiocharEvidenceSlot = {
  key: 'operator_with_biochar',
  title: 'Biochar Mixing Photo',
  description: 'Capture live photo of biochar mixing.',
  kind: 'photo',
};

export { FEEDSTOCK_QUANTITY_UNITS, FEEDSTOCK_TYPES };
