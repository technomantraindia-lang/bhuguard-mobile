import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface ChangeLanguagePillProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

function GlobeIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke="#111111" strokeWidth={1.7} />
      <Path
        d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9s1.3-6.2 3.8-9z"
        stroke="#111111"
        strokeWidth={1.7}
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
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#111111',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111111',
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.55,
  },
});
