import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { OfficerProfileAppBar } from '../../components/officer/profile/OfficerProfileAppBar';
import { useFieldOfficerProfileData } from '../../hooks/useFieldOfficerProfileData';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerPerformance'>;

function StatRow({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
    </View>
  );
}

export function FieldOfficerPerformanceScreen({ navigation }: Props) {
  const { data, loading, error, reload } = useFieldOfficerProfileData();

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading performance..." />
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const performance = data!.performance;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfficerProfileAppBar
        onBack={() => navigation.goBack()}
        onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
      />

      <View style={styles.content}>
        <Text style={styles.pageTitle}>Performance Overview</Text>
        <Text style={styles.pageSubtitle}>
          Track completed visits and verification accuracy from your assignment reports.
        </Text>

        <View style={styles.heroGrid}>
          <View style={[styles.heroCard, officerCardShadow]}>
            <Text style={styles.heroValue}>{performance.visitsCompleted}</Text>
            <Text style={styles.heroLabel}>Visits Completed</Text>
          </View>
          <View style={[styles.heroCard, officerCardShadow]}>
            <Text style={styles.heroValue}>
              {performance.accuracyPercent}
              <Text style={styles.heroSuffix}>%</Text>
            </Text>
            <Text style={styles.heroLabel}>Accuracy Score</Text>
          </View>
        </View>

        <View style={[styles.card, officerCardShadow]}>
          <Text style={styles.cardTitle}>Assignment Breakdown</Text>
          <StatRow label="Total Assignments" value={performance.totalAssignments} />
          <StatRow label="Approved" value={performance.approved} highlight />
          <StatRow label="Submitted to Admin" value={performance.submittedToAdmin} />
          <StatRow label="Pending" value={performance.pending} />
          <StatRow label="Correction Requested" value={performance.correctionRequested} />
          <StatRow label="Rejected" value={performance.rejected} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: officerTheme.background,
  },
  content: {
    padding: officerTheme.marginMobile,
    gap: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: officerTheme.onSurface,
  },
  pageSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: officerTheme.onSurfaceVariant,
  },
  heroGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  heroCard: {
    flex: 1,
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  heroValue: {
    fontSize: 36,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  heroSuffix: {
    fontSize: 18,
    fontWeight: '600',
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
    textAlign: 'center',
  },
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: officerTheme.onSurface,
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: officerTheme.outlineVariant,
  },
  statLabel: {
    fontSize: 14,
    color: officerTheme.onSurfaceVariant,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  statValueHighlight: {
    color: officerTheme.primary,
  },
});
