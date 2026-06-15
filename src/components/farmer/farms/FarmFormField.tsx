import { StyleSheet, Text, TextInput, View } from 'react-native';

import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface FarmFormFieldProps {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad' | 'decimal-pad';
  multiline?: boolean;
  error?: string;
}

export function FarmFormField({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType = 'default',
  multiline = false,
  error,
}: FarmFormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={dashboardTheme.textMuted}
        editable={editable}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          !editable && styles.inputDisabled,
          error ? styles.inputError : null,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
    backgroundColor: dashboardTheme.surfaceLowest,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    color: dashboardTheme.onSurface,
    minHeight: 48,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: 12,
  },
  inputDisabled: {
    backgroundColor: dashboardTheme.surfaceContainerLow,
    color: dashboardTheme.textMuted,
  },
  inputError: {
    borderColor: dashboardTheme.error,
  },
  error: {
    fontSize: 12,
    lineHeight: 16,
    color: dashboardTheme.error,
    fontWeight: '500',
  },
});
