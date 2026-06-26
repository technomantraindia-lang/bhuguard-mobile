import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { LOGO_SIZES } from '../../constants/branding';
import { colors } from '../../theme/colors';
import { BhuguardLogo } from './BhuguardLogo';

interface BrandedLoaderProps {
  message?: string;
  size?: 'inline' | 'fullscreen';
  style?: StyleProp<ViewStyle>;
}

function LoaderRing({ size }: { size: number }) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const rotation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    rotation.start();
    glow.start();

    return () => {
      rotation.stop();
      glow.stop();
    };
  }, [pulse, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const ringSize = size + 34;

  return (
    <View style={[styles.ringStage, { width: ringSize, height: ringSize }]}>
      <Animated.View
        style={[
          styles.glow,
          {
            width: ringSize - 8,
            height: ringSize - 8,
            borderRadius: (ringSize - 8) / 2,
            opacity: pulse,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            transform: [{ rotate }],
          },
        ]}
      />
      <View style={styles.logoCenter}>
        <BhuguardLogo size={size} animation="splash" />
      </View>
    </View>
  );
}

export function BrandedLoader({ message = 'Loading Bhuguard…', size = 'inline', style }: BrandedLoaderProps) {
  const logoSize = size === 'fullscreen' ? LOGO_SIZES.splash : LOGO_SIZES.modal;

  return (
    <View style={[size === 'fullscreen' ? styles.fullscreen : styles.inline, style]}>
      <LoaderRing size={logoSize} />
      <Text style={[styles.message, size === 'fullscreen' && styles.messageFullscreen]}>{message}</Text>
    </View>
  );
}

export function FullScreenLoader({ message }: { message?: string }) {
  return <BrandedLoader message={message} size="fullscreen" />;
}

export function InlineLoader({ message }: { message?: string }) {
  return <BrandedLoader message={message} size="inline" />;
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 18,
    backgroundColor: colors.background,
  },
  inline: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  ringStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: colors.softGreen,
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.primary,
    borderTopColor: colors.softGreen,
    borderRightColor: `${colors.primary}55`,
  },
  logoCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  messageFullscreen: {
    fontSize: 15,
  },
});
