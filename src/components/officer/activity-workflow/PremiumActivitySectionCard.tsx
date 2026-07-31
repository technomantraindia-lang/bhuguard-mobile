import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import type { ActivityWorkflowStepMeta } from './premiumActivityWorkflowTheme';
import { premiumWorkflowTheme } from './premiumActivityWorkflowTheme';

export type FarmActivitySectionStatus = 'locked' | 'ready' | 'in_progress' | 'completed' | 'error';

interface PremiumActivitySectionCardProps {
  stepIndex: number;
  step: ActivityWorkflowStepMeta;
  status: FarmActivitySectionStatus;
  children?: ReactNode;
  summaryLines?: string[];
  lockedReason?: string;
  error?: string | null;
  completedAt?: string | null;
  onRetry?: () => void;
}

function statusLabel(status: FarmActivitySectionStatus): string {
  switch (status) {
    case 'locked':
      return 'Locked';
    case 'ready':
      return 'Ready';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'error':
      return 'Error';
    default:
      return '';
  }
}

export function PremiumActivitySectionCard({
  stepIndex,
  step,
  status,
  children,
  summaryLines = [],
  lockedReason,
  error,
  completedAt,
  onRetry,
}: PremiumActivitySectionCardProps) {
  const locked = status === 'locked';
  const completed = status === 'completed';
  const errored = status === 'error';

  return (
    <View
      style={[
        styles.card,
        locked && styles.cardLocked,
        completed && styles.cardCompleted,
        errored && styles.cardError,
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, locked && styles.iconWrapLocked, completed && styles.iconWrapCompleted]}>
          {locked ? (
            <BhuguardMaterialIcon name="lock" size={20} color={premiumWorkflowTheme.textMuted} filled />
          ) : completed ? (
            <BhuguardMaterialIcon name="verified" size={22} color="#FFFFFF" filled />
          ) : (
            <BhuguardMaterialIcon
              name={
                step.icon === 'start'
                  ? 'add_circle'
                  : step.icon === 'checkin'
                    ? 'share_location'
                    : step.icon === 'verify'
                      ? 'verified'
                      : step.icon === 'evidence'
                        ? 'photo_camera'
                        : 'assignment_turned_in'
              }
              size={22}
              color={premiumWorkflowTheme.primaryGreen}
              filled
            />
          )}
        </View>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <Text style={styles.stepEyebrow}>Step {stepIndex + 1}</Text>
            <Text
              style={[
                styles.statusPill,
                locked && styles.statusPillLocked,
                completed && styles.statusPillCompleted,
                errored && styles.statusPillError,
              ]}
            >
              {statusLabel(status)}
            </Text>
          </View>
          <Text style={[styles.stepTitle, locked && styles.textMuted]}>{step.title}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
          {completed && completedAt ? (
            <Text style={styles.completedAt}>Completed: {completedAt}</Text>
          ) : null}
        </View>
      </View>

      {locked ? (
        <View style={styles.lockedBox}>
          <Text style={styles.lockedText}>{lockedReason || 'Complete the previous section to unlock.'}</Text>
        </View>
      ) : null}

      {!locked && completed && summaryLines.length > 0 ? (
        <View style={styles.summaryBox}>
          {summaryLines.map((line) => (
            <Text key={line} style={styles.summaryLine}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}

      {!locked && (status !== 'completed' || children) ? (
        <View style={styles.body}>{children}</View>
      ) : null}

      {errored && error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          {onRetry ? (
            <Pressable style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: premiumWorkflowTheme.stepCardRadius,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: premiumWorkflowTheme.glassBorder,
    padding: 16,
    gap: 12,
    ...premiumWorkflowTheme.shadow,
  },
  cardLocked: {
    backgroundColor: '#F3F5F3',
    borderColor: '#E0E5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  cardCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  cardError: {
    borderColor: 'rgba(186, 26, 26, 0.35)',
    backgroundColor: '#FFF8F7',
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: premiumWorkflowTheme.primaryGreenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapLocked: {
    backgroundColor: '#E8ECE9',
  },
  iconWrapCompleted: {
    backgroundColor: premiumWorkflowTheme.primaryGreen,
  },
  headerCopy: { flex: 1, gap: 2, minWidth: 0 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: premiumWorkflowTheme.primaryGreen,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statusPill: {
    fontSize: 10,
    fontWeight: '800',
    color: premiumWorkflowTheme.primaryGreen,
    backgroundColor: premiumWorkflowTheme.primaryGreenSoft,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusPillLocked: {
    color: premiumWorkflowTheme.textMuted,
    backgroundColor: '#E8ECE9',
  },
  statusPillCompleted: {
    color: '#166534',
    backgroundColor: '#BBF7D0',
  },
  statusPillError: {
    color: '#991B1B',
    backgroundColor: '#FECACA',
  },
  stepTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: premiumWorkflowTheme.primaryGreen,
  },
  textMuted: {
    color: premiumWorkflowTheme.textMuted,
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: premiumWorkflowTheme.textSecondary,
  },
  completedAt: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  lockedBox: {
    backgroundColor: '#EEF1EF',
    borderRadius: 10,
    padding: 10,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: '600',
    color: premiumWorkflowTheme.textMuted,
    lineHeight: 17,
  },
  summaryBox: {
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 10,
    padding: 10,
  },
  summaryLine: {
    fontSize: 12,
    fontWeight: '600',
    color: premiumWorkflowTheme.textSecondary,
    lineHeight: 17,
  },
  body: { gap: 12 },
  errorBox: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.15)',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#BA1A1A',
  },
  retryButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: premiumWorkflowTheme.primaryGreen,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
