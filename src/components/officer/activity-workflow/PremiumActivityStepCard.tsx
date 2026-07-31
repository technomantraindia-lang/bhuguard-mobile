import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import type { ActivityWorkflowStepMeta } from './premiumActivityWorkflowTheme';
import { premiumWorkflowTheme } from './premiumActivityWorkflowTheme';

interface PremiumActivityStepCardProps {
  stepIndex: number;
  step: ActivityWorkflowStepMeta;
  children: ReactNode;
  error?: string | null;
}

function StepHeaderIcon({ icon }: { icon: ActivityWorkflowStepMeta['icon'] }) {
  const color = premiumWorkflowTheme.primaryGreen;
  const size = 22;

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

export function PremiumActivityStepCard({ stepIndex, step, children, error }: PremiumActivityStepCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const scale = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(16);
    scale.setValue(0.97);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: premiumWorkflowTheme.animationMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: premiumWorkflowTheme.animationMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, stepIndex, translateY]);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY }, { scale }] }]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <StepHeaderIcon icon={step.icon} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.stepEyebrow}>Step {stepIndex + 1}</Text>
          <Text style={styles.stepTitle}>{step.title.toUpperCase()}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
        </View>
      </View>

      <View style={styles.body}>{children}</View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: premiumWorkflowTheme.stepCardRadius,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: premiumWorkflowTheme.glassBorder,
    padding: 20,
    gap: 18,
    ...premiumWorkflowTheme.shadow,
  },
  header: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: premiumWorkflowTheme.primaryGreenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: 4 },
  stepEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: premiumWorkflowTheme.primaryGreen,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  stepTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: premiumWorkflowTheme.textPrimary,
  },
  stepDescription: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    color: premiumWorkflowTheme.textSecondary,
  },
  body: { gap: 14 },
  errorBox: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.15)',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#BA1A1A',
    textAlign: 'center',
  },
});
