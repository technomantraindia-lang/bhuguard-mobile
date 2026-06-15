import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path, Rect } from 'react-native-svg';

import { getApiErrorMessage, loginPassword } from '../../api/authApi';
import { AuthField } from '../../components/auth/AuthField';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { BRAND_NAME, LOGO_SIZES } from '../../constants/branding';
import { getDemoLoginForRole, getRoleTitle, type AppLoginRole } from '../../config/authRoles';
import type { RootStackParamList } from '../../navigation/types';
import { saveAuthSession } from '../../storage/authStorage';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

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

function validateLogin(login: string, password: string): string | null {
  if (!login.trim()) {
    return 'Please enter mobile number or email.';
  }

  if (!password) {
    return 'Please enter password.';
  }

  const isMobile = /^\d{10}$/.test(login.trim());

  if (/^\d+$/.test(login.trim()) && !isMobile) {
    return 'Mobile number must be exactly 10 digits.';
  }

  return null;
}

function getRoleTitleFromLogin(role: AppLoginRole): string {
  return getRoleTitle(role);
}

function MailIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={2} stroke="#9CA3AF" strokeWidth={1.8} />
      <Path d="M3 7L12 13L21 7" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={10} width={14} height={10} rx={2} stroke="#9CA3AF" strokeWidth={1.8} />
      <Path d="M8 10V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V10" stroke="#9CA3AF" strokeWidth={1.8} />
    </Svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M3 12C5.5 7.5 8.5 5 12 5C15.5 5 18.5 7.5 21 12" stroke="#9CA3AF" strokeWidth={1.8} />
        <Path d="M3 12C5.5 16.5 8.5 19 12 19C15.5 19 18.5 16.5 21 12" stroke="#9CA3AF" strokeWidth={1.8} />
        <Path d="M9 12C9 13.7 10.3 15 12 15C13.7 15 15 13.7 15 12" stroke="#9CA3AF" strokeWidth={1.8} />
      </Svg>
    );
  }

  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12C5.5 7.5 8.5 5 12 5C15.5 5 18.5 7.5 21 12" stroke="#9CA3AF" strokeWidth={1.8} />
      <Path d="M4 4L20 20" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function LoginScreen({ navigation, route }: Props) {
  const selectedRole = route.params?.role ?? 'farmer';
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginPlaceholder = useMemo(() => getDemoLoginForRole(selectedRole), [selectedRole]);

  const handleSubmit = async () => {
    const validationError = validateLogin(login, password);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await loginPassword(login.trim(), password);

      if (result.user_type !== selectedRole) {
        setErrorMessage('Selected role does not match this account. Please go back and choose the correct role.');
        return;
      }

      const dashboardRoute = getDashboardRoute(result.user_type);

      if (!dashboardRoute) {
        setErrorMessage(`Unsupported role: ${result.user_type}`);
        return;
      }

      await saveAuthSession(result.token, result.user, result.user_type);

      navigation.reset({
        index: 0,
        routes: [{ name: dashboardRoute }],
      });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Change role</Text>
          </Pressable>

          <View style={styles.header}>
            <BhuguardLogo size={LOGO_SIZES.login} />
            <Text style={styles.welcome}>Welcome to {BRAND_NAME}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{getRoleTitleFromLogin(selectedRole)}</Text>
            </View>
          </View>

          <View style={styles.form}>
            <AuthField
              label="Username or Email"
              value={login}
              onChangeText={setLogin}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder={loginPlaceholder}
              editable={!loading}
              leftIcon={<MailIcon />}
            />

            <View style={styles.passwordHeader}>
              <Text style={styles.passwordLabel}>Password</Text>
              <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotLink}>Forgot Password?</Text>
              </Pressable>
            </View>
            <AuthField
              label=""
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              placeholder="Enter password"
              editable={!loading}
              leftIcon={<LockIcon />}
              rightAccessory={
                <Pressable onPress={() => setPasswordVisible((value) => !value)} hitSlop={8}>
                  <EyeIcon visible={passwordVisible} />
                </Pressable>
              }
            />

            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

            <Pressable
              style={[styles.signInButton, loading && styles.signInButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.signInText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
              {!loading ? <Text style={styles.signInArrow}>→</Text> : null}
            </Pressable>
          </View>

          <View style={styles.infoBox}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoIconText}>i</Text>
            </View>
            <Text style={styles.infoText}>
              Farmer onboarding is completed by an authorized{' '}
              <Text style={styles.infoStrong}>Field Officer</Text>. Please contact your local project lead for access.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.version}>v2.4.1 Secure Node</Text>
            <View style={styles.footerIcons}>
              <Text style={styles.footerIcon}>🛡</Text>
              <Text style={styles.footerIcon}>☁</Text>
            </View>
          </View>

          <View style={styles.altLinks}>
            <Pressable
              onPress={() =>
                navigation.navigate('MpinLogin', {
                  mobile: /^\d{10}$/.test(login.trim()) ? login.trim() : undefined,
                })
              }
            >
              <Text style={styles.altLink}>Sign in with MPIN</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('OtpLogin')}>
              <Text style={styles.altLink}>Sign in with OTP</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6FAF4',
  },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  backText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  welcome: {
    marginTop: spacing.md,
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  rolePill: {
    marginTop: spacing.md,
    backgroundColor: colors.softGreen,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#CFE8D8',
  },
  rolePillText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  form: {
    gap: spacing.md,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  passwordLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  forgotLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  signInButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  signInArrow: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  infoBox: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: '#FAFDFB',
  },
  infoIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  infoStrong: {
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  version: {
    fontSize: 12,
    color: colors.textMuted,
  },
  footerIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  footerIcon: {
    fontSize: 14,
    color: colors.textMuted,
  },
  altLinks: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  altLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
