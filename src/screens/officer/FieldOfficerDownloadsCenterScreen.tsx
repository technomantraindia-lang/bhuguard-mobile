import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ReportDownloadFormat } from '../../api/reportsApi';
import { getApiErrorMessage } from '../../api/authApi';
import { AppButton } from '../../components/AppButton';
import { OfficerReportCard } from '../../components/officer/OfficerReportCard';
import { useFieldOfficerReportsData } from '../../hooks/useFieldOfficerReportsData';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';
import { downloadFieldOfficerReport } from '../../utils/fieldOfficerReportDownload';
import { reportDownloadKey } from '../../utils/fieldOfficerReportHelpers';
import { getDownloadedReportIds } from '../../utils/reportDownloadStorage';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerDownloadsCenter'>;

export function FieldOfficerDownloadsCenterScreen({ navigation }: Props) {
  const { reports, loading, reload } = useFieldOfficerReportsData();
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<ReportDownloadFormat | null>(null);

  useEffect(() => {
    void getDownloadedReportIds().then(setDownloadedIds);
  }, []);

  const downloadableReports = useMemo(
    () => reports.filter((report) => !report.isDraft),
    [reports],
  );

  const downloadedReports = useMemo(
    () => downloadableReports.filter((report) => downloadedIds.includes(reportDownloadKey(report))),
    [downloadableReports, downloadedIds],
  );

  const handleDownload = async (report: (typeof downloadableReports)[number], format: ReportDownloadFormat) => {
    setDownloadingId(report.id);
    setDownloadingFormat(format);

    try {
      const result = await downloadFieldOfficerReport(report, format);

      if (!result.success) {
        Alert.alert('Download failed', result.message ?? 'Unable to download this report right now.');
        return;
      }

      const ids = await getDownloadedReportIds();
      setDownloadedIds(ids);
      Alert.alert('Success', result.message ?? 'Report downloaded successfully');
    } catch (err) {
      Alert.alert('Download failed', getApiErrorMessage(err, 'Unable to download this report right now.'));
    } finally {
      setDownloadingId(null);
      setDownloadingFormat(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Download Center</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Download submitted verification reports as PDF files.</Text>

        {loading ? <Text style={styles.metaText}>Loading reports...</Text> : null}

        {downloadedReports.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Recently Downloaded</Text>
            <View style={styles.list}>
              {downloadedReports.map((report) => (
                <OfficerReportCard
                  key={`downloaded-${report.id}`}
                  report={report}
                  downloadingFormat={downloadingId === report.id ? downloadingFormat : null}
                  onView={() => navigation.navigate('FieldOfficerReportDetail', { reportId: report.id })}
                  onDownload={(format) => void handleDownload(report, format)}
                />
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Available Reports</Text>

        {downloadableReports.length === 0 ? (
          <Text style={styles.emptyText}>No downloadable reports yet.</Text>
        ) : (
          <View style={styles.list}>
            {downloadableReports.map((report) => (
              <OfficerReportCard
                key={`available-${report.id}`}
                report={report}
                downloadingFormat={downloadingId === report.id ? downloadingFormat : null}
                onView={() => navigation.navigate('FieldOfficerReportDetail', { reportId: report.id })}
                onDownload={(format) => void handleDownload(report, format)}
              />
            ))}
          </View>
        )}

        <AppButton label="Refresh Downloads" onPress={() => void reload()} variant="secondary" />
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
  metaText: {
    fontSize: 13,
    color: officerTheme.onSurfaceVariant,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  list: {
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: officerTheme.onSurfaceVariant,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
