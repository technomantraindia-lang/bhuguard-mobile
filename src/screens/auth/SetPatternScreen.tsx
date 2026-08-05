import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  PatternLockedError,
  PatternUnsupportedError,
  resetPattern,
  setupPattern,
} from '../../api/patternApi';
import { PatternLockPad } from '../../components/auth/pattern/PatternLockPad';
import { useTranslation } from '../../i18n/I18nContext';
import type { RootStackParamList } from '../../navigation/types';
import { safeNavigationReset } from '../../navigation/safeNavigationReset';
import { getDashboardRoute } from '../../utils/authRouting';
import { resolveUserRole } from '../../utils/authRole';
import { getAuthUser } from '../../utils/authStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'SetPattern'>;

type Phase = 'draw' | 'confirm';

export function SetPatternScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const mode = route.params?.mode ?? 'setup';
  const mobile = route.params?.mobile ?? '';
  const [phase, setPhase] = useState<Phase>('draw');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [padKey, setPadKey] = useState(0);
  const firstRef = useRef<string | null>(null);
  const lockRef = useRef(false);

  const gridWidth = Math.min(280, Math.round(width * 0.72));

  const title =
    phase === 'confirm'
      ? t('pattern.confirmTitle')
      : mode === 'reset'
        ? t('pattern.resetTitle')
        : t('pattern.setupTitle');

  const subtitle =
    phase === 'confirm' ? t('pattern.confirmHint') : t('pattern.drawHint');

  const remountPad = useCallback(() => {
    setPadKey((n) => n + 1);
  }, []);

  const finishSuccess = useCallback(async () => {
    setSuccessFlash(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 450));
    firstRef.current = null;
    const user = await getAuthUser();
    const role = user ? resolveUserRole(user) ?? user.user_type : null;
    const dashboard = role ? getDashboardRoute(role) : null;
    if (dashboard) {
      safeNavigationReset(navigation, { index: 0, routes: [{ name: dashboard }] });
      return;
    }
    navigation.navigate('MobileLogin');
  }, [navigation]);

  const onComplete = useCallback(
    async (sequence: string) => {
      if (lockRef.current || loading) {
        return;
      }

      setError(null);

      if (phase === 'draw') {
        // Keep first pattern in memory only — never persist plain pattern.
        firstRef.current = sequence;
        setPhase('confirm');
        remountPad();
        return;
      }

      if (firstRef.current !== sequence) {
        setError(t('pattern.mismatch'));
        // Stay on Confirm Pattern; keep first draw until Start Over.
        remountPad();
        return;
      }

      lockRef.current = true;
      setLoading(true);

      try {
        if (mode === 'reset') {
          await resetPattern(mobile, sequence);
        } else {
          await setupPattern(sequence);
        }
        firstRef.current = null;
        await finishSuccess();
      } catch (err) {
        if (err instanceof PatternUnsupportedError) {
          setError(t('pattern.unsupported'));
        } else if (err instanceof PatternLockedError) {
          setError(err.message || t('pattern.locked'));
        } else {
          setError(err instanceof Error ? err.message : t('pattern.setupFailed'));
        }
        remountPad();
      } finally {
        lockRef.current = false;
        setLoading(false);
      }
    },
    [finishSuccess, loading, mobile, mode, phase, remountPad, t],
  );

  const startOver = useCallback(() => {
    if (loading) {
      return;
    }
    firstRef.current = null;
    setPhase('draw');
    setError(null);
    setSuccessFlash(false);
    remountPad();
  }, [loading, remountPad]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.center}>
        <View style={{ width: gridWidth }}>
          <PatternLockPad
            key={padKey}
            disabled={loading || successFlash}
            errorText={error}
            onComplete={(sequence) => {
              void onComplete(sequence);
            }}
            onCleared={() => setError(null)}
            onTooShort={() => setError(t('pattern.tooShort'))}
          />
        </View>

        {loading ? <ActivityIndicator color="#0F7A45" style={styles.loader} /> : null}
        {successFlash ? <Text style={styles.success}>{t('pattern.setupSuccess')}</Text> : null}
      </View>

      <Pressable
        style={styles.secondary}
        disabled={loading}
        onPress={startOver}
        accessibilityRole="button"
        accessibilityLabel={t('pattern.startOver')}
      >
        <Text style={styles.secondaryText}>{t('pattern.startOver')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F8F1',
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 20,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0B2E1F',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(11,46,31,0.72)',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loader: {
    marginTop: 4,
  },
  success: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F7A45',
    textAlign: 'center',
  },
  secondary: {
    alignSelf: 'center',
    marginBottom: 12,
    padding: 12,
  },
  secondaryText: {
    color: '#0F7A45',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
