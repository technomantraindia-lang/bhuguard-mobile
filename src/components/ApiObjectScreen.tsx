import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '../api/authApi';
import { colors } from '../theme/colors';
import type { ApiRecord } from '../utils/apiHelpers';
import { isApiNotFound, isNetworkError, NETWORK_ERROR_MESSAGE, PENDING_API_MESSAGE } from '../utils/apiError';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';
import { ScreenHeader } from './ScreenHeader';

interface ApiObjectScreenProps {
  title: string;
  subtitle?: string;
  fetcher: () => Promise<ApiRecord>;
  render: (data: ApiRecord) => ReactNode;
}

export function ApiObjectScreen({ title, subtitle, fetcher, render }: ApiObjectScreenProps) {
  const [data, setData] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPending(false);

    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      if (isApiNotFound(err)) {
        setData(null);
        setPending(true);
        setError(null);
      } else if (isNetworkError(err)) {
        setError(NETWORK_ERROR_MESSAGE);
      } else {
        setError(getApiErrorMessage(err, 'Failed to load data.'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pad}>
          <ScreenHeader title={title} subtitle={subtitle} />
        </View>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pad}>
          <ScreenHeader title={title} subtitle={subtitle} />
        </View>
        <ErrorState message={error} onRetry={load} />
      </SafeAreaView>
    );
  }

  if (pending || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pad}>
          <ScreenHeader title={title} subtitle={subtitle} />
        </View>
        <EmptyState title="Module ready" message={PENDING_API_MESSAGE} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title={title} subtitle={subtitle} />
        {render(data)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pad: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  container: {
    padding: 20,
    gap: 12,
  },
});
