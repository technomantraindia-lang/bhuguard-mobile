import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../components/shared/BhuguardMaterialIcon';
import { useTranslation } from '../i18n/I18nContext';
import { dashboardShadowUp, dashboardTheme } from '../theme/bhuguardDashboardTheme';

const TAB_CONFIG: Array<{ routeName: string; labelKey: string; icon: BhuguardIconName }> = [
  { routeName: 'Home', labelKey: 'tabs.farmer.home', icon: 'home' },
  { routeName: 'Farms', labelKey: 'tabs.farmer.farms', icon: 'potted_plant' },
  { routeName: 'Activities', labelKey: 'tabs.farmer.activity', icon: 'assignment' },
  { routeName: 'Reports', labelKey: 'tabs.farmer.reports', icon: 'analytics' },
  { routeName: 'Profile', labelKey: 'tabs.farmer.profile', icon: 'person' },
];

export function FarmerBottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TAB_CONFIG.map((tab) => {
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
              pressed && styles.itemPressed,
            ]}
          >
            <BhuguardMaterialIcon
              name={tab.icon}
              size={24}
              color={focused ? dashboardTheme.onSecondaryContainer : dashboardTheme.onSurfaceVariant}
              filled={focused && tab.icon === 'home'}
            />
            <Text style={[styles.label, focused && styles.labelActive]}>{t(tab.labelKey)}</Text>
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 8,
    ...dashboardShadowUp,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 56,
    gap: 4,
  },
  itemActive: {
    backgroundColor: dashboardTheme.secondaryContainer,
    borderRadius: 999,
    paddingHorizontal: 16,
  },
  itemPressed: {
    transform: [{ scale: 0.9 }],
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  labelActive: {
    color: dashboardTheme.onSecondaryContainer,
  },
});
