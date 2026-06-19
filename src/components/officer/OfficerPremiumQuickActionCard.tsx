import { Pressable, StyleSheet, Text, View } from 'react-native';

import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';

interface OfficerQuickActionsSectionHeaderProps {
  title?: string;
  subtitle?: string;
}

export function OfficerQuickActionsSectionHeader({
  title = 'Quick Actions',
  subtitle = 'Access verification, biochar, and field evidence workflows.',
}: OfficerQuickActionsSectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionEyebrow}>Officer Workflows</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

interface OfficerPremiumQuickActionCardProps {
  icon: BhuguardIconName;
  title: string;
  description: string;
  ctaLabel: string;
  onPress: () => void;
}

export function OfficerPremiumQuickActionCard({
  icon,
  title,
  description,
  ctaLabel,
  onPress,
}: OfficerPremiumQuickActionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, officerCardShadow, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.accentBar} />
      <View style={styles.iconWrap}>
        <BhuguardMaterialIcon name={icon} size={26} color={officerTheme.primaryContainer} filled />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>
      <View style={styles.button}>
        <Text style={styles.buttonText}>{ctaLabel}</Text>
      </View>
    </Pressable>
  );
}

interface OfficerCompactQuickActionCardProps {
  icon: BhuguardIconName;
  label: string;
  onPress: () => void;
}

export function OfficerCompactQuickActionCard({ icon, label, onPress }: OfficerCompactQuickActionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.compactCard, officerCardShadow, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.compactAccentBar} />
      <View style={styles.iconWrap}>
        <BhuguardMaterialIcon name={icon} size={22} color={officerTheme.primaryContainer} filled />
      </View>
      <Text style={styles.compactLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginBottom: 14,
    gap: 4,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: officerTheme.primaryContainer,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: officerTheme.onSurfaceVariant,
    fontWeight: '500',
  },
  card: {
    width: 236,
    minHeight: 204,
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 58, 0.14)',
    padding: 16,
    gap: 8,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: officerTheme.primaryContainer,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EAF7EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  description: {
    minHeight: 36,
    fontSize: 12,
    lineHeight: 18,
    color: officerTheme.onSurfaceVariant,
    fontWeight: '500',
  },
  button: {
    marginTop: 'auto',
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: officerTheme.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: officerTheme.onPrimary,
  },
  compactCard: {
    width: 124,
    minHeight: 118,
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 58, 0.14)',
    padding: 12,
    gap: 10,
    overflow: 'hidden',
  },
  compactAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: officerTheme.primaryContainer,
  },
  compactLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: officerTheme.primary,
  },
});
