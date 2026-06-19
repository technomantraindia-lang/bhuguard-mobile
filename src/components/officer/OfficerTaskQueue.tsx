import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { OfficerDashboardTask } from '../../hooks/useFieldOfficerDashboardData';
import { OfficerMaterialIcon } from './OfficerMaterialIcon';
import { officerShadow, officerTheme } from '../../theme/officerDashboardTheme';

interface OfficerTaskQueueProps {
  tasks: OfficerDashboardTask[];
  onTaskPress?: (task: OfficerDashboardTask) => void;
}

function statusStyles(status: OfficerDashboardTask['status']) {
  switch (status) {
    case 'in_progress':
      return {
        bg: 'rgba(186, 173, 79, 0.3)',
        text: officerTheme.tertiary,
        icon: 'sync' as const,
      };
    case 'waiting':
      return {
        bg: officerTheme.surfaceVariant,
        text: officerTheme.onSurfaceVariant,
        icon: 'hourglass_empty' as const,
      };
    default:
      return {
        bg: officerTheme.secondaryContainer,
        text: officerTheme.onSecondaryContainer,
        icon: 'schedule' as const,
      };
  }
}

function dueLabelStyles(dueLabel: string) {
  if (dueLabel === 'Today') {
    return {
      backgroundColor: officerTheme.surfaceVariant,
      color: officerTheme.onSurfaceVariant,
      borderWidth: 0,
    };
  }

  return {
    backgroundColor: officerTheme.surface,
    color: officerTheme.onSurfaceVariant,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
  };
}

export function OfficerTaskQueue({ tasks, onTaskPress }: OfficerTaskQueueProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Task Queue</Text>

      <View style={styles.list}>
        {tasks.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No pending tasks</Text>
            <Text style={styles.emptyText}>Assigned visits and onboarding tasks will appear here.</Text>
          </View>
        ) : (
          tasks.map((task, index) => {
            const badge = statusStyles(task.status);
            const dueStyles = dueLabelStyles(task.dueLabel ?? task.timeLabel);
            const isDimmed = task.status === 'waiting' && index === tasks.length - 1;

            return (
              <Pressable
                key={task.id}
                style={[styles.card, isDimmed && styles.cardDimmed]}
                onPress={() => onTaskPress?.(task)}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.taskTitle}>{task.title ?? task.farmerName}</Text>
                  <View
                    style={[
                      styles.duePill,
                      {
                        backgroundColor: dueStyles.backgroundColor,
                        borderWidth: dueStyles.borderWidth,
                        borderColor: dueStyles.borderColor,
                      },
                    ]}
                  >
                    <Text style={[styles.dueLabel, { color: dueStyles.color }]}>{task.dueLabel ?? task.timeLabel}</Text>
                  </View>
                </View>

                <View style={styles.locationRow}>
                  <OfficerMaterialIcon name="location_on" size={16} color={officerTheme.onSurfaceVariant} />
                  <Text style={styles.locationText}>{task.location}</Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <OfficerMaterialIcon name={badge.icon} size={12} color={badge.text} />
                  <Text style={[styles.statusText, { color: badge.text }]}>{task.statusLabel}</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: officerTheme.onSurface,
    marginBottom: 16,
  },
  list: {
    gap: 8,
  },
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    ...officerShadow,
    gap: 8,
  },
  cardDimmed: {
    opacity: 0.75,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  duePill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dueLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    lineHeight: 20,
    color: officerTheme.onSurfaceVariant,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
  },
  emptyWrap: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  emptyText: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: officerTheme.onSurfaceVariant,
  },
});
