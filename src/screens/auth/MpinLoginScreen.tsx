import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Dimensions,
  InteractionManager,
  Keyboard,
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
import {
  clearTrustedLoginSelection,
  getValidatedColdStartUser,
  markUnlockCompleted,
  maskMobileNumber,
  setAuthStartupPhase,
} from '../../auth/startup/AuthStartupController';
import { AuthFlowBackground } from '../../components/auth/AuthFlowBackground';
import { MpinKeypad } from '../../components/auth/MpinKeypad';
import { MpinPinInput } from '../../components/auth/MpinPinInput';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { useKeyboardOverlapInset } from '../../hooks/useKeyboardOverlapInset';
import { LOGO_SIZES } from '../../constants/branding';
import { useTranslation } from '../../i18n/I18nContext';
import { safeAuthGoBack } from '../../navigation/safeAuthBack';
import { safeNavigationReset } from '../../navigation/safeNavigationReset';
import type { RootStackParamList } from '../../navigation/types';
import { getBiometricLoginEnabled } from '../../storage/biometricPreference';
import { getAuthUser, getMpinProfile } from '../../storage/authStorage';
import {
  clearMpinLockout,
  formatLockoutRemaining,
  getMpinLockoutStatus,
  recordFailedMpinAttempt,
} from '../../storage/mpinLockoutStorage';
import { authBrand } from '../../theme/authBrand';
import { spacing } from '../../theme';
import { resolveUserRole } from '../../utils/authRole';
import { getDashboardRoute } from '../../utils/authRouting';
import { authenticateWithBiometrics, getOrCreateDeviceUuid } from '../../utils/biometricLogin';
import { finishMobileLogin } from '../../utils/finishMobileLogin';
import { getRoleDisplayName } from '../../utils/roleDisplay';

type Props = NativeStackScreenProps<RootStackParamList, 'MpinLogin'>;

const MPIN_LENGTH = 6;
const USE_COMPACT_KEYPAD = Dimensions.get('window').height < 700;

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

export function MpinLoginScreen({ navigation, route }: Props) {
  const { t, applyScopedLanguageForCurrentUser } = useTranslation();
  const keyboardOverlap = useKeyboardOverlapInset();
  const selectedRole = route.params?.role;
  const unlockMode = route.params?.mode === 'unlock';
  const [mobile, setMobile] = useState(route.params?.mobile ?? '');
  const [displayName, setDisplayName] = useState(route.params?.name ?? '');
  const [displayRole, setDisplayRole] = useState<string | undefined>(selectedRole);
  const [mpin, setMpin] = useState('');
  const [keypadVisible, setKeypadVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricReady, setBiometricReady] = useState(false);
  const [failedBiometricAttempts, setFailedBiometricAttempts] = useState(0);
  const [lockoutRemainingMs, setLockoutRemainingMs] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const autoBiometricPrompted = useRef(false);
  const submitInFlight = useRef(false);
  const mountedRef = useRef(true);

  const isLockedOut = lockoutRemainingMs > 0;

  const refreshLockout = useCallback(async (mobileValue: string) => {
    if (!/^\d{10}$/.test(mobileValue.trim())) {
      setLockoutRemainingMs(0);
      setAttemptsRemaining(null);
      return;
    }

    const status = await getMpinLockoutStatus(mobileValue.trim());

    if (!mountedRef.current) {
      return;
    }

    setLockoutRemainingMs(status.locked ? status.remainingMs : 0);
    setAttemptsRemaining(status.locked ? 0 : status.remainingAttempts);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void refreshLockout(mobile);
  }, [mobile, refreshLockout]);

  useEffect(() => {
    if (lockoutRemainingMs <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setLockoutRemainingMs((current) => {
        const next = Math.max(0, current - 1000);
        if (next === 0) {
          void refreshLockout(mobile);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutRemainingMs, mobile, refreshLockout]);

  const handleBack = useCallback(() => {
    if (unlockMode) {
      safeNavigationReset(navigation, { index: 0, routes: [{ name: 'LanguageSelection' }] });
      return;
    }

    safeAuthGoBack(navigation, 'MobileLogin');
  }, [navigation, unlockMode]);

  useEffect(() => {
    if (keypadVisible) {
      Keyboard.dismiss();
    }
  }, [keypadVisible]);

  useEffect(() => {
    if (unlockMode) {
      setKeypadVisible(true);
      Keyboard.dismiss();
    }
  }, [unlockMode]);

  const completeUnlockToDashboard = useCallback(async () => {
    const user = getValidatedColdStartUser() ?? (await getAuthUser());

    if (!user) {
      safeNavigationReset(navigation, { index: 0, routes: [{ name: 'MobileLogin' }] });
      return;
    }

    await applyScopedLanguageForCurrentUser();
    markUnlockCompleted();
    setAuthStartupPhase('authenticated');
    const role = resolveUserRole(user) ?? user.user_type;
    const routeName = getDashboardRoute(role) ?? 'MobileLogin';
    safeNavigationReset(navigation, { index: 0, routes: [{ name: routeName }] });
  }, [applyScopedLanguageForCurrentUser, navigation]);

  const canSignIn =
    mpin.length === MPIN_LENGTH
    && /^\d{10}$/.test(mobile.trim())
    && !loading
    && !isLockedOut;

  const avatarInitials = useMemo(() => getInitials(displayName || t('brand.name')), [displayName, t]);
  const maskedMobile = useMemo(() => maskMobileNumber(mobile), [mobile]);
  const roleLabel = useMemo(() => roleDisplayLabel(displayRole, t), [displayRole, t]);

  const submitMpin = useCallback(
    async (pin: string) => {
      const normalizedMobile = mobile.trim();

      if (
        submitInFlight.current
        || loading
        || pin.length !== MPIN_LENGTH
        || !/^\d{10}$/.test(normalizedMobile)
      ) {
        return;
      }

      const lockout = await getMpinLockoutStatus(normalizedMobile);
      if (lockout.locked) {
        if (mountedRef.current) {
          setLockoutRemainingMs(lockout.remainingMs);
          setError(
            t('mpinLogin.lockedOut', { time: formatLockoutRemaining(lockout.remainingMs) }),
          );
          setMpin('');
        }
        return;
      }

      submitInFlight.current = true;
      setLoading(true);
      setError(null);
      setKeypadVisible(false);

      try {
        const result = await loginMpin(normalizedMobile, pin);
        await clearMpinLockout(normalizedMobile);

        const loggedIn = await finishMobileLogin(
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

        if (!loggedIn) {
          submitInFlight.current = false;
        }
      } catch (err) {
        const status = await recordFailedMpinAttempt(normalizedMobile);

        if (mountedRef.current) {
          if (status.locked) {
            setLockoutRemainingMs(status.remainingMs);
            setAttemptsRemaining(0);
            setError(
              t('mpinLogin.lockedOut', { time: formatLockoutRemaining(status.remainingMs) }),
            );
          } else {
            setAttemptsRemaining(status.remainingAttempts);
            setError(getApiErrorMessage(err, t('errors.invalidMpin')));
          }
          setMpin('');
        }
        submitInFlight.current = false;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [loading, mobile, navigation, selectedRole, t],
  );

  const scheduleAutoSubmit = useCallback(
    (pin: string) => {
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          void submitMpin(pin);
        });
      });
    },
    [submitMpin],
  );

  const appendDigit = useCallback(
    (digit: string) => {
      if (loading || isLockedOut || mpin.length >= MPIN_LENGTH) {
        return;
      }

      setKeypadVisible(true);
      setError(null);
      setMpin((current) => {
        const next = `${current}${digit}`.slice(0, MPIN_LENGTH);

        if (next.length === MPIN_LENGTH && !submitInFlight.current) {
          scheduleAutoSubmit(next);
        }

        return next;
      });
    },
    [isLockedOut, loading, mpin.length, scheduleAutoSubmit],
  );

  const removeDigit = useCallback(() => {
    if (loading || isLockedOut) {
      return;
    }

    setError(null);
    submitInFlight.current = false;
    setMpin((current) => current.slice(0, -1));
  }, [isLockedOut, loading]);

  const signIn = useCallback(async () => {
    await submitMpin(mpin);
  }, [mpin, submitMpin]);

  const handleBiometricLogin = useCallback(async () => {
    if (isLockedOut) {
      setError(
        t('mpinLogin.lockedOut', { time: formatLockoutRemaining(lockoutRemainingMs) }),
      );
      return;
    }

    if (failedBiometricAttempts >= 3) {
      setError(t('errors.biometricFailed'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const biometricEnabled = await getBiometricLoginEnabled();

      if (!biometricEnabled) {
        if (!unlockMode) {
          Alert.alert(t('farmerLogin.biometricOption'), t('farmerLogin.biometricUnavailable'));
        }
        return;
      }

      const authenticated = await authenticateWithBiometrics(t('farmerLogin.biometricOption'));

      if (!authenticated) {
        setFailedBiometricAttempts((count) => count + 1);
        setError(t('errors.biometricFailed'));
        return;
      }

      if (unlockMode && getValidatedColdStartUser()) {
        await clearMpinLockout(mobile.trim());
        await completeUnlockToDashboard();
        return;
      }

      const profile = await getMpinProfile();

      if (!profile?.mobile) {
        Alert.alert(t('farmerLogin.biometricOption'), t('farmerLogin.biometricUnavailable'));
        return;
      }

      const deviceUuid = await getOrCreateDeviceUuid();
      const result = await loginBiometricToken({
        mobile: profile.mobile,
        device_uuid: deviceUuid,
      });

      await clearMpinLockout(profile.mobile);

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
      setFailedBiometricAttempts((count) => count + 1);
      setError(getApiErrorMessage(err, t('errors.biometricDevice')));
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    completeUnlockToDashboard,
    failedBiometricAttempts,
    isLockedOut,
    lockoutRemainingMs,
    mobile,
    navigation,
    selectedRole,
    t,
    unlockMode,
  ]);

  useEffect(() => {
    const loadProfile = async () => {
      const [profile, biometricEnabled, authUser] = await Promise.all([
        getMpinProfile(),
        getBiometricLoginEnabled(),
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

      const ready = Boolean(profile?.mobile || unlockMode) && biometricEnabled;
      setBiometricReady(ready);

      if (unlockMode && ready && !autoBiometricPrompted.current && !isLockedOut) {
        autoBiometricPrompted.current = true;
        void handleBiometricLogin();
      }
    };

    void loadProfile();
    // Intentionally once on mount for unlock auto-prompt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockMode]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });

    return () => subscription.remove();
  }, [handleBack]);

  const forgotMpin = async () => {
    if (!/^\d{10}$/.test(mobile.trim())) {
      Alert.alert(t('errors.mobileRequired'));
      return;
    }

    if (isLockedOut) {
      setError(
        t('mpinLogin.lockedOut', { time: formatLockoutRemaining(lockoutRemainingMs) }),
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await requestForgotMpinOtp(mobile.trim());
      setAuthStartupPhase('otp_verification');
      navigation.navigate('OtpVerification', {
        mobile: mobile.trim(),
        purpose: 'forgot_mpin',
        flowOrigin: 'auth',
      });
    } catch (err) {
      setError(getApiErrorMessage(err, t('errors.loginFailed')));
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const loginWithAnotherMobile = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      // Clears trusted token/user only — not drafts, evidence, language, or MPIN profile.
      await clearTrustedLoginSelection();
      safeNavigationReset(navigation, { index: 0, routes: [{ name: 'MobileLogin' }] });
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const changeLanguage = () => {
    // Keep trusted session; language screen re-routes after Continue.
    safeNavigationReset(navigation, { index: 0, routes: [{ name: 'LanguageSelection' }] });
  };

  const primaryLabel = loading
    ? unlockMode
      ? t('mpinLogin.signingIn')
      : t('mpinLogin.signingIn')
    : t('mpinLogin.signIn');

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

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: styles.scrollContent.paddingBottom + (Platform.OS === 'ios' ? 0 : keyboardOverlap) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
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

              {!unlockMode ? (
                <>
                  <Text style={styles.label}>{t('mpinLogin.mobileLabel')}</Text>
                  <TextInput
                    value={mobile}
                    onChangeText={(value) => setMobile(value.replace(/\D/g, '').slice(0, 10))}
                    keyboardType="number-pad"
                    maxLength={10}
                    style={styles.mobileInput}
                    placeholder="9876543210"
                    placeholderTextColor="rgba(11, 46, 31, 0.35)"
                    returnKeyType="done"
                    editable={!loading}
                    showSoftInputOnFocus={!keypadVisible}
                    onFocus={() => {
                      setKeypadVisible(false);
                    }}
                    onBlur={() => {
                      setKeypadVisible(true);
                      Keyboard.dismiss();
                    }}
                    onSubmitEditing={() => {
                      setKeypadVisible(true);
                      Keyboard.dismiss();
                    }}
                  />
                </>
              ) : null}

              <Text style={styles.instruction}>{t('mpinLogin.instruction')}</Text>
              <MpinPinInput
                value={mpin}
                length={MPIN_LENGTH}
                focused={keypadVisible}
                onPress={() => {
                  if (isLockedOut) {
                    setError(
                      t('mpinLogin.lockedOut', {
                        time: formatLockoutRemaining(lockoutRemainingMs),
                      }),
                    );
                    return;
                  }
                  setError(null);
                  setKeypadVisible(true);
                }}
              />

              {isLockedOut ? (
                <Text style={styles.error}>
                  {t('mpinLogin.lockedOut', {
                    time: formatLockoutRemaining(lockoutRemainingMs),
                  })}
                </Text>
              ) : null}

              {error && !isLockedOut ? <Text style={styles.error}>{error}</Text> : null}

              {!isLockedOut && attemptsRemaining != null && attemptsRemaining < 5 && attemptsRemaining > 0 ? (
                <Text style={styles.helperText}>
                  {t('mpinLogin.attemptsRemaining', { count: String(attemptsRemaining) })}
                </Text>
              ) : null}

              {!mobile && !unlockMode ? (
                <Text style={styles.helperText}>{t('mpinLogin.enableHint')}</Text>
              ) : null}

              <Pressable
                style={[
                  styles.signInButton,
                  canSignIn ? styles.signInButtonActive : styles.signInButtonDisabled,
                ]}
                onPress={() => void signIn()}
                disabled={!canSignIn}
              >
                <Text
                  style={[
                    styles.signInText,
                    canSignIn ? styles.signInTextActive : styles.signInTextDisabled,
                  ]}
                >
                  {primaryLabel}
                </Text>
              </Pressable>

              <Pressable onPress={() => void forgotMpin()} disabled={loading || isLockedOut} style={styles.forgotWrap}>
                <Text style={styles.forgotLink}>{t('mpinLogin.forgotMpin')}</Text>
              </Pressable>

              <Pressable
                onPress={() => void loginWithAnotherMobile()}
                disabled={loading}
                style={styles.forgotWrap}
              >
                <Text style={styles.anotherMobileLink}>{t('mpinLogin.loginAnotherMobile')}</Text>
              </Pressable>
            </View>
          </ScrollView>

          {keypadVisible ? (
            <View
              style={[
                styles.keypadPanel,
                Platform.OS === 'android' && keyboardOverlap > 0 ? { marginBottom: keyboardOverlap } : null,
              ]}
            >
              <MpinKeypad
                compact={USE_COMPACT_KEYPAD}
                onDigit={appendDigit}
                onBackspace={removeDigit}
                onBiometric={() => void handleBiometricLogin()}
                showBiometric={biometricReady && !isLockedOut}
                disabled={loading || isLockedOut}
              />
            </View>
          ) : null}
        </KeyboardAvoidingView>
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
    gap: 10,
  },
  logoWrap: {
    alignItems: 'center',
  },
  keypadPanel: {
    flexShrink: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
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
    backgroundColor: 'rgba(133, 201, 92, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: authBrand.tertiary,
  },
  welcome: {
    fontSize: 22,
    fontWeight: '800',
    color: authBrand.tertiary,
    marginTop: 2,
  },
  name: {
    fontSize: 15,
    color: authBrand.textMuted,
    fontWeight: '600',
  },
  metaBlock: {
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  metaLine: {
    fontSize: 12,
    fontWeight: '600',
    color: authBrand.tertiary,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: authBrand.tertiary,
  },
  mobileInput: {
    borderWidth: 1.5,
    borderColor: 'rgba(11, 46, 31, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    fontWeight: '600',
    color: authBrand.tertiary,
    backgroundColor: authBrand.white,
  },
  instruction: {
    textAlign: 'center',
    fontSize: 13,
    color: authBrand.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  forgotWrap: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  forgotLink: {
    textAlign: 'center',
    color: authBrand.tertiary,
    fontSize: 14,
    fontWeight: '700',
  },
  anotherMobileLink: {
    textAlign: 'center',
    color: authBrand.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  error: {
    textAlign: 'center',
    color: authBrand.error,
    fontSize: 13,
    lineHeight: 18,
  },
  helperText: {
    textAlign: 'center',
    color: authBrand.textMuted,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 8,
  },
  signInButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  signInButtonActive: {
    backgroundColor: authBrand.primary,
  },
  signInButtonDisabled: {
    backgroundColor: 'rgba(133, 201, 92, 0.35)',
  },
  signInText: {
    fontSize: 16,
    fontWeight: '800',
  },
  signInTextActive: {
    color: authBrand.onPrimary,
  },
  signInTextDisabled: {
    color: 'rgba(11, 46, 31, 0.55)',
  },
});
