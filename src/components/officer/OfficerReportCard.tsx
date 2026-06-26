import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import type { ReportDownloadFormat } from '../../api/reportsApi';
import {
  formatReportStatusLabel,
  formatVerificationDateLabel,
  type FieldOfficerReportItem,
  type FieldOfficerReportStatus,
} from '../../utils/fieldOfficerReportHelpers';

interface OfficerReportCardProps {
  report: FieldOfficerReportItem;
  downloadingFormat?: ReportDownloadFormat | null;
  onView: () => void;
  onContinue?: () => void;
  onDownload?: (format: ReportDownloadFormat) => void;
  onDeleteDraft?: () => void;
}

function statusTone(status: FieldOfficerReportStatus): 'success' | 'danger' | 'muted' | 'neutral' {
  if (status === 'approved') {
    return 'success';
  }

  if (status === 'rejected') {
    return 'danger';
  }

  if (status === 'draft') {
    return 'muted';
  }

  return 'neutral';
}

export function OfficerReportCard({
  report,
  downloadingFormat = null,
  onView,
  onContinue,
  onDownload,
  onDeleteDraft,
}: OfficerReportCardProps) {
  const tone = statusTone(report.status);
  const subjectName = report.companyName || report.farmerName;

  return (
    <View style={[styles.card, officerCardShadow]}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.reportId}>{report.reportId}</Text>
          <Text style={styles.subjectName}>{subjectName}</Text>
          <Text style={styles.metaLine}>
            {report.farmName} · {report.project}
          </Text>
        </View>

        <View
          style={[
            styles.statusPill,
            tone === 'success' && styles.statusSuccess,
            tone === 'danger' && styles.statusDanger,
            tone === 'muted' && styles.statusMuted,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              tone === 'success' && styles.statusTextSuccess,
              tone === 'danger' && styles.statusTextDanger,
            ]}
          >
            {formatReportStatusLabel(report.status)}
          </Text>
        </View>
      </View>

      <View style={styles.dateRow}>
        <BhuguardMaterialIcon name="event_note" size={16} color={officerTheme.onSurfaceVariant} />
        <Text style={styles.dateText}>{formatVerificationDateLabel(report.verificationDate)}</Text>
      </View>

      <View style={styles.actionsRow}>
        {report.isDraft ? (
          <>
            <Pressable style={styles.primaryAction} onPress={onContinue}>
              <Text style={styles.primaryActionText}>Continue</Text>
            </Pressable>
            {onDeleteDraft ? (
              <Pressable style={styles.dangerAction} onPress={onDeleteDraft}>
                <BhuguardMaterialIcon name="cloud_off" size={18} color={officerTheme.onErrorContainer} />
              </Pressable>
            ) : null}
          </>
        ) : (
          <>
            <Pressable style={styles.primaryAction} onPress={onView}>
              <Text style={styles.primaryActionText}>View</Text>
            </Pressable>
            {(['pdf', 'excel', 'doc'] as ReportDownloadFormat[]).map((format) => {
              const loading = downloadingFormat === format;
              const label = format === 'pdf' ? 'PDF' : format === 'excel' ? 'Excel' : 'DOC';

              return (
                <Pressable
                  key={format}
                  style={styles.secondaryAction}
                  onPress={() => onDownload?.(format)}
                  disabled={loading || downloadingFormat !== null || !onDownload}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={officerTheme.primaryContainer} />
                  ) : (
                    <Text style={styles.secondaryActionText}>{label}</Text>
                  )}
                </Pressable>
              );
            })}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: officerTheme.surfaceVariant,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  reportId: {
    fontSize: 12,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  metaLine: {
    fontSize: 12,
    color: officerTheme.onSurfaceVariant,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: officerTheme.surfaceContainerHigh,
    maxWidth: 130,
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
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
    textAlign: 'center',
  },
  statusTextSuccess: {
    color: officerTheme.primaryContainer,
  },
  statusTextDanger: {
    color: officerTheme.onErrorContainer,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 12,
    color: officerTheme.onSurfaceVariant,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryAction: {
    minWidth: '22%',
    flexGrow: 1,
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: officerTheme.onPrimary,
  },
  secondaryAction: {
    minWidth: '22%',
    flexGrow: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(173, 238, 195, 0.25)',
    borderRadius: 14,
    paddingVertical: 10,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: officerTheme.primaryContainer,
  },
  dangerAction: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: officerTheme.errorContainer,
  },
});
