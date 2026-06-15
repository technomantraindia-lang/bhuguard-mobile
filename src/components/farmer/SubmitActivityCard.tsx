import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface SubmitActivityCardProps {
  title?: string;
  children: ReactNode;
}

export function SubmitActivityCard({ title, children }: SubmitActivityCardProps) {
  return (
    <View style={[styles.card, dashboardShadow]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${dashboardTheme.surfaceVariant}80`,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
});
