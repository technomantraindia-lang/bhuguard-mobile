import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApiDetail } from '../hooks/useApiDetail';
import { colors } from '../theme/colors';
import type { ApiRecord } from '../utils/apiHelpers';
import { EMPTY_DATA_MESSAGE, PENDING_API_MESSAGE } from '../utils/apiError';
import { AppCard } from './AppCard';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';
import { ScreenHeader } from './ScreenHeader';
import { ReportPreviewHeader } from './shared/ReportPreviewHeader';
import { StatusBadge } from './StatusBadge';
import { pickNestedString, pickString } from '../utils/apiHelpers';

export interface DetailField {
  label: string;
  keys?: string[];
  nested?: string;
}

interface ApiDetailScreenProps {
  title: string;
  subtitle?: string;
  fetcher: () => Promise<ApiRecord>;
  rootKeys?: string[];
  titleKeys?: string[];
  statusKeys?: string[];
  fields?: DetailField[];
  renderExtra?: (item: ApiRecord) => ReactNode;
  showReportHeader?: boolean;
}

function unwrapRecord(data: ApiRecord, rootKeys: string[]): ApiRecord {
  for (const key of rootKeys) {
    const value = data[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as ApiRecord;
    }
  }

  return data;
}

export function ApiDetailScreen({
  title,
  subtitle,
  fetcher,
  rootKeys = [],
  titleKeys = ['name', 'title', 'farm_name', 'site_name', 'report_code', 'assignment_code'],
  statusKeys = ['status', 'assignment_status', 'report_status'],
  fields = [],
  renderExtra,
  showReportHeader = false,
}: ApiDetailScreenProps) {
  const { data, loading, error, pending, reload } = useApiDetail(fetcher);

  const topHeader = (
    <View style={styles.pad}>
      {showReportHeader ? <ReportPreviewHeader /> : null}
      <ScreenHeader title={title} subtitle={subtitle} showBrandLogo={!showReportHeader} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        {topHeader}
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        {topHeader}
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  if (pending || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        {topHeader}
        <EmptyState title="Module ready" message={PENDING_API_MESSAGE} />
      </SafeAreaView>
    );
  }

  const item = unwrapRecord(data, rootKeys);
  const status = pickString(item, ...statusKeys);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {showReportHeader ? <ReportPreviewHeader /> : null}
        <ScreenHeader title={title} subtitle={subtitle} showBrandLogo={!showReportHeader} />
        <AppCard title={pickString(item, ...titleKeys)} subtitle={subtitle}>
          {status !== '-' ? <StatusBadge status={status} /> : null}
          {fields.map((field) => (
            <View key={field.label} style={styles.row}>
              <Text style={styles.label}>{field.label}</Text>
              <Text style={styles.value}>
                {field.nested
                  ? pickNestedString(item, field.nested)
                  : pickString(item, ...(field.keys ?? []))}
              </Text>
            </View>
          ))}
          {renderExtra?.(item)}
        </AppCard>
        {!fields.length && !renderExtra ? (
          <EmptyState title="No details" message={EMPTY_DATA_MESSAGE} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 20, paddingTop: 12 },
  container: { padding: 20, gap: 12, paddingBottom: 32 },
  row: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  value: { fontSize: 15, color: colors.text, marginTop: 4, lineHeight: 22 },
});
