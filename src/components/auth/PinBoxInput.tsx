import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface PinBoxInputProps {
  label?: string;
  length?: number;
  value: string;
  onChange: (value: string) => void;
  masked?: boolean;
  autoFocus?: boolean;
  activeBorderColor?: string;
  /** Stable key prefix — never Date.now()/Math.random(). */
  keyPrefix?: string;
  hideLabel?: boolean;
  boxBackgroundColor?: string;
  inactiveBorderColor?: string;
  digitColor?: string;
}

export function PinBoxInput({
  label = 'PIN',
  length = 6,
  value,
  onChange,
  masked = true,
  autoFocus = false,
  activeBorderColor = dashboardTheme.primary,
  keyPrefix = 'pin-box',
  hideLabel = false,
  boxBackgroundColor = dashboardTheme.surfaceLowest,
  inactiveBorderColor = dashboardTheme.outlineVariant,
  digitColor = dashboardTheme.onSurface,
}: PinBoxInputProps) {
  const inputRef = useRef<TextInput>(null);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    onChange(digits);
  };

  return (
    <View style={styles.wrap}>
      {!hideLabel ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
        {Array.from({ length }).map((_, index) => {
          const filled = value[index] !== undefined;
          const active = index === value.length && value.length < length;

          return (
            <View
              key={`${keyPrefix}-${index}`}
              style={[
                styles.box,
                { backgroundColor: boxBackgroundColor, borderColor: inactiveBorderColor },
                active && [styles.boxActive, { borderColor: activeBorderColor }],
                filled && { borderColor: activeBorderColor },
              ]}
            >
              {filled ? (
                masked ? (
                  <View style={[styles.dot, { backgroundColor: digitColor }]} />
                ) : (
                  <Text style={[styles.digit, { color: digitColor }]}>{value[index]}</Text>
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
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        importantForAutofill="yes"
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderWidth: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  digit: {
    fontSize: 18,
    fontWeight: '700',
  },
  cursor: {
    width: 2,
    height: 22,
    borderRadius: 1,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
