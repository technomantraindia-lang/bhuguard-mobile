import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';

export interface VerificationStepperItem {
  key: string;
  label: string;
}

interface VerificationStepperProps {
  steps: VerificationStepperItem[];
  currentKey: string;
  completedKeys: string[];
}

const CIRCLE_SIZE = 32;
const LINE_HEIGHT = 4;
const STEP_WIDTH = 104;
const LINE_TOP = 15;

export function VerificationStepper({
  steps,
  currentKey,
  completedKeys,
}: VerificationStepperProps) {
  const [availableWidth, setAvailableWidth] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.key === currentKey),
  );
  const contentWidth = Math.max(availableWidth, steps.length * STEP_WIDTH);
  const cellWidth = contentWidth / Math.max(steps.length, 1);
  const trackWidth = Math.max(0, contentWidth - cellWidth);
  const targetProgress = steps.length > 1 ? currentIndex / (steps.length - 1) : 0;

  const progressWidth = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, trackWidth],
      }),
    [progress, trackWidth],
  );

  useEffect(() => {
    Animated.timing(progress, {
      toValue: targetProgress,
      duration: 320,
      useNativeDriver: false,
    }).start();
  }, [progress, targetProgress]);

  useEffect(() => {
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.08,
        duration: 170,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 170,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentKey, scale]);

  const onLayout = (event: LayoutChangeEvent) => {
    setAvailableWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={[styles.scrollContent, { minWidth: contentWidth }]}
      >
        <View style={[styles.stage, { width: contentWidth }]}>
          <View
            style={[
              styles.line,
              {
                left: cellWidth / 2,
                width: trackWidth,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.progressLine,
              {
                left: cellWidth / 2,
                width: progressWidth,
              },
            ]}
          />

          <View style={styles.stepsRow}>
            {steps.map((step, index) => {
              const completed = completedKeys.includes(step.key) || index < currentIndex;
              const current = step.key === currentKey;
              const circleStyle = [
                styles.circle,
                completed && styles.circleCompleted,
                current && styles.circleCurrent,
              ];

              return (
                <View key={step.key} style={[styles.step, { width: cellWidth }]}>
                  <Animated.View style={current ? { transform: [{ scale }] } : undefined}>
                    <View style={circleStyle}>
                      <Text
                        style={[
                          styles.circleText,
                          (completed || current) && styles.circleTextStrong,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                  </Animated.View>
                  <Text
                    style={[
                      styles.label,
                      completed && styles.labelCompleted,
                      current && styles.labelCurrent,
                    ]}
                    numberOfLines={2}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 88,
  },
  scrollContent: {
    paddingBottom: 2,
  },
  stage: {
    minHeight: 88,
    position: 'relative',
  },
  line: {
    position: 'absolute',
    top: LINE_TOP,
    height: LINE_HEIGHT,
    borderRadius: LINE_HEIGHT / 2,
    backgroundColor: colors.border,
  },
  progressLine: {
    position: 'absolute',
    top: LINE_TOP,
    height: LINE_HEIGHT,
    borderRadius: LINE_HEIGHT / 2,
    backgroundColor: colors.primary,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  step: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  circleCurrent: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.24,
    shadowRadius: 6,
    elevation: 4,
  },
  circleText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  circleTextStrong: {
    color: colors.white,
  },
  label: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelCompleted: {
    color: colors.primary,
  },
  labelCurrent: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
});
