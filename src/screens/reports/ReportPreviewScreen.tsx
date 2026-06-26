import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReportDownloadActions } from '../../components/reports/ReportDownloadActions';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ReportPreviewHeader } from '../../components/shared/ReportPreviewHeader';
import { useApiDetail } from '../../hooks/useApiDetail';
import { useReportDownload } from '../../hooks/useReportDownload';
import type { ReportRole } from '../../api/reportsApi';
import { getReportDetail, resolveReportsDetailKeys } from '../../api/reportsApi';
import { formatReportStatusLabel, getReportStatusBadgeStyle } from '../../utils/reportStatusHelpers';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';
import { colors } from '../../theme/colors';

export interface ReportPreviewScreenProps {
  role: ReportRole;
  reportId: number;
  title?: string;
}

function unwrapReport(data: ApiRecord | undefined, role: ReportRole): ApiRecord | undefined {
  if (!data) {
    return undefined;
  }

  for (const key of resolveReportsDetailKeys(role)) {
    const nested = data[key];

    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as ApiRecord;
    }
  }

  return data;
}

export function ReportPreviewScreen({ role, reportId, title }: ReportPreviewScreenProps) {
  const { data, loading, error, reload } = useApiDetail(() => getReportDetail(role, reportId));
  const report = unwrapReport(data as ApiRecord | undefined, role);
  const status = pickString(report ?? {}, 'report_status', 'status', 'admin_review_status');
  const badge = getReportStatusBadgeStyle(status);
  const reportTitle =
    title ??
    pickString(report ?? {}, 'report_number', 'report_id', 'report_code', 'service_name', 'id');
  const fileNameBase = pickString(report ?? {}, 'report_number', 'report_id', 'report_code', 'id');

  const { downloadingFormat, download } = useReportDownload({
    role,
    reportId,
    fileNameBase,
    downloadKey: `${role}-${reportId}`,
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading report preview..." />
      </SafeAreaView>
    );
  }

  if (error || !report) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error ?? 'Unable to load report preview'} onRetry={reload} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ReportPreviewHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.previewPlaceholder}>
          <Text style={styles.previewTitle}>Report preview is not available yet.</Text>
          <Text style={styles.previewHint}>Use the download buttons below to save PDF, Excel, or DOC copies.</Text>
        </View>

        <View style={styles.metaCard}>
          <Text style={styles.metaTitle}>{reportTitle}</Text>
          <View style={[styles.badge, { backgroundColor: badge.backgroundColor }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{formatReportStatusLabel(status)}</Text>
          </View>

          <MetaRow label="Report ID" value={pickString(report, 'report_number', 'report_id', 'report_code', 'id')} />
          <MetaRow label="Type" value={pickString(report, 'service_name', 'project', 'report_type')} />
          <MetaRow label="Generated" value={pickString(report, 'generated_at', 'verification_date', 'submitted_at')} />
          <MetaRow
            label="Related"
            value={pickString(report, 'farm_name', 'site_name', 'farmer_name', 'company_name')}
          />
          <MetaRow label="Summary" value={pickString(report, 'verification_summary', 'officer_summary', 'notes')} />
        </View>

        <ReportDownloadActions downloadingFormat={downloadingFormat} onDownload={(format) => void download(format)} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value === '-' ? '—' : value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  previewPlaceholder: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 20,
    gap: 8,
    minHeight: 180,
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  previewHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  metaCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10,
  },
  metaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
});
