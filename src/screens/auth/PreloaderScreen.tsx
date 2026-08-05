import { useEffect, useRef } from 'react';
import { Image, ImageBackground, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { syncApiClientBaseUrl } from '../../api/client';
import { routeAfterPreloader } from '../../auth/startup/AuthStartupController';
import { ANIMATED_SPLASH_BG } from '../../components/AnimatedLogoSplash';
import { BHUGUARD_LOGO, LOGO_SIZES } from '../../constants/branding';
import { safeNavigationReset } from '../../navigation/safeNavigationReset';
import type { RootStackParamList } from '../../navigation/types';
import { syncServerTime } from '../../services/serverTimeSync';
import { bootstrapApiBaseUrl } from '../../storage/apiConfigStorage';
import { hideNativeSplashOnce } from '../../utils/splashHideGuard';

type Props = NativeStackScreenProps<RootStackParamList, 'Preloader'>;

const SPLASH_FARM_BG = require('../../../assets/splash-farm-bg.jpg');

const MAX_BOOTSTRAP_MS = 4500;
/** Keep a brief centered logo while hydration finishes after the animated splash. */
const POST_LOGO_HOLD_MS = 180;

export function PreloaderScreen({ navigation }: Props) {
  const finishedRef = useRef(false);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const logoSize = Math.min(
    LOGO_SIZES.splash,
    Math.round(width * 0.42),
    Math.round((height - insets.top - insets.bottom) * 0.28),
    160,
  );

  useEffect(() => {
    void hideNativeSplashOnce();
  }, []);

  useEffect(() => {
    let active = true;
    const startedAt = Date.now();

    const navigateOnce = async (route: keyof RootStackParamList) => {
      if (finishedRef.current || !active) {
        return;
      }

      finishedRef.current = true;
      await hideNativeSplashOnce();

      const elapsed = Date.now() - startedAt;
      const remaining = POST_LOGO_HOLD_MS - elapsed;
      if (remaining > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, remaining));
      }

      if (!active) {
        return;
      }

      safeNavigationReset(navigation, { index: 0, routes: [{ name: route }] });
    };

    const bootstrap = async () => {
      try {
        await Promise.race([
          (async () => {
            await bootstrapApiBaseUrl();
            await syncApiClientBaseUrl();
          })(),
          new Promise<void>((resolve) => setTimeout(resolve, 4000)),
        ]);
      } catch (error) {
        if (__DEV__) {
          console.warn('[Bhuguard] API bootstrap failed during preloader:', error);
        }
      }

      // Best-effort — never block forever on optional APIs.
      void syncServerTime();

      try {
        const next = await routeAfterPreloader();
        await navigateOnce(next.name);
      } catch (error) {
        if (__DEV__) {
          console.warn('[Bhuguard] routeAfterPreloader failed:', error);
        }
        await navigateOnce('LanguageSelection');
      }
    };

    const maxTimer = setTimeout(() => {
      void (async () => {
        try {
          const next = await routeAfterPreloader();
          await navigateOnce(next.name);
        } catch {
          await navigateOnce('LanguageSelection');
        }
      })();
    }, MAX_BOOTSTRAP_MS);

    void bootstrap().finally(() => clearTimeout(maxTimer));

    return () => {
      active = false;
      clearTimeout(maxTimer);
    };
  }, [navigation]);

  return (
    <View style={styles.root} accessibilityLabel="Bhuguard preloader">
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
        >
          <Image
            source={BHUGUARD_LOGO}
            style={{ width: logoSize, height: logoSize }}
            resizeMode="contain"
            accessibilityLabel="Bhuguard logo"
          />
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ANIMATED_SPLASH_BG,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
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
});
