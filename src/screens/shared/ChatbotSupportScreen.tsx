import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { askChatbot, requestSupportAgent, requestSupportCall } from '../../api/chatbotApi';
import { getSupportThreadDetail } from '../../api/supportApi';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { KeyboardAvoidingHost } from '../../components/layout/KeyboardSafeScrollView';
import {
  AgentHandoffCard,
  AssistantWelcomeCard,
  ChatbotComposer,
  ChatbotBottomNav,
  ChatbotMessageBubble,
  ChatbotStatusBadges,
  ChatbotSupportHeader,
  ChatbotTypingIndicator,
  QuickQuestionChips,
} from '../../components/support/ChatbotSupportUi';
import { useSupportAutoRefresh } from '../../hooks/useSupportAutoRefresh';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { extractList, type ApiRecord } from '../../utils/apiHelpers';

const WELCOME_MESSAGE = 'Welcome! How can I help you with your Biochar cycle today?';

interface ChatMessage {
  id: string;
  text: string;
  senderType: 'user' | 'ai_bot' | 'admin' | 'system';
  senderName: string;
  createdAt?: string | null;
}

interface ChatbotSupportScreenProps {
  supportRole: 'farmer' | 'field_officer';
  sourceModule?: string;
}

function mapApiMessages(messages: ApiRecord[]): ChatMessage[] {
  return messages.map((message, index) => {
    const senderType = String(message.sender_type ?? 'user');

    return {
      id: String(message.id ?? index),
      text: String(message.message ?? ''),
      senderType:
        senderType === 'ai_bot'
          ? 'ai_bot'
          : senderType === 'system'
            ? 'system'
            : senderType === 'admin'
              ? 'admin'
              : 'user',
      senderName: String(message.sender_name ?? (senderType === 'user' ? 'You' : 'Bhuguard Assistant')),
      createdAt: (message.created_at as string | undefined) ?? null,
    };
  });
}

function bubbleVariant(senderType: ChatMessage['senderType']): 'user' | 'bot' | 'system' {
  if (senderType === 'user') {
    return 'user';
  }

  if (senderType === 'system') {
    return 'system';
  }

  return 'bot';
}

export function ChatbotSupportScreen({ supportRole, sourceModule }: ChatbotSupportScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [handoffActive, setHandoffActive] = useState(false);
  const [callRequested, setCallRequested] = useState(false);
  const [callFormVisible, setCallFormVisible] = useState(false);
  const [callPhone, setCallPhone] = useState('');
  const [callReason, setCallReason] = useState('');
  const [callUrgency, setCallUrgency] = useState<'normal' | 'urgent'>('normal');

  const scrollToEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const refreshThread = useCallback(async () => {
    if (!threadId) {
      return;
    }

    try {
      const data = await getSupportThreadDetail(threadId);
      const thread = (data.thread ?? data) as ApiRecord;
      const nextMessages = mapApiMessages(extractList(thread, ['messages']));
      setMessages(nextMessages);
      setHandoffActive(thread.needs_admin === true || thread.chatbot_active === false);
      setCallRequested(thread.is_call_requested === true);
    } catch {
      // Keep existing messages on silent refresh failure.
    }
  }, [threadId]);

  useSupportAutoRefresh(() => refreshThread(), { intervalMs: 8000, enabled: threadId != null });

  useEffect(() => {
    scrollToEnd();
  }, [messages.length, typing, callFormVisible]);

  const appendLocalUserMessage = (text: string) => {
    setMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        text,
        senderType: 'user',
        senderName: 'You',
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const appendBotMessage = (text: string, senderType: ChatMessage['senderType'] = 'ai_bot') => {
    setMessages((current) => [
      ...current,
      {
        id: `bot-${Date.now()}`,
        text,
        senderType,
        senderName: senderType === 'system' ? 'Bhuguard Support' : 'Bhuguard Assistant',
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleAsk = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || sending) {
      return;
    }

    setSending(true);
    setTyping(true);
    appendLocalUserMessage(trimmed);
    setInput('');

    try {
      const response = await askChatbot({
        message: trimmed,
        thread_id: threadId,
        language: 'en',
        source_module: sourceModule ?? `${supportRole}_chatbot`,
      });

      const chatbot = (response.chatbot ?? response) as ApiRecord;
      const threadPayload = (response.thread ?? {}) as ApiRecord;
      const nextThreadId = Number(chatbot.thread_id ?? threadPayload.id ?? threadId ?? 0);

      if (Number.isFinite(nextThreadId) && nextThreadId > 0) {
        setThreadId(nextThreadId);
      }

      if (chatbot.bot_message) {
        appendBotMessage(
          String(chatbot.bot_message),
          chatbot.intent === 'handoff' ? 'system' : 'ai_bot',
        );
      }

      if (chatbot.handoff_required) {
        setHandoffActive(true);
      }

      if (chatbot.requires_call_form || chatbot.intent === 'call_prompt') {
        setCallFormVisible(true);
      }

      if (nextThreadId) {
        await refreshThread();
      }
    } catch (error) {
      Alert.alert('Chat support', getApiErrorMessage(error, 'Unable to get chatbot response.'));
    } finally {
      setTyping(false);
      setSending(false);
    }
  };

  const handleTalkToAgent = async () => {
    setSending(true);
    try {
      const response = await requestSupportAgent({
        thread_id: threadId,
        message: 'User requested to speak with Bhuguard support.',
        source_module: sourceModule,
      });
      const handoff = (response.handoff ?? response) as ApiRecord;
      const threadPayload = (response.thread ?? {}) as ApiRecord;
      const nextThreadId = Number(handoff.thread_id ?? threadPayload.id ?? threadId ?? 0);
      if (Number.isFinite(nextThreadId) && nextThreadId > 0) {
        setThreadId(nextThreadId);
      }
      appendBotMessage(
        String(handoff.bot_message ?? 'Your request has been sent to Bhuguard support. Admin will contact you soon.'),
        'system',
      );
      setHandoffActive(true);
      await refreshThread();
    } catch (error) {
      Alert.alert('Support handoff', getApiErrorMessage(error, 'Unable to connect with support.'));
    } finally {
      setSending(false);
    }
  };

  const handleRequestCall = async () => {
    if (!callPhone.trim() || !callReason.trim()) {
      Alert.alert('Call request', 'Enter your mobile number and a short issue reason.');
      return;
    }

    setSending(true);
    try {
      const response = await requestSupportCall({
        thread_id: threadId,
        phone: callPhone.trim(),
        reason: callReason.trim(),
        urgency: callUrgency,
        source_module: sourceModule,
      });
      const result = (response.call_request ?? response) as ApiRecord;
      const threadPayload = (response.thread ?? {}) as ApiRecord;
      const nextThreadId = Number(result.thread_id ?? threadPayload.id ?? threadId ?? 0);
      if (Number.isFinite(nextThreadId) && nextThreadId > 0) {
        setThreadId(nextThreadId);
      }
      appendBotMessage(
        String(result.bot_message ?? 'Your call request has been sent to Bhuguard support. Admin will contact you soon.'),
        'system',
      );
      setHandoffActive(true);
      setCallRequested(true);
      setCallFormVisible(false);
      await refreshThread();
    } catch (error) {
      Alert.alert('Call request', getApiErrorMessage(error, 'Unable to submit call request.'));
    } finally {
      setSending(false);
    }
  };

  const openTicketInbox = () => {
    navigation.navigate('SupportThreads', { supportRole });
  };

  const aiAnswered = messages.some((message) => message.senderType === 'ai_bot');

  return (
    <ScreenContainer keyboardAvoiding={false} backgroundColor={dashboardTheme.background}>
      <KeyboardAvoidingHost>
      <ChatbotSupportHeader />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
      >
          <AssistantWelcomeCard />

          <QuickQuestionChips
            onSelect={(question) => void handleAsk(question)}
            onTalkToAdmin={() => void handleTalkToAgent()}
          />

          <ChatbotMessageBubble message={WELCOME_MESSAGE} variant="bot" createdAt={new Date().toISOString()} />

          {messages.map((message) => (
            <ChatbotMessageBubble
              key={message.id}
              message={message.text}
              variant={bubbleVariant(message.senderType)}
              createdAt={message.createdAt}
            />
          ))}

          {typing ? <ChatbotTypingIndicator /> : null}

          <AgentHandoffCard
            callFormVisible={callFormVisible}
            callPhone={callPhone}
            callReason={callReason}
            callUrgency={callUrgency}
            sending={sending}
            onTalkToAdmin={() => void handleTalkToAgent()}
            onToggleCallForm={() => setCallFormVisible((value) => !value)}
            onCallPhoneChange={setCallPhone}
            onCallReasonChange={setCallReason}
            onCallUrgencyChange={setCallUrgency}
            onSubmitCall={() => void handleRequestCall()}
          />

          <ChatbotStatusBadges aiAnswered={aiAnswered} callRequested={callRequested} />
        </ScrollView>

      <ChatbotComposer
        value={input}
        sending={sending}
        onChange={setInput}
        onSend={() => void handleAsk(input)}
        bottomInset={0}
        footer={<ChatbotBottomNav onHistory={openTicketInbox} />}
      />
      </KeyboardAvoidingHost>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
});
