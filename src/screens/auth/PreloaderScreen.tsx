import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SplashScreenNative from 'expo-splash-screen';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { getCurrentUser } from '../../api/authApi';
import { syncApiClientBaseUrl } from '../../api/client';
import {
  EXIT_CROSS_FADE_MS,
  MIN_SPLASH_MS,
  SplashScreen,
  runCrossFadeOut,
  waitForMinimumSplash,
} from '../../components/auth/splash';
import type { RootStackParamList } from '../../navigation/types';
import { bootstrapApiBaseUrl } from '../../storage/apiConfigStorage';
import { getStoredLanguage } from '../../storage/languageStorage';
import { clearAuthStorage, getAuthToken, saveAuthUser } from '../../utils/authStorage';
import { isAdminRole, isCompanyRole, resolveUserRole } from '../../utils/authRole';
import { getDashboardRoute, isMobileSupportedRole } from '../../utils/authRouting';

type Props = NativeStackScreenProps<RootStackParamList, 'Preloader'>;

const MAX_BOOTSTRAP_MS = 8000;
const AUTH_CHECK_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export function PreloaderScreen({ navigation }: Props) {
  const finishedRef = useRef(false);
  const exitOpacity = useSharedValue(1);

  useEffect(() => {
    void SplashScreenNative.hideAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    const startedAt = Date.now();

    const navigateAfterSplash = async (route: keyof RootStackParamList) => {
      if (finishedRef.current || !active) {
        return;
      }

      finishedRef.current = true;
      await waitForMinimumSplash(startedAt, MIN_SPLASH_MS);

      if (!active) {
        return;
      }

      exitOpacity.value = withTiming(0, {
        duration: EXIT_CROSS_FADE_MS,
        easing: Easing.out(Easing.cubic),
      });
      await runCrossFadeOut(EXIT_CROSS_FADE_MS);

      if (!active) {
        return;
      }

      navigation.reset({ index: 0, routes: [{ name: route }] });
    };

    const goToLogin = async () => {
      await navigateAfterSplash('MobileLogin');
    };

    const goToLanguage = async () => {
      await navigateAfterSplash('LanguageSelection');
    };

    const goToDashboard = async (route: keyof RootStackParamList) => {
      await navigateAfterSplash(route);
    };

    const bootstrap = async () => {
      try {
        await withTimeout(bootstrapApiBaseUrl(), 4000, 'API bootstrap');
        await syncApiClientBaseUrl();

        const [token, language] = await Promise.all([getAuthToken(), getStoredLanguage()]);

        if (token) {
          try {
            const user = await withTimeout(getCurrentUser(), AUTH_CHECK_MS, 'Session check');
            const resolvedRole = resolveUserRole(user) ?? user.user_type;

            if (isAdminRole(resolvedRole) || isCompanyRole(resolvedRole) || !isMobileSupportedRole(resolvedRole)) {
              await clearAuthStorage();
              await goToLogin();
              return;
            }

            await saveAuthUser(user);
            const route = getDashboardRoute(resolvedRole);
            await goToDashboard(route ?? 'MobileLogin');
            return;
          } catch {
            await clearAuthStorage();
          }
        }

        if (!language) {
          await goToLanguage();
          return;
        }

        await goToLogin();
      } catch {
        await goToLogin();
      }
    };

    const maxTimer = setTimeout(() => {
      void goToLogin();
    }, MAX_BOOTSTRAP_MS);

    void bootstrap().finally(() => clearTimeout(maxTimer));

    return () => {
      active = false;
      clearTimeout(maxTimer);
    };
  }, [exitOpacity, navigation]);

  return (
    <View style={styles.root}>
      <SplashScreen exitOpacity={exitOpacity} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7FAF6',
  },
});
