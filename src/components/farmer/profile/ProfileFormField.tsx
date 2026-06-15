import { StyleSheet, Text, TextInput, View } from 'react-native';

import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface ProfileFormFieldProps {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
}

export function ProfileFormField({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  secureTextEntry = false,
  keyboardType = 'default',
}: ProfileFormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={dashboardTheme.textMuted}
        editable={editable}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={[styles.input, !editable && styles.inputDisabled]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  input: {
    backgroundColor: dashboardTheme.background,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    color: dashboardTheme.onSurface,
  },
  inputDisabled: {
    backgroundColor: dashboardTheme.surfaceContainerLow,
    color: dashboardTheme.textMuted,
  },
});
