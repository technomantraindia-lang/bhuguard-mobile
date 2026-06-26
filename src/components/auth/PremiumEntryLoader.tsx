import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { LOGO_SIZES } from '../../constants/branding';
import { colors } from '../../theme/colors';
import { BhuguardLogo } from '../shared/BhuguardLogo';

const SERVICE_PILLS = [
  'Farm MRV',
  'GPS Verification',
  'Carbon Reports',
  'Biochar Tracking',
  'Evidence Capture',
  'Soil & Baseline',
] as const;

interface PremiumEntryLoaderProps {
  title: string;
  subtitle: string;
  progress?: number;
}

export function PremiumEntryLoader({ title, subtitle, progress = 0 }: PremiumEntryLoaderProps) {
  const [pillIndex, setPillIndex] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;
  const pillOpacity = useRef(new Animated.Value(1)).current;

  const clampedProgress = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(rise, {
        toValue: 0,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();

    const spin = Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    spin.start();

    return () => spin.stop();
  }, [fade, orbit, rise]);

  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: clampedProgress,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [barWidth, clampedProgress]);

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(pillOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(pillOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start();

      setPillIndex((current) => (current + 1) % SERVICE_PILLS.length);
    }, 2200);

    return () => clearInterval(timer);
  }, [pillOpacity]);

  const orbitRotate = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = barWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['8%', '100%'],
  });

  const orbitDots = useMemo(
    () =>
      [0, 1, 2, 3].map((index) => {
        const angle = (index / 4) * Math.PI * 2;
        const radius = 78;
        return {
          key: index,
          left: 86 + Math.cos(angle) * radius,
          top: 86 + Math.sin(angle) * radius,
        };
      }),
    [],
  );

  return (
    <Animated.View style={[styles.wrap, { opacity: fade, transform: [{ translateY: rise }] }]}>
      <View style={styles.logoStage}>
        <Animated.View style={[styles.orbitRing, { transform: [{ rotate: orbitRotate }] }]}>
          {orbitDots.map((dot) => (
            <View key={dot.key} style={[styles.orbitDot, { left: dot.left, top: dot.top }]} />
          ))}
        </Animated.View>
        <View style={styles.logoHalo} />
        <BhuguardLogo size={LOGO_SIZES.splash} animation="splash" />
      </View>

      <Text style={styles.brand}>Bhuguard</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <Animated.View style={[styles.servicePill, { opacity: pillOpacity }]}>
        <Text style={styles.servicePillText}>{SERVICE_PILLS[pillIndex]}</Text>
      </Animated.View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
      <Text style={styles.progressHint}>Preparing your climate workspace</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoStage: {
    alignItems: 'center',
    height: 190,
    justifyContent: 'center',
    marginBottom: 8,
    width: 190,
  },
  orbitRing: {
    ...StyleSheet.absoluteFill,
  },
  orbitDot: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 10,
    opacity: 0.55,
    position: 'absolute',
    width: 10,
  },
  logoHalo: {
    backgroundColor: colors.softGreen,
    borderRadius: 999,
    height: 148,
    opacity: 0.55,
    position: 'absolute',
    width: 148,
  },
  brand: {
    color: colors.primaryDark,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
    maxWidth: 300,
    textAlign: 'center',
  },
  servicePill: {
    backgroundColor: '#FFFFFFCC',
    borderColor: '#BFC9BE55',
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  servicePillText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  progressTrack: {
    backgroundColor: '#DCE2E7',
    borderRadius: 999,
    height: 6,
    marginTop: 14,
    overflow: 'hidden',
    width: '78%',
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: '100%',
  },
  progressHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
});
