import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getNotifications } from '../../api/notificationsApi';
import { ApiListScreen } from '../../components/ApiListScreen';
import { ListItemCard } from '../../components/ListItemCard';
import { useNotifications } from '../../context/NotificationContext';
import { colors } from '../../theme/colors';
import type { ApiRecord } from '../../utils/apiHelpers';
import { pickString } from '../../utils/apiHelpers';

interface NotificationsScreenProps {
  title?: string;
}

export function NotificationsScreen({ title = 'Notifications' }: NotificationsScreenProps) {
  const { markAsRead, markAllAsRead, refreshUnreadCount } = useNotifications();
  const [reloadToken, setReloadToken] = useState(0);

  const fetcher = useCallback(async () => {
    void reloadToken;
    const data = await getNotifications({ per_page: 50 });
    await refreshUnreadCount();
    return data;
  }, [refreshUnreadCount, reloadToken]);

  const handleMarkAll = useCallback(async () => {
    try {
      await markAllAsRead();
      setReloadToken((value) => value + 1);
    } catch {
      // ApiListScreen refresh will surface failures on next load.
    }
  }, [markAllAsRead]);

  const handlePress = useCallback(async (item: ApiRecord) => {
    const id = pickString(item, 'id');
    if (!id) {
      return;
    }

    try {
      await markAsRead(id);
      setReloadToken((value) => value + 1);
    } catch {
      // Ignore mark-read failures; keep list usable.
    }
  }, [markAsRead]);

  return (
    <ApiListScreen
      title={title}
      subtitle="Activity updates for your account"
      fetcher={fetcher}
      listKeys={['notifications']}
      emptyTitle="No notifications yet."
      emptyMessage="You have no notifications yet."
      refetchOnFocus
      headerAction={{ label: 'Mark all read', onPress: () => void handleMarkAll() }}
      onItemPress={(item) => void handlePress(item)}
      searchKeys={['title', 'message', 'type', 'type_label', 'status']}
      renderItem={(item) => {
        const isRead = pickString(item, 'status') === 'read' || pickString(item, 'is_read') === 'true';

        return (
          <View style={[styles.cardWrap, !isRead && styles.unread]}>
            <ListItemCard
              item={item}
              titleKeys={['title', 'type_label', 'type']}
              subtitleKeys={['message', 'body']}
              statusKey="status"
              lines={[
                { label: 'Type', keys: ['type_label', 'type'] },
                { label: 'Created', keys: ['created_at'] },
                { label: 'Related', keys: ['related_code', 'related_id'] },
              ]}
            />
            {!isRead ? <Text style={styles.unreadHint}>Tap to mark as read</Text> : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  unread: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  unreadHint: {
    marginTop: 6,
    marginHorizontal: 4,
    color: colors.textMuted,
    fontSize: 12,
  },
});
