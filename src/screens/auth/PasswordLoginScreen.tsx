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

import { getApiErrorMessage, login } from '../../api/authApi';
import { AuthField } from '../../components/auth/AuthField';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { getDemoLoginForRole, type AppLoginRole } from '../../config/authRoles';
import { useTranslation } from '../../i18n/I18nContext';
import type { RootStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { finishMobileLogin } from '../../utils/finishMobileLogin';

type Props = NativeStackScreenProps<RootStackParamList, 'PasswordLogin'>;

function LockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={10} width={14} height={10} rx={2} stroke="#9CA3AF" strokeWidth={1.8} />
      <Path d="M8 10V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V10" stroke="#9CA3AF" strokeWidth={1.8} />
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={2} stroke="#9CA3AF" strokeWidth={1.8} />
      <Path d="M3 7L12 13L21 7" stroke="#9CA3AF" strokeWidth={1.8} strokeLinecap="round" />
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

function getTitleKey(role: AppLoginRole): string {
  if (role === 'farmer') {
    return 'passwordLogin.farmerTitle';
  }

  if (role === 'artisan') {
    return 'passwordLogin.artisanTitle';
  }

  if (role === 'artisan_pro') {
    return 'passwordLogin.artisanProTitle';
  }

  return 'passwordLogin.fieldOfficerTitle';
}

function getBackRoute(
  role: AppLoginRole,
): 'FarmerLoginOptions' | 'FieldOfficerLogin' | 'ArtisanLogin' | 'ArtisanProLogin' {
  if (role === 'farmer') {
    return 'FarmerLoginOptions';
  }

  if (role === 'artisan') {
    return 'ArtisanLogin';
  }

  if (role === 'artisan_pro') {
    return 'ArtisanProLogin';
  }

  return 'FieldOfficerLogin';
}

export function PasswordLoginScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginPlaceholder = useMemo(() => getDemoLoginForRole(role), [role]);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setErrorMessage(t('errors.invalidCredentials'));
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const loginId = username.trim();
      const isEmail = loginId.includes('@');
      const { token, user } = await login({
        ...(isEmail ? { email: loginId } : { mobile: loginId }),
        password,
      });

      await finishMobileLogin(
        navigation,
        { token, user, expectedRole: role },
        {
          roleMismatch: t('mpinLogin.roleMismatch'),
          unsupportedAccount: t('errors.unsupportedAccount'),
          farmerProfileMissingTitle: t('farmerLogin.profileMissingTitle'),
          farmerProfileMissingMessage: t('farmerLogin.profileMissingMessage'),
        },
        setErrorMessage,
      );
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('errors.loginFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => navigation.navigate(getBackRoute(role))} style={styles.backButton}>
            <Text style={styles.backText}>← {t('common.back')}</Text>
          </Pressable>

          <View style={styles.header}>
            <BhuguardLogo size={LOGO_SIZES.login} />
            <Text style={styles.title}>{t(getTitleKey(role))}</Text>
            <Text style={styles.subtitle}>{t('passwordLogin.subtitle')}</Text>
          </View>

          <AuthField
            label={t('passwordLogin.usernameLabel')}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
            placeholder={loginPlaceholder}
            editable={!loading}
            leftIcon={<MailIcon />}
          />

          <View style={styles.passwordHeader}>
            <Text style={styles.passwordLabel}>{t('passwordLogin.passwordLabel')}</Text>
            <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotLink}>{t('passwordLogin.forgotPassword')}</Text>
            </Pressable>
          </View>

          <AuthField
            label=""
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            placeholder={t('passwordLogin.passwordPlaceholder')}
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
            onPress={() => void handleLogin()}
            disabled={loading}
          >
            <Text style={styles.signInText}>
              {loading ? t('passwordLogin.signingIn') : t('passwordLogin.signIn')}
            </Text>
          </Pressable>

          {role === 'farmer' ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{t('farmerLogin.noRegistration')}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6FAF4',
  },
  flex: { flex: 1 },
  container: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
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
    marginBottom: spacing.sm,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    borderRadius: 14,
    backgroundColor: '#E8F5ED',
    padding: 14,
    marginTop: spacing.sm,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#3F5F4C',
    textAlign: 'center',
  },
});
