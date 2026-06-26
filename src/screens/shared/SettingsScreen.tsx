import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { LanguageCardList } from '../../components/auth/LanguageCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useTranslation } from '../../i18n/I18nContext';
import type { AppLanguage } from '../../i18n/types';
import { useLogout } from '../../hooks/useLogout';
import { navigateToApiHealthCheck, navigateToApiServerSettings } from '../../navigation/navigationRef';
import { colors } from '../../theme/colors';

interface SettingsScreenProps {
  title: string;
  subtitle?: string;
}

export function SettingsScreen({ title, subtitle }: SettingsScreenProps) {
  const logout = useLogout();
  const { t, language, setLanguage } = useTranslation();

  const languageOptions: Array<{ language: AppLanguage; title: string; nativeTitle: string }> = [
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

  const handleLanguageChange = async (nextLanguage: AppLanguage) => {
    if (nextLanguage === language) {
      return;
    }

    await setLanguage(nextLanguage);
    Alert.alert(t('language.changed'), t('language.changedMessage'));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={title} subtitle={subtitle} />

        <AppCard title={t('language.settingsTitle')} subtitle={t('language.settingsSubtitle')} />

        <LanguageCardList
          options={languageOptions}
          selectedLanguage={language}
          onSelect={(nextLanguage) => void handleLanguageChange(nextLanguage)}
        />

        <AppCard title={t('apiServer.title')} subtitle={t('apiServer.settingsSubtitle')} />

        <View style={styles.actions}>
          <AppButton label={t('apiServer.openSettings')} onPress={navigateToApiServerSettings} variant="secondary" />
        </View>

        {__DEV__ ? (
          <>
            <AppCard title="Developer" subtitle="API connectivity diagnostics (dev only)" />
            <View style={styles.actions}>
              <AppButton
                label="API Health Check"
                onPress={navigateToApiHealthCheck}
                variant="secondary"
              />
            </View>
          </>
        ) : null}

        <AppCard title={t('common.account')} subtitle={t('common.logout')} />

        <View style={styles.actions}>
          <AppButton label={t('common.logout')} onPress={logout} variant="danger" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, gap: 12, paddingBottom: 24 },
  actions: { marginTop: 4, gap: 8 },
});
