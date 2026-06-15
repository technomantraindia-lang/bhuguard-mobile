import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import type { FarmerReportsSummary } from '../../utils/farmerReportHelpers';

interface FarmerBenefitsSummaryCardProps {
  summary: FarmerReportsSummary;
  onViewDetails: () => void;
}

export function FarmerBenefitsSummaryCard({ summary, onViewDetails }: FarmerBenefitsSummaryCardProps) {
  return (
    <View style={[styles.card, dashboardShadow]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Farmer Benefits Summary</Text>
        <View style={styles.incentiveBadge}>
          <Text style={styles.incentiveBadgeText}>Project Incentives: Available</Text>
        </View>
      </View>

      <View style={styles.metricsCard}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Estimated Carbon Credits</Text>
          <Text style={styles.metricValue}>{summary.estimatedCredits.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricLabelRow}>
            <View style={styles.approvedDot} />
            <Text style={styles.metricLabel}>Approved Credits</Text>
          </View>
          <Text style={[styles.metricValue, styles.approvedValue]}>
            {summary.approvedCredits.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.metricRowLast}>
          <View style={styles.metricLabelRow}>
            <View style={styles.pendingDot} />
            <Text style={styles.metricLabel}>Pending Credits</Text>
          </View>
          <Text style={styles.metricValue}>{summary.pendingCredits.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={onViewDetails}>
        <Text style={styles.buttonText}>View Benefits</Text>
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
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
    flex: 1,
  },
  incentiveBadge: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: dashboardTheme.surfaceLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 160,
  },
  incentiveBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
    textAlign: 'right',
  },
  metricsCard: {
    backgroundColor: dashboardTheme.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${dashboardTheme.outlineVariant}33`,
    padding: 12,
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${dashboardTheme.outlineVariant}33`,
    gap: 12,
  },
  metricRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metricLabel: {
    fontSize: 15,
    color: dashboardTheme.onSurfaceVariant,
    flexShrink: 1,
  },
  metricValue: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  approvedValue: {
    color: dashboardTheme.primary,
  },
  approvedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: dashboardTheme.primary,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: dashboardTheme.tertiaryContainer,
  },
  button: {
    borderWidth: 2,
    borderColor: dashboardTheme.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: dashboardTheme.surface,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.primary,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
