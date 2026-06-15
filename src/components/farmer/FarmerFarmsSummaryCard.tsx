import { StyleSheet, Text, View } from 'react-native';

import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface FarmerFarmsSummaryCardProps {
  totalFarms: number;
  totalLandLabel: string;
  verifiedCount: number;
  pendingCount: number;
}

export function FarmerFarmsSummaryCard({
  totalFarms,
  totalLandLabel,
  verifiedCount,
  pendingCount,
}: FarmerFarmsSummaryCardProps) {
  return (
    <View style={[styles.card, dashboardShadow]}>
      <Text style={styles.heading}>Farm Portfolio Summary</Text>

      <View style={styles.grid}>
        <View style={[styles.statBox, styles.statNeutral]}>
          <Text style={styles.statLabel}>Total Farms</Text>
          <Text style={styles.statValue}>{totalFarms}</Text>
        </View>

        <View style={[styles.statBox, styles.statNeutral]}>
          <Text style={styles.statLabel}>Total Land</Text>
          <Text style={styles.statValue}>{totalLandLabel}</Text>
        </View>

        <View style={[styles.statBox, styles.statVerified]}>
          <Text style={[styles.statLabel, styles.statLabelVerified]}>Verified</Text>
          <Text style={[styles.statValue, styles.statValueVerified]}>{verifiedCount}</Text>
        </View>

        <View style={[styles.statBox, styles.statPending]}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statValue}>{pendingCount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.surfaceVariant,
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: dashboardTheme.onSurfaceVariant,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    width: '47%',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  statNeutral: {
    backgroundColor: dashboardTheme.surfaceContainerLow,
  },
  statVerified: {
    backgroundColor: dashboardTheme.secondaryContainer,
  },
  statPending: {
    backgroundColor: `${dashboardTheme.tertiaryContainer}33`,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  statLabelVerified: {
    color: dashboardTheme.onSecondaryContainer,
  },
  statValue: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.primary,
  },
  statValueVerified: {
    color: dashboardTheme.onSecondaryContainer,
  },
});
