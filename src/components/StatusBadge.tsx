import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

interface StatusBadgeProps {
  status?: string | null;
  label?: string;
  tone?: 'success' | 'warning' | 'neutral';
}

export function StatusBadge({ status, label, tone }: StatusBadgeProps) {
  const displayLabel = label ?? status?.toString() ?? 'unknown';

  if (tone) {
    const toneStyle =
      tone === 'success' ? styles.success : tone === 'warning' ? styles.warning : styles.neutralTone;

    const textStyle =
      tone === 'success' ? styles.successText : tone === 'warning' ? styles.warningText : styles.neutralToneText;

    return (
      <View style={[styles.badge, toneStyle]}>
        <Text style={[styles.text, textStyle]}>{displayLabel}</Text>
      </View>
    );
  }

  const normalized = displayLabel.toLowerCase();
  const isPositive = ['active', 'approved', 'completed', 'submitted', 'accepted', 'success', 'captured'].some((s) =>
    normalized.includes(s),
  );

  return (
    <View style={[styles.badge, isPositive ? styles.positive : styles.neutral]}>
      <Text style={[styles.text, isPositive ? styles.positiveText : styles.neutralText]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  positive: {
    backgroundColor: colors.ecoLight,
  },
  neutral: {
    backgroundColor: colors.primaryLight,
  },
  success: {
    backgroundColor: colors.ecoLight,
  },
  warning: {
    backgroundColor: '#FEF3C7',
  },
  neutralTone: {
    backgroundColor: colors.primaryLight,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  positiveText: {
    color: colors.eco,
  },
  neutralText: {
    color: colors.primaryDark,
  },
  successText: {
    color: colors.eco,
  },
  warningText: {
    color: '#B45309',
  },
  neutralToneText: {
    color: colors.primaryDark,
  },
});
