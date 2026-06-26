import type { VerificationResult } from './feedstockVerificationChecklist';

export type SectionResult = 'pass' | 'fail' | 'needs_correction';

export interface BiocharApplicationChecklistItemDef {
  key: string;
  label: string;
}

export const BIOCHAR_PLOT_CHECKLIST: BiocharApplicationChecklistItemDef[] = [
  { key: 'plot_id_matches', label: 'Plot ID matches registered farm plot' },
  { key: 'plot_inside_boundary', label: 'Plot is inside mapped farm boundary' },
  { key: 'plot_gps_valid', label: 'Plot location GPS is valid' },
  { key: 'plot_not_duplicate', label: 'Plot not already used for duplicate application' },
];

export const BIOCHAR_BATCH_CHECKLIST: BiocharApplicationChecklistItemDef[] = [
  { key: 'batch_exists', label: 'Batch ID exists' },
  { key: 'batch_approved_production', label: 'Batch belongs to approved production record' },
  { key: 'batch_quality_acceptable', label: 'Batch quality status acceptable' },
  { key: 'batch_sufficient_quantity', label: 'Batch has sufficient available quantity' },
  { key: 'batch_not_expired', label: 'Batch not expired / invalid' },
];

export const BIOCHAR_QUANTITY_CHECKLIST: BiocharApplicationChecklistItemDef[] = [
  { key: 'quantity_correct', label: 'Quantity applied is correct' },
  { key: 'quantity_within_stock', label: 'Quantity does not exceed available batch stock' },
  { key: 'unit_correct', label: 'Unit is correct' },
  { key: 'quantity_matches_evidence', label: 'Quantity matches evidence' },
];

export const BIOCHAR_DATE_CHECKLIST: BiocharApplicationChecklistItemDef[] = [
  { key: 'date_valid', label: 'Application date is valid' },
  { key: 'date_matches_photo_timestamp', label: 'Application date matches photo timestamp' },
  { key: 'date_within_reporting_period', label: 'Application is within project reporting period' },
  { key: 'no_duplicate_plot_batch', label: 'No duplicate application for same plot and batch' },
];

export const BIOCHAR_BEFORE_PHOTO_CHECKLIST: BiocharApplicationChecklistItemDef[] = [
  { key: 'before_uploaded', label: 'Before photo uploaded' },
  { key: 'before_clear', label: 'Before photo is clear' },
  { key: 'before_correct_plot', label: 'Before photo shows correct plot' },
  { key: 'before_gps_timestamp', label: 'GPS/timestamp available' },
];

export const BIOCHAR_DURING_PHOTO_CHECKLIST: BiocharApplicationChecklistItemDef[] = [
  { key: 'during_uploaded', label: 'During photo uploaded' },
  { key: 'during_shows_activity', label: 'Photo shows biochar application activity' },
  { key: 'during_worker_visible', label: 'Worker/material visible' },
  { key: 'during_gps_timestamp', label: 'GPS/timestamp available' },
];

export const BIOCHAR_AFTER_PHOTO_CHECKLIST: BiocharApplicationChecklistItemDef[] = [
  { key: 'after_uploaded', label: 'After photo uploaded' },
  { key: 'after_completed', label: 'Photo shows completed application' },
  { key: 'after_plot_visible', label: 'Plot condition visible' },
  { key: 'after_gps_timestamp', label: 'GPS/timestamp available' },
];

export const BIOCHAR_APPLICATION_PROGRESS_STEPS: Array<{ key: string; label: string }> = [
  { key: 'plot_id', label: 'Plot ID' },
  { key: 'batch_id', label: 'Batch ID' },
  { key: 'quantity', label: 'Quantity Applied' },
  { key: 'application_date', label: 'Application Date' },
  { key: 'before_photo', label: 'Before Photo' },
  { key: 'during_photo', label: 'During Photo' },
  { key: 'after_photo', label: 'After Photo' },
];

export const BIOCHAR_APPLICATION_RESULT_OPTIONS: Array<{ value: VerificationResult; label: string }> = [
  { value: 'approved', label: 'Approved' },
  { value: 'approved_with_remarks', label: 'Approved with Remarks' },
  { value: 'correction_required', label: 'Correction Required' },
  { value: 'rejected', label: 'Rejected' },
];

export const SECTION_RESULT_OPTIONS: Array<{ value: SectionResult; label: string }> = [
  { value: 'pass', label: 'Pass' },
  { value: 'fail', label: 'Fail' },
  { value: 'needs_correction', label: 'Needs Correction' },
];

export type BiocharPhotoPhase = 'before' | 'during' | 'after';

export interface BiocharSectionState {
  items: Record<string, boolean>;
  result: SectionResult | null;
  remarks: string;
}

export interface BiocharPhotoReview {
  phase: BiocharPhotoPhase;
  approved: boolean | null;
  rejectionReason: string;
}

export function defaultSectionItems(defs: BiocharApplicationChecklistItemDef[]): Record<string, boolean> {
  return Object.fromEntries(defs.map((item) => [item.key, false]));
}

export function defaultBiocharSections() {
  return {
    plot: { items: defaultSectionItems(BIOCHAR_PLOT_CHECKLIST), result: null as SectionResult | null, remarks: '' },
    batch: { items: defaultSectionItems(BIOCHAR_BATCH_CHECKLIST), result: null as SectionResult | null, remarks: '' },
    quantity: { items: defaultSectionItems(BIOCHAR_QUANTITY_CHECKLIST), result: null as SectionResult | null, remarks: '' },
    applicationDate: { items: defaultSectionItems(BIOCHAR_DATE_CHECKLIST), result: null as SectionResult | null, remarks: '' },
    beforePhoto: { items: defaultSectionItems(BIOCHAR_BEFORE_PHOTO_CHECKLIST), result: null as SectionResult | null, remarks: '' },
    duringPhoto: { items: defaultSectionItems(BIOCHAR_DURING_PHOTO_CHECKLIST), result: null as SectionResult | null, remarks: '' },
    afterPhoto: { items: defaultSectionItems(BIOCHAR_AFTER_PHOTO_CHECKLIST), result: null as SectionResult | null, remarks: '' },
  };
}
