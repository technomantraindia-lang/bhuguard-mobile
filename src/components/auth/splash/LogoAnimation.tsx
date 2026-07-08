import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { BHUGUARD_LOGO, LOGO_SIZES } from '../../../constants/branding';
import {
  LOGO_OPACITY_MS,
  LOGO_SCALE_MS,
  SPLASH_GLOW_COLOR,
  SPLASH_RIPPLE_COLOR,
} from './SplashTransition';

interface LogoAnimationProps {
  size?: number;
}

export function LogoAnimation({ size = LOGO_SIZES.splash }: LogoAnimationProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.75);
  const glowOpacity = useSharedValue(0);
  const rippleScale = useSharedValue(0.55);
  const rippleOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: LOGO_OPACITY_MS,
      easing: Easing.out(Easing.cubic),
    });

    scale.value = withSequence(
      withSpring(1.08, {
        damping: 14,
        stiffness: 120,
        mass: 0.9,
      }),
      withSpring(1, {
        damping: 16,
        stiffness: 140,
        mass: 0.85,
      }),
    );

    glowOpacity.value = withDelay(
      420,
      withTiming(0.1, {
        duration: Math.max(400, LOGO_SCALE_MS - 200),
        easing: Easing.out(Easing.quad),
      }),
    );

    rippleOpacity.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(0, { duration: 2800, easing: Easing.out(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );

    rippleScale.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: 0 }),
          withTiming(1.7, { duration: 2800, easing: Easing.out(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
      cancelAnimation(glowOpacity);
      cancelAnimation(rippleOpacity);
      cancelAnimation(rippleScale);
    };
  }, [glowOpacity, opacity, rippleOpacity, rippleScale, scale]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 1 + (1 - scale.value) * 0.15 }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: rippleOpacity.value * 0.9,
    transform: [{ scale: rippleScale.value }],
  }));

  return (
    <View style={[styles.wrap, { width: size * 2.2, height: size * 2.2 }]}>
      <Animated.View style={[styles.ripple, rippleStyle]} />
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Image source={BHUGUARD_LOGO} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 999,
    backgroundColor: SPLASH_GLOW_COLOR,
  },
  ripple: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: SPLASH_RIPPLE_COLOR,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
