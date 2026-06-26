import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getCurrentUser } from '../../api/authApi';
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

const MIN_SPLASH_MS = 2400;

export function PreloaderScreen({ navigation }: Props) {
  const { t, ready: i18nReady } = useTranslation();
  const [progress, setProgress] = useState(0.08);

  const title = i18nReady ? t('preloader.title') : 'Bhuguard';
  const subtitle = i18nReady ? t('preloader.loading') : 'Loading your climate workspace…';
  const tagline = i18nReady ? t('brand.tagline') : 'Digital MRV for Climate Action';

  useEffect(() => {
    if (!i18nReady) {
      return;
    }

    let active = true;
    const startedAt = Date.now();

    const tickProgress = (value: number) => {
      if (active) {
        setProgress(value);
      }
    };

    const bootstrap = async () => {
      tickProgress(0.18);
      await bootstrapApiBaseUrl();
      tickProgress(0.42);

      const [token, language] = await Promise.all([getAuthToken(), getStoredLanguage()]);
      tickProgress(0.62);

      if (token) {
        try {
          const user = await getCurrentUser();
          tickProgress(0.82);
          const resolvedRole = resolveUserRole(user) ?? user.user_type;

          if (isAdminRole(resolvedRole) || isCompanyRole(resolvedRole) || !isMobileSupportedRole(resolvedRole)) {
            await clearAuthStorage();
            tickProgress(1);
            await waitForMinimumSplash(startedAt);
            if (!active) return;
            navigation.reset({ index: 0, routes: [{ name: 'RoleSelection' }] });
            return;
          }

          await saveAuthUser(user);
          tickProgress(1);
          await waitForMinimumSplash(startedAt);
          if (!active) return;

          const route = getDashboardRoute(resolvedRole);
          navigation.reset({
            index: 0,
            routes: [{ name: route ?? 'RoleSelection' }],
          });
          return;
        } catch {
          await clearAuthStorage();
        }
      }

      tickProgress(1);
      await waitForMinimumSplash(startedAt);
      if (!active) return;

      navigation.reset({
        index: 0,
        routes: [{ name: language ? 'RoleSelection' : 'LanguageSelection' }],
      });
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [i18nReady, navigation]);

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
