import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { LanguageCardList } from '../../components/auth/LanguageCard';
import { RoleSelectionBackground } from '../../components/auth/RoleSelectionBackground';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { useTranslation } from '../../i18n/I18nContext';
import type { AppLanguage } from '../../i18n/types';
import type { RootStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSelection'>;

export function LanguageSelectionScreen({ navigation }: Props) {
  const { t, setLanguage } = useTranslation();

  const options: Array<{ language: AppLanguage; title: string; nativeTitle: string }> = [
    {
      language: 'gu',
      title: t('language.gujarati'),
      nativeTitle: t('language.gujaratiNative'),
    },
    {
      language: 'hi',
      title: t('language.hindi'),
      nativeTitle: t('language.hindiNative'),
    },
    {
      language: 'en',
      title: t('language.english'),
      nativeTitle: t('language.englishNative'),
    },
  ];

  const handleSelect = async (language: AppLanguage) => {
    await setLanguage(language);
    navigation.reset({
      index: 0,
      routes: [{ name: 'RoleSelection' }],
    });
  };

  return (
    <View style={styles.root}>
      <RoleSelectionBackground />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <BhuguardLogo size={LOGO_SIZES.roleSelection} />
          </View>
          <Text style={styles.title}>{t('language.title')}</Text>
          <Text style={styles.subtitle}>{t('language.subtitle')}</Text>

          <LanguageCardList options={options} onSelect={(language) => void handleSelect(language)} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safe: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  logoWrap: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: -8,
  },
});
