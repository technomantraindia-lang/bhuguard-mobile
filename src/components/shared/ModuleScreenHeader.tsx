import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LOGO_SIZES } from '../../constants/branding';
import { colors } from '../../theme/colors';
import { HEADER_MIN_HEIGHT, SCREEN_HORIZONTAL_PADDING } from '../../theme/layoutMetrics';
import { BhuguardMaterialIcon } from './BhuguardMaterialIcon';
import { BrandedHeaderLogo } from './BrandedHeaderLogo';

interface ModuleScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showLogo?: boolean;
  onBackPress?: () => void;
  rightSlot?: ReactNode;
  logoSize?: number;
}

export function ModuleScreenHeader({
  title,
  subtitle,
  showBack = false,
  showLogo = true,
  onBackPress,
  rightSlot,
  logoSize = LOGO_SIZES.moduleHeader,
}: ModuleScreenHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            onPress={onBackPress}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BhuguardMaterialIcon name="arrow_back" size={22} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.sideSlot}>
            {showLogo ? <BrandedHeaderLogo size={logoSize} /> : null}
          </View>
        )}

        <View style={styles.titleBlock}>
          {showBack && showLogo ? (
            <View style={styles.logoInline}>
              <BrandedHeaderLogo size={logoSize} />
            </View>
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.sideSlot}>{rightSlot ?? null}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  row: {
    minHeight: HEADER_MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
    gap: 10,
  },
  sideSlot: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softGreen,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  logoInline: {
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.textMuted,
  },
});
