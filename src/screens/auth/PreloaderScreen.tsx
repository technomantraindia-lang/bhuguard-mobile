import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { SplashBackground } from '../../components/auth/SplashBackground';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { useTranslation } from '../../i18n/I18nContext';
import type { RootStackParamList } from '../../navigation/types';
import { bootstrapApiBaseUrl } from '../../storage/apiConfigStorage';
import { getAuthToken, getAuthUserType } from '../../storage/authStorage';
import { getStoredLanguage } from '../../storage/languageStorage';
import { colors } from '../../theme/colors';
import { getDashboardRoute } from '../../utils/authRouting';

type Props = NativeStackScreenProps<RootStackParamList, 'Preloader'>;

const PRELOADER_DURATION_MS = 2600;

export function PreloaderScreen({ navigation }: Props) {
  const { t, ready: i18nReady } = useTranslation();
  const [loadingText, setLoadingText] = useState('');

  useEffect(() => {
    if (!i18nReady) {
      return;
    }

    setLoadingText(t('preloader.loading'));
  }, [i18nReady, t]);

  useEffect(() => {
    if (!i18nReady) {
      return;
    }

    let active = true;

    const bootstrap = async () => {
      await bootstrapApiBaseUrl();
      await new Promise((resolve) => setTimeout(resolve, 900));

      if (active) {
        setLoadingText(t('preloader.loadingData'));
      }

      await new Promise((resolve) => setTimeout(resolve, PRELOADER_DURATION_MS - 900));

      if (!active) {
        return;
      }

      const [token, userType, language] = await Promise.all([
        getAuthToken(),
        getAuthUserType(),
        getStoredLanguage(),
      ]);

      if (token) {
        const route = getDashboardRoute(userType ?? '');

        navigation.reset({
          index: 0,
          routes: [{ name: route ?? 'RoleSelection' }],
        });
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: language ? 'RoleSelection' : 'LanguageSelection' }],
      });
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [i18nReady, navigation, t]);

  return (
    <View style={styles.root}>
      <SplashBackground />
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <BhuguardLogo size={LOGO_SIZES.splash} animation="splash" />
          <Text style={styles.brand}>{t('brand.name')}</Text>
          <Text style={styles.tagline}>{t('brand.tagline')}</Text>
          <ActivityIndicator style={styles.spinner} color={colors.primary} />
          <Text style={styles.loading}>{loadingText || t('preloader.loading')}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4FBF6',
  },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 24,
  },
  brand: {
    marginTop: 18,
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 24,
  },
  loading: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
});
