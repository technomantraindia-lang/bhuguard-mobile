import { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ReportDownloadFormat } from '../../api/reportsApi';
import { deleteFieldOfficerReportDraft } from '../../api/fieldOfficerApi';
import { getApiErrorMessage } from '../../api/authApi';
import { AppButton } from '../../components/AppButton';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { ErrorState } from '../../components/ErrorState';
import { OfficerReportCard } from '../../components/officer/OfficerReportCard';
import { OfficerReportQuickActions } from '../../components/officer/OfficerReportQuickActions';
import { OfficerReportSkeletonCards } from '../../components/officer/OfficerReportSkeletonCards';
import { OfficerReportsHeader } from '../../components/officer/OfficerReportsHeader';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { useFieldOfficerReportsData } from '../../hooks/useFieldOfficerReportsData';
import type { FieldOfficerStackParamList, FieldOfficerTabParamList } from '../../navigation/types';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { downloadFieldOfficerReport } from '../../utils/roleReportDownload';
import type { FieldOfficerReportFilter, FieldOfficerReportItem } from '../../utils/fieldOfficerReportHelpers';
import { clearVisitReportDraft } from '../../utils/visitVerificationStorage';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FieldOfficerTabParamList, 'Reports'>,
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

  const { filteredReports, summary, loading, refreshing, error, reload, refresh } = useFieldOfficerReportsData({
    searchQuery,
    filter,
  });

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

  if (loading && filteredReports.length === 0 && !error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <OfficerReportsHeader
          onBack={() => navigation.navigate('Home')}
          onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
          onProfilePress={() => navigation.navigate('Profile')}
        />
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
      </SafeAreaView>
    );
  }

  if (error && filteredReports.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <OfficerReportsHeader
          onBack={() => navigation.navigate('Home')}
          onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
          onProfilePress={() => navigation.navigate('Profile')}
        />
        <ErrorState message="Unable to load reports" onRetry={reload} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfficerReportsHeader
        onBack={() => navigation.navigate('Home')}
        onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
        onProfilePress={() => navigation.navigate('Profile')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={officerTheme.primary} />
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
});
