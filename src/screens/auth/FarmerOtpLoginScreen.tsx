import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage, requestLoginOtp } from '../../api/authApi';
import { AuthField } from '../../components/auth/AuthField';
import { KeyboardAwareScreen } from '../../components/layout/KeyboardAwareScreen';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { useTranslation } from '../../i18n/I18nContext';
import type { RootStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FarmerOtpLogin'>;

export function FarmerOtpLoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const cleaned = mobile.replace(/\D/g, '').slice(-10);

    if (!/^\d{10}$/.test(cleaned)) {
      Alert.alert(t('errors.mobileRequired'));
      return;
    }

    setLoading(true);

    try {
      const otpResponse = await requestLoginOtp(cleaned);
      navigation.navigate('OtpVerification', {
        mobile: cleaned,
        requestId: typeof otpResponse?.request_id === 'string' ? otpResponse.request_id : undefined,
        devOtp: typeof otpResponse?.dev_otp === 'string' ? otpResponse.dev_otp : undefined,
        purpose: 'login',
        role: 'farmer',
        flowOrigin: 'auth',
      });
    } catch (error) {
      Alert.alert(t('errors.loginFailed'), getApiErrorMessage(error, t('errors.loginFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScreen edges={['top', 'bottom']} backgroundColor="#F6FAF4" contentContainerStyle={styles.container}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← {t('common.back')}</Text>
      </Pressable>

      <View style={styles.header}>
        <BhuguardLogo size={LOGO_SIZES.login} />
        <Text style={styles.title}>{t('otpLogin.title')}</Text>
        <Text style={styles.subtitle}>{t('otpLogin.subtitle')}</Text>
      </View>

      <AuthField
        label={t('otpLogin.mobileLabel')}
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
        placeholder="9876543210"
        editable={!loading}
      />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => void handleSendOtp()}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? t('otpLogin.sendingOtp') : t('otpLogin.sendOtp')}</Text>
      </Pressable>
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
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
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
