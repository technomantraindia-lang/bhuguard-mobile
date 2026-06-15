import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { BHUGUARD_LOGO } from '../../constants/branding';

type LogoAnimation = 'none' | 'splash' | 'bounce';

interface BhuguardLogoProps {
  size: number;
  onPress?: () => void;
  animation?: LogoAnimation;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function BhuguardLogo({
  size,
  onPress,
  animation = 'none',
  style,
  accessibilityLabel = 'Bhuguard logo',
}: BhuguardLogoProps) {
  const scale = useRef(new Animated.Value(animation === 'splash' ? 0.94 : 1)).current;
  const opacity = useRef(new Animated.Value(animation === 'splash' ? 0 : 1)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animation === 'splash') {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.95,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      pulse.start();

      return () => {
        pulse.stop();
      };
    }

    if (animation === 'bounce') {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.1, friction: 4, tension: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      ]).start();
    }
  }, [animation, opacity, scale]);

  const logo = (
    <Animated.View style={[styles.wrap, style, { opacity, transform: [{ scale }] }]}>
      <Image
        source={BHUGUARD_LOGO}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );

  if (!onPress) {
    return logo;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => {
        Animated.spring(pressScale, {
          toValue: 0.96,
          useNativeDriver: true,
          friction: 6,
        }).start();
      }}
      onPressOut={() => {
        Animated.spring(pressScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
        }).start();
      }}
    >
      <Animated.View style={{ transform: [{ scale: pressScale }] }}>{logo}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
});
