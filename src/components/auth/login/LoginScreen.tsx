import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ActivityIndicator,
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
} from "react-native";

import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useFocusEffect } from "@react-navigation/native";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import axios from "axios";

import {
  getApiErrorMessage,
  requestForgotMpinOtp,
  requestLoginOtp,
} from "../../../api/authApi";

import {
  getValidatedColdStartUser,
  resolveRouteAfterMobileContinue,
  setAuthStartupPhase,
} from "../../../auth/startup/AuthStartupController";

import { APP_VARIANT } from "../../../config/env";

import { LOGO_SIZES } from "../../../constants/branding";

import { useTranslation } from "../../../i18n/I18nContext";

import { safeAuthGoBack } from "../../../navigation/safeAuthBack";

import type { RootStackParamList } from "../../../navigation/types";

import { BhuguardLogo } from "../../shared/BhuguardLogo";

import { fadeUpIn } from "./Animations";

import { LoginBackground } from "./LoginBackground";

import { PhoneInput } from "./PhoneInput";

import { loginTheme } from "./Theme";

type Props = NativeStackScreenProps<RootStackParamList, "MobileLogin">;

const VALID_MOBILE = /^\d{10}$/;

const COLORS = {
  white: "#FFFFFF",

  softWhite: "rgba(255, 255, 255, 0.84)",

  lime: "#B9E85A",

  muted: "rgba(255, 255, 255, 0.62)",

  error: "#FF9D8F",

  buttonActive: "#3F7D24",

  buttonDisabledBg: "rgba(15, 58, 32, 0.55)",

  buttonDisabledText: "rgba(255, 255, 255, 0.45)",
} as const;

function cleanMobile(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

function LoginScreenComponent({ navigation }: Props) {
  const { t } = useTranslation();

  const insets = useSafeAreaInsets();

  const { width: windowWidth } = useWindowDimensions();

  const width = useMemo(() => windowWidth, [windowWidth]);

  const [mobile, setMobile] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [touched, setTouched] = useState(false);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_500Medium,

    PlusJakartaSans_600SemiBold,

    PlusJakartaSans_700Bold,
  });

  const contentOpacity = useRef(new Animated.Value(1)).current;

  const contentTranslate = useRef(new Animated.Value(0)).current;

  const enterPlayed = useRef(false);

  const requestLock = useRef(false);

  const mountedRef = useRef(true);

  const navigatedRef = useRef(false);

  const prefilledRef = useRef(false);

  const formWidth = useMemo(() => Math.min(400, width * 0.86), [width]);

  const logoSize = useMemo(
    () => Math.min(LOGO_SIZES.login, Math.max(105, Math.round(width * 0.28))),

    [width],
  );

  const mapAuthError = useCallback(
    (err: unknown): string => {
      if (axios.isAxiosError(err) && !err.response) {
        return t("mobileLogin.serverUnreachable");
      }

      const message = getApiErrorMessage(
        err,
        t("mobileLogin.unableToContinue"),
      );

      const normalized = message.toLowerCase();

      if (
        normalized.includes("not registered") ||
        normalized.includes("not found") ||
        normalized.includes("does not exist") ||
        normalized.includes("no user") ||
        normalized.includes("unknown") ||
        normalized.includes("unregistered")
      ) {
        return t("mobileLogin.notRegistered");
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

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          safeAuthGoBack(navigation, "LanguageSelection");

          return true;
        },
      );

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

  useEffect(() => {
    if (enterPlayed.current) {
      return;
    }

    enterPlayed.current = true;

    contentOpacity.setValue(0);

    contentTranslate.setValue(18);

    const enter = fadeUpIn(contentOpacity, contentTranslate, {
      delay: 40,
      duration: 420,
    });

    enter.start();

    return () => {
      enter.stop();
    };
  }, [contentOpacity, contentTranslate]);

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
      setError(t("mobileLogin.invalidMobile"));

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

      if (trustedRoute?.name === "MpinLogin" && trustedRoute.params) {
        navigatedRef.current = true;

        navigation.navigate(
          "MpinLogin",
          trustedRoute.params as RootStackParamList["MpinLogin"],
        );

        return;
      }

      if (trustedRoute?.name === "CreateMpin") {
        navigatedRef.current = true;

        navigation.navigate(
          "CreateMpin",

          (trustedRoute.params ?? {
            mode: "setup",

            flowOrigin: "auth",

            mobile,
          }) as RootStackParamList["CreateMpin"],
        );

        return;
      }

      await requestLoginOtp(mobile);

      if (!mountedRef.current || navigatedRef.current) {
        return;
      }

      navigatedRef.current = true;

      setAuthStartupPhase("otp_verification");

      navigation.navigate("OtpVerification", {
        mobile,

        purpose: "login",

        flowOrigin: "auth",
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

  const forgotMpin = useCallback(async () => {
    if (!VALID_MOBILE.test(mobile)) {
      setTouched(true);

      setError(t("mobileLogin.invalidMobile"));

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

      setAuthStartupPhase("otp_verification");

      navigation.navigate("OtpVerification", {
        mobile,

        purpose: "forgot_mpin",

        flowOrigin: "auth",
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
    setMobile("");

    setTouched(false);

    setError(null);

    navigatedRef.current = false;
  }, []);

  const openDevServerSettings = useCallback(() => {
    if (APP_VARIANT === "development") {
      navigation.navigate("ApiServerSettings");
    }
  }, [navigation]);

  const onChangeMobile = useCallback((value: string) => {
    const next = cleanMobile(value);

    setMobile((current) => (current === next ? current : next));

    setError((current) => (current ? null : current));
  }, []);

  const showLegal = useCallback((document: "terms" | "privacy") => {
    Alert.alert(
      document === "privacy" ? "Privacy Policy" : "Terms of Service",

      document === "privacy"
        ? "Bhuguard protects your personal and farm data. Full policy is available in your profile after login."
        : "By using Bhuguard you agree to participate under the terms communicated by your project partner. Full terms are available in your profile after login.",
    );
  }, []);

  const footerPad = Math.max(insets.bottom, 16) + 32;

  const apiErrorMessage =
    error && error !== t("mobileLogin.invalidMobile") ? error : null;

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <LoginBackground />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}

          behavior={Platform.OS === "ios" ? "padding" : "height"}

          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 24}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: footerPad },
            ]}

            keyboardShouldPersistTaps="handled"

            showsVerticalScrollIndicator={false}

            bounces

            keyboardDismissMode="on-drag"
          >
            <Animated.View
              style={[
                styles.content,

                {
                  width: formWidth,

                  opacity: contentOpacity,

                  transform: [{ translateY: contentTranslate }],
                },
              ]}
            >
              <Pressable
                onLongPress={
                  APP_VARIANT === "development"
                    ? openDevServerSettings
                    : undefined
                }

                delayLongPress={650}

                accessibilityLabel="Bhuguard logo"

                style={styles.logoWrap}
              >
                <BhuguardLogo size={logoSize} />
              </Pressable>

              <Text
                style={[styles.brandName, fontsLoaded ? styles.fontBold : null]}

                allowFontScaling={false}
              >
                BHUGUARD
              </Text>

              <Text
                style={[
                  styles.tagline,
                  fontsLoaded ? styles.fontSemiBold : null,
                ]}

                allowFontScaling={false}
              >
                SECURE FARMS. SUSTAINABLE FUTURE.
              </Text>

              <View style={styles.welcomeBlock}>
                <Text
                  style={[styles.welcome, fontsLoaded ? styles.fontBold : null]}

                  allowFontScaling={false}
                >
                  Welcome
                </Text>

                <Text
                  style={[
                    styles.subtitle,
                    fontsLoaded ? styles.fontMedium : null,
                  ]}

                  allowFontScaling={false}
                >
                  Secure access to your farm operations{"\n"}and sustainable
                  field management.
                </Text>
              </View>

              <PhoneInput
                value={mobile}

                fontsLoaded={fontsLoaded}

                invalid={showMobileValidation}

                editable={!loading}

                placeholder="Enter your mobile number"

                onBlur={() => setTouched(true)}

                onChangeText={onChangeMobile}
              />

              {showMobileValidation ? (
                <Text style={styles.validationError}>
                  {t("mobileLogin.invalidMobile")}
                </Text>
              ) : null}

              {apiErrorMessage ? (
                <Text style={styles.validationError}>{apiErrorMessage}</Text>
              ) : null}

              <Pressable
                style={[
                  styles.loginButton,

                  isValid && !loading
                    ? styles.loginButtonActive
                    : styles.loginButtonDisabled,
                ]}

                disabled={!isValid || loading}

                onPress={() => void handleContinue()}

                accessibilityRole="button"

                accessibilityLabel="Login"
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text
                    style={[
                      styles.loginLabel,

                      fontsLoaded ? styles.fontBold : null,

                      !isValid && styles.loginLabelDisabled,
                    ]}

                    allowFontScaling={false}
                  >
                    Login
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => void forgotMpin()}

                disabled={loading}

                style={styles.linkWrap}

                accessibilityRole="link"
              >
                <Text
                  style={[
                    styles.link,
                    fontsLoaded ? styles.fontSemiBold : null,
                  ]}
                >
                  Forgot MPIN?
                </Text>
              </Pressable>

              <Pressable
                onPress={loginWithAnotherMobile}

                disabled={loading}

                style={styles.linkWrap}

                accessibilityRole="link"
              >
                <Text
                  style={[
                    styles.link,
                    fontsLoaded ? styles.fontSemiBold : null,
                  ]}
                >
                  Login with another mobile number
                </Text>
              </Pressable>

              <Text
                style={[styles.legal, fontsLoaded ? styles.fontMedium : null]}
              >
                By continuing, you agree to our{" "}
                <Text
                  style={styles.legalHighlight}
                  onPress={() => showLegal("terms")}
                >
                  Terms of Service
                </Text>
                {"\n"}and{" "}
                <Text
                  style={styles.legalHighlight}
                  onPress={() => showLegal("privacy")}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </Animated.View>
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

    backgroundColor: "#011F11",
  },

  safe: {
    flex: 1,
  },

  flex: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,

    justifyContent: "center",

    alignItems: "center",

    paddingHorizontal: 20,

    paddingTop: 16,
  },

  content: {
    alignSelf: "center",

    alignItems: "center",

    gap: 12,
  },

  logoWrap: {
    alignItems: "center",

    marginBottom: 4,
  },

  brandName: {
    fontSize: 27,

    fontWeight: "800",

    letterSpacing: 8,

    color: COLORS.white,

    textAlign: "center",

    marginTop: 6,
  },

  tagline: {
    fontSize: 11,

    fontWeight: "600",

    letterSpacing: 2.2,

    color: COLORS.lime,

    textAlign: "center",

    paddingHorizontal: 8,

    textTransform: "uppercase",
  },

  welcomeBlock: {
    marginTop: 28,

    marginBottom: 8,

    alignItems: "center",

    gap: 10,

    width: "100%",
  },

  welcome: {
    fontSize: 32,

    fontWeight: "800",

    color: COLORS.white,

    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,

    lineHeight: 22,

    fontWeight: "500",

    color: COLORS.softWhite,

    textAlign: "center",

    paddingHorizontal: 4,
  },

  validationError: {
    fontSize: 13,

    color: COLORS.error,

    fontWeight: "600",

    textAlign: "center",

    paddingHorizontal: 8,

    marginTop: -4,
  },

  loginButton: {
    marginTop: 4,

    minHeight: 64,

    width: "100%",

    borderRadius: 999,

    alignItems: "center",

    justifyContent: "center",
  },

  loginButtonActive: {
    backgroundColor: COLORS.buttonActive,

    borderWidth: 1,

    borderColor: "rgba(185, 232, 90, 0.35)",
  },

  loginButtonDisabled: {
    backgroundColor: COLORS.buttonDisabledBg,
  },

  loginLabel: {
    fontSize: 18,

    fontWeight: "700",

    color: COLORS.white,

    letterSpacing: 0.3,
  },

  loginLabelDisabled: {
    color: COLORS.buttonDisabledText,
  },

  linkWrap: {
    paddingVertical: 6,
  },

  link: {
    fontSize: 14,

    fontWeight: "600",

    color: COLORS.lime,

    textAlign: "center",

    textDecorationLine: "underline",
  },

  legal: {
    marginTop: 12,

    fontSize: 12,

    lineHeight: 18,

    color: COLORS.muted,

    textAlign: "center",

    paddingHorizontal: 4,
  },

  legalHighlight: {
    color: COLORS.lime,

    fontWeight: "700",
  },

  fontBold: {
    fontFamily: loginTheme.fonts.bold,
  },

  fontSemiBold: {
    fontFamily: loginTheme.fonts.semiBold,
  },

  fontMedium: {
    fontFamily: loginTheme.fonts.medium,
  },
});
