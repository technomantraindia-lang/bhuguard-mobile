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
  const mode = route.params?.mode ?? 'setup';
  const mobile = route.params?.mobile ?? '';
  const [phase, setPhase] = useState<Phase>('draw');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const firstRef = useRef<string | null>(null);
  const lockRef = useRef(false);

  const hint =
    phase === 'draw'
      ? t('pattern.drawHint')
      : t('pattern.confirmHint');

  const finishSuccess = useCallback(async () => {
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
        firstRef.current = sequence;
        setPhase('confirm');
        return;
      }

      if (firstRef.current !== sequence) {
        setError(t('pattern.mismatch'));
        firstRef.current = null;
        setPhase('draw');
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
        await finishSuccess();
      } catch (err) {
        if (err instanceof PatternUnsupportedError) {
          setError(t('pattern.unsupported'));
        } else if (err instanceof PatternLockedError) {
          setError(err.message || t('pattern.locked'));
        } else {
          setError(err instanceof Error ? err.message : t('pattern.setupFailed'));
        }
        firstRef.current = null;
        setPhase('draw');
      } finally {
        lockRef.current = false;
        setLoading(false);
      }
    },
    [finishSuccess, loading, mobile, mode, phase, t],
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {mode === 'reset' ? t('pattern.resetTitle') : t('pattern.setupTitle')}
        </Text>
        <Text style={styles.subtitle}>{t('pattern.minPoints')}</Text>
      </View>

      <PatternLockPad
        disabled={loading}
        hintText={hint}
        errorText={error}
        onComplete={(sequence) => {
          void onComplete(sequence);
        }}
        onCleared={() => setError(null)}
        onTooShort={() => setError(t('pattern.tooShort'))}
      />

      {loading ? <ActivityIndicator color="#0F7A45" style={{ marginTop: 16 }} /> : null}

      <Pressable
        style={styles.secondary}
        disabled={loading}
        onPress={() => {
          firstRef.current = null;
          setPhase('draw');
          setError(null);
        }}
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
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    marginBottom: 16,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0B2E1F',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(11,46,31,0.7)',
  },
  secondary: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 12,
  },
  secondaryText: {
    color: '#0F7A45',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
