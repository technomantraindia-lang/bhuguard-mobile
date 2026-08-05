import { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  ImageBackground,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BHUGUARD_LOGO, LOGO_SIZES } from '../constants/branding';

export const ANIMATED_SPLASH_BG = '#03150D';

const SPLASH_FARM_BG = require('../../assets/splash-farm-bg.jpg');

/** Entrance + pulse + hold + exit ≈ 2.3–2.6s */
const ENTRANCE_MS = 700;
const PULSE_HALF_MS = 280;
const HOLD_MS = 450;
const EXIT_MS = 420;
const HARD_CAP_MS = 3200;

type AnimatedLogoSplashProps = {
  onFinish: () => void;
};

/**
 * Premium farm-background logo splash using only React Native Animated.
 * Logo stays exactly centered; never clipped by status bar / notch.
 */
export default function AnimatedLogoSplash({ onFinish }: AnimatedLogoSplashProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const maxByWidth = Math.round(width * 0.42);
  const maxByHeight = Math.round((height - insets.top - insets.bottom) * 0.28);
  const logoSize = Math.min(LOGO_SIZES.splash, maxByWidth, maxByHeight, 160);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.72)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const onFinishRef = useRef(onFinish);
  const finishedRef = useRef(false);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    let active = true;
    let hardCapTimer: ReturnType<typeof setTimeout> | undefined;
    let reduceMotionTimer: ReturnType<typeof setTimeout> | undefined;
    let running: Animated.CompositeAnimation | null = null;

    const complete = () => {
      if (!active || finishedRef.current) {
        return;
      }
      finishedRef.current = true;
      onFinishRef.current();
    };

    const runReduced = () => {
      opacity.setValue(1);
      scale.setValue(1);
      glowOpacity.setValue(0.4);
      reduceMotionTimer = setTimeout(() => {
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 280,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            complete();
          }
        });
      }, 700);
    };

    const runFull = () => {
      running = Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: ENTRANCE_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: ENTRANCE_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.55,
            duration: ENTRANCE_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.04,
              duration: PULSE_HALF_MS,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.75,
              duration: PULSE_HALF_MS,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1,
              duration: PULSE_HALF_MS,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0.45,
              duration: PULSE_HALF_MS,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.delay(HOLD_MS),
        Animated.parallel([
          Animated.timing(screenOpacity, {
            toValue: 0,
            duration: EXIT_MS,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: EXIT_MS,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: EXIT_MS,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      running.start(({ finished }) => {
        if (finished) {
          complete();
        }
      });
    };

    hardCapTimer = setTimeout(complete, HARD_CAP_MS);

    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!active) {
          return;
        }
        if (enabled) {
          runReduced();
        } else {
          runFull();
        }
      })
      .catch(() => {
        if (active) {
          runFull();
        }
      });

    return () => {
      active = false;
      running?.stop();
      if (hardCapTimer) {
        clearTimeout(hardCapTimer);
      }
      if (reduceMotionTimer) {
        clearTimeout(reduceMotionTimer);
      }
      opacity.stopAnimation();
      scale.stopAnimation();
      glowOpacity.stopAnimation();
      screenOpacity.stopAnimation();
    };
  }, [glowOpacity, opacity, scale, screenOpacity]);

  const glowSize = logoSize * 1.45;

  return (
    <Animated.View
      style={[styles.root, { opacity: screenOpacity }]}
      accessibilityLabel="Bhuguard splash"
    >
      <ImageBackground
        source={SPLASH_FARM_BG}
        style={styles.background}
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      >
        <LinearGradient
          colors={['rgba(3, 21, 13, 0.55)', 'rgba(3, 21, 13, 0.72)', 'rgba(3, 21, 13, 0.78)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View
          style={[
            styles.center,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
          pointerEvents="none"
        >
          <Animated.View
            style={[
              styles.glow,
              {
                width: glowSize,
                height: glowSize,
                borderRadius: glowSize / 2,
                opacity: glowOpacity,
              },
            ]}
          />

          <Animated.Image
            source={BHUGUARD_LOGO}
            resizeMode="contain"
            fadeDuration={0}
            style={[
              styles.logo,
              {
                width: logoSize,
                height: logoSize,
                opacity,
                transform: [{ scale }],
              },
            ]}
            accessibilityLabel="Bhuguard logo"
          />
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: ANIMATED_SPLASH_BG,
    zIndex: 9999,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: ANIMATED_SPLASH_BG,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  center: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(133, 201, 92, 0.22)',
    shadowColor: '#85C95C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
  },
  logo: {
    zIndex: 2,
  },
});

export { AnimatedLogoSplash };
