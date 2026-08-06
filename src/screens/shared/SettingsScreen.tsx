import { Alert, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { LanguageCardList } from '../../components/auth/LanguageCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAppUpdate } from '../../context/AppUpdateContext';
import { useTranslation } from '../../i18n/I18nContext';
import type { AppLanguage } from '../../i18n/types';
import { useLogout } from '../../hooks/useLogout';
import { navigateToApiHealthCheck } from '../../navigation/navigationRef';
import { colors } from '../../theme/colors';

interface SettingsScreenProps {
  title: string;
  subtitle?: string;
}

export function SettingsScreen({ title, subtitle }: SettingsScreenProps) {
  const logout = useLogout();
  const { t, language, setLanguage } = useTranslation();
  const { state: updateState, enabled: updatesEnabled, checkForUpdates } = useAppUpdate();
  const configVersion = Constants.expoConfig?.version ?? 'Unknown';
  const runtimeVersion = Updates.runtimeVersion ?? 'Unknown';
  const updateChannel = Updates.channel ?? 'Unknown';

  const languageOptions: Array<{ language: AppLanguage; title: string; glyph: string }> = [
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

  const handleLanguageChange = async (nextLanguage: AppLanguage) => {
    if (nextLanguage === language) {
      return;
    }

    await setLanguage(nextLanguage);
    Alert.alert(t('language.changed'), t('language.changedMessage'));
  };

  const handleManualUpdateCheck = async () => {
    const next = await checkForUpdates('manual');
    if (next.status === 'failed' && next.message) {
      Alert.alert('Update check', next.message);
    }
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

        <AppCard title="App Version" subtitle="Installed update configuration" />
        <View style={styles.versionBlock}>
          <AppCard title={`Installed version: ${configVersion}`} />
          <AppCard title={`Runtime version: ${runtimeVersion}`} />
          <AppCard title={`Update channel: ${updateChannel}`} />
          <AppCard title={`Update status: ${updateState.message ?? updateState.status}`} />
          <AppButton
            label={updateState.status === 'checking' ? 'Checking for updates…' : 'Check for updates'}
            onPress={() => void handleManualUpdateCheck()}
            loading={updateState.status === 'checking'}
            disabled={!updatesEnabled}
          />
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
  versionBlock: { gap: 8 },
});
