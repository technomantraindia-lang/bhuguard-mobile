import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface ProfileMpinInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  errorText?: string;
}

export function ProfileMpinInput({ label, value, onChange, helperText, errorText }: ProfileMpinInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? '');

  const handleChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    onChange(cleaned);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.boxRow} onPress={() => inputRef.current?.focus()}>
        {digits.map((digit, index) => (
          <View key={`${label}-${index}`} style={[styles.box, errorText ? styles.boxError : null]}>
            <Text style={styles.boxText}>{digit ? '•' : ''}</Text>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={6}
        secureTextEntry
        style={styles.hiddenInput}
        accessibilityLabel={label}
      />
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxError: {
    borderColor: dashboardTheme.error,
  },
  boxText: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
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
