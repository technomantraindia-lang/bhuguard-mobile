import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, ImageBackground, StyleSheet, View } from 'react-native';

import { getLinearGradient } from '../../utils/nativeGlass';

const BACKGROUND = require('../../../assets/auth-environment-bg.jpg');
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EnvironmentalBackgroundProps {
  children?: React.ReactNode;
  fadeOpacity?: Animated.Value;
}

export function EnvironmentalBackground({ children, fadeOpacity }: EnvironmentalBackgroundProps) {
  const zoom = useRef(new Animated.Value(1)).current;
  const internalFade = useRef(new Animated.Value(0)).current;
  const LinearGradient = getLinearGradient();

  useEffect(() => {
    Animated.timing(internalFade, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(zoom, {
          toValue: 1.06,
          duration: 16000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(zoom, {
          toValue: 1,
          duration: 16000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
      zoom.stopAnimation();
    };
  }, [internalFade, zoom]);

  const opacity = fadeOpacity ?? internalFade;

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.imageWrap, { opacity, transform: [{ scale: zoom }] }]}>
        <ImageBackground source={BACKGROUND} style={styles.image} resizeMode="cover" />
      </Animated.View>

      {LinearGradient ? (
        <LinearGradient
          colors={['rgba(2,18,12,0.15)', 'rgba(2,18,12,0.28)', 'rgba(2,18,12,0.62)']}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMid} />
          <View style={styles.overlayBottom} />
        </>
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#02120C',
    overflow: 'hidden',
  },
  imageWrap: {
    ...StyleSheet.absoluteFill,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlayTop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 18, 12, 0.15)',
  },
  overlayMid: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 18, 12, 0.13)',
  },
  overlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: 'rgba(2, 18, 12, 0.34)',
  },
});
