import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  changePattern,
} from '../../api/patternApi';
import { PatternLockPad } from '../../components/auth/pattern/PatternLockPad';
import { useTranslation } from '../../i18n/I18nContext';
import type { FarmerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FarmerStackParamList, 'ChangePattern'>;

type Phase = 'old' | 'new' | 'confirm';

export function ChangePatternScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('old');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const oldRef = useRef<string | null>(null);
  const nextRef = useRef<string | null>(null);
  const lockRef = useRef(false);
  const padKey = useRef(0);
  const [, bump] = useState(0);

  const remount = () => {
    padKey.current += 1;
    bump((n) => n + 1);
  };

  const hint =
    phase === 'old'
      ? t('pattern.enterCurrent')
      : phase === 'new'
        ? t('pattern.drawHint')
        : t('pattern.confirmHint');

  const onComplete = useCallback(
    async (sequence: string) => {
      if (lockRef.current || loading) {
        return;
      }
      setError(null);

      if (phase === 'old') {
        oldRef.current = sequence;
        setPhase('new');
        remount();
        return;
      }

      if (phase === 'new') {
        nextRef.current = sequence;
        setPhase('confirm');
        remount();
        return;
      }

      if (nextRef.current !== sequence) {
        setError(t('pattern.mismatch'));
        nextRef.current = null;
        setPhase('new');
        remount();
        return;
      }

      if (!oldRef.current || !nextRef.current) {
        setPhase('old');
        remount();
        return;
      }

      lockRef.current = true;
      setLoading(true);
      try {
        await changePattern(oldRef.current, nextRef.current);
        Alert.alert(t('pattern.changedTitle'), t('pattern.changedMessage'), [
          { text: t('common.ok') || 'OK', onPress: () => navigation.goBack() },
        ]);
      } catch (err) {
        if (err instanceof PatternUnsupportedError) {
          setError(t('pattern.unsupported'));
        } else if (err instanceof PatternLockedError) {
          setError(err.message || t('pattern.locked'));
        } else {
          setError(err instanceof Error ? err.message : t('pattern.changeFailed'));
        }
        oldRef.current = null;
        nextRef.current = null;
        setPhase('old');
        remount();
      } finally {
        lockRef.current = false;
        setLoading(false);
      }
    },
    [loading, navigation, phase, t],
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.back}>{t('common.back') || 'Back'}</Text>
        </Pressable>
        <Text style={styles.title}>{t('pattern.changeTitle')}</Text>
      </View>

      <PatternLockPad
        key={padKey.current}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F8F1',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 16,
    gap: 8,
  },
  back: {
    color: '#0F7A45',
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0B2E1F',
  },
});
