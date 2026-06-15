import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfficerMaterialIcon, type OfficerIconName } from './OfficerMaterialIcon';
import { officerShadow, officerTheme } from '../theme/officerDashboardTheme';

const VISIBLE_TABS: Array<{ routeName: string; label: string; icon: OfficerIconName }> = [
  { routeName: 'Home', label: 'Tasks', icon: 'assignment_turned_in' },
  { routeName: 'Map', label: 'Map', icon: 'map' },
  { routeName: 'Farmers', label: 'Farmers', icon: 'group' },
  { routeName: 'Profile', label: 'Profile', icon: 'account_circle' },
];

export function OfficerBottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
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
            style={[styles.item, focused && styles.itemActive]}
          >
            {focused ? (
              <View style={styles.activeIconWrap}>
                <OfficerMaterialIcon
                  name={tab.icon}
                  size={22}
                  color={officerTheme.onPrimaryContainer}
                  filled={tab.icon === 'assignment_turned_in' || tab.icon === 'map'}
                />
              </View>
            ) : (
              <OfficerMaterialIcon
                name={tab.icon}
                size={24}
                color={officerTheme.onSurfaceVariant}
                filled={false}
              />
            )}
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
    minHeight: officerTheme.tabBarHeight,
    backgroundColor: officerTheme.surfaceLowest,
    borderTopWidth: 1,
    borderTopColor: officerTheme.outlineVariant,
    paddingTop: 8,
    paddingHorizontal: 16,
    ...officerShadow,
  },
  item: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    gap: 4,
  },
  itemActive: {
    borderTopWidth: 2,
    borderTopColor: officerTheme.primary,
  },
  activeIconWrap: {
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: officerTheme.onSurfaceVariant,
  },
  labelActive: {
    color: officerTheme.primary,
    fontWeight: '700',
  },
});
