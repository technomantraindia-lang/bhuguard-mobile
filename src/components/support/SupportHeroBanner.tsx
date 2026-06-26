import { StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface SupportHeroBannerProps {
  title: string;
  subtitle: string;
}

export function SupportHeroBanner({ title, subtitle }: SupportHeroBannerProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.glow} />
      <View style={styles.iconCircle}>
        <BhuguardMaterialIcon name="support_agent" size={22} color="#fff" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: dashboardTheme.primary,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    overflow: 'hidden',
    padding: 16,
    position: 'relative',
  },
  glow: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    height: 120,
    position: 'absolute',
    right: -20,
    top: -30,
    width: 120,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    lineHeight: 18,
  },
});
