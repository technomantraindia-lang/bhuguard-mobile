import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import type { ProfileDocumentStatus } from '../../../constants/farmerProfileDocuments';

interface ProfileDocumentCardProps {
  title: string;
  status: ProfileDocumentStatus;
  onView?: () => void;
  onReplace?: () => void;
  actionsEnabled?: boolean;
  unavailableMessage?: string;
}

function statusLabel(status: ProfileDocumentStatus): string {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'uploaded':
      return 'Uploaded';
    default:
      return 'Pending';
  }
}

function statusStyle(status: ProfileDocumentStatus) {
  switch (status) {
    case 'verified':
      return { bg: dashboardTheme.surfaceLow, text: dashboardTheme.primaryContainer };
    case 'uploaded':
      return { bg: dashboardTheme.surfaceContainer, text: dashboardTheme.secondary };
    default:
      return { bg: dashboardTheme.creditsSurface, text: dashboardTheme.tertiary };
  }
}

export function ProfileDocumentCard({
  title,
  status,
  onView,
  onReplace,
  actionsEnabled = true,
  unavailableMessage = 'Document upload feature is not available yet.',
}: ProfileDocumentCardProps) {
  const badge = statusStyle(status);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <BhuguardMaterialIcon name="assignment" size={20} color={dashboardTheme.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{statusLabel(status)}</Text>
          </View>
        </View>
      </View>

      {actionsEnabled ? (
        <View style={styles.actions}>
          <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]} onPress={onView}>
            <Text style={styles.actionText}>View Document</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.actionButtonOutline, pressed && styles.pressed]} onPress={onReplace}>
            <Text style={styles.actionTextOutline}>Replace Document</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.unavailableText}>{unavailableMessage}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 12,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: dashboardTheme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  actionTextOutline: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.primary,
  },
  unavailableText: {
    fontSize: 13,
    lineHeight: 18,
    color: dashboardTheme.onSurfaceVariant,
    fontStyle: 'italic',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
