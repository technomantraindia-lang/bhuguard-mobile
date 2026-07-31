import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { getApiErrorMessage, requestForgotPasswordOtp } from '../../api/authApi';
import { useTranslation } from '../../i18n/I18nContext';
import { AuthBackHeader } from '../../components/auth/AuthBackHeader';
import type { SecurityScreensParamList } from '../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Props = NativeStackScreenProps<SecurityScreensParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const initialMobile = route.params?.mobile ?? '';
  const flowOrigin = route.params?.flowOrigin;
  const [mobile, setMobile] = useState(initialMobile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lockedMobile = flowOrigin === 'profile' && initialMobile.length > 0;

  const sendOtp = async () => {
    const trimmed = mobile.replace(/\D/g, '').slice(-10);

    if (!/^\d{10}$/.test(trimmed)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await requestForgotPasswordOtp(trimmed);
      navigation.navigate('OtpVerification', {
        mobile: trimmed,
        purpose: 'forgot_password',
        flowOrigin,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send reset instructions.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.gradient}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <AuthBackHeader />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                Enter your registered email or mobile number to receive a reset link or OTP.
              </Text>
            </View>

            <View style={[styles.card, dashboardShadow]}>
              <Text style={styles.label}>Email / Mobile Number</Text>
              <View style={styles.inputWrap}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={styles.inputIcon}>
                  <Path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                    stroke={dashboardTheme.outline}
                    strokeWidth={1.6}
                  />
                  <Path d="M22 6l-10 7L2 6" stroke={dashboardTheme.outline} strokeWidth={1.6} />
                </Svg>
                <TextInput
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  placeholder="Enter your contact info"
                  placeholderTextColor={dashboardTheme.outline}
                  style={styles.input}
                  editable={!lockedMobile}
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
                onPress={sendOtp}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? 'Sending…' : 'Send Reset Instructions'}</Text>
              </Pressable>
            </View>

            <Pressable style={styles.helpRow} onPress={() => navigation.goBack()}>
              <View style={styles.helpIcon}>
                <Text style={styles.helpIconText}>?</Text>
              </View>
              <Text style={styles.helpText}>{t('common.contactHelp')}</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: '#E8FFEE',
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingBottom: 24,
  },
  header: {
    marginTop: 8,
    marginBottom: 28,
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
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: dashboardTheme.onSurface,
  },
  error: {
    fontSize: 13,
    color: dashboardTheme.error,
  },
  button: {
    marginTop: 4,
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
  helpRow: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  helpIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: dashboardTheme.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIconText: {
    fontSize: 13,
    fontWeight: '700',
    color: dashboardTheme.outline,
  },
  helpText: {
    fontSize: 14,
    color: dashboardTheme.onSurfaceVariant,
  },
});
