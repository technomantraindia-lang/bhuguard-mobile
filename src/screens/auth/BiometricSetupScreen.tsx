import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView as SafeAreaViewImport } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { enableDeviceBiometric, getApiErrorMessage } from '../../api/authApi';
import {
  getValidatedColdStartUser,
  markUnlockCompleted,
  routeAfterAuthenticatedUnlock,
} from '../../auth/startup/AuthStartupController';
import { AuthFlowBackground as AuthFlowBackgroundImport } from '../../components/auth/AuthFlowBackground';
import { GlassContinueButton as GlassContinueButtonImport } from '../../components/auth/login/GlassContinueButton';
import { LiquidGlassCard as LiquidGlassCardImport } from '../../components/auth/login/LiquidGlassCard';
import { BhuguardLogo as BhuguardLogoImport } from '../../components/shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { useTranslation } from '../../i18n/I18nContext';
import type { RootStackParamList } from '../../navigation/types';
import { safeNavigationReset } from '../../navigation/safeNavigationReset';
import { setBiometricLoginEnabled } from '../../storage/biometricPreference';
import { getAuthUser } from '../../storage/authStorage';
import { authBrand } from '../../theme/authBrand';
import {
  authenticateWithBiometrics,
  isBiometricHardwareAvailable,
  isNativeBiometricModuleAvailable,
} from '../../utils/biometricLogin';
import { getDashboardRoute, isMobileSupportedRole } from '../../utils/authRouting';
import { resolveUserRole } from '../../utils/authRole';

type Props = NativeStackScreenProps<RootStackParamList, 'BiometricSetup'>;

type CardProps = { children: ReactNode; style?: object };
type LogoProps = { size: number };
type ContinueProps = {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

const AuthFlowBackground: ComponentType<{ overlayOpacity?: number }> | undefined =
  typeof AuthFlowBackgroundImport === 'function' ? AuthFlowBackgroundImport : undefined;

const GlassContinueButton: ComponentType<ContinueProps> | undefined =
  typeof GlassContinueButtonImport === 'function' ? GlassContinueButtonImport : undefined;

const LiquidGlassCard: ComponentType<CardProps> | undefined =
  typeof LiquidGlassCardImport === 'function' ? LiquidGlassCardImport : undefined;

const BhuguardLogo: ComponentType<LogoProps> | undefined =
  typeof BhuguardLogoImport === 'function' ? BhuguardLogoImport : undefined;

const SafeAreaHost =
  typeof SafeAreaViewImport === 'function' || typeof SafeAreaViewImport === 'object'
    ? SafeAreaViewImport
    : View;

function FallbackCard({ children, style }: CardProps) {
  return <View style={[styles.fallbackCard, style]}>{children}</View>;
}

function FallbackContinueButton({ label, loading, disabled, onPress }: ContinueProps) {
  return (
    <Pressable
      style={[styles.fallbackPrimary, (disabled || loading) && styles.fallbackPrimaryDisabled]}
      disabled={disabled || loading}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.fallbackPrimaryText}>{label}</Text>
    </Pressable>
  );
}

export function BiometricSetupScreen({ navigation }: Props) {
  const { t, applyScopedLanguageForCurrentUser } = useTranslation();
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nativeModulePresent = isNativeBiometricModuleAvailable();

  useEffect(() => {
    if (!nativeModulePresent) {
      setAvailable(false);
      return;
    }

    void isBiometricHardwareAvailable()
      .then(setAvailable)
      .catch(() => setAvailable(false));
  }, [nativeModulePresent]);

  const goDashboard = async () => {
    try {
      const user = getValidatedColdStartUser() ?? (await getAuthUser());

      if (!user) {
        safeNavigationReset(navigation, { index: 0, routes: [{ name: 'MobileLogin' }] });
        return;
      }

      if (typeof applyScopedLanguageForCurrentUser === 'function') {
        await applyScopedLanguageForCurrentUser();
      }

      markUnlockCompleted();

      const role = resolveUserRole(user) ?? user.user_type;

      if (!isMobileSupportedRole(role)) {
        safeNavigationReset(navigation, { index: 0, routes: [{ name: 'MobileLogin' }] });
        return;
      }

      const unlockRoute = await routeAfterAuthenticatedUnlock(user);
      const route = getDashboardRoute(role) ?? unlockRoute.name;

      safeNavigationReset(navigation, {
        index: 0,
        routes: [{ name: route as keyof RootStackParamList }],
      });
    } catch (err) {
      setError(getApiErrorMessage(err, t('errors.biometricDevice')));
      safeNavigationReset(navigation, { index: 0, routes: [{ name: 'MobileLogin' }] });
    }
  };

  const enable = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!available) {
        setError(t('biometricSetup.unavailable'));
        return;
      }

      const ok = await authenticateWithBiometrics(t('biometricSetup.enable'));

      if (!ok) {
        setError(t('errors.biometricFailed'));
        return;
      }

      try {
        await enableDeviceBiometric();
      } catch {
        // Local preference still enables unlock; device registry is best-effort.
      }

      await setBiometricLoginEnabled(true);
      await goDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err, t('errors.biometricDevice')));
    } finally {
      setLoading(false);
    }
  };

  if (__DEV__) {
    console.log('[BIOMETRIC COMPONENT AUDIT]', {
      AuthFlowBackground,
      GlassContinueButton,
      LiquidGlassCard,
      BhuguardLogo,
      SafeAreaView: SafeAreaHost,
    });
  }

  const missingComponents = Object.entries({
    AuthFlowBackground,
    GlassContinueButton,
    LiquidGlassCard,
    BhuguardLogo,
    SafeAreaView: SafeAreaHost,
  }).filter(([, value]) => !value);

  if (__DEV__ && missingComponents.length > 0) {
    console.error(
      '[BIOMETRIC UNDEFINED COMPONENTS]',
      missingComponents.map(([name]) => name),
    );
  }

  const Card = LiquidGlassCard ?? FallbackCard;
  const ContinueButton = GlassContinueButton ?? FallbackContinueButton;
  const Background = AuthFlowBackground;

  return (
    <View style={styles.root}>
      {Background ? <Background /> : <View pointerEvents="none" style={styles.fallbackBackground} />}
      <SafeAreaHost style={styles.safe}>
        <View style={styles.content}>
          <Card>
            <View style={styles.logoWrap}>
              {BhuguardLogo ? (
                <BhuguardLogo size={LOGO_SIZES.roleSelection} />
              ) : (
                <Text style={styles.fallbackBrand}>Bhuguard</Text>
              )}
            </View>
            <Text style={styles.title}>{t('biometricSetup.title')}</Text>
            <Text style={styles.subtitle}>{t('biometricSetup.subtitle')}</Text>
            {!nativeModulePresent || !available ? (
              <Text style={styles.hint}>{t('biometricSetup.unavailable')}</Text>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {nativeModulePresent && available ? (
              <ContinueButton
                label={loading ? t('common.loading') : t('biometricSetup.enable')}
                loading={loading}
                disabled={loading}
                onPress={() => void enable()}
              />
            ) : null}

            <Pressable style={styles.secondary} disabled={loading} onPress={() => void goDashboard()}>
              <Text style={styles.secondaryText}>
                {!nativeModulePresent || !available ? t('common.continue') : t('biometricSetup.skip')}
              </Text>
            </Pressable>
          </Card>
        </View>
      </SafeAreaHost>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: authBrand.tertiary },
  safe: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: authBrand.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: authBrand.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    color: authBrand.textMuted,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: authBrand.error,
    textAlign: 'center',
    fontWeight: '600',
  },
  secondary: {
    marginTop: 4,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(11, 46, 31, 0.18)',
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: authBrand.primary,
    fontWeight: '800',
    fontSize: 15,
  },
  fallbackBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#03150D',
  },
  fallbackCard: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 22,
    gap: 12,
  },
  fallbackBrand: {
    fontSize: 22,
    fontWeight: '800',
    color: authBrand.primary,
  },
  fallbackPrimary: {
    marginTop: 8,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#0B2E1F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  fallbackPrimaryDisabled: {
    backgroundColor: '#E4EBE6',
  },
  fallbackPrimaryText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
