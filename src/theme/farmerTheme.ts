export const farmerTheme = {
  primary: '#85C95C',
  secondary: '#E7DF7C',
  tertiary: '#0B2E1F',
  cream: '#F4F0DF',
  creamSurface: '#F8F6E8',
  lightGreenSurface: '#EEF8EF',
  white: '#FFFFFF',
  deepText: '#111827',
  headingGreen: '#0B2E1F',
  actionGreen: '#0F7A45',
  secondaryText: '#6B7280',
  softBorder: 'rgba(11, 46, 31, 0.10)',
  error: '#DC2626',
  warning: '#D97706',
  dueSoon: '#F59E0B',
  draft: '#B8A93A',
  submitted: '#0F7A45',
  notStarted: '#6B7280',
  overdue: '#DC2626',
  cardShadow: {
    shadowColor: '#0B2E1F',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;

export type FarmerCycleTone = 'default' | 'warning' | 'danger' | 'success' | 'draft';

export function farmerCycleToneColor(tone: FarmerCycleTone): string {
  switch (tone) {
    case 'danger':
      return farmerTheme.overdue;
    case 'warning':
      return farmerTheme.dueSoon;
    case 'success':
      return farmerTheme.submitted;
    case 'draft':
      return farmerTheme.draft;
    default:
      return farmerTheme.notStarted;
  }
}
