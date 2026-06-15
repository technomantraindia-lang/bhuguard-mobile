import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface OnboardingToggleSwitchProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function OnboardingToggleSwitch({ title, description, value, onValueChange }: OnboardingToggleSwitchProps) {
  return (
    <View style={[styles.card, dashboardShadow]}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: dashboardTheme.surfaceContainerHighest,
          true: dashboardTheme.primaryContainer,
        }}
        thumbColor={dashboardTheme.surfaceLowest}
        ios_backgroundColor={dashboardTheme.surfaceContainerHighest}
      />
    </View>
  );
}

interface OnboardingSignatureCheckboxProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

export function OnboardingSignatureCheckbox({ label, checked, onToggle }: OnboardingSignatureCheckboxProps) {
  return (
    <Pressable style={styles.signatureCard} onPress={onToggle}>
      <View style={[styles.signatureBox, checked && styles.signatureBoxChecked]}>
        {checked ? <Text style={styles.signatureTick}>✓</Text> : null}
      </View>
      <Text style={styles.signatureLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  description: {
    fontSize: 11,
    lineHeight: 14,
    color: dashboardTheme.onSurfaceVariant,
  },
  signatureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${dashboardTheme.outlineVariant}80`,
  },
  signatureBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: dashboardTheme.outline,
    backgroundColor: dashboardTheme.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  signatureBoxChecked: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderColor: dashboardTheme.primaryContainer,
  },
  signatureTick: {
    color: dashboardTheme.onPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  signatureLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.onSurface,
  },
});
