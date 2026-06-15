import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface PinBoxInputProps {
  label: string;
  length?: number;
  value: string;
  onChange: (value: string) => void;
  masked?: boolean;
  autoFocus?: boolean;
  activeBorderColor?: string;
}

export function PinBoxInput({
  label,
  length = 6,
  value,
  onChange,
  masked = true,
  autoFocus = false,
  activeBorderColor = dashboardTheme.primary,
}: PinBoxInputProps) {
  const inputRef = useRef<TextInput>(null);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    onChange(digits);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
        {Array.from({ length }).map((_, index) => {
          const filled = value[index] !== undefined;
          const active = index === value.length && value.length < length;

          return (
            <View
              key={`${label}-${index}`}
              style={[
                styles.box,
                active && [styles.boxActive, { borderColor: activeBorderColor }],
                filled && { borderColor: activeBorderColor },
              ]}
            >
              {filled ? (
                masked ? (
                  <View style={styles.dot} />
                ) : (
                  <Text style={styles.digit}>{value[index]}</Text>
                )
              ) : active ? (
                <View style={[styles.cursor, { backgroundColor: activeBorderColor }]} />
              ) : null}
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        style={styles.hiddenInput}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: dashboardTheme.onSurfaceVariant,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    maxWidth: 48,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderColor: dashboardTheme.primary,
    borderWidth: 2,
  },
  boxFilled: {
    borderColor: dashboardTheme.primary,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: dashboardTheme.onSurface,
  },
  digit: {
    fontSize: 18,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  cursor: {
    width: 2,
    height: 22,
    borderRadius: 1,
    backgroundColor: dashboardTheme.primary,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
