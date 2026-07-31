import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, View } from 'react-native';

import { BHUGUARD_LOGO, LOGO_SIZES } from '../../../constants/branding';
import { LOGO_OPACITY_MS, LOGO_SCALE_MS } from './SplashTransition';

interface LogoAnimationProps {
  size?: number;
}

export function LogoAnimation({ size = LOGO_SIZES.splash }: LogoAnimationProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) {
        setReduceMotion(enabled);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: LOGO_OPACITY_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: LOGO_SCALE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    if (reduceMotion) {
      return () => {
        opacity.stopAnimation();
        scale.stopAnimation();
      };
    }

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -6,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const timer = setTimeout(() => breathe.start(), 400);

    return () => {
      clearTimeout(timer);
      breathe.stop();
      opacity.stopAnimation();
      scale.stopAnimation();
      floatY.stopAnimation();
    };
  }, [floatY, opacity, reduceMotion, scale]);

  return (
    <View style={[styles.wrap, { width: size * 1.4, height: size * 1.4 }]}>
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity,
            transform: [{ scale }, { translateY: floatY }],
          },
        ]}
      >
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
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
