import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '../../components/AppButton';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { OfficerReportCard } from '../../components/officer/OfficerReportCard';
import { useFieldOfficerReportsData } from '../../hooks/useFieldOfficerReportsData';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerReportDraft'>;

export function FieldOfficerReportDraftScreen({ navigation }: Props) {
  const { filteredReports, loading, error, reload } = useFieldOfficerReportsData({ filter: 'draft' });
  const draftReports = filteredReports;

  if (loading && draftReports.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading draft visits..." />
      </SafeAreaView>
    );
  }

  if (error && draftReports.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message="Unable to load draft reports" onRetry={reload} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Create Report</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Select a visit assignment to continue or start a verification report draft.
        </Text>

        {draftReports.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No draft visits available right now.</Text>
            <AppButton label="View Assigned Visits" onPress={() => navigation.navigate('FieldOfficerAssignments')} />
          </View>
        ) : (
          <View style={styles.list}>
            {draftReports.map((report) => (
              <OfficerReportCard
                key={`${report.id}-${report.assignmentId}`}
                report={report}
                onView={() => navigation.navigate('FieldOfficerReportDetail', { reportId: report.id })}
                onContinue={() =>
                  navigation.navigate('FieldOfficerDraftReportEditor', { assignmentId: report.assignmentId })
                }
                onDownload={() => undefined}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: officerTheme.background,
  },
  header: {
    minHeight: officerTheme.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: officerTheme.marginMobile,
    backgroundColor: officerTheme.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.outlineVariant,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  backText: {
    fontSize: 22,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: officerTheme.marginMobile,
    gap: 16,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: officerTheme.onSurfaceVariant,
  },
  list: {
    gap: 12,
  },
  emptyWrap: {
    gap: 12,
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: officerTheme.onSurfaceVariant,
    fontWeight: '600',
  },
});
