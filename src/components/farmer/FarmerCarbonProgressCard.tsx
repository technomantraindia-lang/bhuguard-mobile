import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import type { FarmerReportsSummary } from '../../utils/farmerReportHelpers';

interface FarmerCarbonProgressCardProps {
  summary: FarmerReportsSummary;
  onViewSummary: () => void;
}

export function FarmerCarbonProgressCard({ summary, onViewSummary }: FarmerCarbonProgressCardProps) {
  return (
    <View style={[styles.card, dashboardShadow]}>
      <View style={styles.topAccent} />

      <View style={styles.headerRow}>
        <Text style={styles.title}>My Carbon Progress</Text>
        {summary.isActive ? (
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metricsRow}>
        <View>
          <Text style={styles.metricLabel}>Estimated Generated</Text>
          <Text style={styles.generatedValue}>
            {summary.estimatedGenerated.toFixed(1)}{' '}
            <Text style={styles.unit}>tCO</Text>
            <Text style={styles.subscript}>2</Text>
            <Text style={styles.unit}>e</Text>
          </Text>
        </View>

        <View style={styles.targetBlock}>
          <Text style={styles.metricLabel}>Target</Text>
          <Text style={styles.targetValue}>
            {summary.targetGenerated}{' '}
            <Text style={styles.unitSmall}>tCO</Text>
            <Text style={styles.subscriptSmall}>2</Text>
            <Text style={styles.unitSmall}>e</Text>
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${summary.progressPercent}%` }]} />
      </View>

      <View style={styles.progressLabels}>
        <Text style={styles.progressHint}>0%</Text>
        <Text style={styles.progressPercent}>{summary.progressPercent}%</Text>
        <Text style={styles.progressHint}>100%</Text>
      </View>

      <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={onViewSummary}>
        <Text style={styles.buttonText}>View Carbon Summary</Text>
        <BhuguardMaterialIcon name="arrow_forward" size={18} color={dashboardTheme.primaryContainer} />
      </Pressable>
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
    gap: 16,
    overflow: 'hidden',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: dashboardTheme.primary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${dashboardTheme.secondaryContainer}80`,
    borderWidth: 1,
    borderColor: dashboardTheme.secondaryContainer,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: dashboardTheme.primary,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.onSecondaryContainer,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  generatedValue: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: dashboardTheme.primary,
  },
  subscript: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
    color: dashboardTheme.onSurfaceVariant,
  },
  targetBlock: {
    alignItems: 'flex-end',
  },
  targetValue: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  unit: {
    fontSize: 16,
    fontWeight: '400',
    color: dashboardTheme.onSurfaceVariant,
  },
  unitSmall: {
    fontSize: 14,
    fontWeight: '500',
    color: dashboardTheme.onSurfaceVariant,
  },
  subscriptSmall: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
    color: dashboardTheme.onSurfaceVariant,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: dashboardTheme.surfaceLow,
    borderWidth: 1,
    borderColor: `${dashboardTheme.secondaryContainer}4D`,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: dashboardTheme.primaryContainer,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressHint: {
    fontSize: 12,
    color: dashboardTheme.onSurfaceVariant,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: dashboardTheme.primary,
  },
  button: {
    marginTop: 4,
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
