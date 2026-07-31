import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { farmerTheme } from '../../../theme/farmerTheme';
import type { ProfileDocumentStatus } from '../../../constants/farmerProfileDocuments';

type DocumentCardStatus = ProfileDocumentStatus | 'rejected';

interface ProfileDocumentCardProps {
  title: string;
  status: DocumentCardStatus;
  rejectionReason?: string | null;
  onView?: () => void;
  onReplace?: () => void;
  onDelete?: () => void;
  actionsEnabled?: boolean;
  unavailableMessage?: string;
}

function statusLabel(status: DocumentCardStatus): string {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'uploaded':
      return 'Uploaded';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Pending';
  }
}

function statusStyle(status: DocumentCardStatus) {
  switch (status) {
    case 'verified':
      return { bg: farmerTheme.lightGreenSurface, text: farmerTheme.actionGreen };
    case 'uploaded':
      return { bg: farmerTheme.creamSurface, text: farmerTheme.headingGreen };
    case 'rejected':
      return { bg: '#FEE2E2', text: farmerTheme.error };
    default:
      return { bg: '#FEF3C7', text: farmerTheme.draft };
  }
}

export function ProfileDocumentCard({
  title,
  status,
  rejectionReason,
  onView,
  onReplace,
  onDelete,
  actionsEnabled = true,
  unavailableMessage = 'Document upload feature is not available yet.',
}: ProfileDocumentCardProps) {
  const badge = statusStyle(status);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <BhuguardMaterialIcon name="assignment" size={20} color={farmerTheme.actionGreen} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{statusLabel(status)}</Text>
          </View>
          {status === 'rejected' && rejectionReason ? (
            <Text style={styles.rejectionText}>{rejectionReason}</Text>
          ) : null}
        </View>
      </View>

      {actionsEnabled ? (
        <View style={styles.actions}>
          {onView ? (
            <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]} onPress={onView}>
              <Text style={styles.actionText}>View</Text>
            </Pressable>
          ) : null}
          {onReplace ? (
            <Pressable
              style={({ pressed }) => [styles.actionButtonOutline, pressed && styles.pressed]}
              onPress={onReplace}
            >
              <Text style={styles.actionTextOutline}>Replace</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              style={({ pressed }) => [styles.actionButtonOutline, pressed && styles.pressed]}
              onPress={onDelete}
            >
              <Text style={[styles.actionTextOutline, styles.deleteText]}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Text style={styles.unavailableText}>{unavailableMessage}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: farmerTheme.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: farmerTheme.softBorder,
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
    backgroundColor: farmerTheme.lightGreenSurface,
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
    color: farmerTheme.deepText,
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
  rejectionText: {
    fontSize: 12,
    color: farmerTheme.error,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexGrow: 1,
    backgroundColor: farmerTheme.lightGreenSurface,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 90,
  },
  actionButtonOutline: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: farmerTheme.softBorder,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: farmerTheme.white,
    minWidth: 90,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: farmerTheme.actionGreen,
  },
  actionTextOutline: {
    fontSize: 13,
    fontWeight: '600',
    color: farmerTheme.headingGreen,
  },
  deleteText: {
    color: farmerTheme.error,
  },
  unavailableText: {
    fontSize: 13,
    lineHeight: 18,
    color: farmerTheme.secondaryText,
    fontStyle: 'italic',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
