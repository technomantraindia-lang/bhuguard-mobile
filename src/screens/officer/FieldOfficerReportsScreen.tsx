import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ReportDownloadFormat } from '../../api/reportsApi';
import { deleteFieldOfficerReportDraft, getBiocharReport, getBiocharReports } from '../../api/fieldOfficerApi';
import { getApiErrorMessage } from '../../api/authApi';
import { AppButton } from '../../components/AppButton';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { ErrorState } from '../../components/ErrorState';
import { OfficerListState } from '../../components/officer/OfficerListState';
import { OfficerReportCard } from '../../components/officer/OfficerReportCard';
import { OfficerReportQuickActions } from '../../components/officer/OfficerReportQuickActions';
import { OfficerReportSkeletonCards } from '../../components/officer/OfficerReportSkeletonCards';
import { OfficerReportsHeader } from '../../components/officer/OfficerReportsHeader';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { useFieldOfficerReportsData } from '../../hooks/useFieldOfficerReportsData';
import type { FieldOfficerStackParamList, FieldOfficerTabParamList } from '../../navigation/types';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import {
  alertBiocharDownloadResult,
  saveAndShareBiocharReport,
} from '../../utils/biocharReportDownload';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';
import type { FieldOfficerReportFilter, FieldOfficerReportItem } from '../../utils/fieldOfficerReportHelpers';
import { downloadFieldOfficerReport } from '../../utils/roleReportDownload';
import { clearVisitReportDraft } from '../../utils/visitVerificationStorage';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FieldOfficerTabParamList, 'Home'>,
  NativeStackNavigationProp<FieldOfficerStackParamList>
>;

const FILTERS: Array<{ key: FieldOfficerReportFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'correction', label: 'Correction' },
];

export function FieldOfficerReportsScreen() {
  const navigation = useNavigation<Nav>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FieldOfficerReportFilter>('all');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<ReportDownloadFormat | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FieldOfficerReportItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [biocharReports, setBiocharReports] = useState<ApiRecord[]>([]);
  const [biocharLoading, setBiocharLoading] = useState(true);
  const [biocharError, setBiocharError] = useState<string | null>(null);
  const [biocharDetail, setBiocharDetail] = useState<ApiRecord | null>(null);
  const [biocharDownloadingId, setBiocharDownloadingId] = useState<number | null>(null);

  const { filteredReports, summary, loading, refreshing, error, reload, refresh } = useFieldOfficerReportsData({
    searchQuery,
    filter,
  });

  const loadBiocharReports = useCallback(async () => {
    setBiocharLoading(true);
    setBiocharError(null);

    try {
      const data = await getBiocharReports();
      setBiocharReports(extractList(data as ApiRecord, ['reports', 'data']));
    } catch (err) {
      setBiocharError(getApiErrorMessage(err, 'Failed to load biochar reports.'));
      setBiocharReports([]);
    } finally {
      setBiocharLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBiocharReports();
  }, [loadBiocharReports]);

  const statCards = useMemo(
    () => [
      { label: 'Total Reports', value: summary.totalReports },
      { label: 'Draft', value: summary.draft },
      { label: 'Submitted', value: summary.submitted },
      { label: 'Pending Review', value: summary.pendingReview },
    ],
    [summary],
  );

  const handleView = (report: FieldOfficerReportItem) => {
    navigation.navigate('FieldOfficerReportDetail', { reportId: report.id });
  };

  const handleContinue = (report: FieldOfficerReportItem) => {
    navigation.navigate('FieldOfficerDraftReportEditor', { assignmentId: report.assignmentId });
  };

  const handleDownload = async (report: FieldOfficerReportItem, format: ReportDownloadFormat) => {
    setDownloadingId(report.id);
    setDownloadingFormat(format);

    try {
      const result = await downloadFieldOfficerReport(report, format);

      if (!result.success) {
        Alert.alert('Download failed', result.message ?? 'Unable to download this report right now.');
        return;
      }

      Alert.alert('Success', result.message ?? 'Report downloaded successfully');
    } catch (err) {
      Alert.alert('Download failed', getApiErrorMessage(err, 'Unable to download this report right now.'));
    } finally {
      setDownloadingId(null);
      setDownloadingFormat(null);
    }
  };

  const openBiocharDetail = async (reportId: number) => {
    try {
      const data = await getBiocharReport(reportId);
      setBiocharDetail((data.report ?? data) as ApiRecord);
    } catch (err) {
      Alert.alert('Error', getApiErrorMessage(err, 'Unable to load biochar report detail.'));
    }
  };

  const handleBiocharDownload = async (reportId: number, format: 'pdf' | 'csv') => {
    setBiocharDownloadingId(reportId);
    try {
      const result = await saveAndShareBiocharReport(reportId, format, `biochar-report-${reportId}`);
      alertBiocharDownloadResult(result);
    } finally {
      setBiocharDownloadingId(null);
    }
  };

  const confirmDeleteDraft = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      if (!deleteTarget.isDraft) {
        Alert.alert('Delete failed', 'Only draft reports can be deleted.');
        return;
      }

      try {
        await deleteFieldOfficerReportDraft(deleteTarget.id);
      } catch {
        // Assignment-only drafts may not exist on backend yet.
      }

      await clearVisitReportDraft(deleteTarget.assignmentId);
      setDeleteTarget(null);
      await reload();
      Alert.alert('Draft deleted', 'The draft report has been removed.');
    } catch (err) {
      Alert.alert('Delete failed', getApiErrorMessage(err, 'Unable to delete this draft right now.'));
    } finally {
      setDeleting(false);
    }
  };

  const handleRefresh = () => {
    refresh();
    void loadBiocharReports();
  };

  if (loading && filteredReports.length === 0 && !error) {
    return (
      <SafeReportsShell navigation={navigation}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.statsGrid}>
            {statCards.map((card) => (
              <View key={card.label} style={[styles.statCard, officerCardShadow]}>
                <View style={styles.skeletonStatLabel} />
                <View style={styles.skeletonStatValue} />
              </View>
            ))}
          </View>
          <OfficerReportSkeletonCards />
        </ScrollView>
      </SafeReportsShell>
    );
  }

  if (error && filteredReports.length === 0) {
    return (
      <SafeReportsShell navigation={navigation}>
        <ErrorState message="Unable to load reports" onRetry={reload} />
      </SafeReportsShell>
    );
  }

  return (
    <SafeReportsShell navigation={navigation}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={officerTheme.primary} />
        }
      >
        <View style={styles.statsGrid}>
          {statCards.map((card) => (
            <View key={card.label} style={[styles.statCard, officerCardShadow]}>
              <Text style={styles.statLabel}>{card.label}</Text>
              <Text style={styles.statValue}>{card.value}</Text>
            </View>
          ))}
        </View>

        <OfficerReportQuickActions
          onCreateReport={() => navigation.navigate('FieldOfficerReportDraft')}
          onPendingReports={() => navigation.navigate('FieldOfficerPendingReports')}
          onDownloadCenter={() => navigation.navigate('FieldOfficerDownloadsCenter')}
        />

        <View style={styles.searchWrap}>
          <BhuguardMaterialIcon name="search" size={18} color={officerTheme.outline} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search report, farmer, farm ID..."
            placeholderTextColor={officerTheme.outline}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {FILTERS.map((chip) => (
            <Pressable
              key={chip.key}
              style={[styles.chip, filter === chip.key && styles.chipActive]}
              onPress={() => setFilter(chip.key)}
            >
              <Text style={[styles.chipText, filter === chip.key && styles.chipTextActive]}>{chip.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Verification Reports</Text>

        {filteredReports.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No reports found</Text>
            <AppButton label="Create Report" onPress={() => navigation.navigate('FieldOfficerReportDraft')} />
          </View>
        ) : (
          <View style={styles.list}>
            {filteredReports.map((report) => (
              <OfficerReportCard
                key={`${report.id}-${report.assignmentId}`}
                report={report}
                downloadingFormat={downloadingId === report.id ? downloadingFormat : null}
                onView={() => handleView(report)}
                onContinue={() => handleContinue(report)}
                onDownload={(format) => void handleDownload(report, format)}
                onDeleteDraft={report.isDraft ? () => setDeleteTarget(report) : undefined}
              />
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Completed Biochar Reports</Text>

        {biocharLoading && biocharReports.length === 0 ? (
          <OfficerListState kind="loading" message="Loading biochar reports…" />
        ) : biocharError && biocharReports.length === 0 ? (
          <OfficerListState kind="error" message={biocharError} onRetry={() => void loadBiocharReports()} />
        ) : biocharReports.length === 0 ? (
          <OfficerListState
            kind="empty"
            title="No biochar reports"
            message="Completed biochar production reports will appear here."
          />
        ) : (
          <View style={styles.list}>
            {biocharReports.map((report) => {
              const reportId = Number(report.batch_id ?? report.report_id ?? report.id);
              const busy = biocharDownloadingId === reportId;

              return (
                <View key={`biochar-${reportId}`} style={[styles.biocharCard, officerCardShadow]}>
                  <Text style={styles.biocharTitle}>
                    {pickString(report, 'report_id') !== '-'
                      ? pickString(report, 'report_id')
                      : `Batch ${reportId}`}
                  </Text>
                  <Text style={styles.biocharMeta}>
                    {pickString(report, 'farmer_name')} • {pickString(report, 'farm_name')}
                  </Text>
                  <Text style={styles.biocharMeta}>
                    Output: {pickString(report, 'biochar_output')} kg • {pickString(report, 'production_date')}
                  </Text>
                  <Text style={styles.biocharStatus}>{pickString(report, 'verification_status', 'status')}</Text>
                  <View style={styles.biocharActions}>
                    <Pressable style={styles.biocharBtn} onPress={() => void openBiocharDetail(reportId)}>
                      <Text style={styles.biocharBtnText}>Detail</Text>
                    </Pressable>
                    <Pressable
                      style={styles.biocharBtn}
                      disabled={busy}
                      onPress={() => void handleBiocharDownload(reportId, 'pdf')}
                    >
                      <Text style={styles.biocharBtnText}>{busy ? '…' : 'PDF'}</Text>
                    </Pressable>
                    <Pressable
                      style={styles.biocharBtnPrimary}
                      disabled={busy}
                      onPress={() => void handleBiocharDownload(reportId, 'csv')}
                    >
                      <Text style={styles.biocharBtnPrimaryText}>CSV</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {biocharDetail ? (
          <View style={[styles.detailCard, officerCardShadow]}>
            <Text style={styles.sectionTitle}>Biochar report detail</Text>
            <Text style={styles.detailLine}>Report: {pickString(biocharDetail, 'report_id')}</Text>
            <Text style={styles.detailLine}>Farmer: {pickString(biocharDetail, 'farmer_name')}</Text>
            <Text style={styles.detailLine}>Farm: {pickString(biocharDetail, 'farm_name')}</Text>
            <Text style={styles.detailLine}>Feedstock: {pickString(biocharDetail, 'feedstock_type')}</Text>
            <Text style={styles.detailLine}>Output: {pickString(biocharDetail, 'biochar_output')} kg</Text>
            <Text style={styles.detailLine}>Utilization: {pickString(biocharDetail, 'utilization_label')}</Text>
            <Text style={styles.detailLine}>Applied: {pickString(biocharDetail, 'quantity_applied')} kg</Text>
            <Text style={styles.detailLine}>Sold: {pickString(biocharDetail, 'quantity_sold')} kg</Text>
            <Text style={styles.detailLine}>Remaining: {pickString(biocharDetail, 'remaining_stock')} kg</Text>
            <Text style={styles.detailLine}>Status: {pickString(biocharDetail, 'verification_status')}</Text>
            <Pressable style={styles.biocharBtn} onPress={() => setBiocharDetail(null)}>
              <Text style={styles.biocharBtnText}>Close</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <ConfirmationModal
        visible={Boolean(deleteTarget)}
        title="Delete draft report?"
        message="This will remove the saved draft for this visit. This action cannot be undone."
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        onConfirm={() => void confirmDeleteDraft()}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeReportsShell>
  );
}

function SafeReportsShell({
  children,
  navigation,
}: {
  children: ReactNode;
  navigation: Nav;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfficerReportsHeader
        onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
        onProfilePress={() => navigation.navigate('Profile')}
      />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: officerTheme.background,
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: officerTheme.marginMobile,
    gap: 16,
    paddingBottom: 96,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: officerTheme.surfaceVariant,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  skeletonStatLabel: {
    width: '70%',
    height: 10,
    borderRadius: 5,
    backgroundColor: officerTheme.surfaceContainerHigh,
  },
  skeletonStatValue: {
    width: '40%',
    height: 22,
    borderRadius: 8,
    backgroundColor: officerTheme.surfaceContainer,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: officerTheme.onSurface,
    paddingVertical: 0,
  },
  chipRow: {
    gap: 10,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: officerTheme.surfaceContainer,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
  },
  chipActive: {
    backgroundColor: officerTheme.secondaryContainer,
    borderColor: officerTheme.secondaryContainer,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
  },
  chipTextActive: {
    color: officerTheme.onSecondaryContainer,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  list: {
    gap: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: officerTheme.onSurfaceVariant,
    fontWeight: '600',
  },
  biocharCard: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    gap: 4,
  },
  biocharTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  biocharMeta: {
    fontSize: 12,
    color: officerTheme.onSurfaceVariant,
  },
  biocharStatus: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: officerTheme.tertiary,
    textTransform: 'capitalize',
  },
  biocharActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  biocharBtn: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  biocharBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  biocharBtnPrimary: {
    backgroundColor: officerTheme.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  biocharBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: officerTheme.onPrimary,
  },
  detailCard: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    gap: 6,
  },
  detailLine: {
    fontSize: 13,
    color: officerTheme.onSurface,
  },
});
