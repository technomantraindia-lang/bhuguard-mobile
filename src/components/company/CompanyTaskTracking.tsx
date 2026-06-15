import { StyleSheet, Text, View } from 'react-native';

import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface CompanyTaskTrackingProps {
  progressPercent: number;
  completedCount: number;
  totalCount: number;
}

export function CompanyTaskTracking({ progressPercent, completedCount, totalCount }: CompanyTaskTrackingProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Task Tracking</Text>
      <View style={styles.card}>
        <View style={styles.decor} />

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.subtitle}>Assigned vs Completed</Text>
            <Text style={styles.heading}>Weekly Progress</Text>
          </View>
          <Text style={styles.percent}>{progressPercent}%</Text>
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progressPercent}%` }]} />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{completedCount} Completed</Text>
          <Text style={styles.footerText}>{totalCount} Total</Text>
        </View>
      </View>
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
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    ...dashboardShadow,
    overflow: 'hidden',
    gap: 16,
  },
  decor: {
    position: 'absolute',
    bottom: -32,
    right: -32,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: dashboardTheme.primary,
    opacity: 0.05,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: dashboardTheme.onSurfaceVariant,
  },
  heading: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
    marginTop: 2,
  },
  percent: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: dashboardTheme.primary,
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: dashboardTheme.surfaceVariant,
    overflow: 'hidden',
    zIndex: 1,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: dashboardTheme.primary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  footerText: {
    fontSize: 11,
    lineHeight: 14,
    color: dashboardTheme.onSurfaceVariant,
  },
});
