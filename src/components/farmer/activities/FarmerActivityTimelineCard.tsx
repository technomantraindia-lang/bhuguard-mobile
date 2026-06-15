import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import type { ActivityDisplayStatus, FarmerActivityViewModel } from '../../../utils/farmerActivityHelpers';

interface FarmerActivityTimelineCardProps {
  activity: FarmerActivityViewModel;
  isLast?: boolean;
  onViewDetails: () => void;
  onDownloadReport?: () => void;
  onFixResubmit?: () => void;
}

const STATUS_STYLES: Record<
  ActivityDisplayStatus,
  { badge: string; text: string; dot: string }
> = {
  approved: {
    badge: dashboardTheme.surfaceLow,
    text: dashboardTheme.primaryContainer,
    dot: dashboardTheme.primaryContainer,
  },
  under_review: {
    badge: '#FEFCE8',
    text: '#CA8A04',
    dot: '#D9C94C',
  },
  correction_required: {
    badge: dashboardTheme.errorContainer,
    text: dashboardTheme.error,
    dot: dashboardTheme.error,
  },
  draft: {
    badge: dashboardTheme.surfaceContainerLow,
    text: dashboardTheme.textMuted,
    dot: dashboardTheme.textMuted,
  },
};

export function FarmerActivityTimelineCard({
  activity,
  isLast = false,
  onViewDetails,
  onDownloadReport,
  onFixResubmit,
}: FarmerActivityTimelineCardProps) {
  const statusStyle = STATUS_STYLES[activity.status];

  return (
    <View style={styles.row}>
      <View style={styles.timeline}>
        <View style={[styles.dot, { backgroundColor: statusStyle.dot }]} />
        {!isLast ? <View style={styles.line} /> : null}
      </View>

      <View style={[styles.card, dashboardShadow]}>
        <View style={styles.header}>
          <Text style={styles.emoji}>{activity.emoji}</Text>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{activity.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.badge }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{activity.statusLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.meta}>
          <MetaRow icon="agriculture" label="Farm" value={activity.farmName} />
          <MetaRow icon="schedule" label="Date" value={activity.dateLabel} />
          <MetaRow icon="photo_camera" label="Evidence" value={activity.evidenceLabel} />
          {activity.fieldOfficerName ? (
            <MetaRow icon="support_agent" label="Field Officer" value={activity.fieldOfficerName} />
          ) : null}
        </View>

        {activity.remark ? (
          <View style={styles.remarkBox}>
            <Text style={styles.remarkLabel}>Remark</Text>
            <Text style={styles.remarkText}>{activity.remark}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={onViewDetails}>
            <Text style={styles.primaryButtonText}>View Details</Text>
          </Pressable>

          {activity.status === 'approved' && onDownloadReport ? (
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              onPress={onDownloadReport}
            >
              <BhuguardMaterialIcon name="upload" size={16} color={dashboardTheme.primaryContainer} />
              <Text style={styles.secondaryButtonText}>Download Report</Text>
            </Pressable>
          ) : null}

          {activity.status === 'correction_required' && onFixResubmit ? (
            <Pressable
              style={({ pressed }) => [styles.fixButton, pressed && styles.pressed]}
              onPress={onFixResubmit}
            >
              <Text style={styles.fixButtonText}>Fix & Resubmit</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function MetaRow({ icon, label, value }: { icon: 'agriculture' | 'schedule' | 'photo_camera' | 'support_agent'; label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <BhuguardMaterialIcon name={icon} size={16} color={dashboardTheme.textMuted} />
      <Text style={styles.metaLabel}>{label}:</Text>
      <Text style={styles.metaValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  timeline: {
    width: 16,
    alignItems: 'center',
    paddingTop: 18,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: 4,
    backgroundColor: dashboardTheme.outlineVariant,
  },
  card: {
    flex: 1,
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 14,
    gap: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  meta: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
  },
  metaValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: dashboardTheme.onSurface,
  },
  remarkBox: {
    backgroundColor: dashboardTheme.errorContainer,
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  remarkLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: dashboardTheme.onErrorContainer,
    textTransform: 'uppercase',
  },
  remarkText: {
    fontSize: 13,
    lineHeight: 18,
    color: dashboardTheme.onErrorContainer,
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: dashboardTheme.primaryContainer,
    borderRadius: 8,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  fixButton: {
    backgroundColor: dashboardTheme.error,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  fixButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
