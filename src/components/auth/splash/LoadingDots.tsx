import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { SPLASH_DOT_COLOR } from './SplashTransition';

interface LoadingDotsProps {
  visible?: boolean;
}

function pulseDot(value: Animated.Value, delayMs: number): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.delay(delayMs),
      Animated.timing(value, {
        toValue: 1,
        duration: 420,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 0.28,
        duration: 420,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]),
  );
}

export function LoadingDots({ visible = true }: LoadingDotsProps) {
  const a = useRef(new Animated.Value(0.28)).current;
  const b = useRef(new Animated.Value(0.28)).current;
  const c = useRef(new Animated.Value(0.28)).current;
  const containerOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(containerOpacity, {
      toValue: visible ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [containerOpacity, visible]);

  useEffect(() => {
    const animations = [pulseDot(a, 0), pulseDot(b, 180), pulseDot(c, 360)];
    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
      a.stopAnimation();
      b.stopAnimation();
      c.stopAnimation();
    };
  }, [a, b, c]);

  return (
    <Animated.View style={[styles.row, { opacity: containerOpacity }]} accessibilityLabel="Loading">
      <Animated.View style={[styles.dot, { opacity: a }]} />
      <Animated.View style={[styles.dot, { opacity: b }]} />
      <Animated.View style={[styles.dot, { opacity: c }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 22,
    minHeight: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: SPLASH_DOT_COLOR,
  },
});
