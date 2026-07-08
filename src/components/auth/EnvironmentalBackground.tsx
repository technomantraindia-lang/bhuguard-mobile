import { useEffect } from 'react';
import { Dimensions, ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const BACKGROUND = require('../../../assets/auth-environment-bg.jpg');
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EnvironmentalBackgroundProps {
  children?: React.ReactNode;
}

export function EnvironmentalBackground({ children }: EnvironmentalBackgroundProps) {
  const zoom = useSharedValue(1);

  useEffect(() => {
    zoom.value = withRepeat(
      withTiming(1.06, {
        duration: 16000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [zoom]);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoom.value }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.imageWrap, imageStyle]}>
        <ImageBackground source={BACKGROUND} style={styles.image} resizeMode="cover" />
      </Animated.View>
      <LinearGradient
        colors={['rgba(3, 21, 13, 0.35)', 'rgba(3, 21, 13, 0.78)']}
        locations={[0, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#03150D',
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
});
