import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, shadows, spacing } from '../theme';
import { CARD_RADIUS } from '../theme/layoutMetrics';

interface AppCardProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  footer?: ReactNode;
  variant?: 'default' | 'soft';
}

export function AppCard({
  title,
  subtitle,
  children,
  onPress,
  style,
  footer,
  variant = 'default',
}: AppCardProps) {
  const content = (
    <>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
      {footer}
    </>
  );

  const cardStyle = [styles.card, variant === 'soft' && styles.soft, shadows.card, style];

  if (onPress) {
    return (
      <Pressable style={cardStyle} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: CARD_RADIUS,
    padding: spacing.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  soft: {
    backgroundColor: colors.softGreen,
    borderColor: colors.primary,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
