import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import type { ActivityWorkflowStepMeta } from './premiumActivityWorkflowTheme';
import { premiumWorkflowTheme } from './premiumActivityWorkflowTheme';

interface PremiumActivityProgressCardProps {
  steps: ActivityWorkflowStepMeta[];
  /** Highest completed step index (-1 = none). */
  completedCount: number;
  /** Current active step index (0-based). */
  currentStep: number;
  /** Explicit percent 0-100. */
  progressPercent: number;
  progressLabel?: string;
  onStepPress?: (index: number) => void;
}

function StepIcon({
  icon,
  active,
  completed,
  locked,
}: {
  icon: ActivityWorkflowStepMeta['icon'];
  active: boolean;
  completed: boolean;
  locked: boolean;
}) {
  const color = completed || active ? '#FFFFFF' : premiumWorkflowTheme.textMuted;
  const size = active ? 18 : 14;
  if (completed) {
    return <BhuguardMaterialIcon name="verified" size={size} color="#FFFFFF" filled />;
  }
  if (locked) {
    return <BhuguardMaterialIcon name="lock" size={12} color={premiumWorkflowTheme.textMuted} filled />;
  }

  switch (icon) {
    case 'start':
      return <BhuguardMaterialIcon name="add_circle" size={size} color={color} filled />;
    case 'checkin':
      return <BhuguardMaterialIcon name="share_location" size={size} color={color} filled />;
    case 'verify':
      return <BhuguardMaterialIcon name="verified" size={size} color={color} filled />;
    case 'evidence':
      return <BhuguardMaterialIcon name="photo_camera" size={size} color={color} filled />;
    case 'submit':
      return <BhuguardMaterialIcon name="assignment_turned_in" size={size} color={color} filled />;
    default:
      return null;
  }
}

export function PremiumActivityProgressCard({
  steps,
  completedCount,
  currentStep,
  progressPercent,
  progressLabel = 'Farm Activity Progress',
  onStepPress,
}: PremiumActivityProgressCardProps) {
  const lineProgress = useRef(new Animated.Value(Math.max(completedCount, 0))).current;

  useEffect(() => {
    Animated.timing(lineProgress, {
      toValue: Math.max(completedCount, 0),
      duration: premiumWorkflowTheme.animationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [completedCount, lineProgress]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.progressLabel}>{progressLabel}</Text>
        <Text style={styles.percent}>{Math.round(progressPercent)}% Completed</Text>
      </View>

      <View style={styles.track}>
        {steps.map((step, index) => {
          const completed = index < completedCount || (progressPercent >= 100 && index <= currentStep);
          const active = index === currentStep && progressPercent < 100;
          const locked = index > currentStep && !completed;
          const isLast = index === steps.length - 1;
          const tappable = completed || active;

          const segmentFill = lineProgress.interpolate({
            inputRange: [index, index + 1],
            outputRange: ['0%', '100%'],
            extrapolate: 'clamp',
          });

          const node = (
            <View style={styles.stepInner}>
              <View style={styles.nodeRow}>
                <View
                  style={[
                    styles.node,
                    locked && styles.nodeLocked,
                    completed && styles.nodeCompleted,
                    active && styles.nodeActive,
                  ]}
                >
                  <StepIcon icon={step.icon} active={active} completed={completed} locked={locked} />
                </View>
                {!isLast ? (
                  <View style={styles.connector}>
                    <Animated.View style={[styles.connectorFill, { width: segmentFill }]} />
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  (active || completed) && styles.stepLabelActive,
                  locked && styles.stepLabelLocked,
                ]}
                numberOfLines={1}
              >
                {step.shortLabel}
              </Text>
            </View>
          );

          return (
            <View key={step.key} style={styles.stepWrap}>
              {tappable && onStepPress ? (
                <Pressable onPress={() => onStepPress(index)} accessibilityRole="button">
                  {node}
                </Pressable>
              ) : (
                node
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: premiumWorkflowTheme.cardRadius,
    backgroundColor: premiumWorkflowTheme.glassBackground,
    borderWidth: 1,
    borderColor: premiumWorkflowTheme.glassBorder,
    padding: 14,
    gap: 12,
    ...premiumWorkflowTheme.shadow,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: premiumWorkflowTheme.textPrimary,
    letterSpacing: 0.2,
  },
  percent: {
    fontSize: 12,
    fontWeight: '700',
    color: premiumWorkflowTheme.primaryGreen,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepWrap: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  stepInner: {
    width: '100%',
    alignItems: 'center',
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  node: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: premiumWorkflowTheme.lineInactive,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeLocked: {
    backgroundColor: '#EEF1EF',
    borderColor: '#D5DED8',
  },
  nodeCompleted: {
    backgroundColor: premiumWorkflowTheme.primaryGreen,
    borderColor: premiumWorkflowTheme.primaryGreen,
  },
  nodeActive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: premiumWorkflowTheme.primaryGreen,
    borderColor: premiumWorkflowTheme.primaryGreen,
  },
  connector: {
    position: 'absolute',
    left: '58%',
    right: '-42%',
    top: 14,
    height: 3,
    backgroundColor: premiumWorkflowTheme.lineInactive,
    borderRadius: 999,
    overflow: 'hidden',
  },
  connectorFill: {
    height: '100%',
    backgroundColor: premiumWorkflowTheme.lineActive,
    borderRadius: 999,
  },
  stepLabel: {
    marginTop: 6,
    fontSize: 9,
    fontWeight: '600',
    color: premiumWorkflowTheme.textMuted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: premiumWorkflowTheme.primaryGreen,
    fontWeight: '700',
  },
  stepLabelLocked: {
    color: '#A0A8A2',
  },
});
