import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage, resetPassword } from '../../api/authApi';
import { AuthBrandHeader } from '../../components/auth/AuthBrandHeader';
import { AuthPasswordField } from '../../components/auth/AuthPasswordField';
import { PasswordRequirementBanner } from '../../components/auth/PasswordRequirementBanner';
import { ResetPasswordHeroIcon } from '../../components/auth/ResetPasswordHeroIcon';
import type { SecurityScreensParamList } from '../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { finishSecurityFlow } from '../../utils/securityFlow';

type Props = NativeStackScreenProps<SecurityScreensParamList, 'ResetPassword'>;

function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export function ResetPasswordScreen({ navigation, route }: Props) {
  const mobile = route.params?.mobile ?? '';
  const flowOrigin = route.params?.flowOrigin;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!isStrongPassword(password)) {
      setError('Password must be at least 8 characters with a mix of letters and numbers.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetPassword(mobile, password);
      finishSecurityFlow(navigation, flowOrigin);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Password reset failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <AuthBrandHeader />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <ResetPasswordHeroIcon />

            <View style={styles.header}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>Create a strong new password to secure your account.</Text>
            </View>

            <View style={[styles.card, dashboardShadow]}>
              <AuthPasswordField
                label="New Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter new password"
              />
              <AuthPasswordField
                label="Confirm Password"
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Re-enter new password"
              />
            </View>

            <PasswordRequirementBanner />

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
              onPress={submit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Resetting…' : 'Reset Password'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
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
    paddingBottom: 16,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: dashboardTheme.onSurfaceVariant,
    textAlign: 'center',
  },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    padding: 20,
    gap: 18,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  error: {
    fontSize: 13,
    color: dashboardTheme.error,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingBottom: 16,
    paddingTop: 8,
  },
  button: {
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
});
