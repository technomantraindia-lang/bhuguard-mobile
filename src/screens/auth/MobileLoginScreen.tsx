import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import axios from 'axios';

// Entrance mobile + OTP login — no role cards.

import { getApiErrorMessage, requestLoginOtp } from '../../api/authApi';
import { EnvironmentalBackground } from '../../components/auth/EnvironmentalBackground';
import { BhuguardLogo } from '../../components/shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MobileLogin'>;

const VALID_MOBILE = /^\d{10}$/;

function cleanMobile(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

function mapAuthError(error: unknown): string {
  if (axios.isAxiosError(error) && !error.response) {
    return 'Server not reachable. Please check internet or server URL.';
  }

  const message = getApiErrorMessage(error, 'Unable to continue. Please try again.');
  const normalized = message.toLowerCase();

  if (
    normalized.includes('not registered') ||
    normalized.includes('not found') ||
    normalized.includes('does not exist') ||
    normalized.includes('no user') ||
    normalized.includes('unknown') ||
    normalized.includes('unregistered')
  ) {
    return 'Mobile number not registered. Please contact Bhuguard admin.';
  }

  return message;
}

export function MobileLoginScreen({ navigation }: Props) {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const cardOpacity = useSharedValue(0);
  const cardTranslate = useSharedValue(28);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    cardTranslate.value = withTiming(0, { duration: 560, easing: Easing.out(Easing.cubic) });
    contentOpacity.value = withDelay(180, withTiming(1, { duration: 420 }));
  }, [cardOpacity, cardTranslate, contentOpacity]);

  const isValid = useMemo(() => VALID_MOBILE.test(mobile), [mobile]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslate.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleContinue = async () => {
    setTouched(true);

    if (!VALID_MOBILE.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await requestLoginOtp(mobile);
      navigation.navigate('OtpVerification', {
        mobile,
        purpose: 'login',
        flowOrigin: 'auth',
      });
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <EnvironmentalBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.spacer} />

          <Animated.View style={[styles.cardOuter, cardStyle]}>
            <BlurView intensity={28} tint="light" style={styles.blur}>
              <View style={styles.glass}>
                <Animated.View style={[styles.content, contentStyle]}>
                  <BhuguardLogo size={LOGO_SIZES.moduleHeader} />
                  <Text style={styles.heading}>Welcome to Bhuguard</Text>
                  <Text style={styles.subheading}>Enter your mobile number to continue</Text>

                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={[styles.inputRow, touched && !isValid ? styles.inputInvalid : null]}>
                    <Text style={styles.prefix}>+91</Text>
                    <TextInput
                      style={styles.input}
                      value={mobile}
                      onChangeText={(value) => {
                        setMobile(cleanMobile(value));
                        if (error) {
                          setError(null);
                        }
                      }}
                      onBlur={() => setTouched(true)}
                      keyboardType="number-pad"
                      maxLength={10}
                      placeholder="9876543210"
                      placeholderTextColor="rgba(3,21,13,0.35)"
                      editable={!loading}
                      accessibilityLabel="Mobile number"
                    />
                  </View>

                  {touched && !isValid ? (
                    <Text style={styles.error}>Please enter a valid 10-digit mobile number.</Text>
                  ) : null}
                  {error ? <Text style={styles.error}>{error}</Text> : null}

                  <Pressable
                    style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
                    onPress={() => void handleContinue()}
                    disabled={!isValid || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#F4F0DF" />
                    ) : (
                      <Text style={styles.buttonText}>Continue</Text>
                    )}
                  </Pressable>
                </Animated.View>
              </View>
            </BlurView>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </EnvironmentalBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'flex-end',
  },
  spacer: {
    flex: 1,
  },
  cardOuter: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#03150D',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  blur: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  glass: {
    backgroundColor: 'rgba(244, 240, 223, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  heading: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '700',
    color: '#03150D',
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    lineHeight: 20,
    color: '#0B2E1F',
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 8,
  },
  label: {
    alignSelf: 'stretch',
    fontSize: 13,
    fontWeight: '600',
    color: '#0B2E1F',
    marginTop: 4,
  },
  inputRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(14,122,69,0.25)',
    minHeight: 52,
    paddingHorizontal: 14,
  },
  inputInvalid: {
    borderColor: '#B42318',
  },
  prefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E7A45',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#03150D',
    paddingVertical: 12,
  },
  error: {
    alignSelf: 'stretch',
    fontSize: 13,
    color: '#B42318',
    fontWeight: '600',
  },
  button: {
    alignSelf: 'stretch',
    marginTop: 8,
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: '#0E7A45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#F4F0DF',
    fontSize: 16,
    fontWeight: '700',
  },
});
