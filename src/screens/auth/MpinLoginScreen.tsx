import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage, loginMpin, requestForgotMpinOtp } from '../../api/authApi';
import { MpinKeypad } from '../../components/auth/MpinKeypad';
import { MpinPinInput } from '../../components/auth/MpinPinInput';
import type { RootStackParamList } from '../../navigation/types';
import { getMpinProfile, saveAuthSession } from '../../storage/authStorage';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MpinLogin'>;

const MPIN_LENGTH = 6;

function getDashboardRoute(userType: string): keyof RootStackParamList | null {
  switch (userType) {
    case 'farmer':
      return 'FarmerApp';
    case 'company_user':
      return 'CompanyApp';
    case 'field_officer':
      return 'FieldOfficerApp';
    default:
      return null;
  }
}

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

  const canSignIn = mpin.length === MPIN_LENGTH && mobile.trim().length === 10 && !loading;

  const avatarInitials = useMemo(() => getInitials(displayName || 'Bhuguard User'), [displayName]);

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
      const dashboardRoute = getDashboardRoute(result.user_type);

      if (!dashboardRoute) {
        setError(`Unsupported role: ${result.user_type}`);
        return;
      }

      await saveAuthSession(result.token, result.user, result.user_type);
      navigation.reset({ index: 0, routes: [{ name: dashboardRoute }] });
    } catch (err) {
      setError(getApiErrorMessage(err, 'MPIN login failed.'));
      setMpin('');
    } finally {
      setLoading(false);
    }
  };

  const forgotMpin = async () => {
    if (!/^\d{10}$/.test(mobile.trim())) {
      Alert.alert('Mobile required', 'Sign in with password first, then reset MPIN from this screen.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await requestForgotMpinOtp(mobile.trim());
      navigation.navigate('OtpVerification', { mobile: mobile.trim(), purpose: 'forgot_mpin' });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send MPIN reset OTP.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>←</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.profileWrap}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarInitials}</Text>
            </View>
          </View>
          <Text style={styles.welcome}>Welcome Back</Text>
          <Text style={styles.name}>{displayName || 'Bhuguard User'}</Text>
        </View>

        <Text style={styles.instruction}>Enter your 6-digit MPIN</Text>
        <MpinPinInput value={mpin} length={MPIN_LENGTH} />

        <Pressable onPress={forgotMpin} disabled={loading}>
          <Text style={styles.forgotLink}>Forgot MPIN?</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!mobile ? (
          <Text style={styles.helperText}>Sign in with password once to enable MPIN login for this device.</Text>
        ) : null}

        <MpinKeypad
          onDigit={appendDigit}
          onBackspace={removeDigit}
          onBiometric={() => Alert.alert('Coming soon', 'Biometric MPIN unlock will be available in a future update.')}
          disabled={loading}
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.signInButton, canSignIn ? styles.signInButtonActive : styles.signInButtonDisabled]}
          onPress={signIn}
          disabled={!canSignIn}
        >
          <Text style={styles.signInText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
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
    fontSize: 24,
    color: colors.text,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    gap: 18,
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
