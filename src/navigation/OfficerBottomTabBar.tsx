import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../components/shared/BhuguardMaterialIcon';
import { useTranslation } from '../i18n/I18nContext';
import { officerShadow, officerTheme } from '../theme/officerDashboardTheme';

const TAB_CONFIG: Array<{ routeName: string; labelKey: string; icon: BhuguardIconName }> = [
  { routeName: 'Home', labelKey: 'tabs.officer.dashboard', icon: 'assignment_turned_in' },
  { routeName: 'Visits', labelKey: 'tabs.officer.visits', icon: 'event_note' },
  { routeName: 'Evidence', labelKey: 'tabs.officer.evidence', icon: 'photo_camera' },
  { routeName: 'Reports', labelKey: 'tabs.officer.reports', icon: 'pending_actions' },
  { routeName: 'Profile', labelKey: 'tabs.officer.profile', icon: 'account_circle' },
];

export function OfficerBottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
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
            style={[styles.item, focused && styles.itemActive]}
          >
            {focused ? (
              <View style={styles.activeIconWrap}>
                <BhuguardMaterialIcon
                  name={tab.icon}
                  size={20}
                  color={officerTheme.onPrimaryContainer}
                  filled={tab.icon === 'assignment_turned_in' || tab.icon === 'event_note'}
                />
              </View>
            ) : (
              <BhuguardMaterialIcon
                name={tab.icon}
                size={22}
                color={officerTheme.onSurfaceVariant}
                filled={false}
              />
            )}
            <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
              {t(tab.labelKey)}
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
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: officerTheme.tabBarHeight,
    backgroundColor: officerTheme.surfaceLowest,
    borderTopWidth: 1,
    borderTopColor: officerTheme.outlineVariant,
    paddingTop: 8,
    paddingHorizontal: 8,
    ...officerShadow,
  },
  item: {
    flex: 1,
    maxWidth: 72,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
    color: officerTheme.onSurfaceVariant,
    textAlign: 'center',
  },
  labelActive: {
    color: officerTheme.primary,
    fontWeight: '700',
  },
});
