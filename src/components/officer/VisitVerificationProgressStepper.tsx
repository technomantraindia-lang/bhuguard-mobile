import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import type { VisitVerificationStepKey } from '../../utils/visitWorkflowHelpers';

import { VerificationStepper, type VerificationStepperItem } from './VerificationStepper';

interface VisitVerificationProgressStepperProps {
  currentStep: VisitVerificationStepKey;
  completedSteps: VisitVerificationStepKey[];
}

export function VisitVerificationProgressStepper({
  currentStep,
  completedSteps,
}: VisitVerificationProgressStepperProps) {
  const currentKey = resolveDisplayStepKey(currentStep);
  const completedKeys = VERIFICATION_STEPPER_STEPS
    .filter((step) => step.sourceKeys.some((key) => completedSteps.includes(key)))
    .map((step) => step.key);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Verification process</Text>
      <VerificationStepper
        steps={VERIFICATION_STEPPER_STEPS}
        currentKey={currentKey}
        completedKeys={completedKeys}
      />
    </View>
  );
}

interface VerificationStepperStep extends VerificationStepperItem {
  sourceKeys: VisitVerificationStepKey[];
}

const VERIFICATION_STEPPER_STEPS: VerificationStepperStep[] = [
  { key: 'accept', label: 'Accept', sourceKeys: ['start_visit', 'accept'] },
  { key: 'check_in', label: 'Check-in', sourceKeys: ['check_in'] },
  { key: 'verify', label: 'Verify', sourceKeys: ['farmer_details', 'mobile_network', 'verify', 'checklist'] },
  { key: 'start_biochar_activity', label: 'Start Biochar Activity', sourceKeys: ['start_biochar_activity'] },
  { key: 'biochar_process', label: 'Biochar Process', sourceKeys: ['biochar_process'] },
  { key: 'evidence_submit', label: 'Evidence/Submit', sourceKeys: ['evidence', 'review', 'submit'] },
];

function resolveDisplayStepKey(currentStep: VisitVerificationStepKey): string {
  if (currentStep === 'start_visit' || currentStep === 'accept') {
    return 'accept';
  }

  if (currentStep === 'farmer_details' || currentStep === 'mobile_network' || currentStep === 'verify' || currentStep === 'checklist') {
    return 'verify';
  }

  if (currentStep === 'evidence' || currentStep === 'review' || currentStep === 'submit') {
    return 'evidence_submit';
  }

  return currentStep;
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
});
