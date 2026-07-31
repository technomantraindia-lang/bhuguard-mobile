import { StyleSheet, Text, View } from 'react-native';

import { officerTheme } from '../../theme/officerDashboardTheme';

interface ActivityWorkflowStepperProps {
  steps: string[];
  currentStep: number;
}

export function ActivityWorkflowStepper({ steps, currentStep }: ActivityWorkflowStepperProps) {
  return (
    <View style={styles.row}>
      {steps.map((step, index) => {
        const active = index === currentStep;
        const completed = index < currentStep;

        return (
          <View key={step} style={styles.item}>
            <View style={[styles.dot, (active || completed) && styles.dotActive]}>
              <Text style={[styles.dotText, (active || completed) && styles.dotTextActive]}>{index + 1}</Text>
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{step}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  item: { alignItems: 'center', width: 72 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: officerTheme.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: officerTheme.surfaceLowest,
  },
  dotActive: { backgroundColor: officerTheme.primary, borderColor: officerTheme.primary },
  dotText: { fontSize: 12, fontWeight: '700', color: officerTheme.onSurfaceVariant },
  dotTextActive: { color: officerTheme.onPrimary },
  label: { marginTop: 4, fontSize: 10, textAlign: 'center', color: officerTheme.onSurfaceVariant },
  labelActive: { color: officerTheme.primary, fontWeight: '700' },
});
