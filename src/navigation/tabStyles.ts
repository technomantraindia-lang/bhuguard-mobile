import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

import { colors } from '../theme';

export const tabScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    paddingTop: 4,
    height: 64,
  },
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
};
