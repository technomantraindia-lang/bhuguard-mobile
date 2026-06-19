import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { MobileLoginRole } from '../../utils/authRouting';
import { colors } from '../../theme/colors';

interface RoleListCardProps {
  role: MobileLoginRole;
  title: string;
  description: string;
  buttonLabel: string;
  onPress: () => void;
}

function RoleIcon({ role }: { role: MobileLoginRole }) {
  const tint = colors.primary;

  if (role === 'farmer') {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={11} width={12} height={7} rx={1.5} stroke={tint} strokeWidth={1.8} />
        <Circle cx={7} cy={18.5} r={2} stroke={tint} strokeWidth={1.8} />
        <Circle cx={13} cy={18.5} r={2} stroke={tint} strokeWidth={1.8} />
        <Path d="M15 11V8H18L20 11" stroke={tint} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }

  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={4} width={14} height={16} rx={2} stroke={tint} strokeWidth={1.8} />
      <Circle cx={12} cy={10} r={2.5} stroke={tint} strokeWidth={1.8} />
      <Path d="M9 16H15" stroke={tint} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function RoleListCard({ role, title, description, buttonLabel, onPress }: RoleListCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card} accessibilityRole="button">
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <RoleIcon role={role} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      <View style={styles.button}>
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E8D0',
    backgroundColor: colors.white,
    padding: 18,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
