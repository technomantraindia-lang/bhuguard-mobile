import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { SPLASH_DOT_COLOR } from './SplashTransition';

interface LoadingDotsProps {
  visible?: boolean;
}

export function LoadingDots({ visible = true }: LoadingDotsProps) {
  const a = useSharedValue(0.28);
  const b = useSharedValue(0.28);
  const c = useSharedValue(0.28);
  const containerOpacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    containerOpacity.value = withTiming(visible ? 1 : 0, { duration: 280 });
  }, [containerOpacity, visible]);

  useEffect(() => {
    const pulse = (delayMs: number) =>
      withDelay(
        delayMs,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) }),
            withTiming(0.28, { duration: 420, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          false,
        ),
      );

    a.value = pulse(0);
    b.value = pulse(180);
    c.value = pulse(360);

    return () => {
      cancelAnimation(a);
      cancelAnimation(b);
      cancelAnimation(c);
    };
  }, [a, b, c]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const aStyle = useAnimatedStyle(() => ({ opacity: a.value }));
  const bStyle = useAnimatedStyle(() => ({ opacity: b.value }));
  const cStyle = useAnimatedStyle(() => ({ opacity: c.value }));

  return (
    <Animated.View style={[styles.row, wrapStyle]} accessibilityLabel="Loading">
      <Animated.View style={[styles.dot, aStyle]} />
      <Animated.View style={[styles.dot, bStyle]} />
      <Animated.View style={[styles.dot, cStyle]} />
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
