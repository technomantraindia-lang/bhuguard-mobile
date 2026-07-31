import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { loginTheme } from './Theme';

interface ChangeLanguagePillProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

function GlobeIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={loginTheme.darkText} strokeWidth={1.8} />
      <Path
        d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9s1.3-6.2 3.8-9z"
        stroke={loginTheme.darkText}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ChangeLanguagePillComponent({ label, onPress, disabled = false }: ChangeLanguagePillProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
    >
      <View style={styles.row}>
        <GlobeIcon />
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export const ChangeLanguagePill = memo(ChangeLanguagePillComponent);

const styles = StyleSheet.create({
  pill: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: loginTheme.cream,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: loginTheme.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: loginTheme.darkText,
    fontFamily: loginTheme.fonts.semiBold,
    includeFontPadding: false,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: '#EDE8D4',
  },
  disabled: {
    opacity: 0.55,
  },
});
