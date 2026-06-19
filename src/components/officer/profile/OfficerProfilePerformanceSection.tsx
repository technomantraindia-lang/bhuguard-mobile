import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';

interface OfficerProfilePerformanceSectionProps {
  visitsCompleted: number;
  accuracyPercent: number;
  onViewFull?: () => void;
  onVisitsPress?: () => void;
  onAccuracyPress?: () => void;
}

export function OfficerProfilePerformanceSection({
  visitsCompleted,
  accuracyPercent,
  onViewFull,
  onVisitsPress,
  onAccuracyPress,
}: OfficerProfilePerformanceSectionProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <BhuguardMaterialIcon name="analytics" size={20} color={officerTheme.primary} />
          <Text style={styles.title}>Performance</Text>
        </View>
        <Pressable onPress={onViewFull}>
          <Text style={styles.viewFull}>View Full</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        <Pressable
          style={[styles.statCard, officerCardShadow]}
          onPress={onVisitsPress}
          disabled={!onVisitsPress}
        >
          <Text style={styles.statValue}>{visitsCompleted}</Text>
          <Text style={styles.statLabel}>Visits Completed</Text>
        </Pressable>

        <Pressable
          style={[styles.statCard, officerCardShadow]}
          onPress={onAccuracyPress}
          disabled={!onAccuracyPress}
        >
          <Text style={styles.statValue}>
            {accuracyPercent}
            <Text style={styles.statSuffix}>%</Text>
          </Text>
          <Text style={styles.statLabel}>Accuracy Score</Text>
        </Pressable>
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
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  viewFull: {
    fontSize: 14,
    fontWeight: '500',
    color: officerTheme.primary,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.3)',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
  },
  statValue: {
    fontSize: 40,
    fontWeight: '700',
    color: officerTheme.primary,
    lineHeight: 48,
  },
  statSuffix: {
    fontSize: 20,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
  },
});
