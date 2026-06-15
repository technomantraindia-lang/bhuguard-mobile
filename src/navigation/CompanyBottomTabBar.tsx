import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../components/shared/BhuguardMaterialIcon';
import { dashboardShadowUp, dashboardTheme } from '../theme/bhuguardDashboardTheme';

const VISIBLE_TABS: Array<{ routeName: string; label: string; icon: BhuguardIconName }> = [
  { routeName: 'Home', label: 'Dashboard', icon: 'dashboard' },
  { routeName: 'Activities', label: 'Activities', icon: 'fact_check' },
  { routeName: 'Maps', label: 'Maps', icon: 'map' },
  { routeName: 'Profile', label: 'Profile', icon: 'person' },
];

export function CompanyBottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {VISIBLE_TABS.map((tab) => {
        const routeIndex = state.routes.findIndex((route) => route.name === tab.routeName);

        if (routeIndex < 0) {
          return null;
        }

        const route = state.routes[routeIndex];
        const focused = state.index === routeIndex;
        const { options } = descriptors[route.key];

        return (
          <Pressable
            key={tab.routeName}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
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
            style={({ pressed }) => [
              styles.item,
              focused && styles.itemActive,
              !focused && pressed && styles.itemPressed,
              focused && pressed && styles.itemActivePressed,
            ]}
          >
            <BhuguardMaterialIcon
              name={tab.icon}
              size={24}
              color={focused ? dashboardTheme.primary : dashboardTheme.onSurfaceVariant}
              filled={focused && tab.icon === 'dashboard'}
            />
            <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: dashboardTheme.tabBarHeight,
    backgroundColor: dashboardTheme.surfaceLowest,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.outlineVariant,
    paddingTop: 8,
    paddingHorizontal: dashboardTheme.marginMobile,
    ...dashboardShadowUp,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    gap: 4,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  itemActive: {
    borderTopColor: dashboardTheme.primary,
  },
  itemPressed: {
    backgroundColor: dashboardTheme.surfaceContainer,
    borderRadius: 8,
    transform: [{ scale: 0.9 }],
  },
  itemActivePressed: {
    transform: [{ scale: 0.9 }],
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: dashboardTheme.onSurfaceVariant,
    marginTop: 4,
  },
  labelActive: {
    color: dashboardTheme.primary,
    fontWeight: '700',
  },
});
