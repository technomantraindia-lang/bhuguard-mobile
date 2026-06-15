import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface ProfileSecureFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  keyboardType?: 'default' | 'number-pad';
  maxLength?: number;
}

export function ProfileSecureField({
  label,
  value,
  onChangeText,
  placeholder,
  helperText,
  errorText,
  keyboardType = 'default',
  maxLength,
}: ProfileSecureFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, errorText ? styles.inputWrapError : null]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={dashboardTheme.textMuted}
          secureTextEntry={!visible}
          keyboardType={keyboardType}
          maxLength={maxLength}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          style={styles.eyeButton}
          onPress={() => setVisible((current) => !current)}
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <Text style={styles.eyeText}>{visible ? 'Hide' : 'Show'}</Text>
        </Pressable>
      </View>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
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
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: dashboardTheme.background,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 10,
    paddingRight: 8,
  },
  inputWrapError: {
    borderColor: dashboardTheme.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    color: dashboardTheme.onSurface,
  },
  eyeButton: {
    paddingHorizontal: 10,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: 13,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    color: dashboardTheme.textMuted,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    color: dashboardTheme.error,
    fontWeight: '600',
  },
});
