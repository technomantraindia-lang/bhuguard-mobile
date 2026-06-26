import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../../components/shared/BhuguardMaterialIcon';
import { useTranslation } from '../../i18n/I18nContext';
import { colors } from '../../theme/colors';
import {
  TAB_BAR_CONTENT_HEIGHT,
  TAB_BAR_MIN_BOTTOM_INSET,
  TAB_BAR_TOP_PADDING,
} from '../../theme/layoutMetrics';

export interface RoleTabConfig {
  routeName: string;
  labelKey: string;
  icon: BhuguardIconName;
  filledWhenActive?: boolean;
}

interface RoleBottomTabBarProps extends BottomTabBarProps {
  tabs: RoleTabConfig[];
  shadowStyle?: object;
}

export function RoleBottomTabBar({ state, descriptors, navigation, tabs, shadowStyle }: RoleBottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.wrap,
        shadowStyle,
        { paddingBottom: Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_INSET) },
      ]}
    >
      {tabs.map((tab) => {
        const routeIndex = state.routes.findIndex((route) => route.name === tab.routeName);

        if (routeIndex < 0) {
          return null;
        }

        const route = state.routes[routeIndex];
        const focused = state.index === routeIndex;
        const { options } = descriptors[route.key];
        const label = t(tab.labelKey);

        return (
          <Pressable
            key={tab.routeName}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={({ pressed }) => [styles.item, focused && styles.itemActive, pressed && styles.itemPressed]}
          >
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <BhuguardMaterialIcon
                name={tab.icon}
                size={22}
                color={focused ? colors.primary : colors.textMuted}
                filled={focused && (tab.filledWhenActive ?? true)}
              />
            </View>
            <Text
              style={[styles.label, focused && styles.labelActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    minHeight: TAB_BAR_CONTENT_HEIGHT + TAB_BAR_TOP_PADDING,
    paddingTop: TAB_BAR_TOP_PADDING,
    paddingHorizontal: 6,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    maxWidth: 80,
    paddingHorizontal: 2,
    paddingVertical: 2,
    gap: 3,
  },
  itemActive: {},
  itemPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  iconWrap: {
    width: 36,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  iconWrapActive: {
    backgroundColor: colors.softGreen,
  },
  label: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
    width: '100%',
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
