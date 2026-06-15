import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import type { ApiRecord } from '../utils/apiHelpers';
import { pickNestedString, pickString } from '../utils/apiHelpers';
import { AppCard } from './AppCard';
import { AppButton } from './AppButton';
import { StatusBadge } from './StatusBadge';

export interface ListFieldLine {
  label: string;
  keys?: string[];
  nested?: string;
}

interface ListItemCardProps {
  item: ApiRecord;
  titleKeys?: string[];
  subtitleKeys?: string[];
  statusKey?: string;
  statusNested?: string;
  lines?: ListFieldLine[];
  onDownload?: () => void;
  downloadAvailable?: boolean;
}

export function ListItemCard({
  item,
  titleKeys = ['name', 'title', 'farm_name', 'site_name', 'report_code', 'assignment_code', 'update_code'],
  subtitleKeys = ['description', 'remarks', 'activity_done'],
  statusKey = 'status',
  statusNested,
  lines = [],
  onDownload,
  downloadAvailable,
}: ListItemCardProps) {
  const status = statusNested
    ? pickNestedString(item, statusNested)
    : pickString(item, statusKey, 'assignment_status', 'report_status', 'enrolment_status');

  return (
    <AppCard title={pickString(item, ...titleKeys)} subtitle={pickString(item, ...subtitleKeys)}>
      {status !== '-' ? <StatusBadge status={status} /> : null}
      {lines.map((line) => (
        <View key={line.label} style={styles.line}>
          <Text style={styles.label}>{line.label}</Text>
          <Text style={styles.value}>
            {line.nested
              ? pickNestedString(item, line.nested)
              : pickString(item, ...(line.keys ?? []))}
          </Text>
        </View>
      ))}
      {downloadAvailable && onDownload ? (
        <AppButton label="Download (placeholder)" onPress={onDownload} variant="secondary" style={styles.download} />
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  line: { marginTop: 4 },
  label: { fontSize: 12, color: colors.textMuted },
  value: { fontSize: 14, color: colors.text, fontWeight: '500' },
  download: { marginTop: 8 },
});
