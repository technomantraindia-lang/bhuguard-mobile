import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, ImageBackground, StyleSheet, View } from 'react-native';

const SPLASH_BACKGROUND = require('../../../../assets/auth-environment-bg.jpg');
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SplashBackgroundImageProps {
  fadeOpacity?: Animated.Value;
}

export function SplashBackgroundImage({ fadeOpacity }: SplashBackgroundImageProps) {
  const zoom = useRef(new Animated.Value(1)).current;
  const internalFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(internalFade, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(zoom, {
          toValue: 1.08,
          duration: 14000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(zoom, {
          toValue: 1,
          duration: 14000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
      zoom.stopAnimation();
      internalFade.stopAnimation();
    };
  }, [internalFade, zoom]);

  const opacity = fadeOpacity ?? internalFade;

  return (
    <View style={styles.root} pointerEvents="none">
      <Animated.View style={[styles.imageWrap, { opacity, transform: [{ scale: zoom }] }]}>
        <ImageBackground source={SPLASH_BACKGROUND} style={styles.image} resizeMode="cover" />
      </Animated.View>

      <View style={styles.overlayLight} />
      <View style={styles.overlayMist} />
      <View style={styles.overlayDepth} />
      <View style={styles.centerGlow} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#E8F3EA',
    overflow: 'hidden',
  },
  imageWrap: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlayLight: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(247, 250, 246, 0.42)',
  },
  overlayMist: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  overlayDepth: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '38%',
    backgroundColor: 'rgba(11, 107, 58, 0.12)',
  },
  centerGlow: {
    position: 'absolute',
    alignSelf: 'center',
    top: SCREEN_HEIGHT * 0.22,
    width: SCREEN_WIDTH * 0.88,
    height: SCREEN_HEIGHT * 0.42,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
  },
});
