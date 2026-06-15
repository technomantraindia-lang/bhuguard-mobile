import type { OnboardingDraft } from '../context/OnboardingContext';

const SERVICE_LABELS: Record<string, string> = {
  regenerative_agriculture: 'Regenerative Agriculture',
  agro_forestry: 'Agro Forestry',
  biochar: 'Biochar',
};

/** Merges UI-only fields into the backend `notes` field. */
export function buildOnboardingNotes(draft: OnboardingDraft): string {
  const lines: string[] = [];

  if (draft.notes.trim()) {
    lines.push(draft.notes.trim());
  }

  const extras: string[] = [];

  if (draft.alternate_mobile.trim()) {
    extras.push(`Alternate mobile: ${draft.alternate_mobile.trim()}`);
  }

  if (draft.gender.trim()) {
    extras.push(`Gender: ${draft.gender.trim()}`);
  }

  if (draft.age.trim()) {
    extras.push(`Age: ${draft.age.trim()}`);
  }

  if (draft.farmer_category.trim()) {
    extras.push(`Farmer category: ${draft.farmer_category.trim()}`);
  }

  if (draft.aadhaar_number.trim().length >= 4) {
    extras.push(`Aadhaar: ****${draft.aadhaar_number.trim().slice(-4)}`);
  }

  if (draft.preferred_language.trim()) {
    extras.push(`Preferred language: ${draft.preferred_language.trim()}`);
  }

  if (draft.address_line.trim()) {
    extras.push(`Address line: ${draft.address_line.trim()}`);
  }

  if (draft.ownership_type.trim()) {
    extras.push(`Ownership type: ${draft.ownership_type.trim()}`);
  }

  if (draft.existing_farming_practice.trim()) {
    extras.push(`Existing farming practice: ${draft.existing_farming_practice.trim()}`);
  }

  if (draft.service_interest.trim()) {
    const label = SERVICE_LABELS[draft.service_interest] ?? draft.service_interest;
    extras.push(`Service interest: ${label}`);
  }

  if (draft.remarks.trim()) {
    extras.push(`Remarks: ${draft.remarks.trim()}`);
  }

  if (draft.gps_captured_at.trim()) {
    extras.push(`GPS captured at: ${draft.gps_captured_at.trim()}`);
  }

  if (extras.length > 0) {
    lines.push(extras.join('\n'));
  }

  return lines.join('\n\n').trim();
}

export function formatFarmerCode(farmerId: number): string {
  return `BHG-FRM-${String(farmerId).padStart(6, '0')}`;
}
