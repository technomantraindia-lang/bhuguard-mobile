import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { APP_URL, API_BASE_URL } from '../../config/env';
import { useTranslation } from '../../i18n/I18nContext';
import type { RootStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ApiServerSettings'>;

export function ApiServerSettingsScreen({ navigation }: Props) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </Pressable>

        <View style={styles.header}>
          <BhuguardLogo size={LOGO_SIZES.login} />
          <Text style={styles.title}>{t('apiServer.title')}</Text>
          <Text style={styles.subtitle}>Read-only diagnostics</Text>
        </View>

        <View style={styles.helpBox}>
          <Text style={styles.helpText}>{t('apiServer.urlLabel')}: {APP_URL}</Text>
          <Text style={styles.helpText}>API: {API_BASE_URL}</Text>
          <Text style={styles.helpText}>Runtime server switching is disabled in this build.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6FAF4',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
  helpBox: {
    borderRadius: 14,
    backgroundColor: '#E8F5ED',
    padding: 14,
    gap: 6,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#3F5F4C',
  },
});
