const BIOCHAR_PRODUCTION_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  correction_required: 'Correction Required',
  produced: 'Produced',
  submitted_for_review: 'Submitted for Review',
  reviewed: 'Reviewed',
  completed: 'Completed',
  approved: 'Approved',
};

/** Convert backend snake_case / raw enum values into readable UI labels. */
export function formatStatusLabel(value: string | null | undefined, fallback = '—'): string {
  if (value == null) {
    return fallback;
  }

  const trimmed = String(value).trim();
  if (!trimmed || trimmed === '-') {
    return fallback;
  }

  const known = BIOCHAR_PRODUCTION_STATUS_LABELS[trimmed.toLowerCase()];
  if (known) {
    return known;
  }

  return trimmed
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
