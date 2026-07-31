import { Image, ImageBackground, StyleSheet, View } from 'react-native';

import { BHUGUARD_LOGO } from '../../constants/branding';

const BACKGROUND = require('../../../assets/auth-environment-bg.jpg');

interface RoleEnvironmentalBackgroundProps {
  /** Lighter cream/green overlay for role content screens. */
  variant?: 'role' | 'auth';
}

/**
 * Shared low-opacity environmental background for Farmer / FO / Artisan content screens.
 * Do not use on camera, maps, fullscreen evidence, or QR viewers.
 */
export function RoleEnvironmentalBackground({ variant = 'role' }: RoleEnvironmentalBackgroundProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <ImageBackground source={BACKGROUND} style={styles.image} resizeMode="cover" />
      <View style={[styles.wash, variant === 'auth' ? styles.washAuth : styles.washRole]} />
      <Image source={BHUGUARD_LOGO} style={styles.watermark} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFill,
    opacity: 0.18,
  },
  wash: {
    ...StyleSheet.absoluteFill,
  },
  washRole: {
    backgroundColor: 'rgba(247, 250, 246, 0.88)',
  },
  washAuth: {
    backgroundColor: 'rgba(247, 250, 246, 0.78)',
  },
  watermark: {
    position: 'absolute',
    right: 18,
    bottom: 28,
    width: 72,
    height: 72,
    opacity: 0.06,
  },
});
