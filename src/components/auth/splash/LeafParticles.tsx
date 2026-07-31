import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { LEAF_START_DELAY_MS, SPLASH_LEAF_COLORS } from './SplashTransition';

interface LeafParticlesProps {
  active?: boolean;
}

interface LeafSpec {
  id: string;
  left: number;
  bottom: number;
  size: number;
  color: string;
  driftX: number;
  duration: number;
  delay: number;
}

function LeafShape({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 3C8 7 6 11 6 14.5C6 18 8.5 20.5 12 21C15.5 20.5 18 18 18 14.5C18 11 16 7 12 3Z"
        fill={color}
        opacity={0.95}
      />
      <Path d="M12 8V19" stroke="#285B2A" strokeWidth={0.8} opacity={0.35} />
    </Svg>
  );
}

function FloatingLeaf({ leaf }: { leaf: LeafSpec }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.delay(leaf.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: leaf.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );

    float.start();

    return () => {
      float.stop();
      progress.stopAnimation();
    };
  }, [leaf.delay, leaf.duration, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -86],
  });

  const translateX = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, leaf.driftX, 0, -leaf.driftX, 0],
  });

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-12deg', '12deg'],
  });

  const leafOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.11],
  });

  return (
    <Animated.View
      style={[
        styles.leaf,
        {
          left: leaf.left,
          bottom: leaf.bottom,
          width: leaf.size,
          height: leaf.size,
          opacity: leafOpacity,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
      pointerEvents="none"
    >
      <LeafShape color={leaf.color} size={leaf.size} />
    </Animated.View>
  );
}

export function LeafParticles({ active = true }: LeafParticlesProps) {
  const leaves = useMemo<LeafSpec[]>(
    () => [
      { id: 'l1', left: 42, bottom: 120, size: 14, color: SPLASH_LEAF_COLORS[0], driftX: 10, duration: 7200, delay: LEAF_START_DELAY_MS },
      { id: 'l2', left: 88, bottom: 90, size: 11, color: SPLASH_LEAF_COLORS[1], driftX: -8, duration: 8400, delay: LEAF_START_DELAY_MS + 220 },
      { id: 'l3', left: 160, bottom: 70, size: 13, color: SPLASH_LEAF_COLORS[0], driftX: 12, duration: 7800, delay: LEAF_START_DELAY_MS + 420 },
      { id: 'l4', left: 230, bottom: 110, size: 12, color: SPLASH_LEAF_COLORS[1], driftX: -10, duration: 9000, delay: LEAF_START_DELAY_MS + 180 },
      { id: 'l5', left: 280, bottom: 80, size: 10, color: SPLASH_LEAF_COLORS[0], driftX: 7, duration: 7600, delay: LEAF_START_DELAY_MS + 560 },
      { id: 'l6', left: 310, bottom: 140, size: 15, color: SPLASH_LEAF_COLORS[1], driftX: -6, duration: 8600, delay: LEAF_START_DELAY_MS + 300 },
    ],
    [],
  );

  if (!active) {
    return null;
  }

  return (
    <View style={styles.wrap} pointerEvents="none">
      {leaves.map((leaf) => (
        <FloatingLeaf key={leaf.id} leaf={leaf} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  leaf: {
    position: 'absolute',
  },
});
