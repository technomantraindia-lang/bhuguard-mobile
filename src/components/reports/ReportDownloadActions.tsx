import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ReportDownloadFormat } from '../../api/reportsApi';
import { colors } from '../../theme/colors';

interface ReportDownloadActionsProps {
  downloadingFormat?: ReportDownloadFormat | null;
  disabled?: boolean;
  compact?: boolean;
  onDownload: (format: ReportDownloadFormat) => void;
  onPreview?: () => void;
}

const FORMATS: Array<{ format: ReportDownloadFormat; label: string }> = [
  { format: 'pdf', label: 'PDF' },
  { format: 'excel', label: 'Excel' },
  { format: 'doc', label: 'DOC' },
];

export function ReportDownloadActions({
  downloadingFormat = null,
  disabled = false,
  compact = false,
  onDownload,
  onPreview,
}: ReportDownloadActionsProps) {
  return (
    <View style={styles.wrap}>
      {onPreview ? (
        <Pressable
          style={[styles.previewButton, disabled && styles.disabled]}
          onPress={onPreview}
          disabled={disabled}
        >
          <Text style={styles.previewText}>Preview Report</Text>
        </Pressable>
      ) : null}

      <View style={[styles.row, compact && styles.rowCompact]}>
        {FORMATS.map(({ format, label }) => {
          const loading = downloadingFormat === format;

          return (
            <Pressable
              key={format}
              style={[styles.downloadButton, compact && styles.downloadButtonCompact, disabled && styles.disabled]}
              onPress={() => onDownload(format)}
              disabled={disabled || loading || downloadingFormat !== null}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.downloadText}>{label}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  previewButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  previewText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowCompact: {
    flexWrap: 'wrap',
  },
  downloadButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  downloadButtonCompact: {
    minWidth: '30%',
    flexGrow: 1,
  },
  downloadText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  disabled: {
    opacity: 0.55,
  },
});
