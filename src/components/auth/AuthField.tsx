import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '../../theme/colors';

interface AuthFieldProps extends TextInputProps {
  label: string;
  leftIcon?: ReactNode;
  rightAccessory?: ReactNode;
}

export function AuthField({ label, leftIcon, rightAccessory, style, ...props }: AuthFieldProps) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          {...props}
          style={[styles.input, leftIcon ? styles.inputWithLeft : null, rightAccessory ? styles.inputWithRight : null, style]}
          placeholderTextColor="#9CA3AF"
        />
        {rightAccessory ? <View style={styles.rightAccessory}>{rightAccessory}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  inputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  leftIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  rightAccessory: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputWithLeft: {
    paddingLeft: 44,
  },
  inputWithRight: {
    paddingRight: 44,
  },
});
