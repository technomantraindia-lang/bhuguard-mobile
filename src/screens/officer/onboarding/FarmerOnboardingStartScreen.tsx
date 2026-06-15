import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ONBOARDING_STEPS } from '../../../constants/onboardingSteps';
import { useOnboarding } from '../../../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { BhuguardMaterialIcon } from '../../../components/shared/BhuguardMaterialIcon';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

function StepIcon({ icon }: { icon: (typeof ONBOARDING_STEPS)[number]['icon'] }) {
  if (icon === 'consent') {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d="M7 3h7l5 5v13H7V3z"
          stroke={dashboardTheme.primary}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <Path d="M14 3v5h5M10 13h6M10 17h4" stroke={dashboardTheme.primary} strokeWidth={1.6} />
      </Svg>
    );
  }

  if (icon === 'folder') {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 8h16v11H4V8zM4 8l2-4h6l2 2h6v2"
          stroke={dashboardTheme.primary}
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

  return <BhuguardMaterialIcon name={iconName} size={18} color={dashboardTheme.primary} />;
}

export function FarmerOnboardingStartScreen() {
  const navigation = useNavigation<Nav>();
  const { resetDraft } = useOnboarding();

  const start = () => {
    resetDraft();
    navigation.navigate('FarmerBasicDetails');
  };

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

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>New Farmer Onboarding</Text>
          <Text style={styles.subtitle}>
            Follow these steps to register a new farmer in the DMRV ecosystem.
          </Text>

          <View style={[styles.stepperCard, dashboardShadow]}>
            {ONBOARDING_STEPS.map((step, index) => {
              const isLast = index === ONBOARDING_STEPS.length - 1;

              return (
                <View key={step.id} style={styles.stepRow}>
                  <View style={styles.stepRail}>
                    <View style={styles.stepCircle}>
                      <StepIcon icon={step.icon} />
                    </View>
                    {!isLast ? <View style={styles.stepLine} /> : null}
                  </View>
                  <Text style={styles.stepLabel}>{step.label}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={({ pressed }) => [styles.startButton, pressed && styles.startPressed]} onPress={start}>
            <Text style={styles.startLabel}>Begin Onboarding</Text>
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
    paddingBottom: 120,
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
  stepLine: {
    flex: 1,
    width: 2,
    minHeight: 28,
    backgroundColor: dashboardTheme.outlineVariant,
    marginVertical: 4,
  },
  stepLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
    paddingTop: 6,
    paddingBottom: 22,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingBottom: 24,
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
