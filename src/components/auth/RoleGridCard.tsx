import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { SelectableRoleId } from '../../config/authRoles';
import { colors } from '../../theme/colors';

interface RoleGridCardProps {
  roleId: SelectableRoleId;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

function RoleGridIcon({ roleId }: { roleId: SelectableRoleId }) {
  const tint = colors.primary;

  switch (roleId) {
    case 'farmer':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={11} width={12} height={7} rx={1.5} stroke={tint} strokeWidth={1.8} />
          <Circle cx={7} cy={18.5} r={2} stroke={tint} strokeWidth={1.8} />
          <Circle cx={13} cy={18.5} r={2} stroke={tint} strokeWidth={1.8} />
          <Path d="M15 11V8H18L20 11" stroke={tint} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'field_officer':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Rect x={5} y={4} width={14} height={16} rx={2} stroke={tint} strokeWidth={1.8} />
          <Circle cx={12} cy={10} r={2.5} stroke={tint} strokeWidth={1.8} />
          <Path d="M9 16H15" stroke={tint} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'company_user':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={6} r={2.5} stroke={tint} strokeWidth={1.8} />
          <Circle cx={6} cy={16} r={2.5} stroke={tint} strokeWidth={1.8} />
          <Circle cx={18} cy={16} r={2.5} stroke={tint} strokeWidth={1.8} />
          <Path d="M12 8.5V11M12 11L6 13.5M12 11L18 13.5" stroke={tint} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'biochar_operator':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 4C9 7 8 10 8 13C8 16.5 10 19 12 20C14 19 16 16.5 16 13C16 10 15 7 12 4Z"
            stroke={tint}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <Path d="M10 14C10.8 15.2 11.4 15.8 12 16C12.6 15.8 13.2 15.2 14 14" stroke={tint} strokeWidth={1.8} />
        </Svg>
      );
    case 'artisan':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M8 6L6 18" stroke={tint} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M16 6L18 18" stroke={tint} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M6 14H18" stroke={tint} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case 'auditor':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Rect x={6} y={4} width={12} height={16} rx={2} stroke={tint} strokeWidth={1.8} />
          <Path d="M9 12L11 14L15 10" stroke={tint} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

export function RoleGridCard({ roleId, title, description, selected, onPress }: RoleGridCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View style={styles.iconCircle}>
        <RoleGridIcon roleId={roleId} />
      </View>
      <Text style={[styles.title, selected && styles.titleSelected]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.description} numberOfLines={3}>
        {description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 132,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: colors.white,
    padding: 14,
    gap: 8,
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: '#F6FCF8',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  titleSelected: {
    color: colors.primary,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
});
