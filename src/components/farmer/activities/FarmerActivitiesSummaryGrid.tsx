import { StyleSheet, Text, View } from 'react-native';

import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import type { FarmerActivitiesSummary } from '../../../utils/farmerActivityHelpers';

interface FarmerActivitiesSummaryGridProps {
  summary: FarmerActivitiesSummary;
}

export function FarmerActivitiesSummaryGrid({ summary }: FarmerActivitiesSummaryGridProps) {
  return (
    <View style={[styles.card, dashboardShadow]}>
      <Text style={styles.heading}>Activity Overview</Text>

      <View style={styles.grid}>
        <View style={[styles.statBox, styles.statNeutral]}>
          <Text style={styles.statLabel}>Submitted Activities</Text>
          <Text style={styles.statValue}>{summary.submitted}</Text>
        </View>

        <View style={[styles.statBox, styles.statApproved]}>
          <Text style={[styles.statLabel, styles.statLabelApproved]}>Approved</Text>
          <Text style={[styles.statValue, styles.statValueApproved]}>{summary.approved}</Text>
        </View>

        <View style={[styles.statBox, styles.statReview]}>
          <Text style={[styles.statLabel, styles.statLabelReview]}>Under Review</Text>
          <Text style={[styles.statValue, styles.statValueReview]}>{summary.underReview}</Text>
        </View>

        <View style={[styles.statBox, styles.statCorrection]}>
          <Text style={[styles.statLabel, styles.statLabelCorrection]}>Correction Required</Text>
          <Text style={[styles.statValue, styles.statValueCorrection]}>{summary.correctionRequired}</Text>
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
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: dashboardTheme.onSurfaceVariant,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '47%',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  statNeutral: {
    backgroundColor: dashboardTheme.surfaceContainerLow,
  },
  statApproved: {
    backgroundColor: dashboardTheme.surfaceLow,
  },
  statReview: {
    backgroundColor: '#FEFCE8',
  },
  statCorrection: {
    backgroundColor: dashboardTheme.errorContainer,
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
  },
  statLabelApproved: {
    color: dashboardTheme.headingGreen,
  },
  statLabelReview: {
    color: '#854D0E',
  },
  statLabelCorrection: {
    color: dashboardTheme.onErrorContainer,
  },
  statValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: dashboardTheme.primary,
  },
  statValueApproved: {
    color: dashboardTheme.primaryContainer,
  },
  statValueReview: {
    color: '#CA8A04',
  },
  statValueCorrection: {
    color: dashboardTheme.error,
  },
});
