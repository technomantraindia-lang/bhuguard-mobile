import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';
import { colors } from '../../theme/colors';

interface LoginOptionCardProps {
  icon: BhuguardIconName;
  title: string;
  description: string;
  onPress: () => void;
  disabled?: boolean;
}

export function LoginOptionCard({ icon, title, description, onPress, disabled = false }: LoginOptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.card, disabled && styles.cardDisabled]}
      accessibilityRole="button"
    >
      <View style={styles.iconWrap}>
        <BhuguardMaterialIcon name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E8D0',
    backgroundColor: colors.white,
    padding: 16,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '600',
  },
});
