import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { officerTheme } from '../../theme/officerDashboardTheme';

interface OfficerListStateProps {
  kind: 'loading' | 'empty' | 'error';
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function OfficerListState({ kind, title, message, onRetry }: OfficerListStateProps) {
  if (kind === 'loading') {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={officerTheme.primary} size="large" />
        <Text style={styles.message}>{message ?? 'Loading…'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title ?? (kind === 'empty' ? 'Nothing here yet' : 'Something went wrong')}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry ? (
        <Pressable style={styles.retry} onPress={onRetry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: officerTheme.onSurface,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: officerTheme.onSurfaceVariant,
    textAlign: 'center',
  },
  retry: {
    marginTop: 8,
    backgroundColor: officerTheme.primary,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryText: {
    color: officerTheme.onPrimary,
    fontWeight: '800',
    fontSize: 14,
  },
});
