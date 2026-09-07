import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

import { ONBOARDING_STEP_TOTAL } from '../../constants/onboardingSteps';
import { useKeyboardOverlapInset } from '../../hooks/useKeyboardOverlapInset';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';

interface OnboardingStepShellProps {
  stepCurrent: number;
  stepTotal?: number;
  title: string;
  subtitle: string;
  children: ReactNode;
  onNext: () => void;
  nextLabel?: string;
  nextLoading?: boolean;
  nextDisabled?: boolean;
  footerError?: string | null;
  footerExtra?: ReactNode;
}

export function OnboardingStepShell({
  stepCurrent,
  stepTotal = ONBOARDING_STEP_TOTAL,
  title,
  subtitle,
  children,
  onNext,
  nextLabel = 'Continue',
  nextLoading = false,
  nextDisabled = false,
  footerError = null,
  footerExtra = null,
}: OnboardingStepShellProps) {
  const navigation = useNavigation();
  const keyboardOverlap = useKeyboardOverlapInset();

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
                stroke={dashboardTheme.onSurface}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>

          <Text style={styles.stepBadge}>
            Step {stepCurrent} of {stepTotal}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: 24 + keyboardOverlap }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pageHeader}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <View style={styles.form}>{children}</View>
          </ScrollView>

          <View style={[styles.footer, dashboardShadow, Platform.OS === 'android' ? { marginBottom: keyboardOverlap } : null]}>
            {footerError ? <Text style={styles.footerError}>{footerError}</Text> : null}
            {footerExtra}
            <Pressable
              style={({ pressed }) => [
                styles.nextButton,
                pressed && styles.nextPressed,
                (nextDisabled || nextLoading) && styles.nextDisabled,
              ]}
              onPress={onNext}
              disabled={nextDisabled || nextLoading}
            >
              <Text style={styles.nextLabel}>{nextLoading ? 'Please wait…' : nextLabel}</Text>
              {!nextLoading ? (
                <BhuguardMaterialIcon name="arrow_forward" size={20} color={dashboardTheme.onPrimaryContainer} />
              ) : null}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export function OnboardingSectionCard({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <View style={[styles.card, dashboardShadow]}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {children}
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
    paddingBottom: 8,
    backgroundColor: dashboardTheme.background,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: dashboardTheme.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  stepBadge: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: dashboardTheme.primary,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingBottom: 24,
    gap: 24,
  },
  pageHeader: {
    marginTop: 8,
    gap: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.onSurfaceVariant,
  },
  form: {
    gap: 24,
  },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    padding: 20,
    gap: 20,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
    marginBottom: -4,
  },
  footer: {
    flexShrink: 0,
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
    borderRadius: 12,
    backgroundColor: dashboardTheme.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  nextDisabled: {
    opacity: 0.65,
  },
  nextLabel: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onPrimaryContainer,
  },
});
