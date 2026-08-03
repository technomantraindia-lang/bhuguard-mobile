import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  getApiErrorMessage,
  requestForgotMpinOtp,
  requestForgotPasswordOtp,
  requestLoginOtp,
  verifyForgotMpinOtp,
  verifyForgotPasswordOtp,
  verifyLoginOtp,
} from '../../api/authApi';
import {
  maskMobileForOtpSubtitle,
  setAuthStartupPhase,
} from '../../auth/startup/AuthStartupController';
import { PinBoxInput } from '../../components/auth/PinBoxInput';
import { ChangeLanguagePill } from '../../components/auth/login/ChangeLanguagePill';
import { GlassBackButton } from '../../components/auth/login/GlassBackButton';
import { GlassCard } from '../../components/auth/login/GlassCard';
import { LoginBackground } from '../../components/auth/login/LoginBackground';
import { PrimaryButton } from '../../components/auth/login/PrimaryButton';
import { fadeUpIn } from '../../components/auth/login/Animations';
import { loginTheme } from '../../components/auth/login/Theme';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { useTranslation } from '../../i18n/I18nContext';
import type { AppLanguage } from '../../i18n/types';
import type { RootStackParamList } from '../../navigation/types';
import { saveDeviceLanguage } from '../../storage/languageStorage';
import { finishMobileLogin } from '../../utils/finishMobileLogin';

const RESEND_SECONDS = 45;
const OTP_LENGTH = 6;

type Props = NativeStackScreenProps<RootStackParamList, 'OtpVerification'>;

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function OtpVerificationScreen({ navigation, route }: Props) {
  const { t, language, setLanguage } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const width = useMemo(() => windowWidth, [windowWidth]);

  const mobile = route.params?.mobile ?? '';
  const purpose = route.params?.purpose ?? 'forgot_password';
  const role = route.params?.role;
  const flowOrigin = route.params?.flowOrigin;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendExpiresAt, setResendExpiresAt] = useState(() => Date.now() + RESEND_SECONDS * 1000);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslate = useRef(new Animated.Value(0)).current;
  const enterPlayed = useRef(false);
  const mountedRef = useRef(true);
  const verifyLock = useRef(false);
  const resendLock = useRef(false);
  const resendExpiresAtRef = useRef(resendExpiresAt);
  resendExpiresAtRef.current = resendExpiresAt;

  const cardWidth = useMemo(
    () => Math.min(420, Math.max(300, width * 0.9)),
    [width],
  );
  const logoSize = useMemo(
    () => Math.min(128, Math.max(104, Math.round(width * 0.26))),
    [width],
  );

  const maskedMobile = useMemo(() => maskMobileForOtpSubtitle(mobile), [mobile]);
  const secondsLeft = Math.max(0, Math.ceil((resendExpiresAt - nowTick) / 1000));
  const canResend = secondsLeft <= 0 && !resendLoading;
  const canVerify = otp.trim().length === OTP_LENGTH && !loading;
  const timerLabel = formatCountdown(secondsLeft);

  const mapOtpError = useCallback(
    (err: unknown): string => {
      const message = getApiErrorMessage(err, t('errors.loginFailed'));
      const normalized = message.toLowerCase();

      if (
        normalized.includes('expired')
        || normalized.includes('expire')
      ) {
        return t('otpLogin.expiredOtp');
      }

      if (
        normalized.includes('too many')
        || normalized.includes('rate')
        || normalized.includes('attempt')
      ) {
        return t('otpLogin.tooManyAttempts');
      }

      if (
        normalized.includes('network')
        || normalized.includes('unreachable')
        || normalized.includes('timeout')
        || normalized.includes('timed out')
        || normalized.includes('connection')
      ) {
        return t('otpLogin.networkError');
      }

      if (
        normalized.includes('server')
        || normalized.includes('500')
        || normalized.includes('503')
      ) {
        return t('otpLogin.serverError');
      }

      if (
        normalized.includes('invalid')
        || normalized.includes('incorrect')
        || normalized.includes('wrong')
        || normalized.includes('otp')
      ) {
        return t('otpLogin.invalidOtp');
      }

      return message;
    },
    [t],
  );

  useEffect(() => {
    mountedRef.current = true;
    setAuthStartupPhase('otp_verification');
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (enterPlayed.current) {
      return;
    }
    enterPlayed.current = true;
    cardOpacity.setValue(0);
    cardTranslate.setValue(20);
    const enter = fadeUpIn(cardOpacity, cardTranslate, { delay: 40, duration: 420 });
    enter.start();
    return () => {
      enter.stop();
    };
  }, [cardOpacity, cardTranslate]);

  // Single stable countdown driven by expiry timestamp — does not reset on language/rerender.
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const confirmGoBack = useCallback(() => {
    Alert.alert(
      t('otpLogin.changeMobileTitle'),
      t('otpLogin.changeMobileMessage'),
      [
        { text: t('otpLogin.stay'), style: 'cancel' },
        {
          text: t('otpLogin.goBack'),
          style: 'destructive',
          onPress: () => {
            verifyLock.current = false;
            resendLock.current = false;
            setAuthStartupPhase('mobile_login');
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MobileLogin');
            }
          },
        },
      ],
    );
  }, [navigation, t]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        confirmGoBack();
        return true;
      });

      return () => subscription.remove();
    }, [confirmGoBack]),
  );

  const openLanguage = useCallback(() => {
    // In-place language change only — do not open LanguageSelection (it resets the auth stack).
    const options: Array<{ language: AppLanguage; label: string }> = [
      { language: 'en', label: t('language.englishNative') },
      { language: 'hi', label: t('language.hindiNative') },
      { language: 'gu', label: t('language.gujaratiNative') },
    ];

    Alert.alert(
      t('mobileLogin.changeLanguage'),
      undefined,
      [
        ...options.map((option) => ({
          text: option.language === language ? `✓ ${option.label}` : option.label,
          onPress: () => {
            void (async () => {
              await setLanguage(option.language);
              await saveDeviceLanguage(option.language);
            })();
          },
        })),
        { text: t('otpLogin.stay'), style: 'cancel' as const },
      ],
    );
  }, [language, setLanguage, t]);

  const verify = useCallback(async () => {
    if (otp.trim().length !== OTP_LENGTH) {
      setError(t('errors.otpRequired'));
      return;
    }

    if (verifyLock.current || loading) {
      return;
    }

    verifyLock.current = true;
    setLoading(true);
    setError(null);

    try {
      if (purpose === 'login') {
        const result = await verifyLoginOtp(mobile, otp.trim());
        if (!mountedRef.current) {
          return;
        }
        await finishMobileLogin(
          navigation,
          {
            token: result.token,
            user: result.user,
            expectedRole: role,
            continueSetupChain: true,
          },
          {
            roleMismatch: t('mpinLogin.roleMismatch'),
            unsupportedAccount: t('errors.unsupportedAccount'),
            farmerProfileMissingTitle: t('farmerLogin.profileMissingTitle'),
            farmerProfileMissingMessage: t('farmerLogin.profileMissingMessage'),
          },
          setError,
        );
        return;
      }

      if (purpose === 'forgot_mpin') {
        await verifyForgotMpinOtp(mobile, otp.trim());
        if (!mountedRef.current) {
          return;
        }
        navigation.navigate('CreateMpin', { mobile, flowOrigin });
      } else if (purpose === 'forgot_pattern') {
        await verifyForgotMpinOtp(mobile, otp.trim());
        if (!mountedRef.current) {
          return;
        }
        navigation.navigate('SetPattern', { mobile, mode: 'reset' });
      } else {
        await verifyForgotPasswordOtp(mobile, otp.trim());
        if (!mountedRef.current) {
          return;
        }
        navigation.navigate('ResetPassword', { mobile, flowOrigin });
      }
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }
      const mapped = mapOtpError(err);
      setError(mapped);
      const normalized = mapped.toLowerCase();
      if (normalized.includes('invalid') || normalized.includes('expired')) {
        setOtp('');
      }
    } finally {
      verifyLock.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [flowOrigin, loading, mapOtpError, mobile, navigation, otp, purpose, role, t]);

  const resend = useCallback(async () => {
    if (resendExpiresAtRef.current > Date.now() || resendLock.current || resendLoading) {
      return;
    }

    resendLock.current = true;
    setResendLoading(true);
    setError(null);

    try {
      if (purpose === 'login') {
        await requestLoginOtp(mobile);
      } else if (purpose === 'forgot_mpin') {
        await requestForgotMpinOtp(mobile);
      } else {
        await requestForgotPasswordOtp(mobile);
      }

      if (!mountedRef.current) {
        return;
      }

      const nextExpiry = Date.now() + RESEND_SECONDS * 1000;
      setResendExpiresAt(nextExpiry);
      setNowTick(Date.now());
      setOtp('');
    } catch (err) {
      if (mountedRef.current) {
        setError(mapOtpError(err));
      }
    } finally {
      resendLock.current = false;
      if (mountedRef.current) {
        setResendLoading(false);
      }
    }
  }, [mapOtpError, mobile, purpose, resendLoading]);

  const titleFont = fontsLoaded ? loginTheme.fonts.bold : undefined;
  const bodyFont = fontsLoaded ? loginTheme.fonts.medium : undefined;
  const semiFont = fontsLoaded ? loginTheme.fonts.semiBold : undefined;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LoginBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <GlassBackButton onPress={confirmGoBack} disabled={loading} />
          <ChangeLanguagePill
            label={t('mobileLogin.changeLanguage')}
            onPress={openLanguage}
            disabled={loading}
          />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Animated.View
              style={[
                styles.cardWrap,
                {
                  width: cardWidth,
                  opacity: cardOpacity,
                  transform: [{ translateY: cardTranslate }],
                },
              ]}
            >
              <GlassCard>
                <View style={styles.logoWrap}>
                  <BhuguardLogo size={Math.max(logoSize, LOGO_SIZES.login)} />
                </View>

                <Text style={[styles.title, titleFont ? { fontFamily: titleFont } : null]}>
                  {t('otpLogin.verifyTitle')}
                </Text>
                <Text style={[styles.subtitle, bodyFont ? { fontFamily: bodyFont } : null]}>
                  {t('otpLogin.verifySubtitle', { mobile: maskedMobile })}
                </Text>

                <PinBoxInput
                  label={t('otpLogin.verifyTitle')}
                  hideLabel
                  keyPrefix="otp-box"
                  value={otp}
                  onChange={(value) => {
                    setOtp(value);
                    if (error) {
                      setError(null);
                    }
                  }}
                  masked={false}
                  autoFocus
                  length={OTP_LENGTH}
                  activeBorderColor={loginTheme.ctaGreen}
                  boxBackgroundColor={loginTheme.inputFill}
                  inactiveBorderColor={loginTheme.inputBorder}
                  digitColor={loginTheme.darkText}
                />

                {error ? (
                  <Text style={[styles.error, semiFont ? { fontFamily: semiFont } : null]}>
                    {error}
                  </Text>
                ) : null}

                <View style={styles.resendBlock}>
                  {secondsLeft > 0 ? (
                    <Text style={[styles.timerText, bodyFont ? { fontFamily: bodyFont } : null]}>
                      {t('otpLogin.resendIn', { time: timerLabel })}
                    </Text>
                  ) : (
                    <Text style={[styles.timerText, bodyFont ? { fontFamily: bodyFont } : null]}>
                      {t('otpLogin.resendReady')}
                    </Text>
                  )}
                  <Pressable
                    onPress={() => void resend()}
                    disabled={!canResend}
                    style={({ pressed }) => [styles.resendLink, pressed && styles.resendPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={t('otpLogin.resend')}
                  >
                    <Text
                      style={[
                        styles.resendText,
                        semiFont ? { fontFamily: semiFont } : null,
                        !canResend && styles.resendDisabled,
                      ]}
                    >
                      {resendLoading ? t('otpLogin.sendingOtp') : t('otpLogin.resend')}
                    </Text>
                  </Pressable>
                </View>

                <PrimaryButton
                  label={loading ? t('otpLogin.verifying') : t('otpLogin.verifyContinue')}
                  loading={loading}
                  disabled={!canVerify}
                  onPress={() => void verify()}
                />

                <Text style={[styles.securityHelper, bodyFont ? { fontFamily: bodyFont } : null]}>
                  {t('otpLogin.securityHelper')}
                </Text>
              </GlassCard>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: loginTheme.deepGreen,
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
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  cardWrap: {
    maxWidth: 420,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: loginTheme.darkText,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: loginTheme.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    color: loginTheme.error,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  resendBlock: {
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 14,
    color: loginTheme.textMuted,
  },
  resendLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resendPressed: {
    opacity: 0.85,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '700',
    color: loginTheme.ctaGreen,
  },
  resendDisabled: {
    opacity: 0.4,
  },
  securityHelper: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    color: loginTheme.textMuted,
    textAlign: 'center',
  },
});
