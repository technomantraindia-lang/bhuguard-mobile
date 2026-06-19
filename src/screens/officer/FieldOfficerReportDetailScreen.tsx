import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { getFieldOfficerReportDetail } from '../../api/fieldOfficerApi';
import { AppButton } from '../../components/AppButton';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { useApiDetail } from '../../hooks/useApiDetail';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { downloadFieldOfficerReport } from '../../utils/fieldOfficerReportDownload';
import {
  formatReportStatusLabel,
  formatVerificationDateLabel,
  mapFieldOfficerReport,
  type FieldOfficerReportItem,
} from '../../utils/fieldOfficerReportHelpers';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FieldOfficerReportDetail'>;

export function FieldOfficerReportDetailScreen({ route, navigation }: Props) {
  const { reportId } = route.params;
  const [downloading, setDownloading] = useState(false);

  const fetcher = useCallback(() => getFieldOfficerReportDetail(reportId), [reportId]);

  const { data, loading, error, reload } = useApiDetail(fetcher);

  const reportRecord = (data?.report ?? data) as ApiRecord | undefined;
  const report: FieldOfficerReportItem | null = reportRecord ? mapFieldOfficerReport(reportRecord) : null;

  const handleDownload = async () => {
    if (!report) {
      return;
    }

    setDownloading(true);

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
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading report details..." />
      </SafeAreaView>
    );
  }

  if (error || !report || !reportRecord) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error ?? 'Unable to load report details'} onRetry={reload} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Report Detail</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, officerCardShadow]}>
          <Text style={styles.reportId}>{report.reportId}</Text>
          <Text style={styles.status}>{formatReportStatusLabel(report.status)}</Text>

          <DetailRow label="Farmer / Company" value={report.companyName || report.farmerName} />
          <DetailRow label="Farm / Site" value={report.farmName} />
          <DetailRow label="Project" value={report.project} />
          <DetailRow label="Verification Date" value={formatVerificationDateLabel(report.verificationDate)} />
          <DetailRow label="Recommendation" value={pickString(reportRecord, 'officer_recommendation')} />
          <DetailRow label="Admin Review" value={pickString(reportRecord, 'admin_review_status')} />
          <DetailRow label="Admin Remarks" value={pickString(reportRecord, 'admin_remarks')} />
          <DetailRow label="Submitted At" value={pickString(reportRecord, 'submitted_at')} />
        </View>

        <View style={[styles.card, officerCardShadow]}>
          <Text style={styles.sectionTitle}>Officer Summary</Text>
          <Text style={styles.summaryText}>{pickString(reportRecord, 'officer_summary')}</Text>
        </View>

        {!report.isDraft ? (
          <AppButton
            label={downloading ? 'Downloading...' : 'Download PDF'}
            onPress={() => void handleDownload()}
            loading={downloading}
          />
        ) : (
          <AppButton
            label="Continue Draft"
            onPress={() =>
              navigation.navigate('FieldOfficerDraftReportEditor', { assignmentId: report.assignmentId })
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value === '-' ? '—' : value}</Text>
    </View>
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
  backText: {
    fontSize: 22,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  headerTitle: {
    fontSize: 18,
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
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: officerTheme.surfaceVariant,
    gap: 10,
  },
  reportId: {
    fontSize: 14,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  status: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: officerTheme.secondaryContainer,
    color: officerTheme.onSecondaryContainer,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: officerTheme.onSurfaceVariant,
  },
  detailRow: {
    gap: 2,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: officerTheme.onSurface,
    fontWeight: '600',
  },
});
