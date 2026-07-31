/** Approved Bhuguard Field Officer design tokens — dark primary accents. */
export const officerTheme = {
  background: '#F4F0DF',
  neutral: '#F4F0DF',
  surface: '#FFFFFF',
  surfaceLowest: '#FFFFFF',
  surfaceLow: 'rgba(11, 46, 31, 0.08)',
  surfaceContainer: 'rgba(255, 255, 255, 0.92)',
  surfaceContainerHigh: 'rgba(231, 223, 124, 0.28)',
  surfaceVariant: 'rgba(11, 46, 31, 0.06)',
  /** Dark forest — primary CTAs, titles, active states */
  primary: '#0B2E1F',
  /** Mid forest — icons / secondary accents (replaces old light lime) */
  primaryContainer: '#1F6B3A',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#FFFFFF',
  /** Soft lime — success chips only */
  accent: '#85C95C',
  secondary: '#E7DF7C',
  secondaryContainer: '#E7DF7C',
  secondaryFixed: '#E7DF7C',
  onSecondaryContainer: '#0B2E1F',
  onSecondaryFixedVariant: '#0B2E1F',
  onSurface: '#0B2E1F',
  onSurfaceVariant: 'rgba(11, 46, 31, 0.62)',
  outline: 'rgba(11, 46, 31, 0.22)',
  outlineVariant: 'rgba(11, 46, 31, 0.10)',
  tertiary: '#0B2E1F',
  tertiaryContainer: 'rgba(11, 46, 31, 0.08)',
  onTertiaryFixedVariant: '#0B2E1F',
  successGreen: '#85C95C',
  error: '#B42318',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#93000A',
  headingGreen: '#0B2E1F',
  cardBorder: 'rgba(11, 46, 31, 0.08)',
  marginMobile: 16,
  headerHeight: 64,
  tabBarHeight: 64,
  fontFamily: 'PlusJakartaSans_500Medium',
  fontFamilyBold: 'PlusJakartaSans_700Bold',
  fontFamilySemiBold: 'PlusJakartaSans_600SemiBold',
} as const;

export const officerShadow = {
  shadowColor: 'rgba(11, 46, 31, 0.12)',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 4,
};

export const officerCardShadow = {
  shadowColor: 'rgba(11, 46, 31, 0.08)',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 12,
  elevation: 2,
};
