import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import { BackHandler } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { AppLoginRole } from '../../../config/authRoles';
import {
  getApiErrorMessage,
  requestForgotMpinOtp,
  requestLoginOtp,
  resolveLoginRoute,
} from '../../../api/authApi';
import {
  getValidatedColdStartUser,
  resolveRouteAfterMobileContinue,
  setAuthStartupPhase,
} from '../../../auth/startup/AuthStartupController';
import { useTranslation } from '../../../i18n/I18nContext';
import { NETWORK_UNREACHABLE_MESSAGE } from '../../../utils/apiError';
import { safeAuthGoBack } from '../../../navigation/safeAuthBack';
import type { RootStackParamList } from '../../../navigation/types';
import { BhuguardLogo } from '../../shared/BhuguardLogo';
import { useKeyboardOverlapInset, useKeyboardVisible } from '../../../hooks/useKeyboardOverlapInset';
import { ChangeLanguagePill } from './ChangeLanguagePill';
import { LoginBackground } from './LoginBackground';
import { PhoneInput } from './PhoneInput';

type Props = NativeStackScreenProps<RootStackParamList, 'MobileLogin'>;

const VALID_MOBILE = /^\d{10}$/;

const COLORS = {
  white: '#FFFFFF',
  brand: '#0B3B28',
  tagline: '#0B3B28',
  login: '#0B4A2B',
  lime: '#B7E05A',
  error: '#B53B3B',
} as const;

function cleanMobile(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

function LoginScreenComponent({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const width = useMemo(() => windowWidth, [windowWidth]);
  const keyboardOverlap = useKeyboardOverlapInset();
  const keyboardOpen = useKeyboardVisible();

  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [fontsLoaded] = useFonts({
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const requestLock = useRef(false);
  const mountedRef = useRef(true);
  const navigatedRef = useRef(false);
  const prefilledRef = useRef(false);

  const formWidth = useMemo(() => Math.min(340, width * 0.82), [width]);
  const logoSize = keyboardOpen ? 72 : 112;

  const mapAuthError = useCallback(
    (err: unknown): string => {
      const message = getApiErrorMessage(err, t('mobileLogin.unableToContinue'));
      const normalized = message.toLowerCase();

      if (
        normalized.includes('not registered')
        || normalized.includes('not found')
        || normalized.includes('does not exist')
        || normalized.includes('no user')
        || normalized.includes('unknown')
        || normalized.includes('unregistered')
      ) {
        return t('mobileLogin.notRegistered');
      }

      if (
        message === NETWORK_UNREACHABLE_MESSAGE
        || /no internet connection/i.test(message)
      ) {
        return message;
      }

      return message;
    },
    [t],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      navigatedRef.current = false;
      requestLock.current = false;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        safeAuthGoBack(navigation, 'LanguageSelection');
        return true;
      });
      return () => subscription.remove();
    }, [navigation]),
  );

  useEffect(() => {
    if (prefilledRef.current) {
      return;
    }
    prefilledRef.current = true;
    const trusted = getValidatedColdStartUser();
    if (trusted?.mobile) {
      const next = cleanMobile(trusted.mobile);
      setMobile((current) => (current === next ? current : next));
    }
  }, []);

  const isValid = useMemo(() => VALID_MOBILE.test(mobile), [mobile]);
  const showMobileValidation = useMemo(() => {
    if (!mobile.length) {
      return false;
    }
    return touched && !isValid;
  }, [isValid, mobile.length, touched]);

  const handleContinue = useCallback(async () => {
    setTouched(true);
    if (!VALID_MOBILE.test(mobile)) {
      setError(t('mobileLogin.invalidMobile'));
      return;
    }
    if (requestLock.current || navigatedRef.current) {
      return;
    }

    requestLock.current = true;
    setLoading(true);
    setError(null);

    try {
      const trustedRoute = await resolveRouteAfterMobileContinue(mobile);
      if (!mountedRef.current) {
        return;
      }

      if (trustedRoute?.name === 'PatternLogin' && trustedRoute.params) {
        navigatedRef.current = true;
        navigation.navigate('PatternLogin', trustedRoute.params as RootStackParamList['PatternLogin']);
        return;
      }

      if (trustedRoute?.name === 'SetPattern' && trustedRoute.params) {
        navigatedRef.current = true;
        navigation.navigate('SetPattern', trustedRoute.params as RootStackParamList['SetPattern']);
        return;
      }

      if (trustedRoute?.name === 'MpinLogin' && trustedRoute.params) {
        navigatedRef.current = true;
        navigation.navigate('PatternLogin', trustedRoute.params as RootStackParamList['PatternLogin']);
        return;
      }

      if (trustedRoute?.name === 'CreateMpin') {
        navigatedRef.current = true;
        navigation.navigate(
          'CreateMpin',
          (trustedRoute.params ?? {
            mode: 'setup',
            flowOrigin: 'auth',
            mobile,
          }) as RootStackParamList['CreateMpin'],
        );
        return;
      }

      // Backend is authoritative when /auth/login/resolve exists.
      // Live deployments without this endpoint should continue with OTP flow.
      try {
        const decision = await resolveLoginRoute(mobile);
        if (!mountedRef.current || navigatedRef.current) {
          return;
        }

        if (decision.next_step === 'pattern_login' && decision.pattern_configured) {
          navigatedRef.current = true;
          setAuthStartupPhase('locked');
          navigation.navigate('PatternLogin', {
            mobile: decision.mobile ?? mobile,
            name: decision.name,
            role: (decision.role as AppLoginRole | undefined),
            mode: 'login',
          });
          return;
        }
      } catch (resolveError) {
        if (axios.isAxiosError(resolveError) && resolveError.response?.status !== 404) {
          throw resolveError;
        }
      }

      const otpResponse = await requestLoginOtp(mobile);
      if (!mountedRef.current || navigatedRef.current) {
        return;
      }

      navigatedRef.current = true;
      setAuthStartupPhase('otp_verification');
      navigation.navigate('OtpVerification', {
        mobile,
        requestId: typeof otpResponse?.request_id === 'string' ? otpResponse.request_id : undefined,
        devOtp: typeof otpResponse?.dev_otp === 'string' ? otpResponse.dev_otp : undefined,
        purpose: 'login',
        flowOrigin: 'auth',
      });
    } catch (err) {
      if (mountedRef.current) {
        setError(mapAuthError(err));
        navigatedRef.current = false;
      }
    } finally {
      requestLock.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [mapAuthError, mobile, navigation, t]);

  const forgotPattern = useCallback(async () => {
    if (!VALID_MOBILE.test(mobile)) {
      setTouched(true);
      setError(t('mobileLogin.invalidMobile'));
      return;
    }
    if (requestLock.current || loading) {
      return;
    }

    requestLock.current = true;
    setLoading(true);
    setError(null);

    try {
      await requestForgotMpinOtp(mobile);
      if (!mountedRef.current) {
        return;
      }
      navigatedRef.current = true;
      setAuthStartupPhase('otp_verification');
      navigation.navigate('OtpVerification', {
        mobile,
        purpose: 'forgot_pattern',
        flowOrigin: 'auth',
      });
    } catch (err) {
      if (mountedRef.current) {
        setError(mapAuthError(err));
        navigatedRef.current = false;
      }
    } finally {
      requestLock.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loading, mapAuthError, mobile, navigation, t]);

  const loginWithAnotherMobile = useCallback(() => {
    setMobile('');
    setTouched(false);
    setError(null);
    navigatedRef.current = false;
  }, []);

  const onChangeMobile = useCallback((value: string) => {
    const next = cleanMobile(value);
    setMobile((current) => (current === next ? current : next));
    setError((current) => (current ? null : current));
  }, []);

  const showLegal = useCallback((document: 'terms' | 'privacy') => {
    Alert.alert(
      document === 'privacy' ? 'Privacy Policy' : 'Terms of Service',
      document === 'privacy'
        ? 'Bhuguard protects your personal and farm data. Full policy is available in your profile after login.'
        : 'By using Bhuguard you agree to participate under the terms communicated by your project partner. Full terms are available in your profile after login.',
    );
  }, []);

  const apiErrorMessage =
    error && error !== t('mobileLogin.invalidMobile') ? error : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LoginBackground />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={[styles.topControls, { top: Math.max(insets.top, 8) }]} pointerEvents="box-none">
          <ChangeLanguagePill
            label={t('mobileLogin.changeLanguage')}
            disabled={loading}
            onPress={() => safeAuthGoBack(navigation, 'LanguageSelection')}
          />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.layout,
              keyboardOpen ? styles.layoutKeyboard : null,
              {
                paddingBottom:
                  Math.max(insets.bottom, 12) + (Platform.OS === 'ios' ? 16 : keyboardOverlap),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={[styles.brandBlock, keyboardOpen && styles.brandCompact]}>
              <Pressable
                accessibilityLabel="Bhuguard logo"
                style={styles.logoWrap}
              >
                <BhuguardLogo size={logoSize} />
              </Pressable>

              <Text
                style={[styles.brandName, fontsLoaded ? styles.fontBold : null]}
                allowFontScaling={false}
                accessibilityRole="header"
              >
                BHUGUARD
              </Text>

              <View style={styles.taglineRow}>
                <View style={styles.taglineLine} />
                <Text
                  style={[styles.tagline, fontsLoaded ? styles.fontSemiBold : null]}
                  allowFontScaling={false}
                >
                  PROTECTING WHAT GROWS
                </Text>
                <View style={styles.taglineLine} />
              </View>
            </View>

            <View style={[styles.formBlock, { width: formWidth }]}>
              <Text
                style={[styles.welcome, fontsLoaded ? styles.fontBold : null]}
                allowFontScaling={false}
              >
                Welcome to Bhuguard
              </Text>
              <Text
                style={[styles.subtitle, fontsLoaded ? styles.fontMedium : null]}
                allowFontScaling={false}
              >
                Enter your mobile number to continue
              </Text>

              <PhoneInput
                value={mobile}
                fontsLoaded={fontsLoaded}
                invalid={showMobileValidation}
                editable={!loading}
                placeholder="Enter mobile number"
                onBlur={() => setTouched(true)}
                onChangeText={onChangeMobile}
              />

              {showMobileValidation ? (
                <Text style={styles.validationError}>{t('mobileLogin.invalidMobile')}</Text>
              ) : null}
              {apiErrorMessage ? <Text style={styles.validationError}>{apiErrorMessage}</Text> : null}

              <Pressable
                style={[styles.loginButton, (!isValid || loading) && styles.loginButtonDisabled]}
                disabled={!isValid || loading}
                onPress={() => void handleContinue()}
                accessibilityRole="button"
                accessibilityLabel="Login"
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text
                    style={[styles.loginLabel, fontsLoaded ? styles.fontBold : null]}
                    allowFontScaling={false}
                  >
                    Login
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => void forgotPattern()}
                disabled={loading}
                style={styles.linkWrap}
                accessibilityRole="link"
                accessibilityLabel={t('pattern.forgot')}
              >
                <Text style={[styles.link, fontsLoaded ? styles.fontSemiBold : null]}>
                  {t('pattern.forgot')}
                </Text>
              </Pressable>

              <Pressable
                onPress={loginWithAnotherMobile}
                disabled={loading}
                style={styles.linkWrapSecondary}
                accessibilityRole="link"
                accessibilityLabel="Login with another mobile number"
              >
                <Text style={[styles.link, fontsLoaded ? styles.fontSemiBold : null]}>
                  Login with another mobile number
                </Text>
              </Pressable>

              <Text style={[styles.legal, fontsLoaded ? styles.fontMedium : null]}>
                By continuing, you agree to our{' '}
                <Text style={styles.legalHighlight} onPress={() => showLegal('terms')}>
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text style={styles.legalHighlight} onPress={() => showLegal('privacy')}>
                  Privacy Policy
                </Text>
                .
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export const LoginScreen = memo(LoginScreenComponent);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B3B28',
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    right: 16,
    zIndex: 30,
    alignItems: 'flex-end',
    gap: 10,
  },
  layout: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingTop: 56,
  },
  layoutKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 16,
    gap: 16,
  },
  brandBlock: {
    alignItems: 'center',
    paddingTop: 18,
  },
  brandCompact: {
    paddingTop: 4,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 5.5,
    color: COLORS.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  taglineRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
  },
  taglineLine: {
    width: 34,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: COLORS.lime,
    opacity: 0.9,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: COLORS.white,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  formBlock: {
    alignSelf: 'center',
    alignItems: 'center',
    paddingBottom: 8,
  },
  welcome: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 18,
  },
  validationError: {
    fontSize: 13,
    color: '#FFD7D0',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  loginButton: {
    marginTop: 14,
    minHeight: 54,
    width: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.login,
  },
  loginButtonDisabled: {
    opacity: 0.55,
  },
  loginLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  linkWrap: {
    marginTop: 16,
    paddingVertical: 2,
  },
  linkWrapSecondary: {
    marginTop: 10,
    paddingVertical: 2,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  legal: {
    marginTop: 22,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.white,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  legalHighlight: {
    color: COLORS.lime,
    fontWeight: '700',
  },
  fontBold: {
    fontFamily: 'Outfit_700Bold',
  },
  fontSemiBold: {
    fontFamily: 'Outfit_600SemiBold',
  },
  fontMedium: {
    fontFamily: 'Outfit_500Medium',
  },
});
