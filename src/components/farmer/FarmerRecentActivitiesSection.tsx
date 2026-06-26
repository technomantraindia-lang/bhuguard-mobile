import { StyleSheet, Text, View } from 'react-native';

import type { FarmerActivityViewModel } from '../../utils/farmerActivityHelpers';
import { DashboardPressable } from '../shared/DashboardPressable';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface FarmerRecentActivitiesSectionProps {
  activities: FarmerActivityViewModel[];
  onActivityPress: (activityId: number) => void;
  onViewAllPress: () => void;
}

export function FarmerRecentActivitiesSection({
  activities,
  onActivityPress,
  onViewAllPress,
}: FarmerRecentActivitiesSectionProps) {
  if (activities.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Recent Biochar Activity</Text>
        <DashboardPressable variant="button" onPress={onViewAllPress}>
          <Text style={styles.viewAll}>View all</Text>
        </DashboardPressable>
      </View>

      <View style={styles.list}>
        {activities.map((activity) => (
          <DashboardPressable
            key={activity.id}
            onPress={() => onActivityPress(activity.id)}
            style={[styles.card, dashboardShadow]}
          >
            <View style={styles.cardTop}>
              <Text style={styles.emoji}>{activity.emoji}</Text>
              <View style={styles.copy}>
                <Text style={styles.title}>{activity.title}</Text>
                <Text style={styles.subtitle}>{activity.activityId}</Text>
                <Text style={styles.farmName}>{activity.farmName}</Text>
              </View>
              <Text style={styles.date}>{activity.dateLabel}</Text>
            </View>
            <Text style={styles.status}>{activity.statusLabel}</Text>
          </DashboardPressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  viewAll: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 12,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 22,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  farmName: {
    fontSize: 12,
    lineHeight: 16,
    color: dashboardTheme.textMuted,
  },
  date: {
    fontSize: 11,
    lineHeight: 14,
    color: dashboardTheme.textMuted,
  },
  status: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
});
