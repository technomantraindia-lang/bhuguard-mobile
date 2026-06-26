import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';

interface FarmerAddBiocharCardProps {
  onPress: () => void;
}

export function FarmerAddBiocharCard({ onPress }: FarmerAddBiocharCardProps) {
  return (
    <Pressable style={({ pressed }) => [styles.card, dashboardShadow, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.iconWrap}>
        <BhuguardMaterialIcon name="add_circle" size={28} color={dashboardTheme.onPrimary} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>Add Biochar</Text>
        <Text style={styles.description}>Start a new biochar activity record for your farm.</Text>
      </View>

      <View style={styles.cta}>
        <BhuguardMaterialIcon name="arrow_forward" size={18} color={dashboardTheme.onPrimary} />
        <Text style={styles.ctaText}>Add Biochar</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.9)',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: dashboardTheme.headingGreen,
    borderRadius: 10,
    paddingVertical: 12,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
});
