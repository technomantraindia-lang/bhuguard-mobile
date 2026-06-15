import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface AuthPasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

function LockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={10} width={14} height={10} rx={2} stroke={dashboardTheme.outline} strokeWidth={1.8} />
      <Path
        d="M8 10V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V10"
        stroke={dashboardTheme.outline}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M3 12C5.5 7.5 8.5 5 12 5C15.5 5 18.5 7.5 21 12" stroke={dashboardTheme.outline} strokeWidth={1.8} />
        <Path d="M3 12C5.5 16.5 8.5 19 12 19C15.5 19 18.5 16.5 21 12" stroke={dashboardTheme.outline} strokeWidth={1.8} />
        <Path d="M9 12C9 13.7 10.3 15 12 15C13.7 15 15 13.7 15 12" stroke={dashboardTheme.outline} strokeWidth={1.8} />
      </Svg>
    );
  }

  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12C5.5 7.5 8.5 5 12 5C15.5 5 18.5 7.5 21 12" stroke={dashboardTheme.outline} strokeWidth={1.8} />
      <Path d="M4 4L20 20" stroke={dashboardTheme.outline} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function AuthPasswordField({ label, value, onChangeText, placeholder }: AuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <View style={styles.leftIcon}>
          <LockIcon />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholder={placeholder}
          placeholderTextColor={dashboardTheme.outline}
          autoCapitalize="none"
          style={styles.input}
        />
        <Pressable
          onPress={() => setVisible((current) => !current)}
          style={styles.eyeButton}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <EyeIcon visible={visible} />
        </Pressable>
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
    color: dashboardTheme.onSurfaceVariant,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 12,
    backgroundColor: dashboardTheme.surfaceLowest,
    minHeight: 52,
  },
  leftIcon: {
    paddingLeft: 14,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: dashboardTheme.onSurface,
    paddingVertical: 14,
    paddingRight: 8,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
