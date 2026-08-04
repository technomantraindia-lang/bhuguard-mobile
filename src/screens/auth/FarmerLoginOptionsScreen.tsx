import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage, loginBiometricToken, requestForgotMpinOtp } from '../../api/authApi';
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

type Props = NativeStackScreenProps<RootStackParamList, 'FarmerLoginOptions'>;

function normalizeMobile(value: string): string {
  return value.replace(/\D/g, '').slice(-10);
}

export function FarmerLoginOptionsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [patternMobile, setPatternMobile] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const [profile, enabled] = await Promise.all([getMpinProfile(), getBiometricLoginEnabled()]);
      setBiometricReady(Boolean(profile?.mobile) && enabled);
      if (profile?.mobile) {
        setPatternMobile(profile.mobile);
      }
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

  const handlePatternLogin = () => {
    const mobile = normalizeMobile(patternMobile);
    if (mobile.length < 10) {
      Alert.alert(t('farmerLogin.patternOption'), t('farmerLogin.patternMobileRequired'));
      return;
    }

    navigation.navigate('PatternLogin', { mobile, mode: 'login' });
  };

  const handleForgotPattern = async () => {
    const mobile = normalizeMobile(patternMobile);
    if (mobile.length < 10) {
      Alert.alert(t('pattern.forgot'), t('farmerLogin.patternMobileRequired'));
      return;
    }

    if (forgotLoading) {
      return;
    }

    setForgotLoading(true);
    try {
      await requestForgotMpinOtp(mobile);
      navigation.navigate('OtpVerification', {
        mobile,
        purpose: 'forgot_pattern',
        flowOrigin: 'auth',
      });
    } catch (error) {
      Alert.alert(t('errors.loginFailed'), getApiErrorMessage(error, t('errors.loginFailed')));
    } finally {
      setForgotLoading(false);
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
          <Text style={styles.label}>{t('farmerLogin.patternMobileLabel')}</Text>
          <TextInput
            style={styles.input}
            value={patternMobile}
            onChangeText={setPatternMobile}
            keyboardType="phone-pad"
            placeholder={t('farmerLogin.patternMobilePlaceholder')}
            placeholderTextColor={colors.textMuted}
            maxLength={15}
            autoCorrect={false}
          />
          <LoginOptionCard
            icon="lock"
            title={t('farmerLogin.patternOption')}
            description={t('farmerLogin.patternDescription')}
            onPress={handlePatternLogin}
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

        <Pressable disabled={forgotLoading} onPress={() => void handleForgotPattern()}>
          <Text style={styles.link}>{forgotLoading ? t('common.loading') : t('pattern.forgot')}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>{t('farmerLogin.contactSupport')}</Text>
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D7E5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#FFFFFF',
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
