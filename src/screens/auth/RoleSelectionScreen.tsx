import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RoleListCard } from '../../components/auth/RoleListCard';
import { RoleSelectionBackground } from '../../components/auth/RoleSelectionBackground';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { useTranslation } from '../../i18n/I18nContext';
import type { RootStackParamList } from '../../navigation/types';
import { getApiBaseUrl, testApiConnection } from '../../storage/apiConfigStorage';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelection'>;

export function RoleSelectionScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [serverOffline, setServerOffline] = useState(false);

  useEffect(() => {
    void (async () => {
      const url = await getApiBaseUrl();

      if (!url) {
        setServerOffline(true);
        return;
      }

      const result = await testApiConnection(url);
      setServerOffline(!result.ok);
    })();
  }, []);

  return (
    <View style={styles.root}>
      <RoleSelectionBackground />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <BhuguardLogo size={LOGO_SIZES.roleSelection} />
          </View>
          <Text style={styles.title}>{t('role.title')}</Text>
          <Text style={styles.subtitle}>{t('role.subtitle')}</Text>

          {serverOffline ? (
            <Pressable
              style={styles.serverBanner}
              onPress={() => navigation.navigate('ApiServerSettings')}
            >
              <Text style={styles.serverBannerTitle}>{t('apiServer.offlineTitle')}</Text>
              <Text style={styles.serverBannerText}>{t('apiServer.offlineHint')}</Text>
            </Pressable>
          ) : null}

          <View style={styles.list}>
            <RoleListCard
              role="farmer"
              title={t('role.farmerTitle')}
              description={t('role.farmerDescription')}
              buttonLabel={t('role.farmerButton')}
              onPress={() => navigation.navigate('FarmerLoginOptions')}
            />
            <RoleListCard
              role="field_officer"
              title={t('role.fieldOfficerTitle')}
              description={t('role.fieldOfficerDescription')}
              buttonLabel={t('role.fieldOfficerButton')}
              onPress={() => navigation.navigate('FieldOfficerLogin')}
            />
          </View>

          <View style={styles.infoBanner}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoIconText}>i</Text>
            </View>
            <Text style={styles.infoText}>{t('role.farmerRegistrationNote')}</Text>
          </View>

          <Pressable onPress={() => navigation.navigate('LanguageSelection')}>
            <Text style={styles.languageLink}>{t('language.settingsTitle')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('ApiServerSettings')}>
            <Text style={styles.languageLink}>{t('apiServer.openSettings')}</Text>
          </Pressable>
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
    gap: spacing.lg,
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
  },
  list: {
    gap: 14,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#E8F5ED',
    borderRadius: 14,
    padding: 14,
  },
  infoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoIconText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#3F5F4C',
  },
  languageLink: {
    textAlign: 'center',
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  serverBanner: {
    backgroundColor: '#FFF4E5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F5C26B',
    gap: 4,
  },
  serverBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A6700',
  },
  serverBannerText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#7A5A00',
  },
});
