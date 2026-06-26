import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import {
  formatRelativeSupportTime,
  supportPriorityColor,
  supportPriorityLabel,
  supportStatusColor,
  supportStatusLabel,
} from '../../constants/supportCategories';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';

interface SupportThreadCardProps {
  thread: ApiRecord;
  onPress: () => void;
}

export function SupportThreadCard({ thread, onPress }: SupportThreadCardProps) {
  const status = pickString(thread, 'status');
  const priority = pickString(thread, 'priority');
  const unread = Number(thread.unread_admin_messages_count ?? 0);
  const preview = pickString(thread.latest_message as ApiRecord | undefined, 'message');

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.leftRail}>
        <View style={styles.avatar}>
          <BhuguardMaterialIcon name="support_agent" size={18} color="#fff" />
        </View>
        {unread > 0 ? <View style={styles.unreadDot} /> : null}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.subject} numberOfLines={1}>
            {pickString(thread, 'subject')}
          </Text>
          <Text style={styles.time}>
            {formatRelativeSupportTime(pickString(thread, 'last_message_at', 'lastMessageAt'))}
          </Text>
        </View>

        <Text style={styles.category}>{pickString(thread, 'category')}</Text>

        {preview ? (
          <Text style={styles.preview} numberOfLines={2}>
            {preview}
          </Text>
        ) : null}

        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: `${supportStatusColor(status)}18` }]}>
            <Text style={[styles.badgeText, { color: supportStatusColor(status) }]}>
              {supportStatusLabel(status)}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${supportPriorityColor(priority)}18` }]}>
            <Text style={[styles.badgeText, { color: supportPriorityColor(priority) }]}>
              {supportPriorityLabel(priority)}
            </Text>
          </View>
          {unread > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread} new</Text>
            </View>
          ) : null}
        </View>
      </View>

      <BhuguardMaterialIcon name="chevron_right" size={20} color={dashboardTheme.outline} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: 'rgba(191, 201, 190, 0.35)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    ...dashboardShadow,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  leftRail: {
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: dashboardTheme.primary,
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  unreadDot: {
    backgroundColor: dashboardTheme.primary,
    borderColor: '#fff',
    borderRadius: 999,
    borderWidth: 2,
    height: 12,
    position: 'absolute',
    right: -2,
    top: -2,
    width: 12,
  },
  body: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  subject: {
    color: dashboardTheme.onSurface,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  time: {
    color: dashboardTheme.outline,
    fontSize: 11,
    fontWeight: '600',
  },
  category: {
    color: dashboardTheme.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
  preview: {
    color: dashboardTheme.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  badges: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: dashboardTheme.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
