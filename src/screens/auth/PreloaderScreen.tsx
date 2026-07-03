import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getCurrentUser } from '../../api/authApi';
import { syncApiClientBaseUrl } from '../../api/client';
import { PremiumEntryLoader } from '../../components/auth/PremiumEntryLoader';
import { SplashBackground } from '../../components/auth/SplashBackground';
import { useTranslation } from '../../i18n/I18nContext';
import type { RootStackParamList } from '../../navigation/types';
import { bootstrapApiBaseUrl } from '../../storage/apiConfigStorage';
import { getStoredLanguage } from '../../storage/languageStorage';
import { colors } from '../../theme/colors';
import { clearAuthStorage, getAuthToken, saveAuthUser } from '../../utils/authStorage';
import { isAdminRole, isCompanyRole, resolveUserRole } from '../../utils/authRole';
import { getDashboardRoute, isMobileSupportedRole } from '../../utils/authRouting';

type Props = NativeStackScreenProps<RootStackParamList, 'Preloader'>;

const MIN_SPLASH_MS = 1800;
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
  const { t, ready: i18nReady } = useTranslation();
  const [progress, setProgress] = useState(0.08);
  const finishedRef = useRef(false);

  const title = i18nReady ? t('preloader.title') : 'Bhuguard';
  const subtitle = i18nReady ? t('preloader.loading') : 'Loading your climate workspace…';
  const tagline = i18nReady ? t('brand.tagline') : 'Digital MRV for Climate Action';

  useEffect(() => {
    let active = true;
    const startedAt = Date.now();

    const tickProgress = (value: number) => {
      if (active) {
        setProgress(value);
      }
    };

    const goToEntry = async (route: 'LanguageSelection' | 'RoleSelection') => {
      if (finishedRef.current || !active) {
        return;
      }

      finishedRef.current = true;
      tickProgress(1);
      await waitForMinimumSplash(startedAt);

      if (!active) {
        return;
      }

      navigation.reset({ index: 0, routes: [{ name: route }] });
    };

    const goToDashboard = async (route: keyof RootStackParamList) => {
      if (finishedRef.current || !active) {
        return;
      }

      finishedRef.current = true;
      tickProgress(1);
      await waitForMinimumSplash(startedAt);

      if (!active) {
        return;
      }

      navigation.reset({ index: 0, routes: [{ name: route }] });
    };

    const bootstrap = async () => {
      try {
        tickProgress(0.18);
        await withTimeout(bootstrapApiBaseUrl(), 4000, 'API bootstrap');
        await syncApiClientBaseUrl();
        tickProgress(0.42);

        const [token, language] = await Promise.all([getAuthToken(), getStoredLanguage()]);
        tickProgress(0.62);

        if (token) {
          try {
            const user = await withTimeout(getCurrentUser(), AUTH_CHECK_MS, 'Session check');
            tickProgress(0.82);

            const resolvedRole = resolveUserRole(user) ?? user.user_type;

            if (isAdminRole(resolvedRole) || isCompanyRole(resolvedRole) || !isMobileSupportedRole(resolvedRole)) {
              await clearAuthStorage();
              await goToEntry('RoleSelection');
              return;
            }

            await saveAuthUser(user);
            const route = getDashboardRoute(resolvedRole);
            await goToDashboard(route ?? 'RoleSelection');
            return;
          } catch {
            await clearAuthStorage();
          }
        }

        await goToEntry(language ? 'RoleSelection' : 'LanguageSelection');
      } catch {
        await goToEntry('RoleSelection');
      }
    };

    const maxTimer = setTimeout(() => {
      void goToEntry('RoleSelection');
    }, MAX_BOOTSTRAP_MS);

    void bootstrap().finally(() => clearTimeout(maxTimer));

    return () => {
      active = false;
      clearTimeout(maxTimer);
    };
  }, [navigation]);

  return (
    <View style={styles.root}>
      <SplashBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <PremiumEntryLoader title={title} subtitle={subtitle} progress={progress} />
        <Text style={styles.tagline}>{tagline}</Text>
      </SafeAreaView>
    </View>
  );
}

async function waitForMinimumSplash(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  const remaining = MIN_SPLASH_MS - elapsed;

  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  tagline: {
    bottom: 36,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    left: 24,
    position: 'absolute',
    right: 24,
    textAlign: 'center',
  },
});
