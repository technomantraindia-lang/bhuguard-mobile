import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { closeSupportThread, getSupportThreadDetail, sendSupportMessage } from '../../api/supportApi';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SupportChatBubble } from '../../components/support/SupportChatBubble';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { supportStatusColor, supportStatusLabel } from '../../constants/supportCategories';
import { useSupportAutoRefresh } from '../../hooks/useSupportAutoRefresh';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';

interface SupportChatScreenProps {
  threadId: number;
}

export function SupportChatScreen({ threadId }: SupportChatScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ApiRecord>>(null);
  const messageCountRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thread, setThread] = useState<ApiRecord | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(false);
      } else if (!thread) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      if (!silent) {
        setError(null);
      }

      try {
        const data = await getSupportThreadDetail(threadId);
        const nextThread = (data.thread ?? data) as ApiRecord;
        const nextMessages = extractList(nextThread, ['messages']);
        const previousCount = messageCountRef.current;

        setThread(nextThread);
        messageCountRef.current = nextMessages.length;

        if (silent && nextMessages.length > previousCount) {
          requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
        }
      } catch (err) {
        if (!silent) {
          setError(getApiErrorMessage(err, 'Failed to load support conversation.'));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [thread, threadId],
  );

  useSupportAutoRefresh(load, { intervalMs: 6000 });

  const handleSend = async () => {
    if (!message.trim()) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      await sendSupportMessage(threadId, { message: message.trim() });
      setMessage('');
      await load(true);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send message.'));
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    setSending(true);
    setError(null);

    try {
      await closeSupportThread(threadId);
      await load(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to close support thread.'));
    } finally {
      setSending(false);
    }
  };

  if (loading && !thread) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Support Chat" />
        <LoadingState message="Loading conversation..." />
      </SafeAreaView>
    );
  }

  if (error && !thread) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Support Chat" />
        <ErrorState message={error} onRetry={() => void load(false)} />
      </SafeAreaView>
    );
  }

  const status = pickString(thread ?? {}, 'status');
  const isClosed = status === 'closed' || status === 'resolved';
  const messages = extractList(thread ?? {}, ['messages']);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={pickString(thread ?? {}, 'subject')}
        subtitle={`${supportStatusLabel(status)} · Live updates`}
      />

      <View style={styles.statusBanner}>
        <View style={[styles.statusPill, { backgroundColor: `${supportStatusColor(status)}18` }]}>
          <Text style={[styles.statusPillText, { color: supportStatusColor(status) }]}>
            {supportStatusLabel(status)}
          </Text>
        </View>
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.statusHint}>Auto-syncing messages</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.messagesContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(false)} tintColor={dashboardTheme.primary} />}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const senderType = pickString(item, 'sender_type');
            const isAdmin = senderType === 'admin' || senderType === 'ai_bot' || senderType === 'system';
            const isBot = senderType === 'ai_bot';

            return (
              <SupportChatBubble
                message={pickString(item, 'message')}
                isAdmin={isAdmin}
                isBot={isBot}
                senderName={
                  isBot
                    ? 'Bhuguard Assistant'
                    : senderType === 'system'
                      ? 'Bhuguard Support'
                      : isAdmin
                        ? 'Bhuguard Team'
                        : pickString(item, 'sender_name', 'senderName') || 'You'
                }
                createdAt={pickString(item, 'created_at', 'createdAt')}
              />
            );
          }}
          ListEmptyComponent={<EmptyState title="No messages yet" message="Start the conversation below." />}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {!isClosed ? (
            <View style={styles.composerCard}>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder="Write your message..."
                placeholderTextColor={dashboardTheme.outline}
                multiline
              />
              <View style={styles.composerActions}>
                <Pressable style={styles.closeButton} onPress={() => void handleClose()} disabled={sending}>
                  <Text style={styles.closeButtonText}>Close Ticket</Text>
                </Pressable>
                <Pressable
                  style={[styles.sendButton, (sending || !message.trim()) && styles.sendButtonDisabled]}
                  onPress={() => void handleSend()}
                  disabled={sending || !message.trim()}
                >
                  <BhuguardMaterialIcon name="arrow_forward" size={18} color="#fff" />
                  <Text style={styles.sendButtonText}>{sending ? 'Sending' : 'Send'}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.closedBanner}>
              <BhuguardMaterialIcon name="verified" size={18} color={dashboardTheme.primary} />
              <Text style={styles.closedText}>This support thread is {supportStatusLabel(status).toLowerCase()}.</Text>
              <Pressable onPress={() => navigation.goBack()}>
                <Text style={styles.backLink}>Back to inbox</Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  flex: { flex: 1 },
  statusBanner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  liveRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-end',
  },
  liveDot: {
    backgroundColor: dashboardTheme.primary,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  statusHint: {
    color: dashboardTheme.outline,
    fontSize: 11,
    fontWeight: '600',
  },
  messagesContent: {
    backgroundColor: '#F3F7F2',
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  composer: {
    backgroundColor: dashboardTheme.background,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  composerCard: {
    backgroundColor: '#fff',
    borderColor: 'rgba(191, 201, 190, 0.35)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 12,
    ...dashboardShadow,
  },
  input: {
    color: dashboardTheme.onSurface,
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 120,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  composerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: dashboardTheme.primary,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: { opacity: 0.55 },
  sendButtonText: { color: '#fff', fontWeight: '700' },
  closeButton: { paddingHorizontal: 4, paddingVertical: 8 },
  closeButtonText: { color: dashboardTheme.error, fontWeight: '600' },
  closedBanner: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: 'rgba(191, 201, 190, 0.35)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    paddingVertical: 14,
  },
  closedText: { color: dashboardTheme.onSurfaceVariant, fontSize: 13 },
  backLink: { color: dashboardTheme.primary, fontWeight: '700' },
  errorText: { color: dashboardTheme.error, fontSize: 12, paddingHorizontal: 12 },
});
