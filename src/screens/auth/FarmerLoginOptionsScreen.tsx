import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage, loginBiometricToken } from '../../api/authApi';
import { LoginOptionCard } from '../../components/auth/LoginOptionCard';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { APP_VARIANT } from '../../config/env';
import { useTranslation } from '../../i18n/I18nContext';
import type { RootStackParamList } from '../../navigation/types';
import { getBiometricLoginEnabled } from '../../storage/biometricPreference';
import { getMpinProfile } from '../../storage/authStorage';
import { colors, spacing } from '../../theme';
import { authenticateWithBiometrics, getOrCreateDeviceUuid } from '../../utils/biometricLogin';
import { finishMobileLogin } from '../../utils/finishMobileLogin';

type Props = NativeStackScreenProps<RootStackParamList, 'FarmerLoginOptions'>;

export function FarmerLoginOptionsScreen({ navigation }: Props) {
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
      Alert.alert(t('farmerLogin.biometricOption'), t('farmerLogin.biometricUnavailable'));
      return;
    }

    setBiometricLoading(true);

    try {
      const profile = await getMpinProfile();

      if (!profile?.mobile) {
        Alert.alert(t('farmerLogin.biometricOption'), t('farmerLogin.biometricUnavailable'));
        return;
      }

      const authenticated = await authenticateWithBiometrics(t('farmerLogin.biometricOption'));

      if (!authenticated) {
        Alert.alert(t('errors.biometricFailed'));
        return;
      }

      const deviceUuid = await getOrCreateDeviceUuid();
      const result = await loginBiometricToken({
        mobile: profile.mobile,
        device_uuid: deviceUuid,
      });

      const loggedIn = await finishMobileLogin(
        navigation,
        { token: result.token, user: result.user, expectedRole: 'farmer' },
        {
          roleMismatch: t('mpinLogin.roleMismatch'),
          unsupportedAccount: t('errors.unsupportedAccount'),
          farmerProfileMissingTitle: t('farmerLogin.profileMissingTitle'),
          farmerProfileMissingMessage: t('farmerLogin.profileMissingMessage'),
        },
      );

      if (!loggedIn) {
        return;
      }
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
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </Pressable>

        <View style={styles.header}>
          <BhuguardLogo size={LOGO_SIZES.login} />
          <Text style={styles.title}>{t('farmerLogin.title')}</Text>
          <Text style={styles.subtitle}>{t('farmerLogin.subtitle')}</Text>
        </View>

        <View style={styles.list}>
          <LoginOptionCard
            icon="person"
            title={t('farmerLogin.passwordOption')}
            description={t('farmerLogin.passwordDescription')}
            onPress={() => navigation.navigate('PasswordLogin', { role: 'farmer' })}
          />
          <LoginOptionCard
            icon="lock"
            title={t('farmerLogin.mpinOption')}
            description={t('farmerLogin.mpinDescription')}
            onPress={() => navigation.navigate('MpinLogin', { role: 'farmer' })}
          />
          <LoginOptionCard
            icon="description"
            title={t('farmerLogin.otpOption')}
            description={t('farmerLogin.otpDescription')}
            onPress={() => navigation.navigate('FarmerOtpLogin')}
          />
          <LoginOptionCard
            icon="verified"
            title={t('farmerLogin.biometricOption')}
            description={
              biometricReady ? t('farmerLogin.biometricDescription') : t('farmerLogin.biometricUnavailable')
            }
            onPress={() => void handleBiometricLogin()}
            disabled={biometricLoading}
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{t('farmerLogin.noRegistration')}</Text>
        </View>

        <Pressable onPress={() => navigation.navigate('MpinLogin', { role: 'farmer' })}>
          <Text style={styles.link}>{t('farmerLogin.forgotMpin')}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>{t('farmerLogin.contactSupport')}</Text>
        </Pressable>
        {__DEV__ || APP_VARIANT !== 'production' ? (
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
  infoBox: {
    borderRadius: 14,
    backgroundColor: '#E8F5ED',
    padding: 14,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#3F5F4C',
    textAlign: 'center',
  },
  link: {
    textAlign: 'center',
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
