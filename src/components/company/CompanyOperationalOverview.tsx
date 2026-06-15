import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CompanyOperationalStat } from '../../hooks/useCompanyDashboardData';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface CompanyOperationalOverviewProps {
  stats: CompanyOperationalStat[];
}

export function CompanyOperationalOverview({ stats }: CompanyOperationalOverviewProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Operational Overview</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stats.map((stat) => (
          <View key={stat.id} style={styles.card}>
            <View
              style={[
                styles.decor,
                { backgroundColor: stat.tone === 'alert' ? dashboardTheme.error : dashboardTheme.primary },
              ]}
            />
            <BhuguardMaterialIcon
              name={stat.icon}
              size={24}
              color={stat.tone === 'alert' ? dashboardTheme.error : dashboardTheme.primary}
            />
            <Text style={styles.value}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 24,
    gap: 8,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 8,
  },
  card: {
    width: 140,
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    ...dashboardShadow,
    overflow: 'hidden',
    position: 'relative',
    gap: 8,
  },
  decor: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 64,
    height: 64,
    borderRadius: 32,
    opacity: 0.05,
  },
  value: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: dashboardTheme.onSurfaceVariant,
  },
});
