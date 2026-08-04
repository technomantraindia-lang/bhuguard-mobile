import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage, loginBiometricToken } from '../../api/authApi';
import { LoginOptionCard } from '../../components/auth/LoginOptionCard';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { useTranslation } from '../../i18n/I18nContext';
import type { RootStackParamList } from '../../navigation/types';
import { getBiometricLoginEnabled } from '../../storage/biometricPreference';
import { getMpinProfile } from '../../storage/authStorage';
import { colors, spacing } from '../../theme';
import { authenticateWithBiometrics, getOrCreateDeviceUuid } from '../../utils/biometricLogin';
import { finishMobileLogin } from '../../utils/finishMobileLogin';
import { useEffect, useState } from 'react';

type Props = NativeStackScreenProps<RootStackParamList, 'FieldOfficerLogin'>;

export function FieldOfficerLoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const [profile, enabled] = await Promise.all([getMpinProfile(), getBiometricLoginEnabled()]);
      setBiometricReady(Boolean(profile?.mobile) && enabled);
    })();
  }, []);

  const handleBiometricLogin = async () => {
    if (!biometricReady) {
      Alert.alert(t('fieldOfficerLogin.biometricOption'), t('farmerLogin.biometricUnavailable'));
      return;
    }

    setBiometricLoading(true);

    try {
      const profile = await getMpinProfile();

      if (!profile?.mobile) {
        Alert.alert(t('fieldOfficerLogin.biometricOption'), t('farmerLogin.biometricUnavailable'));
        return;
      }

      const authenticated = await authenticateWithBiometrics(t('fieldOfficerLogin.biometricOption'));

      if (!authenticated) {
        Alert.alert(t('errors.biometricFailed'));
        return;
      }

      const deviceUuid = await getOrCreateDeviceUuid();
      const result = await loginBiometricToken({
        mobile: profile.mobile,
        device_uuid: deviceUuid,
      });

      await finishMobileLogin(
        navigation,
        { token: result.token, user: result.user, expectedRole: 'field_officer' },
        {
          roleMismatch: t('mpinLogin.roleMismatch'),
          unsupportedAccount: t('errors.unsupportedAccount'),
          farmerProfileMissingTitle: t('farmerLogin.profileMissingTitle'),
          farmerProfileMissingMessage: t('farmerLogin.profileMissingMessage'),
        },
      );
    } catch (error) {
      Alert.alert(t('errors.loginFailed'), getApiErrorMessage(error, t('errors.biometricDevice')));
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.navigate('RoleSelection')} style={styles.backButton}>
          <Text style={styles.backText}>← {t('fieldOfficerLogin.changeRole')}</Text>
        </Pressable>

        <View style={styles.header}>
          <BhuguardLogo size={LOGO_SIZES.login} />
          <Text style={styles.title}>{t('fieldOfficerLogin.title')}</Text>
          <Text style={styles.subtitle}>{t('fieldOfficerLogin.subtitle')}</Text>
        </View>

        <View style={styles.list}>
          <LoginOptionCard
            icon="person"
            title={t('fieldOfficerLogin.passwordOption')}
            description={t('passwordLogin.subtitle')}
            onPress={() => navigation.navigate('PasswordLogin', { role: 'field_officer' })}
          />
          <LoginOptionCard
            icon="lock"
            title={t('fieldOfficerLogin.mpinOption')}
            description={t('mpinLogin.instruction')}
            onPress={() => navigation.navigate('MpinLogin', { role: 'field_officer' })}
          />
          <LoginOptionCard
            icon="verified"
            title={t('fieldOfficerLogin.biometricOption')}
            description={
              biometricReady ? t('farmerLogin.biometricDescription') : t('farmerLogin.biometricUnavailable')
            }
            onPress={() => void handleBiometricLogin()}
            disabled={biometricLoading}
          />
        </View>

        <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>{t('passwordLogin.forgotPassword')}</Text>
        </Pressable>
        {__DEV__ ? (
          <Pressable onPress={() => navigation.navigate('ApiServerSettings')}>
            <Text style={styles.link}>{t('apiServer.openSettings')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6FAF4',
  },
  container: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
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
  },
  title: {
    fontSize: 26,
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
  list: {
    gap: 12,
  },
  link: {
    textAlign: 'center',
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
