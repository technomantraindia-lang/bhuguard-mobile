import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

export interface FarmerDashboardTask {
  id: string;
  title: string;
  subtitle: string;
  overdue?: boolean;
  type: 'soil' | 'plot';
  targetId?: number;
}

interface FarmerUpcomingTasksProps {
  tasks: FarmerDashboardTask[];
  onViewAll?: () => void;
  onTaskPress?: (task: FarmerDashboardTask) => void;
}

function TaskIcon({ type, overdue }: { type: FarmerDashboardTask['type']; overdue?: boolean }) {
  if (overdue || type === 'plot') {
    return (
      <View style={[styles.taskIcon, styles.taskIconAlert]}>
        <BhuguardMaterialIcon name="share_location" size={20} color={dashboardTheme.onErrorContainer} />
      </View>
    );
  }

  return (
    <View style={[styles.taskIcon, styles.taskIconDefault]}>
      <BhuguardMaterialIcon name="science" size={20} color={dashboardTheme.primary} />
    </View>
  );
}

export function FarmerUpcomingTasks({ tasks, onViewAll, onTaskPress }: FarmerUpcomingTasksProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Upcoming Tasks</Text>
        <Pressable onPress={onViewAll} style={({ pressed }) => pressed && styles.linkPressed}>
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        {tasks.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyText}>No pending soil samples or plot tasks right now.</Text>
          </View>
        ) : (
          tasks.map((task, index) => (
            <View key={task.id}>
              <Pressable
                style={({ pressed }) => [styles.taskRow, pressed && styles.taskRowPressed]}
                onPress={() => onTaskPress?.(task)}
              >
                <TaskIcon type={task.type} overdue={task.overdue} />
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.overdue ? (
                    <Text style={styles.taskSubtitle}>
                      <Text style={styles.overdue}>Overdue</Text>
                      <Text style={styles.taskSubtitleMuted}>
                        {' '}
                        • {task.subtitle.replace(/^Overdue • /, '')}
                      </Text>
                    </Text>
                  ) : (
                    <Text style={styles.taskSubtitleMuted}>{task.subtitle}</Text>
                  )}
                </View>
                <BhuguardMaterialIcon name="chevron_right" size={16} color={dashboardTheme.outlineVariant} />
              </Pressable>
              {index < tasks.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 24,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onBackground,
  },
  viewAll: {
    color: dashboardTheme.primary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
  linkPressed: {
    opacity: 0.7,
  },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    overflow: 'hidden',
    ...dashboardShadow,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  taskRowPressed: {
    backgroundColor: dashboardTheme.surfaceBright,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskIconDefault: {
    backgroundColor: dashboardTheme.surfaceVariant,
  },
  taskIconAlert: {
    backgroundColor: dashboardTheme.errorContainer,
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: dashboardTheme.onSurface,
  },
  taskSubtitle: {
    fontSize: 11,
    lineHeight: 14,
  },
  taskSubtitleMuted: {
    fontSize: 11,
    lineHeight: 14,
    color: dashboardTheme.onSurfaceVariant,
    marginTop: 4,
  },
  overdue: {
    color: dashboardTheme.error,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(191, 201, 189, 0.5)',
  },
  emptyWrap: {
    padding: 16,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.onSurfaceVariant,
  },
});
