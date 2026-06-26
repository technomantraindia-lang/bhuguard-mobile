import { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import {
  deleteFieldOfficerReportDraft,
  getAssignmentReport,
  getVisitAssignments,
} from '../../api/fieldOfficerApi';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { useApiList } from '../../hooks/useApiList';
import type { FieldOfficerStackParamList, FieldOfficerTabParamList } from '../../navigation/types';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { downloadFieldOfficerReport } from '../../utils/fieldOfficerReportDownload';
import { mapFieldOfficerReport } from '../../utils/fieldOfficerReportHelpers';
import { extractList, pickNestedString, pickString, type ApiRecord } from '../../utils/apiHelpers';

type ReportsFilterKey =
  | 'all'
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'correction_requested';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FieldOfficerTabParamList, 'Reports'>,
  NativeStackNavigationProp<FieldOfficerStackParamList>
>;

function resolveReportStatus(assignment: ApiRecord): ReportsFilterKey {
  const status = pickNestedString(assignment, 'verification_report.admin_review_status');

  if (status === '-' || status === 'null' || status === 'undefined') {
    return 'draft';
  }

  if (status === 'correction_requested') {
    return 'correction_requested';
  }

  if (status === 'approved') {
    return 'approved';
  }

  if (status === 'rejected') {
    return 'rejected';
  }

  if (status === 'submitted') {
    return 'submitted';
  }

  return 'pending';
}

function formatStatusLabel(status: ReportsFilterKey): string {
  return (
    {
      draft: 'Draft',
      submitted: 'Submitted',
      pending: 'Pending review',
      approved: 'Approved',
      rejected: 'Rejected',
      correction_requested: 'Correction',
      all: 'All',
    }[status] ?? 'Pending'
  );
}

function formatDateLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function matchesSearch(assignment: ApiRecord, query: string): boolean {
  const haystack = [
    pickString(assignment, 'assignment_code', 'id'),
    pickNestedString(assignment, 'farm.name'),
    pickNestedString(assignment, 'farm.farm_code'),
    pickNestedString(assignment, 'farm.location_text'),
    pickNestedString(assignment, 'farm.village'),
    pickNestedString(assignment, 'farm.district'),
    pickNestedString(assignment, 'farm.farmer.user.name'),
    pickNestedString(assignment, 'farm.company.name'),
    pickNestedString(assignment, 'verification_report.report_code'),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export function FieldOfficerVerificationReportsScreen() {
  const navigation = useNavigation<Nav>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ReportsFilterKey>('all');

  const fetcher = useMemo(
    () => async () => {
      const data = await getVisitAssignments();
      const assignments = extractList(data as ApiRecord, ['data', 'assignments', 'assignments']);

      return { assignments };
    },
    [],
  );

  const { items, loading, refreshing, error, reload, refresh } = useApiList({
    fetcher,
    listKeys: ['assignments'],
  });

  const { summary, filtered } = useMemo(() => {
    const counts: Record<ReportsFilterKey, number> = {
      all: items.length,
      draft: 0,
      submitted: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      correction_requested: 0,
    };

    const normalized = items.map((assignment) => ({ assignment, status: resolveReportStatus(assignment) }));
    for (const entry of normalized) {
      counts[entry.status] = (counts[entry.status] ?? 0) + 1;
    }

    const query = searchQuery.trim();
    const afterSearch = query ? normalized.filter((entry) => matchesSearch(entry.assignment, query)) : normalized;

    const afterFilter = filter === 'all' ? afterSearch : afterSearch.filter((entry) => entry.status === filter);

    return {
      summary: {
        totalReports: counts.all,
        draft: counts.draft,
        submitted: counts.submitted,
        pending: counts.pending,
      },
      filtered: afterFilter.map((entry) => entry.assignment),
    };
  }, [items, searchQuery, filter]);

  const openAssignment = (assignmentId: number) => {
    navigation.navigate('FieldOfficerAssignmentDetail', { assignmentId });
  };

  const openDetail = (assignmentId: number) => {
    navigation.navigate('FieldOfficerVerificationReportDetail', { reportId: assignmentId });
  };

  const handleDownloadPdf = async (assignmentId: number) => {
    try {
      const data = await getAssignmentReport(assignmentId);
      const reportRecord = (data?.report ?? data) as ApiRecord;
      const report = mapFieldOfficerReport({ ...reportRecord, assignment_id: assignmentId });
      const result = await downloadFieldOfficerReport(report);

      if (!result.success) {
        Alert.alert('Download unavailable', result.message ?? 'Report download is not available yet.');
        return;
      }

      Alert.alert('Success', result.message ?? 'Report downloaded successfully');
    } catch (err) {
      Alert.alert('Download failed', getApiErrorMessage(err, 'Report download is not available yet.'));
    }
  };

  const handleRemoveDraft = async (assignmentId: number) => {
    try {
      const data = await getAssignmentReport(assignmentId);
      const reportRecord = (data?.report ?? data) as ApiRecord;
      const reportId = Number(reportRecord?.id);

      if (!reportId) {
        Alert.alert('Draft visit', 'Open the assignment to continue or complete the verification flow.');
        return;
      }

      await deleteFieldOfficerReportDraft(reportId);
      reload();
      Alert.alert('Deleted', 'Draft report removed.');
    } catch (err) {
      Alert.alert('Delete failed', getApiErrorMessage(err, 'Unable to delete this draft right now.'));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || (loading && items.length === 0)}
            onRefresh={refresh}
            tintColor={officerTheme.primary}
          />
        }
      >
        <View style={styles.statsGrid}>
          <StatCard label="Total Reports" value={summary.totalReports} />
          <StatCard label="Draft" value={summary.draft} />
          <StatCard label="Submitted" value={summary.submitted} />
          <StatCard label="Pending Review" value={summary.pending} />
        </View>

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
          <FilterChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip label="Draft" active={filter === 'draft'} onPress={() => setFilter('draft')} />
          <FilterChip label="Submitted" active={filter === 'submitted'} onPress={() => setFilter('submitted')} />
          <FilterChip label="Approved" active={filter === 'approved'} onPress={() => setFilter('approved')} />
          <FilterChip label="Rejected" active={filter === 'rejected'} onPress={() => setFilter('rejected')} />
          <FilterChip
            label="Correction"
            active={filter === 'correction_requested'}
            onPress={() => setFilter('correction_requested')}
          />
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          {error ? (
            <Pressable onPress={reload}>
              <Text style={styles.inlineError}>{error}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.list}>
          {filtered.map((assignment) => {
            const assignmentId = Number(assignment.id ?? 0);
            const status = resolveReportStatus(assignment);
            const farmerName = pickNestedString(assignment, 'farm.farmer.user.name');
            const farmName = pickNestedString(assignment, 'farm.name');
            const project = pickNestedString(assignment, 'service.name');
            const dateRaw = pickString(assignment, 'visit_date', 'due_date', 'created_at', 'updated_at');
            const dateLabel = dateRaw === '-' ? '-' : formatDateLabel(dateRaw);

            const isDraft = status === 'draft';

            return (
              <View key={String(assignment.id ?? assignmentId)} style={[styles.card, officerCardShadow]}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleBlock}>
                    <Text style={styles.cardTitle}>
                      {farmerName !== '-' ? farmerName : pickString(assignment, 'assignment_code', 'id')}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {farmName !== '-' ? farmName : 'Farm'}
                      {project !== '-' ? ` • ${project}` : ''}
                    </Text>
                  </View>

                  <StatusPill status={status} />
                </View>

                <View style={styles.metaRow}>
                  <BhuguardMaterialIcon name="event_note" size={16} color={officerTheme.onSurfaceVariant} />
                  <Text style={styles.metaText}>{dateLabel}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable
                    style={styles.actionPrimary}
                    onPress={() => (isDraft ? openAssignment(assignmentId) : openDetail(assignmentId))}
                  >
                    <Text style={styles.actionPrimaryText}>{isDraft ? 'Continue' : 'View'}</Text>
                  </Pressable>

                  {isDraft ? (
                    <Pressable style={styles.actionDanger} onPress={() => void handleRemoveDraft(assignmentId)}>
                      <BhuguardMaterialIcon name="cloud_off" size={18} color={officerTheme.onErrorContainer} />
                    </Pressable>
                  ) : (
                    <Pressable style={styles.actionSecondary} onPress={() => void handleDownloadPdf(assignmentId)}>
                      <BhuguardMaterialIcon name="upload" size={18} color={officerTheme.primaryContainer} />
                      <Text style={styles.actionSecondaryText}>PDF</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}

          {filtered.length === 0 ? <Text style={styles.emptyText}>No reports match your filters.</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={[styles.statCard, officerCardShadow]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function StatusPill({ status }: { status: ReportsFilterKey }) {
  const label = formatStatusLabel(status);
  const tone = status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : status === 'draft' ? 'muted' : 'neutral';

  return (
    <View
      style={[
        styles.statusPill,
        tone === 'success' && styles.statusSuccess,
        tone === 'danger' && styles.statusDanger,
        tone === 'muted' && styles.statusMuted,
      ]}
    >
      <View
        style={[
          styles.statusDot,
          tone === 'success' && styles.statusDotSuccess,
          tone === 'danger' && styles.statusDotDanger,
          tone === 'muted' && styles.statusDotMuted,
        ]}
      />
      <Text
        style={[
          styles.statusText,
          tone === 'success' && styles.statusTextSuccess,
          tone === 'danger' && styles.statusTextDanger,
          tone === 'muted' && styles.statusTextMuted,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
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
    justifyContent: 'center',
    paddingHorizontal: officerTheme.marginMobile,
    paddingVertical: 12,
    backgroundColor: officerTheme.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.outlineVariant,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: officerTheme.primary,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  inlineError: {
    fontSize: 12,
    color: officerTheme.error,
    fontWeight: '600',
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: officerTheme.surfaceVariant,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  cardTitleBlock: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  cardSubtitle: {
    fontSize: 12,
    color: officerTheme.onSurfaceVariant,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: officerTheme.surfaceContainerHigh,
    gap: 6,
    maxWidth: 140,
  },
  statusSuccess: {
    backgroundColor: 'rgba(173, 238, 195, 0.35)',
  },
  statusDanger: {
    backgroundColor: officerTheme.errorContainer,
  },
  statusMuted: {
    backgroundColor: officerTheme.surfaceContainerHigh,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: officerTheme.outline,
  },
  statusDotSuccess: {
    backgroundColor: officerTheme.primaryContainer,
  },
  statusDotDanger: {
    backgroundColor: officerTheme.error,
  },
  statusDotMuted: {
    backgroundColor: officerTheme.outline,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
  },
  statusTextSuccess: {
    color: officerTheme.primaryContainer,
  },
  statusTextDanger: {
    color: officerTheme.onErrorContainer,
  },
  statusTextMuted: {
    color: officerTheme.onSurfaceVariant,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: officerTheme.onSurfaceVariant,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionPrimary: {
    flex: 1,
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: officerTheme.onPrimary,
  },
  actionSecondary: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(173, 238, 195, 0.25)',
    borderRadius: 14,
    paddingVertical: 10,
  },
  actionSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: officerTheme.primaryContainer,
  },
  actionDanger: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: officerTheme.errorContainer,
  },
  emptyText: {
    textAlign: 'center',
    color: officerTheme.onSurfaceVariant,
    fontSize: 13,
    paddingVertical: 24,
  },
});
