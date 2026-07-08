import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useFonts, Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { LeafParticles } from './LeafParticles';
import { LoadingDots } from './LoadingDots';
import { LogoAnimation } from './LogoAnimation';
import {
  SCREEN_FADE_MS,
  SPLASH_BACKGROUND,
  SPLASH_TAGLINE,
  SPLASH_TAGLINE_COLOR,
  TAGLINE_FADE_MS,
  TAGLINE_START_DELAY_MS,
} from './SplashTransition';

interface SplashScreenProps {
  /** 1 while visible; animate toward 0 for exit cross-fade. */
  exitOpacity?: SharedValue<number>;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function ContourGrid() {
  const paths = [
    `M0 ${SCREEN_HEIGHT * 0.22} C ${SCREEN_WIDTH * 0.25} ${SCREEN_HEIGHT * 0.18}, ${SCREEN_WIDTH * 0.55} ${SCREEN_HEIGHT * 0.28}, ${SCREEN_WIDTH} ${SCREEN_HEIGHT * 0.2}`,
    `M0 ${SCREEN_HEIGHT * 0.4} C ${SCREEN_WIDTH * 0.2} ${SCREEN_HEIGHT * 0.36}, ${SCREEN_WIDTH * 0.6} ${SCREEN_HEIGHT * 0.46}, ${SCREEN_WIDTH} ${SCREEN_HEIGHT * 0.38}`,
    `M0 ${SCREEN_HEIGHT * 0.58} C ${SCREEN_WIDTH * 0.3} ${SCREEN_HEIGHT * 0.54}, ${SCREEN_WIDTH * 0.5} ${SCREEN_HEIGHT * 0.64}, ${SCREEN_WIDTH} ${SCREEN_HEIGHT * 0.57}`,
    `M0 ${SCREEN_HEIGHT * 0.76} C ${SCREEN_WIDTH * 0.22} ${SCREEN_HEIGHT * 0.72}, ${SCREEN_WIDTH * 0.7} ${SCREEN_HEIGHT * 0.8}, ${SCREEN_WIDTH} ${SCREEN_HEIGHT * 0.74}`,
    `M${SCREEN_WIDTH * 0.18} 0 C ${SCREEN_WIDTH * 0.14} ${SCREEN_HEIGHT * 0.3}, ${SCREEN_WIDTH * 0.26} ${SCREEN_HEIGHT * 0.55}, ${SCREEN_WIDTH * 0.16} ${SCREEN_HEIGHT}`,
    `M${SCREEN_WIDTH * 0.52} 0 C ${SCREEN_WIDTH * 0.48} ${SCREEN_HEIGHT * 0.28}, ${SCREEN_WIDTH * 0.58} ${SCREEN_HEIGHT * 0.6}, ${SCREEN_WIDTH * 0.5} ${SCREEN_HEIGHT}`,
    `M${SCREEN_WIDTH * 0.84} 0 C ${SCREEN_WIDTH * 0.8} ${SCREEN_HEIGHT * 0.32}, ${SCREEN_WIDTH * 0.9} ${SCREEN_HEIGHT * 0.58}, ${SCREEN_WIDTH * 0.82} ${SCREEN_HEIGHT}`,
  ];

  return (
    <View style={styles.grid} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        {paths.map((d, index) => (
          <Path
            key={`contour-${index}`}
            d={d}
            stroke="#285B2A"
            strokeWidth={1}
            fill="none"
            opacity={0.045}
          />
        ))}
      </Svg>
    </View>
  );
}

export function SplashScreen({ exitOpacity }: SplashScreenProps) {
  const [fontsLoaded] = useFonts({ Outfit_600SemiBold });
  const screenOpacity = useSharedValue(0);
  const whiteOverlay = useSharedValue(1);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    screenOpacity.value = withTiming(1, {
      duration: SCREEN_FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
    whiteOverlay.value = withTiming(0, {
      duration: SCREEN_FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
    taglineOpacity.value = withDelay(
      TAGLINE_START_DELAY_MS,
      withTiming(1, {
        duration: TAGLINE_FADE_MS,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [screenOpacity, taglineOpacity, whiteOverlay]);

  const rootStyle = useAnimatedStyle(() => {
    const exit = exitOpacity ? exitOpacity.value : 1;
    return {
      opacity: screenOpacity.value * exit,
    };
  });

  const whiteStyle = useAnimatedStyle(() => ({
    opacity: whiteOverlay.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: (1 - taglineOpacity.value) * 8 }],
  }));

  return (
    <Animated.View style={[styles.root, rootStyle]}>
      <ContourGrid />
      <LeafParticles />
      <View style={styles.content}>
        <LogoAnimation />
        <Animated.Text
          style={[
            styles.tagline,
            fontsLoaded ? styles.taglineOutfit : styles.taglineFallback,
            taglineStyle,
          ]}
        >
          {SPLASH_TAGLINE}
        </Animated.Text>
        <LoadingDots />
      </View>
      <Animated.View pointerEvents="none" style={[styles.whiteOverlay, whiteStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SPLASH_BACKGROUND,
  },
  grid: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  tagline: {
    marginTop: 28,
    textAlign: 'center',
    color: SPLASH_TAGLINE_COLOR,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.2,
    maxWidth: 300,
  },
  taglineOutfit: {
    fontFamily: 'Outfit_600SemiBold',
    fontWeight: '600',
  },
  taglineFallback: {
    fontWeight: '600',
  },
  whiteOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
  },
});
