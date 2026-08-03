import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { syncApiClientBaseUrl } from '../../api/client';
import { routeAfterPreloader } from '../../auth/startup/AuthStartupController';
import { ANIMATED_SPLASH_BG } from '../../components/AnimatedLogoSplash';
import { safeNavigationReset } from '../../navigation/safeNavigationReset';
import type { RootStackParamList } from '../../navigation/types';
import { syncServerTime } from '../../services/serverTimeSync';
import { bootstrapApiBaseUrl } from '../../storage/apiConfigStorage';
import { hideNativeSplashOnce } from '../../utils/splashHideGuard';

type Props = NativeStackScreenProps<RootStackParamList, 'Preloader'>;

const MAX_BOOTSTRAP_MS = 4500;
/** Animated logo splash already ran in App; keep Preloader brief. */
const POST_LOGO_HOLD_MS = 120;

export function PreloaderScreen({ navigation }: Props) {
  const finishedRef = useRef(false);

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
      // Always clear native splash before leaving Preloader (API failure / timeout safe).
      await hideNativeSplashOnce();

      const elapsed = Date.now() - startedAt;
      const remaining = POST_LOGO_HOLD_MS - elapsed;
      if (remaining > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, remaining));
      }

      if (!active) {
        return;
      }

      // Skip opacity animation + native-driver teardown before the first stack
      // reset — that combination races Fabric PreAllocateMountItem on Android.
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

      // Best-effort, non-blocking — never delay startup on this.
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

  return <View style={styles.root} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ANIMATED_SPLASH_BG,
  },
});
