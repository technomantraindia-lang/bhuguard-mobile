export const ONBOARDING_STEP_TOTAL = 7;

export const ONBOARDING_STEPS = [
  { id: 1, label: 'Basic Details', icon: 'person' as const },
  { id: 2, label: 'Location Data', icon: 'share_location' as const },
  { id: 3, label: 'Consent & Legal', icon: 'consent' as const },
  { id: 4, label: 'Land Registration', icon: 'landscape' as const },
  { id: 5, label: 'Documents', icon: 'folder' as const },
  { id: 6, label: 'Final Review', icon: 'assignment_turned_in' as const },
  { id: 7, label: 'Submit', icon: 'send' as const },
];

export const ONBOARDING_NEXT_LABELS: Record<number, string> = {
  1: 'Continue to Location Data',
  2: 'Continue to Consent & Legal',
  3: 'Accept & Continue',
  4: 'Continue to Documents',
  5: 'Continue to Final Review',
  6: 'Submit for Admin Approval',
  7: 'Submit Registration',
};
