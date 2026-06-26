import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { LOGO_SIZES } from '../constants/branding';
import { colors } from '../theme/colors';
import { HEADER_MIN_HEIGHT, SCREEN_HORIZONTAL_PADDING } from '../theme/layoutMetrics';
import { BhuguardMaterialIcon } from './shared/BhuguardMaterialIcon';
import { BrandedHeaderLogo } from './shared/BrandedHeaderLogo';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showBrandLogo?: boolean;
  onBackPress?: () => void;
  rightAction?: { label: string; onPress: () => void };
  rightSlot?: ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  showBrandLogo = true,
  onBackPress,
  rightAction,
  rightSlot,
}: ScreenHeaderProps) {
  const navigation = useNavigation();
  const canGoBack = showBack && (Boolean(onBackPress) || navigation.canGoBack());

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {canGoBack ? (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BhuguardMaterialIcon name="arrow_back" size={22} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.sideSlot} />
        )}

        <View style={styles.center}>
          {showBrandLogo ? <BrandedHeaderLogo size={LOGO_SIZES.moduleHeader} /> : null}
          <View style={styles.titleCopy}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.sideSlot, rightSlot ? styles.sideSlotWide : null]}>
          {rightSlot ?? (
            rightAction ? (
              <Pressable onPress={rightAction.onPress} style={styles.rightAction}>
                <Text style={styles.rightText}>{rightAction.label}</Text>
              </Pressable>
            ) : null
          )}
        </View>
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
    marginBottom: 4,
  },
  row: {
    minHeight: HEADER_MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
    gap: 8,
  },
  sideSlot: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideSlotWide: {
    minWidth: 80,
    alignItems: 'flex-end',
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
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  center: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  rightAction: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  rightText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 14,
  },
});
