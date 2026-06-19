import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage, loginMpin, requestForgotMpinOtp } from '../../api/authApi';
import { MpinKeypad } from '../../components/auth/MpinKeypad';
import { MpinPinInput } from '../../components/auth/MpinPinInput';
import { useTranslation } from '../../i18n/I18nContext';
import type { RootStackParamList } from '../../navigation/types';
import { getMpinProfile, saveAuthSession } from '../../storage/authStorage';
import { colors, spacing } from '../../theme';
import { getDashboardRoute, isMobileSupportedRole } from '../../utils/authRouting';

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

  useEffect(() => {
    const loadProfile = async () => {
      if (mobile && displayName) {
        return;
      }

      const profile = await getMpinProfile();

      if (!profile) {
        return;
      }

      if (!mobile) {
        setMobile(profile.mobile);
      }

      if (!displayName) {
        setDisplayName(profile.name);
      }
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

      if (!isMobileSupportedRole(result.user_type)) {
        setError(t('errors.unsupportedAccount'));
        return;
      }

      if (selectedRole && result.user_type !== selectedRole) {
        setError(t('mpinLogin.roleMismatch'));
        return;
      }

      if (result.user_type === 'farmer' && !result.user.farmer_profile?.id) {
        Alert.alert(t('farmerLogin.profileMissingTitle'), t('farmerLogin.profileMissingMessage'));
        return;
      }

      const dashboardRoute = getDashboardRoute(result.user_type);

      if (!dashboardRoute) {
        setError(t('errors.unsupportedAccount'));
        return;
      }

      await saveAuthSession(result.token, result.user, result.user_type);
      navigation.reset({ index: 0, routes: [{ name: dashboardRoute }] });
    } catch (err) {
      setError(getApiErrorMessage(err, t('errors.invalidMpin')));
      setMpin('');
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
    <SafeAreaView style={styles.safe}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>← {t('common.back')}</Text>
      </Pressable>

      <View style={styles.content}>
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
        />

        <Text style={styles.instruction}>{t('mpinLogin.instruction')}</Text>
        <MpinPinInput value={mpin} length={MPIN_LENGTH} />

        <Pressable onPress={() => void forgotMpin()} disabled={loading}>
          <Text style={styles.forgotLink}>{t('mpinLogin.forgotMpin')}</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!mobile ? <Text style={styles.helperText}>{t('mpinLogin.enableHint')}</Text> : null}

        <MpinKeypad onDigit={appendDigit} onBackspace={removeDigit} disabled={loading} />
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.signInButton, canSignIn ? styles.signInButtonActive : styles.signInButtonDisabled]}
          onPress={() => void signIn()}
          disabled={!canSignIn}
        >
          <Text style={styles.signInText}>{loading ? t('mpinLogin.signingIn') : t('mpinLogin.signIn')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4FAF6',
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    gap: 14,
  },
  profileWrap: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 6,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#DDF3E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  welcome: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  name: {
    fontSize: 18,
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
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
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
