import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { BrandedHeaderLogo } from '../shared/BrandedHeaderLogo';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

const QUICK_CHIPS = [
  'How to add Biochar?',
  'Why GPS is required?',
  'Image timestamp issue',
  '25-day update cycle',
  'Farm mapping help',
] as const;

export function ChatbotSupportHeader() {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {navigation.canGoBack() ? (
          <Pressable style={styles.headerIconButton} onPress={() => navigation.goBack()} hitSlop={8}>
            <BhuguardMaterialIcon name="arrow_back" size={22} color={dashboardTheme.primary} />
          </Pressable>
        ) : null}
        <View>
          <Text style={styles.headerTitle}>AI Help & Support</Text>
          <Text style={styles.headerSubtitle}>Online Support Assistant</Text>
        </View>
      </View>
      <View style={styles.headerAvatar}>
        <BrandedHeaderLogo size={36} />
      </View>
    </View>
  );
}

export function AssistantWelcomeCard() {
  return (
    <View style={[styles.welcomeCard, dashboardShadow]}>
      <View style={styles.welcomeRow}>
        <View style={styles.assistantAvatarWrap}>
          <View style={styles.assistantAvatar}>
            <BhuguardMaterialIcon name="eco" size={24} color={dashboardTheme.primary} />
          </View>
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.welcomeCopy}>
          <View style={styles.welcomeTitleRow}>
            <Text style={styles.welcomeTitle}>Bhuguard Assistant</Text>
            <View style={styles.biocharBadge}>
              <Text style={styles.biocharBadgeText}>Biochar Help</Text>
            </View>
          </View>
          <Text style={styles.welcomeBody}>
            Hi, I&apos;m Bhuguard Assistant. Ask me about Biochar activity, GPS, image upload, farm mapping, or support.
          </Text>
        </View>
      </View>
    </View>
  );
}

interface QuickChipsProps {
  onSelect: (question: string) => void;
  onTalkToAdmin: () => void;
}

export function QuickQuestionChips({ onSelect, onTalkToAdmin }: QuickChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsContent}
      style={styles.chipsScroll}
    >
      {QUICK_CHIPS.map((chip) => (
        <Pressable key={chip} style={styles.chip} onPress={() => onSelect(chip)}>
          <Text style={styles.chipText}>{chip}</Text>
        </Pressable>
      ))}
      <Pressable style={[styles.chip, styles.chipPrimary]} onPress={onTalkToAdmin}>
        <Text style={styles.chipPrimaryText}>Talk to Admin</Text>
      </Pressable>
    </ScrollView>
  );
}

function formatChatTime(value?: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface ChatbotMessageBubbleProps {
  message: string;
  variant: 'user' | 'bot' | 'system';
  createdAt?: string | null;
}

export function ChatbotMessageBubble({ message, variant, createdAt }: ChatbotMessageBubbleProps) {
  const isUser = variant === 'user';

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowBot]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>{message}</Text>
      </View>
      {isUser ? (
        <View style={styles.sentMeta}>
          <Text style={styles.timeText}>Sent</Text>
          <BhuguardMaterialIcon name="verified" size={14} color={dashboardTheme.primary} />
        </View>
      ) : (
        <Text style={styles.timeTextLeft}>{formatChatTime(createdAt)}</Text>
      )}
    </View>
  );
}

export function ChatbotTypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.4)).current;
  const dot2 = useRef(new Animated.Value(0.4)).current;
  const dot3 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animate = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.4, duration: 400, useNativeDriver: true }),
        ]),
      );

    const animations = [animate(dot1, 0), animate(dot2, 150), animate(dot3, 300)];
    animations.forEach((anim) => anim.start());

    return () => animations.forEach((anim) => anim.stop());
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingWrap}>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((opacity, index) => (
          <Animated.View key={index} style={[styles.typingDot, { opacity }]} />
        ))}
      </View>
    </View>
  );
}

interface AgentHandoffCardProps {
  callFormVisible: boolean;
  callPhone: string;
  callReason: string;
  callUrgency: 'normal' | 'urgent';
  sending: boolean;
  onTalkToAdmin: () => void;
  onToggleCallForm: () => void;
  onCallPhoneChange: (value: string) => void;
  onCallReasonChange: (value: string) => void;
  onCallUrgencyChange: (value: 'normal' | 'urgent') => void;
  onSubmitCall: () => void;
}

export function AgentHandoffCard({
  callFormVisible,
  callPhone,
  callReason,
  callUrgency,
  sending,
  onTalkToAdmin,
  onToggleCallForm,
  onCallPhoneChange,
  onCallReasonChange,
  onCallUrgencyChange,
  onSubmitCall,
}: AgentHandoffCardProps) {
  return (
    <View style={styles.handoffCard}>
      <View style={styles.handoffTitleRow}>
        <View style={styles.handoffIconWrap}>
          <BhuguardMaterialIcon name="support_agent" size={22} color={dashboardTheme.primary} />
        </View>
        <Text style={styles.handoffTitle}>Connect with Bhuguard Support</Text>
      </View>
      <Text style={styles.handoffBody}>
        Your request will be sent to admin. They can reply or call you within 2-4 business hours.
      </Text>
      <View style={styles.handoffActions}>
        <Pressable style={styles.talkAdminButton} onPress={onTalkToAdmin} disabled={sending}>
          <BhuguardMaterialIcon name="support_agent" size={18} color="#fff" />
          <Text style={styles.talkAdminText}>Talk to Admin</Text>
        </Pressable>
        <Pressable style={styles.requestCallButton} onPress={onToggleCallForm}>
          <BhuguardMaterialIcon name="support_agent" size={18} color={dashboardTheme.primary} />
          <Text style={styles.requestCallText}>Request Call</Text>
        </Pressable>
      </View>
      {callFormVisible ? (
        <View style={styles.callForm}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="+91 00000 00000"
            keyboardType="phone-pad"
            value={callPhone}
            onChangeText={onCallPhoneChange}
            placeholderTextColor={dashboardTheme.outline}
          />
          <Text style={styles.fieldLabel}>Issue Summary</Text>
          <TextInput
            style={[styles.fieldInput, styles.fieldTextArea]}
            placeholder="Tell us more about the issue..."
            value={callReason}
            onChangeText={onCallReasonChange}
            multiline
            placeholderTextColor={dashboardTheme.outline}
          />
          <View style={styles.urgencyRow}>
            {(['normal', 'urgent'] as const).map((level) => (
              <Pressable
                key={level}
                style={[styles.urgencyChip, callUrgency === level && styles.urgencyChipActive]}
                onPress={() => onCallUrgencyChange(level)}
              >
                <Text style={[styles.urgencyText, callUrgency === level && styles.urgencyTextActive]}>
                  {level === 'normal' ? 'Normal' : 'Urgent'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.submitCallButton} onPress={onSubmitCall} disabled={sending}>
            <Text style={styles.submitCallText}>Submit Call Request</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

interface StatusBadgesProps {
  aiAnswered: boolean;
  callRequested: boolean;
}

export function ChatbotStatusBadges({ aiAnswered, callRequested }: StatusBadgesProps) {
  if (!aiAnswered && !callRequested) {
    return null;
  }

  return (
    <View style={styles.badgesRow}>
      {aiAnswered ? (
        <View style={styles.badgeAnswered}>
          <BhuguardMaterialIcon name="verified" size={14} color={dashboardTheme.onSecondaryContainer} />
          <Text style={styles.badgeAnsweredText}>AI Answered</Text>
        </View>
      ) : null}
      {callRequested ? (
        <View style={styles.badgeCall}>
          <BhuguardMaterialIcon name="support_agent" size={14} color={dashboardTheme.primary} />
          <Text style={styles.badgeCallText}>Call Requested</Text>
        </View>
      ) : null}
    </View>
  );
}

interface ChatbotComposerProps {
  value: string;
  sending: boolean;
  onChange: (text: string) => void;
  onSend: () => void;
  bottomInset: number;
  footer?: ReactNode;
}

export function ChatbotComposer({ value, sending, onChange, onSend, bottomInset, footer }: ChatbotComposerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.composerWrap, { paddingBottom: Math.max(bottomInset, insets.bottom, 8) }]}>
      {footer}
      <View style={styles.composerRow}>
        <Pressable style={styles.composerIconButton}>
          <BhuguardMaterialIcon name="add_circle" size={24} color={dashboardTheme.onSurfaceVariant} />
        </Pressable>
        <View style={styles.composerInputWrap}>
          <TextInput
            style={styles.composerInput}
            placeholder="Type your message..."
            placeholderTextColor={dashboardTheme.outline}
            value={value}
            onChangeText={onChange}
            editable={!sending}
            multiline
          />
        </View>
        <Pressable
          style={[styles.sendFab, (!value.trim() || sending) && styles.sendFabDisabled]}
          onPress={onSend}
          disabled={sending || !value.trim()}
        >
          <BhuguardMaterialIcon name="arrow_forward" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

interface ChatbotBottomNavProps {
  onHistory: () => void;
}

export function ChatbotBottomNav({ onHistory }: ChatbotBottomNavProps) {
  return (
    <View style={styles.bottomNav}>
      <Pressable style={styles.bottomNavItem}>
        <BhuguardMaterialIcon name="support_agent" size={22} color={dashboardTheme.onSurfaceVariant} />
      </Pressable>
      <Pressable style={styles.bottomNavItem} onPress={onHistory}>
        <BhuguardMaterialIcon name="schedule" size={22} color={dashboardTheme.onSurfaceVariant} />
      </Pressable>
      <View style={styles.bottomNavActive}>
        <BhuguardMaterialIcon name="support_agent" size={22} color={dashboardTheme.onPrimary} />
      </View>
      <Pressable style={styles.bottomNavItem}>
        <BhuguardMaterialIcon name="lock" size={22} color={dashboardTheme.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(191, 201, 190, 0.35)',
    backgroundColor: 'rgba(249, 249, 255, 0.92)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: dashboardTheme.onSurface },
  headerSubtitle: { fontSize: 12, fontWeight: '600', color: dashboardTheme.primary, marginTop: 2 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.35)',
    backgroundColor: dashboardTheme.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.25)',
    marginBottom: 16,
  },
  welcomeRow: { flexDirection: 'row', gap: 12 },
  assistantAvatarWrap: { position: 'relative' },
  assistantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: dashboardTheme.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: dashboardTheme.surfaceLowest,
  },
  welcomeCopy: { flex: 1, gap: 6 },
  welcomeTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  welcomeTitle: { fontSize: 20, fontWeight: '600', color: dashboardTheme.onSurface, flexShrink: 1 },
  biocharBadge: {
    backgroundColor: dashboardTheme.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  biocharBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: dashboardTheme.onSecondaryContainer,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  welcomeBody: { fontSize: 14, lineHeight: 20, color: dashboardTheme.onSurfaceVariant },
  chipsScroll: { marginBottom: 16, marginHorizontal: -16 },
  chipsContent: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: dashboardTheme.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.5)',
  },
  chipText: { fontSize: 14, fontWeight: '500', color: dashboardTheme.onSurfaceVariant },
  chipPrimary: { backgroundColor: dashboardTheme.primaryContainer, borderColor: dashboardTheme.primaryContainer },
  chipPrimaryText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  messageRow: { marginBottom: 16, maxWidth: '88%' },
  messageRowBot: { alignSelf: 'flex-start' },
  messageRowUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18 },
  bubbleBot: {
    backgroundColor: 'rgba(173, 238, 195, 0.35)',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(173, 238, 195, 0.65)',
  },
  bubbleUser: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderTopRightRadius: 4,
    shadowColor: '#0B6B3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  bubbleText: { fontSize: 16, lineHeight: 24 },
  bubbleTextBot: { color: dashboardTheme.onSurfaceVariant },
  bubbleTextUser: { color: dashboardTheme.onPrimary },
  timeTextLeft: { marginTop: 4, marginLeft: 4, fontSize: 12, color: dashboardTheme.outline },
  sentMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginRight: 4 },
  timeText: { fontSize: 12, color: dashboardTheme.outline },
  typingWrap: { alignSelf: 'flex-start', marginBottom: 8 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    backgroundColor: 'rgba(173, 238, 195, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(173, 238, 195, 0.65)',
  },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: dashboardTheme.primary },
  handoffCard: {
    backgroundColor: dashboardTheme.surfaceContainerHigh,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 58, 0.2)',
    marginBottom: 16,
  },
  handoffTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  handoffIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 107, 58, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handoffTitle: { fontSize: 20, fontWeight: '600', color: dashboardTheme.primary, flex: 1 },
  handoffBody: { fontSize: 14, lineHeight: 20, color: dashboardTheme.onSurfaceVariant, marginBottom: 12 },
  handoffActions: { flexDirection: 'row', gap: 8 },
  talkAdminButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: dashboardTheme.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  talkAdminText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  requestCallButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: dashboardTheme.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  requestCallText: { color: dashboardTheme.primary, fontWeight: '600', fontSize: 14 },
  callForm: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.35)',
    gap: 8,
  },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: dashboardTheme.onSurfaceVariant },
  fieldInput: {
    height: 48,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: dashboardTheme.surface,
    color: dashboardTheme.onSurface,
    fontSize: 16,
  },
  fieldTextArea: { height: 88, paddingTop: 12, textAlignVertical: 'top' },
  urgencyRow: { flexDirection: 'row', gap: 8 },
  urgencyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: dashboardTheme.surfaceContainerLow,
  },
  urgencyChipActive: { backgroundColor: dashboardTheme.primaryContainer },
  urgencyText: { fontSize: 12, fontWeight: '600', color: dashboardTheme.onSurface },
  urgencyTextActive: { color: dashboardTheme.onPrimary },
  submitCallButton: {
    height: 48,
    backgroundColor: dashboardTheme.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitCallText: { color: dashboardTheme.onPrimary, fontWeight: '600', fontSize: 14 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  badgeAnswered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(173, 238, 195, 0.5)',
  },
  badgeAnsweredText: { fontSize: 12, fontWeight: '600', color: dashboardTheme.onSecondaryContainer },
  badgeCall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(11, 107, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 58, 0.2)',
  },
  badgeCallText: { fontSize: 12, fontWeight: '600', color: dashboardTheme.primary },
  composerWrap: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(191, 201, 190, 0.25)',
    backgroundColor: dashboardTheme.surfaceLowest,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  composerIconButton: { padding: 8 },
  composerInputWrap: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.35)',
    backgroundColor: dashboardTheme.surfaceContainerLow,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  composerInput: { fontSize: 16, color: dashboardTheme.onSurface, paddingVertical: 8 },
  sendFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: dashboardTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B6B3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  sendFabDisabled: { opacity: 0.5 },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(191, 201, 190, 0.15)',
    backgroundColor: dashboardTheme.surface,
  },
  bottomNavItem: { padding: 8 },
  bottomNavActive: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 999,
    padding: 10,
    transform: [{ scale: 0.95 }],
  },
});
