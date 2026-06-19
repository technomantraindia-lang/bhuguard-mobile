export const ONBOARDING_STEP_TOTAL = 6;

export const ONBOARDING_STEPS = [
  { id: 1, label: 'Basic Details', icon: 'person' as const },
  { id: 2, label: 'Consent & Legal', icon: 'consent' as const },
  { id: 3, label: 'Land Registration', icon: 'landscape' as const },
  { id: 4, label: 'Land Mapping', icon: 'share_location' as const },
  { id: 5, label: 'Documents', icon: 'folder' as const },
  { id: 6, label: 'Final Review', icon: 'assignment_turned_in' as const },
];

export const ONBOARDING_NEXT_LABELS: Record<number, string> = {
  1: 'Continue to Consent',
  2: 'Continue to Land Info',
  3: 'Continue to Land Mapping',
  4: 'Continue to Documents',
  5: 'Continue to Final Review',
  6: 'Submit Registration',
};
