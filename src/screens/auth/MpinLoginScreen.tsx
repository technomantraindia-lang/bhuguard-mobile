import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage, loginBiometricToken, loginMpin, requestForgotMpinOtp } from '../../api/authApi';
import { MpinKeypad } from '../../components/auth/MpinKeypad';
import { MpinPinInput } from '../../components/auth/MpinPinInput';
import { useTranslation } from '../../i18n/I18nContext';
import type { RootStackParamList } from '../../navigation/types';
import { getBiometricLoginEnabled } from '../../storage/biometricPreference';
import { getMpinProfile } from '../../storage/authStorage';
import { colors, spacing } from '../../theme';
import { authenticateWithBiometrics, getOrCreateDeviceUuid } from '../../utils/biometricLogin';
import { finishMobileLogin } from '../../utils/finishMobileLogin';

type Props = NativeStackScreenProps<RootStackParamList, 'MpinLogin'>;

const MPIN_LENGTH = 6;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'BG';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function MpinLoginScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const selectedRole = route.params?.role;
  const [mobile, setMobile] = useState(route.params?.mobile ?? '');
  const [displayName, setDisplayName] = useState(route.params?.name ?? '');
  const [mpin, setMpin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricReady, setBiometricReady] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const [profile, biometricEnabled] = await Promise.all([getMpinProfile(), getBiometricLoginEnabled()]);

      if (profile) {
        if (!mobile) {
          setMobile(profile.mobile);
        }

        if (!displayName) {
          setDisplayName(profile.name);
        }
      }

      setBiometricReady(Boolean(profile?.mobile) && biometricEnabled);
    };

    void loadProfile();
  }, [displayName, mobile]);

  const canSignIn =
    mpin.length === MPIN_LENGTH && /^\d{10}$/.test(mobile.trim()) && !loading;

  const avatarInitials = useMemo(() => getInitials(displayName || t('brand.name')), [displayName, t]);

  const appendDigit = (digit: string) => {
    if (loading || mpin.length >= MPIN_LENGTH) {
      return;
    }

    setError(null);
    setMpin((current) => `${current}${digit}`.slice(0, MPIN_LENGTH));
  };

  const removeDigit = () => {
    if (loading) {
      return;
    }

    setError(null);
    setMpin((current) => current.slice(0, -1));
  };

  const signIn = async () => {
    if (!canSignIn) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await loginMpin(mobile.trim(), mpin);

      await finishMobileLogin(
        navigation,
        { token: result.token, user: result.user, expectedRole: selectedRole },
        {
          roleMismatch: t('mpinLogin.roleMismatch'),
          unsupportedAccount: t('errors.unsupportedAccount'),
          farmerProfileMissingTitle: t('farmerLogin.profileMissingTitle'),
          farmerProfileMissingMessage: t('farmerLogin.profileMissingMessage'),
        },
        setError,
      );
    } catch (err) {
      setError(getApiErrorMessage(err, t('errors.invalidMpin')));
      setMpin('');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricReady) {
      Alert.alert(t('farmerLogin.biometricOption'), t('farmerLogin.biometricUnavailable'));
      return;
    }

    setLoading(true);
    setError(null);

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

      await finishMobileLogin(
        navigation,
        { token: result.token, user: result.user, expectedRole: selectedRole },
        {
          roleMismatch: t('mpinLogin.roleMismatch'),
          unsupportedAccount: t('errors.unsupportedAccount'),
          farmerProfileMissingTitle: t('farmerLogin.profileMissingTitle'),
          farmerProfileMissingMessage: t('farmerLogin.profileMissingMessage'),
        },
        setError,
      );
    } catch (err) {
      setError(getApiErrorMessage(err, t('errors.biometricDevice')));
    } finally {
      setLoading(false);
    }
  };

  const forgotMpin = async () => {
    if (!/^\d{10}$/.test(mobile.trim())) {
      Alert.alert(t('errors.mobileRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await requestForgotMpinOtp(mobile.trim());
      navigation.navigate('OtpVerification', {
        mobile: mobile.trim(),
        purpose: 'forgot_mpin',
        flowOrigin: 'auth',
      });
    } catch (err) {
      setError(getApiErrorMessage(err, t('errors.loginFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>← {t('common.back')}</Text>
      </Pressable>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.profileWrap}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarInitials}</Text>
              </View>
            </View>
            <Text style={styles.welcome}>{t('mpinLogin.welcome')}</Text>
            <Text style={styles.name}>{displayName || t('brand.name')}</Text>
          </View>

          <Text style={styles.label}>{t('mpinLogin.mobileLabel')}</Text>
          <TextInput
            value={mobile}
            onChangeText={(value) => setMobile(value.replace(/\D/g, '').slice(0, 10))}
            keyboardType="number-pad"
            maxLength={10}
            style={styles.mobileInput}
            placeholder="9876543210"
            returnKeyType="done"
          />

          <Text style={styles.instruction}>{t('mpinLogin.instruction')}</Text>
          <MpinPinInput value={mpin} length={MPIN_LENGTH} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {!mobile ? <Text style={styles.helperText}>{t('mpinLogin.enableHint')}</Text> : null}
        </ScrollView>

        <View style={styles.bottomPanel}>
          <MpinKeypad
            compact
            onDigit={appendDigit}
            onBackspace={removeDigit}
            onBiometric={() => void handleBiometricLogin()}
            showBiometric={biometricReady}
            disabled={loading}
          />

          <Pressable
            style={[styles.signInButton, canSignIn ? styles.signInButtonActive : styles.signInButtonDisabled]}
            onPress={() => void signIn()}
            disabled={!canSignIn}
          >
            <Text style={styles.signInText}>{loading ? t('mpinLogin.signingIn') : t('mpinLogin.signIn')}</Text>
          </Pressable>

          <Pressable onPress={() => void forgotMpin()} disabled={loading} style={styles.forgotWrap}>
            <Text style={styles.forgotLink}>{t('mpinLogin.forgotMpin')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4FAF6',
  },
  flex: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  backIcon: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 12,
    flexGrow: 1,
  },
  bottomPanel: {
    flexShrink: 0,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2EDE6',
    backgroundColor: '#F4FAF6',
  },
  profileWrap: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DDF3E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  name: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  mobileInput: {
    borderWidth: 1,
    borderColor: '#D8E8D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  instruction: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  forgotWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  forgotLink: {
    textAlign: 'center',
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    textAlign: 'center',
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  helperText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 12,
  },
  signInButton: {
    minHeight: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonActive: {
    backgroundColor: colors.primary,
  },
  signInButtonDisabled: {
    backgroundColor: '#A8C9B6',
  },
  signInText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
