import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { runApiHealthCheck, type ApiHealthCheckResult } from '../../api/apiHealthCheck';
import { API_BASE_URL } from '../../config/apiConfig';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { RootStackParamList } from '../../navigation/types';
import { getApiBaseUrl } from '../../storage/apiConfigStorage';
import { getAuthToken, getAuthUserType } from '../../utils/authStorage';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ApiHealthCheck'>;

export function ApiHealthCheckScreen({ navigation }: Props) {
  const [running, setRunning] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [tokenPresent, setTokenPresent] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [results, setResults] = useState<ApiHealthCheckResult[]>([]);

  const runChecks = useCallback(async () => {
    setRunning(true);

    try {
      const [url, token, role] = await Promise.all([
        getApiBaseUrl(),
        getAuthToken(),
        getAuthUserType(),
      ]);

      setBaseUrl(url || API_BASE_URL);
      setTokenPresent(Boolean(token));
      setUserType(role);
      setResults(await runApiHealthCheck());
    } finally {
      setRunning(false);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          title="API Health Check"
          subtitle="Developer tool — auth foundation connectivity only"
        />

        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Base URL</Text>
          <Text style={styles.metaValue}>{baseUrl || API_BASE_URL}</Text>
          <Text style={styles.metaLabel}>Token</Text>
          <Text style={styles.metaValue}>{tokenPresent ? 'Present' : 'Missing'}</Text>
          <Text style={styles.metaLabel}>Role</Text>
          <Text style={styles.metaValue}>{userType ?? 'Not logged in'}</Text>
        </View>

        <Pressable
          style={[styles.runButton, running && styles.runButtonDisabled]}
          onPress={() => void runChecks()}
          disabled={running}
        >
          {running ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.runButtonText}>Run API Checks</Text>
          )}
        </Pressable>

        {results.map((item) => (
          <View key={item.name} style={[styles.resultCard, item.ok ? styles.ok : styles.fail]}>
            <Text style={styles.resultName}>{item.name}</Text>
            <Text style={styles.resultStatus}>
              {item.ok ? 'SUCCESS' : 'FAIL'}
              {item.status ? ` (${item.status})` : ''}
            </Text>
            <Text style={styles.resultMessage}>{item.message}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 20,
    gap: 12,
    paddingBottom: 32,
  },
  back: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.primary,
    fontWeight: '600',
  },
  metaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 6,
  },
  metaValue: {
    fontSize: 14,
    color: colors.text,
  },
  runButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  runButtonDisabled: {
    opacity: 0.7,
  },
  runButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  resultCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  ok: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  fail: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  resultName: {
    fontWeight: '700',
    color: colors.text,
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  resultMessage: {
    fontSize: 13,
    color: colors.text,
  },
});
