import { StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { formatRelativeSupportTime } from '../../constants/supportCategories';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface SupportChatBubbleProps {
  message: string;
  isAdmin: boolean;
  isBot?: boolean;
  senderName: string;
  createdAt?: string | null;
}

export function SupportChatBubble({ message, isAdmin, isBot = false, senderName, createdAt }: SupportChatBubbleProps) {
  return (
    <View style={[styles.row, isAdmin ? styles.rowAdmin : styles.rowUser]}>
      <View style={styles.avatarWrap}>
        {isAdmin ? (
          <View style={[styles.avatar, isBot ? styles.avatarBot : styles.avatarAdmin]}>
            <BhuguardMaterialIcon name={isBot ? 'eco' : 'support_agent'} size={16} color="#fff" />
          </View>
        ) : (
          <View style={[styles.avatar, styles.avatarUser]}>
            <BhuguardMaterialIcon name="person" size={16} color={dashboardTheme.primary} />
          </View>
        )}
      </View>

      <View style={[styles.content, isAdmin ? styles.contentAdmin : styles.contentUser]}>
        <Text style={styles.meta}>
          {senderName} · {formatRelativeSupportTime(createdAt)}
        </Text>
        <View style={[styles.bubble, isAdmin ? styles.bubbleAdmin : styles.bubbleUser]}>
          <Text style={isAdmin ? styles.bubbleTextAdmin : styles.bubbleTextUser}>{message}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    maxWidth: '92%',
  },
  rowUser: {
    alignSelf: 'flex-start',
  },
  rowAdmin: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatarWrap: {
    paddingTop: 18,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 14,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  avatarUser: {
    backgroundColor: '#EAF7EF',
  },
  avatarAdmin: {
    backgroundColor: '#1E3A8A',
  },
  avatarBot: {
    backgroundColor: '#047857',
  },
  content: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  contentUser: {
    alignItems: 'flex-start',
  },
  contentAdmin: {
    alignItems: 'flex-end',
  },
  meta: {
    color: dashboardTheme.outline,
    fontSize: 11,
    fontWeight: '600',
  },
  bubble: {
    borderRadius: 18,
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    borderColor: 'rgba(191, 201, 190, 0.45)',
    borderWidth: 1,
  },
  bubbleAdmin: {
    backgroundColor: dashboardTheme.primary,
    borderBottomRightRadius: 6,
  },
  bubbleTextUser: {
    color: dashboardTheme.onSurface,
    fontSize: 14,
    lineHeight: 21,
  },
  bubbleTextAdmin: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 21,
  },
});
