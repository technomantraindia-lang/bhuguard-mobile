import { Animated, Easing } from 'react-native';

export function fadeUpIn(
  opacity: Animated.Value,
  translateY: Animated.Value,
  options?: { delay?: number; duration?: number },
): Animated.CompositeAnimation {
  const delay = options?.delay ?? 80;
  const duration = options?.duration ?? 640;

  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: 0,
      duration: duration + 40,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]);
}

export function createFloatLoop(value: Animated.Value): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: -8,
        duration: 2200,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 0,
        duration: 2200,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]),
  );
}

export function createPulseLoop(value: Animated.Value): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.018,
        duration: 1600,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]),
  );
}

export function createKenBurnsLoop(value: Animated.Value): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.08,
        duration: 18000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 1,
        duration: 18000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]),
  );
}

export function pressIn(scale: Animated.Value): void {
  Animated.spring(scale, {
    toValue: 0.97,
    friction: 7,
    tension: 140,
    useNativeDriver: true,
  }).start();
}

export function pressOut(scale: Animated.Value): void {
  Animated.spring(scale, {
    toValue: 1,
    friction: 6,
    tension: 120,
    useNativeDriver: true,
  }).start();
}
