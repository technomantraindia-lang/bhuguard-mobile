import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface NoAssignmentStateProps {
  message?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function NoAssignmentState({
  message = 'No assigned working area found. Please ask Admin to assign villages.',
  onRefresh,
  refreshing = false,
}: NoAssignmentStateProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Working area not assigned</Text>
      <Text style={styles.text}>{message}</Text>
      {onRefresh ? (
        <Pressable style={styles.button} onPress={onRefresh} disabled={refreshing}>
          <Text style={styles.buttonText}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF7ED',
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9A3412',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: '#7C2D12',
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: dashboardTheme.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
