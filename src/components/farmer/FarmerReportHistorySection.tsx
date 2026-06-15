import { StyleSheet, Text, View } from 'react-native';

import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import type { FarmerReportHistoryItem } from '../../utils/farmerReportHelpers';

interface FarmerReportHistorySectionProps {
  items: FarmerReportHistoryItem[];
}

export function FarmerReportHistorySection({ items }: FarmerReportHistorySectionProps) {
  return (
    <View style={[styles.card, dashboardShadow]}>
      <Text style={styles.title}>Report History</Text>

      <View style={styles.list}>
        {items.map((item, index) => (
          <View
            key={item.id}
            style={[styles.historyCard, index < items.length - 1 && styles.historyCardBorder]}
          >
            <View style={[styles.dot, item.isPrimary ? styles.dotPrimary : styles.dotMuted]} />
            <View style={styles.copy}>
              <Text style={styles.reportTitle}>{item.title}</Text>
              <Text style={[styles.date, item.isPrimary ? styles.datePrimary : styles.dateMuted]}>
                {item.dateLabel}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${dashboardTheme.outlineVariant}4D`,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  list: {
    gap: 0,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    position: 'relative',
  },
  historyCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: `${dashboardTheme.outlineVariant}33`,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  dotPrimary: {
    backgroundColor: dashboardTheme.primary,
  },
  dotMuted: {
    backgroundColor: dashboardTheme.outlineVariant,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  reportTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  date: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  datePrimary: {
    color: dashboardTheme.primary,
  },
  dateMuted: {
    color: dashboardTheme.onSurfaceVariant,
  },
});
