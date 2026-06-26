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

/** Evidence keys in production flow order (after batch details). */
export type BiocharEvidenceKey =
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

/** Shown after feedstock evidence — moisture reading proof. */
export const BIOCHAR_MOISTURE_EVIDENCE_SLOT: BiocharEvidenceSlot = {
  key: 'moisture_image',
  title: 'Moisture Image',
  description: 'Capture live photo of moisture reading or sample.',
  kind: 'photo',
};

/** Shown immediately after Production Batch section. */
export const BIOCHAR_BATCH_EVIDENCE_SLOT: BiocharEvidenceSlot = {
  key: 'feedstock_image',
  title: 'Feedstock Live Image',
  description: 'Capture live photo of feedstock used for this production batch.',
  kind: 'photo',
};

/** Shown after production process data — during / mid-production evidence. */
export const BIOCHAR_PROCESS_EVIDENCE_SLOTS: BiocharEvidenceSlot[] = [
  {
    key: 'process_image',
    title: 'Process Live Image',
    description: 'Capture live photo during the middle of the production process.',
    kind: 'photo',
  },
  {
    key: 'process_video',
    title: 'Process Video',
    description: 'Record a short live video during production.',
    kind: 'video',
  },
];

/** Shown after batch is finished. */
export const BIOCHAR_OUTPUT_EVIDENCE_SLOT: BiocharEvidenceSlot = {
  key: 'batch_finish',
  title: 'Batch Finish Image',
  description: 'Capture live photo of finished biochar output after the batch completes.',
  kind: 'photo',
};

/** Final operator evidence. */
export const BIOCHAR_OPERATOR_EVIDENCE_SLOT: BiocharEvidenceSlot = {
  key: 'operator_with_biochar',
  title: 'Operator with Biochar',
  description: 'Capture live photo of the operator with the finished biochar.',
  kind: 'photo',
};

export const BIOCHAR_EVIDENCE_API_FIELD: Record<BiocharEvidenceKey, string> = {
  feedstock_image: 'feedstock_photo',
  moisture_image: 'moisture_photo',
  process_image: 'production_photo',
  process_video: 'production_video',
  batch_finish: 'batch_output_photo',
  operator_with_biochar: 'operator_photo',
};

export { FEEDSTOCK_QUANTITY_UNITS, FEEDSTOCK_TYPES };
