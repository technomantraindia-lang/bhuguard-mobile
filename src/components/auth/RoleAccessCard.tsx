import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../../theme/colors';

export type AccessRole = 'farmer' | 'field_officer' | 'company_user';

interface RoleAccessCardProps {
  role: AccessRole;
  label: string;
  selected: boolean;
  onPress: () => void;
}

function RoleIcon({ role, active }: { role: AccessRole; active: boolean }) {
  const tint = active ? colors.primary : colors.text;

  if (role === 'farmer') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={11} width={12} height={7} rx={1.5} stroke={tint} strokeWidth={1.8} />
        <Circle cx={7} cy={18.5} r={2} stroke={tint} strokeWidth={1.8} />
        <Circle cx={13} cy={18.5} r={2} stroke={tint} strokeWidth={1.8} />
        <Path d="M15 11V8H18L20 11" stroke={tint} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }

  if (role === 'field_officer') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Circle cx={10} cy={9} r={3.5} stroke={tint} strokeWidth={1.8} />
        <Path d="M4 20C4.8 16.5 7.2 14.5 10 14.5C12.8 14.5 15.2 16.5 16 20" stroke={tint} strokeWidth={1.8} />
        <Path d="M16 8L20 12" stroke={tint} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={19.5} cy={7.5} r={2.5} stroke={tint} strokeWidth={1.8} />
      </Svg>
    );
  }

  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L19 6.5V12C19 16.2 16.2 19.8 12 21C7.8 19.8 5 16.2 5 12V6.5L12 3Z"
        stroke={tint}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M12 10V14" stroke={tint} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={12} cy={8} r={1.2} fill={tint} />
    </Svg>
  );
}

export function RoleAccessCard({ role, label, selected, onPress }: RoleAccessCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View style={styles.iconWrap}>
        <RoleIcon role={role} active={selected} />
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 88,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0FAF4',
  },
  iconWrap: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  labelSelected: {
    color: colors.primary,
  },
});
