import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface OnboardingTextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  editable?: boolean;
  maxLength?: number;
  leftIcon?: ReactNode;
}

export function OnboardingTextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  editable = true,
  maxLength,
  leftIcon,
}: OnboardingTextFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, !editable && styles.inputRowReadonly]}>
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={dashboardTheme.outline}
          keyboardType={keyboardType}
          editable={editable}
          maxLength={maxLength}
          style={[styles.input, !editable && styles.inputReadonly]}
        />
      </View>
    </View>
  );
}

export function OnboardingMobileField({
  label,
  value,
  onChangeText,
  placeholder = '10-digit mobile number',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.mobileRow}>
        <View style={styles.mobilePrefix}>
          <Text style={styles.mobilePrefixText}>+91</Text>
        </View>
        <TextInput
          value={value}
          onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, 10))}
          placeholder={placeholder}
          placeholderTextColor={dashboardTheme.outline}
          keyboardType="phone-pad"
          maxLength={10}
          style={styles.mobileInput}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: dashboardTheme.onSurfaceVariant,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  inputRowReadonly: {
    backgroundColor: `${dashboardTheme.surfaceVariant}55`,
    opacity: 0.85,
  },
  leftIcon: {
    paddingLeft: 12,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.onSurface,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputReadonly: {
    color: dashboardTheme.onSurface,
  },
  mobileRow: {
    flexDirection: 'row',
    minHeight: 48,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  mobilePrefix: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: dashboardTheme.surfaceLow,
    borderRightWidth: 1,
    borderRightColor: dashboardTheme.outlineVariant,
  },
  mobilePrefixText: {
    fontSize: 14,
    color: dashboardTheme.onSurfaceVariant,
  },
  mobileInput: {
    flex: 1,
    fontSize: 14,
    color: dashboardTheme.onSurface,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
