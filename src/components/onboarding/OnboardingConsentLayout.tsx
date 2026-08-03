import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

import { ONBOARDING_STEP_TOTAL } from '../../constants/onboardingSteps';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';

interface OnboardingConsentLayoutProps {
  stepCurrent: number;
  stepTotal?: number;
  progressLabel: string;
  children: ReactNode;
  onNext: () => void;
  nextLabel: string;
  footerError?: string | null;
  /** Sticky footer content rendered directly above the Continue button. */
  aboveNext?: ReactNode;
  nextLoading?: boolean;
  nextDisabled?: boolean;
}

export function OnboardingConsentLayout({
  stepCurrent,
  stepTotal = ONBOARDING_STEP_TOTAL,
  progressLabel,
  children,
  onNext,
  nextLabel,
  footerError = null,
  aboveNext = null,
  nextLoading = false,
  nextDisabled = false,
}: OnboardingConsentLayoutProps) {
  const navigation = useNavigation();
  const progressPercent = Math.round((stepCurrent / stepTotal) * 100);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 18l-6-6 6-6"
                stroke={dashboardTheme.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Consent & Legal
          </Text>

          <Text style={styles.stepFraction}>
            {stepCurrent}/{stepTotal}
          </Text>
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.progressBlock}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressStepLabel}>{progressLabel}</Text>
                <Text style={styles.progressPercent}>{progressPercent}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Required Consents</Text>
              <Text style={styles.sectionSubtitle}>
                Please review and accept the following terms to proceed with project onboarding.
              </Text>
            </View>

            {children}
          </ScrollView>

          <View style={[styles.footer, dashboardShadow]}>
            {footerError ? <Text style={styles.footerError}>{footerError}</Text> : null}
            {aboveNext}
            <Pressable
              style={({ pressed }) => [
                styles.nextButton,
                pressed && !nextLoading && !nextDisabled && styles.nextPressed,
                (nextLoading || nextDisabled) && styles.nextDisabled,
              ]}
              onPress={onNext}
              disabled={nextLoading || nextDisabled}
            >
              <Text style={styles.nextLabel}>{nextLoading ? 'Please wait…' : nextLabel}</Text>
              {!nextLoading ? (
                <BhuguardMaterialIcon name="arrow_forward" size={20} color={dashboardTheme.onPrimary} />
              ) : null}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dashboardTheme.marginMobile,
    height: 64,
    backgroundColor: dashboardTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.outlineVariant,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    backgroundColor: dashboardTheme.surfaceLow,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: dashboardTheme.primary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  stepFraction: {
    width: 40,
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
    textAlign: 'right',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingTop: 24,
    paddingBottom: 140,
    gap: 24,
  },
  progressBlock: {
    gap: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  progressStepLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: dashboardTheme.primary,
  },
  progressPercent: {
    fontSize: 11,
    lineHeight: 14,
    color: dashboardTheme.onSurfaceVariant,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: dashboardTheme.surfaceContainerHighest,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: dashboardTheme.primaryContainer,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.onSurfaceVariant,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: dashboardTheme.surfaceLowest,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.outlineVariant,
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 8,
  },
  footerError: {
    fontSize: 13,
    color: dashboardTheme.error,
    textAlign: 'center',
  },
  nextButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: dashboardTheme.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  nextDisabled: {
    opacity: 0.65,
  },
  nextLabel: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
});
