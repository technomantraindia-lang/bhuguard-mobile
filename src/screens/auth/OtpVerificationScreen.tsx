import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  getApiErrorMessage,
  requestForgotMpinOtp,
  requestForgotPasswordOtp,
  verifyForgotMpinOtp,
  verifyForgotPasswordOtp,
} from '../../api/authApi';
import { AuthBackHeader } from '../../components/auth/AuthBackHeader';
import { PinBoxInput } from '../../components/auth/PinBoxInput';
import type { SecurityScreensParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { formatMobileDisplay } from '../../utils/securityFlow';

const RESEND_SECONDS = 45;

type Props = NativeStackScreenProps<SecurityScreensParamList, 'OtpVerification'>;

export function OtpVerificationScreen({ navigation, route }: Props) {
  const mobile = route.params?.mobile ?? '';
  const purpose = route.params?.purpose ?? 'forgot_password';
  const flowOrigin = route.params?.flowOrigin;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const verify = async () => {
    if (otp.trim().length !== 6) {
      setError('Enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (purpose === 'forgot_mpin') {
        await verifyForgotMpinOtp(mobile, otp.trim());
        navigation.navigate('CreateMpin', { mobile, flowOrigin });
      } else {
        await verifyForgotPasswordOtp(mobile, otp.trim());
        navigation.navigate('ResetPassword', { mobile, flowOrigin });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'OTP verification failed.'));
    } finally {
      setLoading(false);
    }
  };

  const resend = useCallback(async () => {
    if (secondsLeft > 0 || resendLoading) {
      return;
    }

    setResendLoading(true);
    setError(null);

    try {
      if (purpose === 'forgot_mpin') {
        await requestForgotMpinOtp(mobile);
      } else {
        await requestForgotPasswordOtp(mobile);
      }

      setSecondsLeft(RESEND_SECONDS);
      setOtp('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to resend OTP.'));
    } finally {
      setResendLoading(false);
    }
  }, [mobile, purpose, resendLoading, secondsLeft]);

  const timerLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AuthBackHeader />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{' '}
              <Text style={styles.mobile}>{formatMobileDisplay(mobile)}</Text>
            </Text>
          </View>

          <PinBoxInput
            label="One-time password"
            value={otp}
            onChange={setOtp}
            masked={false}
            autoFocus
            activeBorderColor="#2563EB"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.resendBlock}>
            {secondsLeft > 0 ? (
              <Text style={styles.timerText}>
                Resend code in <Text style={styles.timerValue}>{timerLabel}</Text>
              </Text>
            ) : (
              <Text style={styles.timerText}>You can resend the code now.</Text>
            )}
            <Pressable
              onPress={resend}
              disabled={secondsLeft > 0 || resendLoading}
              style={({ pressed }) => [styles.resendLink, pressed && styles.resendPressed]}
            >
              <Text style={[styles.resendText, secondsLeft > 0 && styles.resendDisabled]}>
                {resendLoading ? 'Sending…' : 'Resend Code'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
            onPress={verify}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Verifying…' : 'Verify & Proceed'}</Text>
          </Pressable>

          {flowOrigin !== 'profile' ? (
            <Pressable
              style={styles.changeMobile}
              onPress={() => navigation.navigate('ForgotPassword', { flowOrigin })}
            >
              <Text style={styles.changeMobileText}>Change Mobile Number</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingBottom: 24,
    gap: 24,
  },
  header: {
    marginTop: 8,
    gap: 10,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: dashboardTheme.onSurfaceVariant,
  },
  mobile: {
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  error: {
    fontSize: 13,
    color: dashboardTheme.error,
    marginTop: -8,
  },
  resendBlock: {
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 14,
    color: dashboardTheme.onSurfaceVariant,
  },
  timerValue: {
    fontWeight: '700',
    color: dashboardTheme.primary,
  },
  resendLink: {
    paddingVertical: 4,
  },
  resendPressed: {
    opacity: 0.85,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.primary,
  },
  resendDisabled: {
    opacity: 0.45,
  },
  button: {
    marginTop: 8,
    height: 52,
    borderRadius: 26,
    backgroundColor: dashboardTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  changeMobile: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  changeMobileText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.primary,
    textDecorationLine: 'underline',
  },
});
