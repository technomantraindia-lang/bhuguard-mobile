import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  PatternLockedError,
  PatternUnsupportedError,
  verifyPattern,
} from '../../api/patternApi';
import { requestForgotMpinOtp, getApiErrorMessage } from '../../api/authApi';
import {
  routeAfterAuthenticatedUnlock,
  setAuthStartupPhase,
} from '../../auth/startup/AuthStartupController';
import { PatternLockPad } from '../../components/auth/pattern/PatternLockPad';
import { useTranslation } from '../../i18n/I18nContext';
import type { RootStackParamList } from '../../navigation/types';
import { safeNavigationReset } from '../../navigation/safeNavigationReset';
import { finishMobileLogin } from '../../utils/finishMobileLogin';

type Props = NativeStackScreenProps<RootStackParamList, 'PatternLogin'>;

export function PatternLoginScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const mobile = route.params?.mobile ?? '';
  const mode = route.params?.mode ?? 'login';
  const name = route.params?.name;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const lockRef = useRef(false);
  const forgotLockRef = useRef(false);
  const padKey = useRef(0);
  const [, force] = useState(0);

  const remountPad = () => {
    padKey.current += 1;
    force((n) => n + 1);
  };

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

        if (mode === 'unlock') {
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
          navigation.navigate('MpinLogin', {
            mobile,
            name,
            mode,
          });
        } else if (err instanceof PatternLockedError) {
          setError(err.message || t('pattern.locked'));
        } else {
          setError(err instanceof Error ? err.message : t('pattern.incorrect'));
        }
        remountPad();
      } finally {
        lockRef.current = false;
        setLoading(false);
      }
    },
    [loading, mobile, mode, name, navigation, t],
  );

  const onForgotPattern = useCallback(async () => {
    if (forgotLockRef.current || loading || !mobile) {
      return;
    }

    forgotLockRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Reuse forgot-MPIN OTP channel for Pattern recovery (same mobile OTP gate).
      await requestForgotMpinOtp(mobile);
      navigation.navigate('OtpVerification', {
        mobile,
        purpose: 'forgot_pattern',
        flowOrigin: 'auth',
      });
    } catch (err) {
      setError(getApiErrorMessage(err, t('errors.loginFailed')));
    } finally {
      forgotLockRef.current = false;
      setLoading(false);
    }
  }, [loading, mobile, navigation, t]);

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>{t('pattern.loginTitle')}</Text>
      {name ? <Text style={styles.subtitle}>{name}</Text> : null}
      <Text style={styles.subtitle}>{t('pattern.drawToUnlock')}</Text>

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

      {loading ? <ActivityIndicator color="#0F7A45" style={{ marginTop: 16 }} /> : null}

      <Pressable
        style={styles.link}
        disabled={loading}
        onPress={() => {
          void onForgotPattern();
        }}
        accessibilityRole="link"
        accessibilityLabel={t('pattern.forgot')}
      >
        <Text style={styles.linkText}>{t('pattern.forgot')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F8F1',
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0B2E1F',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(11,46,31,0.7)',
    marginBottom: 12,
  },
  link: {
    alignSelf: 'center',
    marginTop: 24,
    padding: 12,
  },
  linkText: {
    color: '#0F7A45',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
