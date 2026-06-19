import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import {
  VISIT_VERIFICATION_STEPS,
  type VisitVerificationStepKey,
} from '../../utils/visitWorkflowHelpers';

interface VisitVerificationProgressStepperProps {
  currentStep: VisitVerificationStepKey;
  completedSteps: VisitVerificationStepKey[];
}

export function VisitVerificationProgressStepper({
  currentStep,
  completedSteps,
}: VisitVerificationProgressStepperProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Verification process</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {VISIT_VERIFICATION_STEPS.map((step, index) => {
          const completed = completedSteps.includes(step.key);
          const active = step.key === currentStep;
          const isLast = index === VISIT_VERIFICATION_STEPS.length - 1;

          return (
            <View key={step.key} style={styles.stepGroup}>
              <View style={styles.stepTop}>
                <View
                  style={[
                    styles.dot,
                    completed && styles.dotCompleted,
                    active && styles.dotActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dotText,
                      active && styles.dotTextActive,
                      completed && !active && styles.dotTextCompleted,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                {!isLast ? (
                  <View style={[styles.line, completed && styles.lineCompleted]} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.label,
                  completed && styles.labelCompleted,
                  active && styles.labelActive,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingVertical: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 8,
    gap: 0,
  },
  stepGroup: {
    width: 78,
    gap: 6,
  },
  stepTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCompleted: {
    borderColor: colors.primary,
    backgroundColor: colors.softGreen,
  },
  dotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dotText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  dotTextActive: {
    color: colors.white,
  },
  dotTextCompleted: {
    color: colors.primary,
  },
  line: {
    width: 50,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: -2,
  },
  lineCompleted: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  labelCompleted: {
    color: colors.primary,
  },
  labelActive: {
    color: colors.text,
    fontWeight: '700',
  },
});
