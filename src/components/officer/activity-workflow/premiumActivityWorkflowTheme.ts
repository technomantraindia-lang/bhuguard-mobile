import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';

export const premiumWorkflowTheme = {
  gradient: ['#F0F9F3', '#E4F4EA', '#F6FAF4'] as const,
  glassBackground: 'rgba(255, 255, 255, 0.82)',
  glassBorder: 'rgba(11, 107, 58, 0.12)',
  cardRadius: 22,
  stepCardRadius: 24,
  primaryGreen: officerTheme.primary,
  primaryGreenSoft: 'rgba(11, 107, 58, 0.12)',
  textPrimary: officerTheme.onSurface,
  textSecondary: '#5F6B63',
  textMuted: '#7A857D',
  lineInactive: '#D5DED8',
  lineActive: officerTheme.primary,
  shadow: officerCardShadow,
  animationMs: 260,
};

export interface ActivityWorkflowStepMeta {
  key: string;
  label: string;
  shortLabel: string;
  icon: 'start' | 'checkin' | 'verify' | 'evidence' | 'submit';
  title: string;
  description: string;
}

export const FARM_VERIFICATION_STEPS: ActivityWorkflowStepMeta[] = [
  {
    key: 'start',
    label: 'Start',
    shortLabel: 'Start',
    icon: 'start',
    title: 'Start Farm Activity',
    description: "Start today's farm activity and lock the selected farm.",
  },
  {
    key: 'checkin',
    label: 'Check-in',
    shortLabel: 'Check-in',
    icon: 'checkin',
    title: 'Check-in at Farm',
    description: 'Capture your GPS location at the farm.',
  },
  {
    key: 'upload',
    label: 'Upload Photo',
    shortLabel: 'Upload',
    icon: 'evidence',
    title: 'Upload Photo',
    description: 'Capture or upload farm photos, then submit.',
  },
];

export const BIOCHAR_ACTIVITY_STEPS: ActivityWorkflowStepMeta[] = [
  {
    key: 'start',
    label: 'Start',
    shortLabel: 'Start',
    icon: 'start',
    title: 'Start Activity',
    description: "Start today's Biochar field activity.",
  },
  {
    key: 'checkin',
    label: 'Check-in',
    shortLabel: 'Check-in',
    icon: 'checkin',
    title: 'Check-in',
    description: 'Capture your GPS location at the farm.',
  },
  {
    key: 'verify',
    label: 'Verify Farm',
    shortLabel: 'Verify',
    icon: 'verify',
    title: 'Verify Farm',
    description: 'Confirm farm ID, farmer name, and farmer image.',
  },
  {
    key: 'evidence',
    label: 'Upload Biochar Activity',
    shortLabel: 'Evidence',
    icon: 'evidence',
    title: 'Upload Biochar Activity',
    description: 'Capture Biochar application evidence with GPS stamp.',
  },
  {
    key: 'submit',
    label: 'Submit',
    shortLabel: 'Submit',
    icon: 'submit',
    title: 'Submit',
    description: 'Review and submit your Biochar activity.',
  },
];
