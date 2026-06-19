import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { OfficerReportCard } from '../../components/officer/OfficerReportCard';
import { useFieldOfficerReportsData } from '../../hooks/useFieldOfficerReportsData';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';
import { downloadFieldOfficerReport } from '../../utils/fieldOfficerReportDownload';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerPendingReports'>;

export function FieldOfficerPendingReportsScreen({ navigation }: Props) {
  const { reports, loading, error, reload } = useFieldOfficerReportsData();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const pendingReports = useMemo(
    () => reports.filter((report) => report.status === 'submitted' || report.status === 'pending'),
    [reports],
  );

  const handleDownload = async (reportId: number) => {
    const report = pendingReports.find((item) => item.id === reportId);

    if (!report) {
      return;
    }

    setDownloadingId(report.id);

    try {
      const result = await downloadFieldOfficerReport(report);

      if (!result.success) {
        Alert.alert('Download failed', result.message ?? 'Unable to download this report right now.');
        return;
      }

      Alert.alert('Success', result.message ?? 'Report downloaded successfully');
    } catch (err) {
      Alert.alert('Download failed', getApiErrorMessage(err, 'Unable to download this report right now.'));
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading && pendingReports.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading pending reports..." />
      </SafeAreaView>
    );
  }

  if (error && pendingReports.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message="Unable to load pending reports" onRetry={reload} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Pending Reports</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Submitted verification reports awaiting admin review.</Text>

        {pendingReports.length === 0 ? (
          <Text style={styles.emptyText}>No pending reports right now.</Text>
        ) : (
          <View style={styles.list}>
            {pendingReports.map((report) => (
              <OfficerReportCard
                key={`${report.id}-${report.assignmentId}`}
                report={report}
                downloading={downloadingId === report.id}
                onView={() => navigation.navigate('FieldOfficerReportDetail', { reportId: report.id })}
                onDownload={() => void handleDownload(report.id)}
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
  emptyText: {
    fontSize: 14,
    color: officerTheme.onSurfaceVariant,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 24,
  },
});
