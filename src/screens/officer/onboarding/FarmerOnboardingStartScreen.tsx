import { useMemo, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import {
  getFarmerOnboardingStepDisplayTone,
  getFarmerOnboardingStepStatusLabel,
  getNextIncompleteFarmerOnboardingStep,
  hasFarmerOnboardingProgress,
  ONBOARDING_STEPS,
  type FarmerOnboardingStep,
  type OnboardingStepDisplayTone,
} from '../../../constants/onboardingSteps';
import { useOnboarding } from '../../../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { BhuguardMaterialIcon } from '../../../components/shared/BhuguardMaterialIcon';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

function StepIcon({
  icon,
  tone,
}: {
  icon: FarmerOnboardingStep['icon'];
  tone: OnboardingStepDisplayTone;
}) {
  const color =
    tone === 'completed'
      ? dashboardTheme.onPrimary
      : tone === 'current'
        ? dashboardTheme.primary
        : dashboardTheme.onSurfaceVariant;

  if (icon === 'consent') {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M7 3h7l5 5v13H7V3z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
        <Path d="M14 3v5h5M10 13h6M10 17h4" stroke={color} strokeWidth={1.6} />
      </Svg>
    );
  }

  if (icon === 'folder') {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 8h16v11H4V8zM4 8l2-4h6l2 2h6v2"
          stroke={color}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  const iconName =
    icon === 'landscape'
      ? 'landscape'
      : icon === 'share_location'
        ? 'share_location'
        : icon === 'assignment_turned_in'
          ? 'assignment_turned_in'
          : 'person';

  return <BhuguardMaterialIcon name={iconName} size={18} color={color} />;
}

export function FarmerOnboardingStartScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { draft, result, resetDraft } = useOnboarding();
  const isNavigatingRef = useRef(false);

  const nextStep = useMemo(
    () => getNextIncompleteFarmerOnboardingStep(draft, result),
    [draft, result],
  );
  const hasProgress = useMemo(() => hasFarmerOnboardingProgress(draft) || result != null, [draft, result]);
  const currentKey = nextStep?.key ?? null;

  const ctaLabel = useMemo(() => {
    if (result != null) {
      return 'View Submission';
    }
    if (!hasProgress) {
      return 'Begin Onboarding';
    }
    if (!nextStep) {
      return 'Open Final Review & Submit';
    }
    return 'Continue Onboarding';
  }, [hasProgress, nextStep, result]);

  const startOrContinue = () => {
    if (isNavigatingRef.current) {
      return;
    }
    isNavigatingRef.current = true;

    try {
      if (result != null) {
        navigation.navigate('FarmerOnboardingSuccess');
        return;
      }

      if (!hasProgress) {
        resetDraft();
        navigation.navigate('FarmerBasicDetails');
        return;
      }

      const target = getNextIncompleteFarmerOnboardingStep(draft, result);
      if (!target) {
        navigation.navigate('FarmerOnboardingReview');
        return;
      }

      navigation.navigate(target.route);
    } finally {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 600);
    }
  };

  const footerPad = Math.max(insets.bottom, 12) + 12;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}
            onPress={() => navigation.goBack()}
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
          <Text style={styles.headerTitle}>Registration</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 100 + footerPad }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>New Farmer Onboarding</Text>
          <Text style={styles.subtitle}>
            Follow these steps to register a new farmer in the DMRV ecosystem.
          </Text>

          <View style={[styles.stepperCard, dashboardShadow]}>
            {ONBOARDING_STEPS.map((step, index) => {
              const isLast = index === ONBOARDING_STEPS.length - 1;
              const tone = getFarmerOnboardingStepDisplayTone(step.key, draft, result, currentKey);
              const statusLabel = getFarmerOnboardingStepStatusLabel(step.key, draft, tone);

              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepRail}>
                    <View
                      style={[
                        styles.stepCircle,
                        tone === 'completed' && styles.stepCircleCompleted,
                        tone === 'current' && styles.stepCircleCurrent,
                        tone === 'pending' && styles.stepCirclePending,
                      ]}
                    >
                      {tone === 'completed' ? (
                        <BhuguardMaterialIcon name="verified" size={18} color={dashboardTheme.onPrimary} />
                      ) : (
                        <StepIcon icon={step.icon} tone={tone} />
                      )}
                    </View>
                    {!isLast ? (
                      <View
                        style={[
                          styles.stepLine,
                          tone === 'completed' && styles.stepLineCompleted,
                        ]}
                      />
                    ) : null}
                  </View>
                  <View style={styles.stepTextCol}>
                    <Text
                      style={[
                        styles.stepLabel,
                        tone === 'pending' && styles.stepLabelPending,
                        tone === 'current' && styles.stepLabelCurrent,
                        tone === 'completed' && styles.stepLabelCompleted,
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text
                      style={[
                        styles.stepStatus,
                        tone === 'completed' && styles.stepStatusCompleted,
                        tone === 'current' && styles.stepStatusCurrent,
                      ]}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: footerPad }]}>
          <Pressable
            style={({ pressed }) => [styles.startButton, pressed && styles.startPressed]}
            onPress={startOrContinue}
          >
            <Text style={styles.startLabel}>{ctaLabel}</Text>
            <BhuguardMaterialIcon name="arrow_forward" size={20} color={dashboardTheme.onPrimary} />
          </Pressable>
        </View>
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
    paddingBottom: 8,
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: dashboardTheme.primary,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  scroll: {
    paddingHorizontal: dashboardTheme.marginMobile,
    gap: 16,
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
    marginBottom: 8,
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
    minHeight: 56,
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
  stepCircleCompleted: {
    backgroundColor: dashboardTheme.primary,
    borderColor: dashboardTheme.primary,
  },
  stepCircleCurrent: {
    borderColor: dashboardTheme.primary,
    borderWidth: 2,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  stepCirclePending: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderColor: dashboardTheme.outlineVariant,
  },
  stepLine: {
    flex: 1,
    width: 2,
    minHeight: 20,
    backgroundColor: dashboardTheme.outlineVariant,
    marginVertical: 4,
  },
  stepLineCompleted: {
    backgroundColor: dashboardTheme.primary,
  },
  stepTextCol: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  stepLabelPending: {
    color: dashboardTheme.onSurfaceVariant,
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: dashboardTheme.primary,
  },
  stepLabelCompleted: {
    color: dashboardTheme.primary,
  },
  stepStatus: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  stepStatusCompleted: {
    color: dashboardTheme.primary,
  },
  stepStatusCurrent: {
    color: dashboardTheme.secondary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingTop: 12,
    backgroundColor: dashboardTheme.background,
  },
  startButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: dashboardTheme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  startLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
});
