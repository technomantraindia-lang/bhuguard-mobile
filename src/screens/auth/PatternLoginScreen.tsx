import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  PatternLockedError,
  PatternUnsupportedError,
  verifyPattern,
} from '../../api/patternApi';
import { getApiErrorMessage, loginBiometricToken, requestForgotMpinOtp } from '../../api/authApi';
import {
  clearTrustedLoginSelection,
  getValidatedColdStartUser,
  markUnlockCompleted,
  maskMobileNumber,
  routeAfterAuthenticatedUnlock,
  setAuthStartupPhase,
} from '../../auth/startup/AuthStartupController';
import { AuthFlowBackground } from '../../components/auth/AuthFlowBackground';
import { PatternLockPad } from '../../components/auth/pattern/PatternLockPad';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { LOGO_SIZES } from '../../constants/branding';
import { useTranslation } from '../../i18n/I18nContext';
import { safeAuthGoBack } from '../../navigation/safeAuthBack';
import { safeNavigationReset } from '../../navigation/safeNavigationReset';
import type { RootStackParamList } from '../../navigation/types';
import { getBiometricLoginEnabled } from '../../storage/biometricPreference';
import { getAuthUser, getMpinProfile } from '../../storage/authStorage';
import { authBrand } from '../../theme/authBrand';
import { spacing } from '../../theme';
import { resolveUserRole } from '../../utils/authRole';
import {
  authenticateWithBiometrics,
  getOrCreateDeviceUuid,
  isBiometricHardwareAvailable,
} from '../../utils/biometricLogin';
import { finishMobileLogin } from '../../utils/finishMobileLogin';
import { getRoleDisplayName } from '../../utils/roleDisplay';

type Props = NativeStackScreenProps<RootStackParamList, 'PatternLogin'>;

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

function roleDisplayLabel(
  role: string | undefined,
  t: (key: string, params?: Record<string, string>) => string,
): string {
  switch (role) {
    case 'farmer':
      return t('role.farmerTitle');
    case 'field_officer':
      return t('role.fieldOfficerTitle');
    case 'artisan':
      return t('role.artisanTitle') || getRoleDisplayName('artisan');
    default:
      return getRoleDisplayName(role);
  }
}

export function PatternLoginScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const selectedRole = route.params?.role;
  const unlockMode = route.params?.mode === 'unlock';
  const [mobile, setMobile] = useState(route.params?.mobile ?? '');
  const [displayName, setDisplayName] = useState(route.params?.name ?? '');
  const [displayRole, setDisplayRole] = useState<string | undefined>(selectedRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricUnavailableHint, setBiometricUnavailableHint] = useState(false);
  const lockRef = useRef(false);
  const forgotLockRef = useRef(false);
  const padKey = useRef(0);
  const mountedRef = useRef(true);
  const autoBiometricPrompted = useRef(false);
  const [, force] = useState(0);

  const remountPad = () => {
    padKey.current += 1;
    force((n) => n + 1);
  };

  const avatarInitials = useMemo(() => getInitials(displayName || 'Bhuguard'), [displayName]);
  const maskedMobile = useMemo(() => maskMobileNumber(mobile), [mobile]);
  const roleLabel = useMemo(
    () => roleDisplayLabel(displayRole ?? selectedRole, t),
    [displayRole, selectedRole, t],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleBack = useCallback(() => {
    if (loading) {
      return;
    }

    safeAuthGoBack(navigation);
  }, [loading, navigation]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });

    return () => subscription.remove();
  }, [handleBack]);

  const completeUnlockToDashboard = useCallback(async () => {
    const user = getValidatedColdStartUser() ?? (await getAuthUser());

    if (!user) {
      setError(t('errors.loginFailed'));
      return;
    }

    markUnlockCompleted();
    setAuthStartupPhase('authenticated');
    const next = await routeAfterAuthenticatedUnlock(user);
    const routeEntry =
      'params' in next && next.params
        ? { name: next.name as keyof RootStackParamList, params: next.params }
        : { name: next.name as keyof RootStackParamList };
    safeNavigationReset(navigation, {
      index: 0,
      routes: [routeEntry],
    });
  }, [navigation, t]);

  const handleBiometricLogin = useCallback(async () => {
    if (lockRef.current || loading) {
      return;
    }

    if (!biometricReady) {
      setBiometricUnavailableHint(true);
      setError(t('farmerLogin.biometricUnavailable'));
      return;
    }

    lockRef.current = true;
    setLoading(true);
    setError(null);
    setBiometricUnavailableHint(false);

    try {
      const authenticated = await authenticateWithBiometrics(t('pattern.useFingerprint'));

      if (!authenticated) {
        // Cancel / failure stays on Pattern screen.
        return;
      }

      if (unlockMode && getValidatedColdStartUser()) {
        await completeUnlockToDashboard();
        return;
      }

      const profile = await getMpinProfile();
      const loginMobile = profile?.mobile || mobile;

      if (!loginMobile) {
        setError(t('farmerLogin.biometricUnavailable'));
        return;
      }

      const deviceUuid = await getOrCreateDeviceUuid();
      const result = await loginBiometricToken({
        mobile: loginMobile,
        device_uuid: deviceUuid,
      });

      await finishMobileLogin(
        navigation,
        { token: result.token, user: result.user, expectedRole: selectedRole, continueSetupChain: false },
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
      lockRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    biometricReady,
    completeUnlockToDashboard,
    loading,
    mobile,
    navigation,
    selectedRole,
    t,
    unlockMode,
  ]);

  useEffect(() => {
    const loadProfile = async () => {
      const [profile, biometricEnabled, hardwareOk, authUser] = await Promise.all([
        getMpinProfile(),
        getBiometricLoginEnabled(),
        isBiometricHardwareAvailable(),
        getAuthUser(),
      ]);

      const coldUser = getValidatedColdStartUser() ?? authUser;

      if (!mountedRef.current) {
        return;
      }

      if (profile) {
        if (!mobile) {
          setMobile(profile.mobile);
        }
        if (!displayName) {
          setDisplayName(profile.name);
        }
      }

      if (coldUser) {
        if (!displayName && coldUser.name) {
          setDisplayName(coldUser.name);
        }
        if (!mobile && coldUser.mobile) {
          setMobile(String(coldUser.mobile).replace(/\D/g, '').slice(-10));
        }
        const role = resolveUserRole(coldUser) ?? coldUser.user_type;
        if (role) {
          setDisplayRole(String(role));
        }
      }

      const ready = Boolean(mobile || profile?.mobile || unlockMode) && biometricEnabled && hardwareOk;
      setBiometricReady(ready);
      setBiometricUnavailableHint(!hardwareOk || !biometricEnabled);

      if (unlockMode && ready && !autoBiometricPrompted.current) {
        autoBiometricPrompted.current = true;
        void handleBiometricLogin();
      }
    };

    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockMode, mobile]);

  const onComplete = useCallback(
    async (sequence: string) => {
      if (lockRef.current || loading || !mobile) {
        return;
      }

      lockRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await verifyPattern(mobile, sequence);

        if (unlockMode) {
          setAuthStartupPhase('authenticated');
          const next = await routeAfterAuthenticatedUnlock(result.user);
          const routeEntry =
            'params' in next && next.params
              ? { name: next.name as keyof RootStackParamList, params: next.params }
              : { name: next.name as keyof RootStackParamList };
          safeNavigationReset(navigation, {
            index: 0,
            routes: [routeEntry],
          });
          return;
        }

        await finishMobileLogin(
          navigation,
          {
            token: result.token,
            user: result.user,
            expectedRole: selectedRole,
            continueSetupChain: false,
          },
          {
            roleMismatch: t('mpinLogin.roleMismatch'),
            unsupportedAccount: t('errors.unsupportedAccount'),
            farmerProfileMissingTitle: t('farmerLogin.profileMissingTitle'),
            farmerProfileMissingMessage: t('farmerLogin.profileMissingMessage'),
          },
          setError,
        );
      } catch (err) {
        if (err instanceof PatternUnsupportedError) {
          setError(t('pattern.unsupported'));
        } else if (err instanceof PatternLockedError) {
          setError(err.message || t('pattern.locked'));
        } else {
          setError(err instanceof Error ? err.message : t('pattern.incorrect'));
        }
        remountPad();
      } finally {
        lockRef.current = false;
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [loading, mobile, navigation, selectedRole, t, unlockMode],
  );

  const onForgotPattern = useCallback(async () => {
    if (forgotLockRef.current || loading || !mobile) {
      return;
    }

    forgotLockRef.current = true;
    setLoading(true);
    setError(null);

    try {
      await requestForgotMpinOtp(mobile);
      setAuthStartupPhase('otp_verification');
      navigation.navigate('OtpVerification', {
        mobile,
        purpose: 'forgot_pattern',
        flowOrigin: 'auth',
      });
    } catch (err) {
      setError(getApiErrorMessage(err, t('errors.loginFailed')));
    } finally {
      forgotLockRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loading, mobile, navigation, t]);

  const loginWithAnotherMobile = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      await clearTrustedLoginSelection();
      safeNavigationReset(navigation, { index: 0, routes: [{ name: 'MobileLogin' }] });
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const changeLanguage = () => {
    safeNavigationReset(navigation, { index: 0, routes: [{ name: 'LanguageSelection' }] });
  };

  return (
    <View style={styles.root}>
      <AuthFlowBackground overlayOpacity={0.48} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={handleBack} hitSlop={8}>
            <Text style={styles.backIcon}>← {t('common.back')}</Text>
          </Pressable>
          <Pressable style={styles.languageLink} onPress={changeLanguage} disabled={loading} hitSlop={8}>
            <Text style={styles.languageLinkText}>{t('mpinLogin.changeLanguage')}</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEnabled={false}
        >
          <View style={styles.card}>
            <View style={styles.logoWrap}>
              <BhuguardLogo size={LOGO_SIZES.moduleHeader} />
            </View>

            <View style={styles.profileWrap}>
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{avatarInitials}</Text>
                </View>
              </View>
              <Text style={styles.welcome}>{t('mpinLogin.welcome')}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {displayName || t('brand.name')}
              </Text>
              <View style={styles.metaBlock}>
                <Text style={styles.metaLine} numberOfLines={1}>
                  {t('mpinLogin.maskedMobileLabel')}: {maskedMobile || '—'}
                </Text>
                <Text style={styles.metaLine} numberOfLines={1}>
                  {t('mpinLogin.roleLabel')}: {roleLabel}
                </Text>
              </View>
            </View>

            <Text style={styles.title}>{t('pattern.drawYourPattern')}</Text>
            <Text style={styles.subtitle}>{t('pattern.useSavedPattern')}</Text>

            <View style={styles.patternWrap}>
              <PatternLockPad
                key={padKey.current}
                disabled={loading}
                errorText={error}
                onComplete={(sequence) => {
                  void onComplete(sequence);
                }}
                onCleared={() => setError(null)}
                onTooShort={() => setError(t('pattern.tooShort'))}
              />
            </View>

            {loading ? <ActivityIndicator color={authBrand.primary} style={styles.loader} /> : null}

            {biometricReady ? (
              <Pressable
                style={styles.biometricButton}
                onPress={() => void handleBiometricLogin()}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={t('pattern.useFingerprint')}
              >
                <View style={styles.biometricCircle}>
                  <BhuguardMaterialIcon name="fingerprint" size={28} color="#FFFFFF" filled />
                </View>
                <Text style={styles.biometricLabel}>{t('pattern.useFingerprint')}</Text>
              </Pressable>
            ) : biometricUnavailableHint ? (
              <Text style={styles.biometricHint}>{t('pattern.biometricUnavailable')}</Text>
            ) : null}

            <Pressable
              style={styles.linkWrap}
              disabled={loading}
              onPress={() => {
                void onForgotPattern();
              }}
              accessibilityRole="link"
              accessibilityLabel={t('pattern.forgot')}
            >
              <Text style={styles.linkText}>{t('pattern.forgot')}</Text>
            </Pressable>

            <Pressable
              style={styles.linkWrap}
              disabled={loading}
              onPress={() => {
                void loginWithAnotherMobile();
              }}
            >
              <Text style={styles.anotherMobileLink}>{t('mpinLogin.loginAnotherMobile')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#06291D',
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: 12,
  },
  backButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  languageLink: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  languageLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  logoWrap: {
    alignItems: 'center',
  },
  profileWrap: {
    alignItems: 'center',
    gap: 4,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: authBrand.primary,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: authBrand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  welcome: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(11,46,31,0.65)',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B2E1F',
  },
  metaBlock: {
    alignItems: 'center',
    gap: 2,
  },
  metaLine: {
    fontSize: 13,
    color: 'rgba(11,46,31,0.7)',
    fontWeight: '600',
  },
  title: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
    color: '#0B2E1F',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(11,46,31,0.65)',
    textAlign: 'center',
    marginBottom: 4,
  },
  patternWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
  },
  loader: {
    marginTop: 4,
  },
  biometricButton: {
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingVertical: 4,
  },
  biometricCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: authBrand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: authBrand.primary,
  },
  biometricHint: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(11,46,31,0.55)',
    paddingHorizontal: 8,
  },
  linkWrap: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  linkText: {
    color: authBrand.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  anotherMobileLink: {
    color: 'rgba(11,46,31,0.7)',
    fontWeight: '600',
    fontSize: 13,
  },
});
