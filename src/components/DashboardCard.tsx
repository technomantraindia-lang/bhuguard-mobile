import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
}

export function DashboardCard({ title, subtitle, onPress }: DashboardCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.accent} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  content: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  chevron: { fontSize: 24, color: colors.primary, fontWeight: '300' },
});
