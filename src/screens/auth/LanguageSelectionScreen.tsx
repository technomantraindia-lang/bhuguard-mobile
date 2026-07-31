import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  getValidatedColdStartUser,
  loadLanguagePreferenceForUser,
  resolveLanguageForContinue,
  routeAfterLanguageContinue,
  validateTrustedSession,
} from '../../auth/startup/AuthStartupController';
import { LanguageCardList } from '../../components/auth/LanguageCard';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { useTranslation } from '../../i18n/I18nContext';
import type { AppLanguage } from '../../i18n/types';
import type { RootStackParamList } from '../../navigation/types';
import { safeNavigationReset } from '../../navigation/safeNavigationReset';
import { getDeviceLanguage, saveDeviceLanguage, saveScopedLanguage } from '../../storage/languageStorage';
import { authBrand } from '../../theme/authBrand';

const LANGUAGE_BACKGROUND = require('../../../assets/auth-environment-bg.jpg');

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSelection'>;

export function LanguageSelectionScreen({ navigation }: Props) {
  const { t, language, setLanguage, applyScopedLanguageForCurrentUser } = useTranslation();
  const [selected, setSelected] = useState<AppLanguage>(language);
  const [continuing, setContinuing] = useState(false);
  const continuingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    void (async () => {
      const user = (await validateTrustedSession()) ?? getValidatedColdStartUser();
      const preferred =
        (await loadLanguagePreferenceForUser(user))
        ?? (await getDeviceLanguage())
        ?? language;

      if (!active || !mountedRef.current) {
        return;
      }

      setSelected(preferred);
      await setLanguage(preferred);
    })();

    return () => {
      active = false;
      mountedRef.current = false;
    };
    // Cold-start load once; do not re-run when language changes after Continue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);

    return () => subscription.remove();
  }, []);

  const options: Array<{ language: AppLanguage; title: string; glyph: string }> = [
    {
      language: 'en',
      title: t('language.englishNative'),
      glyph: '🇮🇳',
    },
    {
      language: 'hi',
      title: t('language.hindiNative'),
      glyph: 'अ',
    },
    {
      language: 'gu',
      title: t('language.gujaratiNative'),
      glyph: 'અ',
    },
  ];

  const handleSelect = async (nextLanguage: AppLanguage) => {
    if (continuingRef.current) {
      return;
    }

    continuingRef.current = true;
    setContinuing(true);
    setSelected(nextLanguage);

    try {
      // Apply language before opening Mobile Number or MPIN. Do not clear session/drafts/evidence.
      await setLanguage(nextLanguage);

      const scope = await resolveLanguageForContinue();

      if (scope.languageRole && scope.languageUserId != null) {
        await saveScopedLanguage(scope.languageRole, scope.languageUserId, nextLanguage);
      } else {
        await saveDeviceLanguage(nextLanguage);
      }

      await applyScopedLanguageForCurrentUser();

      const next = await routeAfterLanguageContinue();

      if (!mountedRef.current) {
        return;
      }

      const routeEntry =
        'params' in next && next.params
          ? { name: next.name as keyof RootStackParamList, params: next.params }
          : { name: next.name as keyof RootStackParamList };

      safeNavigationReset(navigation, {
        index: 0,
        routes: [routeEntry],
      });
    } finally {
      if (mountedRef.current) {
        setContinuing(false);
      }
      continuingRef.current = false;
    }
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={LANGUAGE_BACKGROUND} style={styles.background} resizeMode="cover">
        <View style={styles.mistOverlay} />
        <View style={styles.hexCluster} pointerEvents="none">
          <View style={[styles.hex, styles.hexOne]} />
          <View style={[styles.hex, styles.hexTwo]} />
          <View style={[styles.hex, styles.hexThree]} />
        </View>

        <SafeAreaView style={styles.safe}>
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.brandBlock}>
              <BhuguardLogo size={LOGO_SIZES.roleSelection} />
              <Text style={styles.brandName}>{t('brand.name')}</Text>
              <Text style={styles.brandTagline}>{t('language.climateTagline')}</Text>
            </View>

            <View style={styles.headingBlock}>
              <Text style={styles.title}>{t('language.screenTitle')}</Text>
              <Text style={styles.subtitle}>{t('language.choosePreferred')}</Text>
            </View>

            <LanguageCardList
              options={options}
              selectedLanguage={selected}
              onSelect={(nextLanguage) => {
                void handleSelect(nextLanguage);
              }}
            />

            {continuing ? <Text style={styles.loadingHint}>{t('common.loading')}</Text> : null}
          </ScrollView>
        </SafeAreaView>

        <SafeAreaView edges={['bottom']} style={styles.footer} pointerEvents="none">
          <Text style={styles.footerText}>{t('language.footerPromise')}</Text>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: authBrand.tertiary,
  },
  background: {
    flex: 1,
  },
  mistOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(244, 240, 223, 0.28)',
  },
  hexCluster: {
    position: 'absolute',
    top: 48,
    left: 18,
    width: 120,
    height: 90,
    opacity: 0.35,
  },
  hex: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 8,
    transform: [{ rotate: '15deg' }],
  },
  hexOne: {
    top: 0,
    left: 8,
  },
  hexTwo: {
    top: 28,
    left: 42,
  },
  hexThree: {
    top: 8,
    left: 74,
  },
  safe: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  brandBlock: {
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    marginTop: 4,
    fontSize: 34,
    fontWeight: '800',
    color: authBrand.tertiary,
    letterSpacing: 0.2,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.4,
    color: authBrand.tertiary,
    textTransform: 'uppercase',
  },
  headingBlock: {
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: authBrand.tertiary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(11, 46, 31, 0.72)',
    textAlign: 'center',
  },
  loadingHint: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: authBrand.tertiary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingBottom: 14,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: authBrand.tertiary,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
