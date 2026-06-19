import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import type { ActivityDisplayStatus, FarmerActivityViewModel } from '../../../utils/farmerActivityHelpers';

interface FarmerActivityListCardProps {
  activity: FarmerActivityViewModel;
  onViewDetails: () => void;
  onDownloadReport?: () => void;
  onEditActivity?: () => void;
  onResubmit?: () => void;
}

const STATUS_STYLES: Record<
  ActivityDisplayStatus,
  { badge: string; text: string }
> = {
  approved: {
    badge: dashboardTheme.surfaceLow,
    text: dashboardTheme.primaryContainer,
  },
  submitted: {
    badge: '#EFF6FF',
    text: '#2563EB',
  },
  under_review: {
    badge: '#FEFCE8',
    text: '#CA8A04',
  },
  correction_required: {
    badge: dashboardTheme.errorContainer,
    text: dashboardTheme.error,
  },
  rejected: {
    badge: '#FEE2E2',
    text: '#B91C1C',
  },
  draft: {
    badge: dashboardTheme.surfaceContainerLow,
    text: dashboardTheme.textMuted,
  },
};

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaLine}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

export function FarmerActivityListCard({
  activity,
  onViewDetails,
  onDownloadReport,
  onEditActivity,
  onResubmit,
}: FarmerActivityListCardProps) {
  const statusStyle = STATUS_STYLES[activity.status];

  return (
    <View style={[styles.card, dashboardShadow]}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <BhuguardMaterialIcon name={activity.iconName} size={22} color={dashboardTheme.primaryContainer} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{activity.title}</Text>
          <Text style={styles.activityId}>{activity.activityId}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.badge }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{activity.statusLabel}</Text>
        </View>
      </View>

      <View style={styles.metaBlock}>
        <MetaLine label="Farm Name" value={activity.farmName} />
        <MetaLine label="Project" value={activity.projectName} />
        <MetaLine label="Activity Date" value={activity.dateLabel} />
        {activity.recordedAtLabel ? (
          <MetaLine label="Recorded At" value={activity.recordedAtLabel} />
        ) : null}
        <MetaLine label="Submitted By" value={activity.submittedBy} />
      </View>

      <View style={styles.evidenceRow}>
        <Text style={styles.evidenceTitle}>Evidence</Text>
        <Text style={styles.evidenceText}>Photos: {activity.evidencePhotoCount}</Text>
        {activity.documentsCount > 0 ? (
          <Text style={styles.evidenceText}>Documents: {activity.documentsCount}</Text>
        ) : null}
        <Text style={styles.evidenceText}>GPS: {activity.gpsLabel}</Text>
      </View>

      {activity.fieldOfficerName ? (
        <View style={styles.reviewBlock}>
          <Text style={styles.reviewTitle}>Officer Review</Text>
          <MetaLine label="Officer" value={activity.fieldOfficerName} />
          {activity.reviewDateLabel ? <MetaLine label="Review Date" value={activity.reviewDateLabel} /> : null}
        </View>
      ) : null}

      {activity.remark ? (
        <View style={styles.remarkBox}>
          <Text style={styles.remarkTitle}>Remarks</Text>
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

        {activity.status === 'draft' && onEditActivity ? (
          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={onEditActivity}>
            <Text style={styles.secondaryButtonText}>Edit Activity</Text>
          </Pressable>
        ) : null}

        {activity.status === 'correction_required' && onResubmit ? (
          <Pressable style={({ pressed }) => [styles.fixButton, pressed && styles.pressed]} onPress={onResubmit}>
            <Text style={styles.fixButtonText}>Resubmit</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  emoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.surfaceLow,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  activityId: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '36%',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  metaBlock: {
    gap: 6,
  },
  metaLine: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
    flexShrink: 1,
  },
  evidenceRow: {
    gap: 4,
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 10,
    padding: 10,
  },
  evidenceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
    marginBottom: 2,
  },
  evidenceText: {
    fontSize: 13,
    color: dashboardTheme.onSurface,
  },
  reviewBlock: {
    gap: 4,
  },
  reviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  remarkBox: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  remarkTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: dashboardTheme.onSurfaceVariant,
  },
  remarkText: {
    fontSize: 13,
    lineHeight: 19,
    color: dashboardTheme.onSurface,
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  fixButton: {
    backgroundColor: dashboardTheme.error,
    borderRadius: 10,
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
