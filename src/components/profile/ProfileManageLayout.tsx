import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { LoadingState } from '../LoadingState';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

export type ProfileStepIcon = 'person' | 'lock' | 'pin';

export interface ProfileManageStep {
  id: string;
  label: string;
  icon: ProfileStepIcon;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

interface ProfileManageLayoutProps {
  headerTitle?: string;
  title: string;
  subtitle: string;
  steps: ProfileManageStep[];
  profileDetails?: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  footerAction?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'danger';
  };
}

function StepIcon({ icon }: { icon: ProfileStepIcon }) {
  if (icon === 'lock') {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M8 10V8a4 4 0 118 0v2"
          stroke={dashboardTheme.primary}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        <Path
          d="M6 10h12v10H6V10z"
          stroke={dashboardTheme.primary}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (icon === 'pin') {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2l7 4v6c0 5-3.5 9.5-7 10-3.5-.5-7-5-7-10V6l7-4z"
          stroke={dashboardTheme.primary}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <Path d="M12 11v3" stroke={dashboardTheme.primary} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }

  return <BhuguardMaterialIcon name="person" size={20} color={dashboardTheme.primary} />;
}

export function ProfileManageLayout({
  headerTitle = 'Account',
  title,
  subtitle,
  steps,
  profileDetails,
  loading = false,
  error = null,
  onRetry,
  footerAction,
}: ProfileManageLayoutProps) {
  const [expandedStepId, setExpandedStepId] = useState<string | null>('personal-info');

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topSection}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
        </View>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topSection}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
        </View>
        <ErrorState message={error} onRetry={onRetry} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topSection}>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.stepperCard, dashboardShadow]}>
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const isExpanded = expandedStepId === step.id;

            return (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.stepRail}>
                  <View style={[styles.stepCircle, isExpanded && styles.stepCircleActive]}>
                    <StepIcon icon={step.icon} />
                  </View>
                  {!isLast ? <View style={styles.stepLine} /> : null}
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.stepContent,
                    pressed && !step.disabled && styles.stepPressed,
                    step.disabled && styles.stepDisabled,
                  ]}
                  onPress={() => {
                    if (step.id === 'personal-info') {
                      setExpandedStepId(isExpanded ? null : step.id);
                      return;
                    }

                    step.onPress();
                  }}
                  disabled={step.disabled || step.loading}
                >
                  <Text style={styles.stepLabel}>{step.label}</Text>
                  {step.loading ? <Text style={styles.stepHint}>Sending OTP…</Text> : null}
                  {step.id === 'personal-info' && isExpanded && profileDetails ? (
                    <View style={styles.detailsWrap}>{profileDetails}</View>
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>

        {footerAction ? (
          <Pressable
            style={({ pressed }) => [
              styles.footerButton,
              footerAction.variant === 'danger' && styles.footerButtonDanger,
              pressed && styles.footerButtonPressed,
            ]}
            onPress={footerAction.onPress}
          >
            <Text
              style={[
                styles.footerButtonText,
                footerAction.variant === 'danger' && styles.footerButtonTextDanger,
              ]}
            >
              {footerAction.label}
            </Text>
            {footerAction.variant !== 'danger' ? (
              <BhuguardMaterialIcon name="arrow_forward" size={20} color={dashboardTheme.onPrimary} />
            ) : null}
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  topSection: {
    backgroundColor: dashboardTheme.surface,
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: dashboardTheme.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: dashboardTheme.onSurfaceVariant,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 20,
  },
  stepperCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
  },
  stepRail: {
    alignItems: 'center',
    width: 36,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: dashboardTheme.surfaceLow,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: dashboardTheme.primary,
    backgroundColor: dashboardTheme.surfaceContainer,
  },
  stepLine: {
    flex: 1,
    width: 2,
    minHeight: 28,
    backgroundColor: dashboardTheme.outlineVariant,
    marginVertical: 4,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 22,
    gap: 8,
  },
  stepPressed: {
    opacity: 0.88,
  },
  stepDisabled: {
    opacity: 0.6,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
    paddingTop: 6,
  },
  stepHint: {
    fontSize: 13,
    color: dashboardTheme.onSurfaceVariant,
  },
  detailsWrap: {
    marginTop: 4,
    gap: 8,
  },
  footerButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: dashboardTheme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerButtonDanger: {
    backgroundColor: dashboardTheme.errorContainer,
    borderWidth: 1,
    borderColor: dashboardTheme.error,
  },
  footerButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  footerButtonTextDanger: {
    color: dashboardTheme.onErrorContainer,
  },
});
